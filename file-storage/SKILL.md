---
name: file-storage
description: Implements file upload, storage, and retrieval using AWS S3 or Cloudflare R2, including pre-signed URLs, image resizing with Pillow/sharp, CDN delivery, and secure MIME validation. Use when users need to upload files — profile pictures, document attachments, product images, or any user-generated media. Trigger when user mentions "file upload", "image upload", "S3", "R2", "Cloudflare", "CDN", "pre-signed URL", "avatar", "attachments", or "store files". Never stores uploaded files on the local filesystem in production.
---

# File Storage Engineering (S3 / Cloudflare R2)

## Purpose
File storage is deceptively simple to get wrong. Storing uploads on the local filesystem breaks horizontally scaled deployments. Serving files through your API server adds latency and unnecessary load. Using the original user-supplied filename is a name collision and security vulnerability. This skill implements the production pattern: secure upload → cloud object storage → CDN delivery.

## Storage Provider Decision

| Scenario | Choose |
|---|---|
| Already on AWS | **S3** (native, IAM integration) |
| Want S3-compatible but cheaper egress | **Cloudflare R2** (S3-compatible API, zero egress fees) |
| Video files / large media | S3 or R2 with multipart upload |

Both use the same `boto3` client in Python.

## SOP: File Storage

### Step 1 - Setup
```bash
uv pip install boto3 Pillow python-magic
```

```python
# config.py additions
class Settings(BaseSettings):
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str
    CDN_BASE_URL: str  # your CloudFront or R2 custom domain
    # For Cloudflare R2, also set:
    R2_ENDPOINT_URL: str | None = None  # https://<account>.r2.cloudflarestorage.com
```

```python
# integrations/storage.py
import boto3
from src.config import settings

def get_s3_client():
    kwargs = dict(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    if settings.R2_ENDPOINT_URL:
        kwargs["endpoint_url"] = settings.R2_ENDPOINT_URL  # Cloudflare R2 override
    return boto3.client("s3", **kwargs)

s3 = get_s3_client()
```

### Step 2 - Secure Upload Endpoint (FastAPI)
```python
# api/v1/uploads.py
import uuid, magic
from PIL import Image
from io import BytesIO
from fastapi import UploadFile, HTTPException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/uploads/image", response_model=SuccessResponse[UploadOut])
async def upload_image(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
):
    # 1. Read file into memory
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(422, "File exceeds 10MB limit")

    # 2. Detect MIME type from file content (NEVER trust Content-Type header)
    detected_mime = magic.from_buffer(content[:2048], mime=True)
    if detected_mime not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(422, f"File type '{detected_mime}' not allowed")

    # 3. Resize large images to max 2048px wide (saves storage + bandwidth)
    content = _resize_if_needed(content, max_width=2048)

    # 4. Generate a safe, unique filename - never use the user's filename
    extension = detected_mime.split("/")[1].replace("jpeg", "jpg")
    s3_key = f"uploads/{current_user.id}/{uuid.uuid4()}.{extension}"

    # 5. Upload to S3/R2
    s3.put_object(
        Bucket=settings.S3_BUCKET,
        Key=s3_key,
        Body=content,
        ContentType=detected_mime,
        CacheControl="public, max-age=31536000",  # 1 year (files are immutable by key)
    )

    public_url = f"{settings.CDN_BASE_URL}/{s3_key}"
    return SuccessResponse(data=UploadOut(url=public_url, key=s3_key))


def _resize_if_needed(content: bytes, max_width: int) -> bytes:
    img = Image.open(BytesIO(content))
    if img.width > max_width:
        ratio = max_width / img.width
        new_size = (max_width, int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        output = BytesIO()
        img.save(output, format=img.format or "JPEG", optimize=True, quality=85)
        return output.getvalue()
    return content
```

### Step 3 - Pre-signed Upload URLs (Frontend Direct Upload)
For large files or when you want to bypass your API server for upload bandwidth, use pre-signed URLs. The browser uploads directly to S3 — your server never touches the file bytes.

```python
# services/storage_service.py
def generate_presigned_upload_url(s3_key: str, content_type: str, expires_in: int = 300) -> dict:
    """Returns a URL the browser POSTs to directly. Expires in 5 minutes."""
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": s3_key, "ContentType": content_type},
        ExpiresIn=expires_in,
    )
    return {"upload_url": url, "key": s3_key, "public_url": f"{settings.CDN_BASE_URL}/{s3_key}"}

# Route: client calls this first, gets a URL, uploads directly, then sends us the key
@router.post("/uploads/presign")
async def get_upload_url(content_type: str, current_user: User = Depends(get_current_user)):
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(422, "Content type not allowed")
    s3_key = f"uploads/{current_user.id}/{uuid.uuid4()}"
    return SuccessResponse(data=generate_presigned_upload_url(s3_key, content_type))
```

**Frontend flow:**
```tsx
async function uploadAvatar(file: File) {
  // 1. Get pre-signed URL from our API
  const { data } = await fetch("/api/v1/uploads/presign?content_type=" + file.type).then(r => r.json());

  // 2. Upload directly to S3 - no proxy through our server
  await fetch(data.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

  // 3. Save the public URL to our DB via our API
  await fetch("/api/v1/users/me", { method: "PATCH", body: JSON.stringify({ avatar_url: data.public_url }) });
}
```

### Step 4 - Delete Files
```python
async def delete_file(s3_key: str) -> None:
    s3.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)
    # Also update DB to clear the URL reference
```

When a user deletes their account or replaces their avatar, always delete the old S3 object to avoid orphaned storage costs.

### Step 5 - S3 Bucket Security Configuration
```json
// Bucket policy (public read for CDN, no public write)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/*"
    }
  ]
}
```

Block all public access on the bucket itself. Serve through CloudFront or R2's CDN domain only.
