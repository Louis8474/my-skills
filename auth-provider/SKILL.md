---
name: auth-provider
description: Integrates third-party authentication — OAuth social login (Google, GitHub) and managed auth providers (Clerk, Auth0, Supabase Auth). Use when a user wants to add "Sign in with Google/GitHub", set up single sign-on, or delegate authentication to a managed service instead of rolling their own JWT system. Trigger when user mentions "OAuth", "social login", "Google login", "GitHub login", "Clerk", "Auth0", "Supabase Auth", "SSO", or "I don't want to build my own auth". Routes to the `security` skill if the user wants custom JWT auth from scratch.
---

# Auth Provider Integration

## Purpose
Building auth from scratch is months of work: password reset flows, email verification, brute-force protection, MFA, session management, token rotation. Managed auth providers handle all of this. This skill's job is to integrate them correctly so the rest of the application gets a trusted `user` object without knowing or caring how the session was established.

## Step 1 - Choose the Right Path

| Scenario | Best Choice |
|---|---|
| Users want "Sign in with Google/GitHub" on top of your own auth | OAuth via FastAPI + next-auth |
| You want fully managed auth (email, social, MFA, user dashboard) | **Clerk** (best DX for vibe-coders) |
| You're already using Supabase for DB | **Supabase Auth** |
| Enterprise SSO (SAML, OIDC) or highly customizable | **Auth0** |
| Want control but not from scratch | FastAPI custom JWT (see `security` skill) |

## SOP: Clerk (Recommended for New Projects)

Clerk handles the entire auth layer: sign-up/in UI, email magic links, Google/GitHub OAuth, MFA, and a user management dashboard. You own none of the auth complexity.

### Step 2 - Frontend Setup (Next.js)
```bash
npm install @clerk/nextjs
```

**`app/layout.tsx`:**
```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en"><body>{children}</body></html>
    </ClerkProvider>
  );
}
```

**`middleware.ts` (protect routes):**
```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) auth().protect();
});

export const config = { matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"] };
```

**Sign-in/out components (built-in Clerk UI):**
```tsx
import { SignInButton, SignOutButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export function NavAuth() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button>Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
```

**Getting the current user in a Server Component:**
```tsx
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = auth();           // fast, just the ID
  const user = await currentUser();    // full user object (name, email, etc.)
  // ...
}
```

### Step 3 - Backend: Verify Clerk JWT in FastAPI
Your FastAPI backend needs to trust the JWT Clerk issues. Clerk publishes public keys via JWKS.

```python
# auth/clerk.py
import httpx
from jose import jwt, jwk
from functools import lru_cache
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

bearer_scheme = HTTPBearer()

@lru_cache(maxsize=1)
def get_clerk_jwks():
    """Cache JWKS for 1 hour to avoid hammering Clerk's endpoint."""
    url = f"https://{settings.CLERK_FRONTEND_API}/.well-known/jwks.json"
    return httpx.get(url, timeout=5).json()

async def get_current_user_id(token = Depends(bearer_scheme)) -> str:
    try:
        jwks = get_clerk_jwks()
        unverified_header = jwt.get_unverified_header(token.credentials)
        key_data = next(k for k in jwks["keys"] if k["kid"] == unverified_header["kid"])
        public_key = jwk.construct(key_data)
        payload = jwt.decode(
            token.credentials,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload["sub"]  # Clerk user ID (user_2ABC...)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

**Using in a route:**
```python
@router.get("/me")
async def get_profile(clerk_user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await user_repo.get_by_clerk_id(db, clerk_user_id)
    if not user:
        raise HTTPException(404, "User profile not found")
    return SuccessResponse(data=UserOut.model_validate(user))
```

### Step 4 - Sync Clerk Users to Your DB (Webhook)
When a user signs up in Clerk, you need a corresponding row in your `users` table. Clerk sends a webhook.

```python
# api/v1/webhooks.py
from svix import Webhook  # pip install svix

@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    headers = dict(request.headers)
    
    wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
    try:
        event = wh.verify(payload, headers)
    except Exception:
        raise HTTPException(400, "Invalid Clerk webhook signature")

    if event["type"] == "user.created":
        data = event["data"]
        primary_email = next((e["email_address"] for e in data["email_addresses"] if e["id"] == data["primary_email_address_id"]), None)
        await user_repo.create(db, UserCreate(
            clerk_id=data["id"],
            email=primary_email,
            display_name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
        ))

    elif event["type"] == "user.deleted":
        await user_repo.delete_by_clerk_id(db, event["data"]["id"])
    
    return {"ok": True}
```

## SOP: OAuth via NextAuth.js (If Not Using Clerk)
Use when you want social login but don't want a managed provider.

```bash
npm install next-auth
```

**`app/api/auth/[...nextauth]/route.ts`:**
```ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
    GitHubProvider({ clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

**Using session in a component:**
```tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session } = useSession();
  if (session) return <button onClick={() => signOut()}>Sign out ({session.user?.email})</button>;
  return <button onClick={() => signIn("google")}>Sign in with Google</button>;
}
```

## DB Schema Change (Add to User model)
```python
clerk_id: Mapped[str | None] = mapped_column(String, nullable=True, unique=True, index=True)
# OR for NextAuth:
oauth_provider: Mapped[str | None] = mapped_column(String, nullable=True)  # "google", "github"
oauth_provider_id: Mapped[str | None] = mapped_column(String, nullable=True)
```
