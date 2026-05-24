# JWT and Auth Patterns Reference

## JWT Implementation (python-jose)
```python
# auth/jwt.py
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"

def create_access_token(user_id: str, expires_delta: timedelta = timedelta(minutes=15)) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str, token_family_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": user_id, "exp": expire, "type": "refresh", "family": token_family_id}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str, expected_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalid or expired")
```

## Refresh Token Rotation Pattern
```python
# services/auth_service.py
import secrets, hashlib
from uuid import uuid4

async def issue_tokens(user: User, db: AsyncSession) -> dict:
    family_id = str(uuid4())
    raw_refresh = secrets.token_urlsafe(48)
    hashed = hashlib.sha256(raw_refresh.encode()).hexdigest()
    
    await refresh_token_repo.create(db, RefreshTokenCreate(
        user_id=user.id, token_hash=hashed, family_id=family_id
    ))
    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": raw_refresh,
        "token_type": "bearer"
    }

async def rotate_refresh_token(raw_token: str, db: AsyncSession) -> dict:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    stored = await refresh_token_repo.get_by_hash(db, token_hash)
    
    if not stored:
        # Token reuse detected - invalidate entire family
        if stored := await refresh_token_repo.get_by_hash_or_family(db, token_hash):
            await refresh_token_repo.revoke_family(db, stored.family_id)
        raise HTTPException(status_code=401, detail="Refresh token reused - please log in again")
    
    await refresh_token_repo.revoke(db, stored.id)
    user = await user_repo.get_by_id(db, stored.user_id)
    return await issue_tokens(user, db)
```

## Row-Level Authorization Patterns
```python
# Always check ownership in the service layer, not the router

# Pattern 1: owner-only
async def get_document(doc_id: UUID, current_user: User, db: AsyncSession) -> DocumentOut:
    doc = await doc_repo.get_by_id(db, doc_id)
    if not doc or doc.owner_id != current_user.id:
        raise HTTPException(404)  # Use 404 to hide resource existence for non-owners
    return DocumentOut.model_validate(doc)

# Pattern 2: owner OR admin
async def delete_user(target_id: UUID, current_user: User, db: AsyncSession) -> None:
    if target_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "Insufficient permissions")
    await user_repo.delete(db, target_id)

# Pattern 3: team membership check
async def get_project(project_id: UUID, current_user: User, db: AsyncSession) -> ProjectOut:
    is_member = await project_member_repo.exists(db, project_id=project_id, user_id=current_user.id)
    if not is_member:
        raise HTTPException(404)
    return ProjectOut.model_validate(await project_repo.get_by_id(db, project_id))
```

## Secure File Upload Validation
```python
import magic  # python-magic
from fastapi import UploadFile
import uuid

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB

async def validate_and_store_file(file: UploadFile, db: AsyncSession) -> str:
    # Read first 2KB for MIME detection (don't trust Content-Type header)
    header = await file.read(2048)
    detected_mime = magic.from_buffer(header, mime=True)
    
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(422, f"File type {detected_mime} not allowed")
    
    await file.seek(0)
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(422, "File exceeds 5MB limit")
    
    # Never use user-supplied filename
    safe_filename = f"{uuid.uuid4()}.{detected_mime.split('/')[1]}"
    s3_key = f"uploads/{safe_filename}"
    
    # Upload to S3 (boto3 example)
    s3_client.put_object(Bucket=settings.S3_BUCKET, Key=s3_key, Body=content, ContentType=detected_mime)
    return f"https://{settings.CDN_DOMAIN}/{s3_key}"
```
