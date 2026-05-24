---
name: jwt-auth
description: JWT authentication with NestJS Passport — access/refresh token rotation, RBAC, security best practices
---

# JWT Authentication with NestJS Passport

## Description
Complete JWT authentication implementation using NestJS and Passport.js, including access/refresh token rotation, role-based access control, and security best practices.

## When to Trigger
- Implementing login/register endpoints
- Setting up JWT token generation and validation
- Implementing token refresh flow
- Adding role-based access control (RBAC)
- Securing API endpoints
- Implementing password reset flows
- Adding rate limiting to auth endpoints

## Instructions

### Token Strategy

#### Access Token (Short-Lived)
- Duration: 15 minutes
- Contains: userId, email, roles
- Stored in: Authorization header (Bearer token)
- Used for: API authentication

#### Refresh Token (Long-Lived)
- Duration: 7 days
- Contains: userId, token family (for rotation)
- Stored in: HttpOnly cookie (preferred) or database
- Used for: Obtaining new access tokens
- Must be rotated on each use (invalidated after use)

### Implementation

#### 1. JWT Module Setup

```typescript
// jwt.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  exports: [JwtModule, PassportModule],
})
export class JwtAuthModule {}
```

#### 2. JWT Strategy

```typescript
// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, roles: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user; // Attaches to request.user
  }
}
```

#### 3. Auth Service

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    // Verify refresh token exists and is valid
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revoked) {
      // Possible token reuse attack - revoke all user tokens
      if (tokenRecord) {
        await this.revokeAllUserTokens(tokenRecord.userId);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Rotate refresh token (invalidate old, create new)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    return this.generateTokens(tokenRecord.user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.revokeAllUserTokens(userId);
    }
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.generateRefreshToken(user.id),
    ]);

    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}
```

#### 4. Auth Controller

```typescript
// auth.controller.ts
import { Controller, Post, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    await this.authService.logout(req.user.id, refreshToken);
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }
}
```

#### 5. Guards and Decorators

```typescript
// jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Decorators
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

#### 6. Rate Limiting for Auth Endpoints

```typescript
// rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterRedis } from 'rate-limiter-flexible';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private limiter: RateLimiterRedis;

  constructor(private reflector: Reflector) {
    this.limiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate_limit',
      points: 5, // 5 requests
      duration: 60, // per 60 seconds
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;

    try {
      await this.limiter.consume(ip);
      return true;
    } catch {
      throw new HttpException('Too many requests', 429);
    }
  }
}

// Usage in controller
@Post('login')
@UseGuards(RateLimitGuard)
@HttpCode(200)
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### Prisma Schema for Auth

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String
  name         String
  roles        Role[]    @default([USER])
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @map("user_id")
  revoked   Boolean  @default(false)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

enum Role {
  USER
  ADMIN
  MODERATOR

  @@map("role")
}
```

## Examples

### Protecting Routes
```typescript
// Public route
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}

// Protected route (any authenticated user)
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}

// Admin only route
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get('admin/users')
getAllUsers() {
  return this.usersService.findAll();
}

// Multiple roles
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Patch('users/:id/status')
updateUserStatus() {
  // ...
}
```

### Frontend Integration
```typescript
// Store tokens securely
const login = async (email: string, password: string) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password }),
  });

  const { accessToken } = await response.json();
  // Store access token in memory (not localStorage)
  localStorage.setItem('accessToken', accessToken);
};

// Auto-refresh on 401
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    // Try to refresh tokens
    const refreshResponse = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      localStorage.setItem('accessToken', accessToken);

      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
};
```

## Anti-Patterns

### ❌ Plain Text Passwords
```typescript
// DANGEROUS: Storing passwords without hashing
const user = await prisma.user.create({
  data: { email, password }, // Plain text!
});

// SAFE: Hash passwords with bcrypt
const hashedPassword = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
  data: { email, password: hashedPassword },
});
```

### ❌ Long-Lived Access Tokens
```typescript
// BAD: Access token valid for 30 days
signOptions: { expiresIn: '30d' }

// GOOD: Short-lived access token (15 minutes)
signOptions: { expiresIn: '15m' }
```

### ❌ No Refresh Token Rotation
```typescript
// BAD: Reusing same refresh token indefinitely
async refresh(refreshToken: string) {
  const payload = this.jwtService.verify(refreshToken);
  return this.generateAccessToken(payload); // Same refresh token!
}

// GOOD: Rotate refresh token on each use
async refresh(refreshToken: string) {
  const tokenRecord = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  // Invalidate old token
  await this.prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true },
  });

  // Generate new tokens
  return this.generateTokens(tokenRecord.user);
}
```

### ❌ Storing JWT in localStorage (XSS Vulnerable)
```typescript
// BAD: Vulnerable to XSS
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);

// GOOD: Access token in memory, refresh token in HttpOnly cookie
// Access token: stored in JS variable (memory)
// Refresh token: set via backend as HttpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,    // Not accessible via JavaScript
  secure: true,      // HTTPS only
  sameSite: 'strict' // CSRF protection
});
```

### ❌ Not Invalidating Tokens on Password Change
```typescript
// BAD: Old tokens still valid after password change
async changePassword(userId: string, newPassword: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, 12) },
  });
}

// GOOD: Invalidate all refresh tokens on password change
async changePassword(userId: string, newPassword: string) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, 12) },
    }),
    prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    }),
  ]);
}
```

### ❌ No Rate Limiting on Auth Endpoints
```typescript
// BAD: Vulnerable to brute force attacks
@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}

// GOOD: Rate limit auth endpoints
@Post('login')
@UseGuards(RateLimitGuard)
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```
