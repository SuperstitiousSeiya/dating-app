# Dating App — System Architecture

> **Audience:** AI coding assistants and engineers contributing to this codebase.
> **Standard:** Giga-senior engineering. Every decision here is intentional. Do not deviate without updating this document and leaving a dated rationale comment.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Package Contracts](#4-package-contracts)
5. [Backend — NestJS](#5-backend--nestjs)
6. [Web App — Next.js](#6-web-app--nextjs)
7. [Mobile App — Expo](#7-mobile-app--expo)
8. [Database Design — MongoDB](#8-database-design--mongodb)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Real-time Layer — WebSockets](#10-real-time-layer--websockets)
11. [Media & File Storage](#11-media--file-storage)
12. [Matching Engine](#12-matching-engine)
13. [Notification System](#13-notification-system)
14. [State Management](#14-state-management)
15. [API Design Conventions](#15-api-design-conventions)
16. [Error Handling Strategy](#16-error-handling-strategy)
17. [Security Model](#17-security-model)
18. [Caching Strategy](#18-caching-strategy)
19. [Testing Strategy](#19-testing-strategy)
20. [CI/CD Pipeline](#20-cicd-pipeline)
21. [Environment & Configuration](#21-environment--configuration)
22. [Coding Conventions](#22-coding-conventions)
23. [Feature Roadmap](#23-feature-roadmap)

---

## 1. Project Overview

A full-featured dating application with swipe-based matching, real-time chat, profile management, and a recommendation engine. The system targets both web and native mobile (iOS/Android) from a single monorepo.

### Core Features
- **Discovery:** Swipe cards with like/pass/superlike
- **Matching:** Mutual like triggers a match
- **Chat:** Real-time messaging with read receipts and typing indicators
- **Profiles:** Photo uploads, bio, prompts, verification
- **Preferences:** Age range, distance, gender, intent filters
- **Boost/Premium:** Subscription-gated power features

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Monorepo | Turborepo | Remote caching, task graph, per-package pipelines |
| Backend | NestJS + Fastify adapter | Modular DI, decorators, first-class WebSocket, high throughput via Fastify |
| Database | MongoDB + Mongoose | Flexible schema for profiles, efficient geospatial queries, horizontal scaling |
| Cache | Redis (ioredis) | Session store, rate limiting, feed cache, pub/sub for WS |
| Web | Next.js 14 App Router | RSC, streaming, edge runtime, SEO for landing/blog |
| Mobile | Expo SDK 51 (React Native) | Unified RN codebase, OTA updates via EAS, native gestures |
| UI — Web | shadcn/ui + Tailwind CSS v4 | Accessible, composable, zero-runtime overhead |
| UI — Mobile | NativeWind v4 + Tamagui primitives | Tailwind mental model on native, consistent with web |
| Auth | JWT (access + refresh) + Passport.js | Stateless access tokens, rotating refresh tokens in httpOnly cookie |
| OAuth | Google, Apple (Sign in with Apple) | Required by App Store; Google for web/Android |
| File Storage | Cloudinary | CDN, transformation API, moderation hooks |
| Real-time | Socket.io (NestJS gateway) | Rooms for match channels, namespace isolation |
| Email | Resend + React Email | Type-safe templates, high deliverability |
| Push Notifications | Expo Push + FCM/APNs | Unified via Expo SDK |
| Payments | Stripe | Subscriptions, webhooks |
| Validation | Zod (shared) | Single source of truth; used on backend and frontend |
| ORM/ODM | Mongoose v8 | Strong TypeScript support, schema hooks, virtuals |
| API Docs | Swagger (NestJS @nestjs/swagger) | Auto-generated from decorators |
| Testing | Vitest + Supertest + Playwright + Detox | See §19 |
| Linter/Formatter | ESLint (flat config) + Prettier | Enforced via Husky + lint-staged |

---

## 3. Monorepo Structure

```
dating-app/
├── apps/
│   ├── web/                    # Next.js 14 App Router
│   ├── mobile/                 # Expo SDK 51
│   └── backend/                # NestJS + Fastify
├── packages/
│   ├── types/                  # Shared TypeScript types & Zod schemas
│   ├── utils/                  # Pure utility functions (no framework deps)
│   ├── validators/             # Zod schemas used by both API and UI forms
│   ├── ui-web/                 # shadcn components extended for this project
│   ├── ui-mobile/              # NativeWind / Tamagui shared components
│   ├── config-eslint/          # Shared ESLint flat configs
│   ├── config-typescript/      # Shared tsconfig bases
│   └── config-tailwind/        # Shared Tailwind preset
├── tooling/
│   └── scripts/                # Release, codegen, db-seed scripts
├── docs/
│   └── architecture.md         # This file
├── turbo.json
├── package.json                # Root — workspaces config only, no app code
└── pnpm-workspace.yaml
```

### Turborepo Pipeline (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["NODE_ENV", "DATABASE_URL"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "outputs": [] },
    "test": { "outputs": ["coverage/**"] },
    "type-check": { "outputs": [] },
    "db:generate": { "cache": false }
  }
}
```

### Workspace Manager
Use **pnpm** workspaces exclusively. Never use npm or yarn in this repo.

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

---

## 4. Package Contracts

### `packages/types`
The single source of truth for all domain types. No business logic. No framework imports.

```
packages/types/
├── src/
│   ├── user.ts
│   ├── match.ts
│   ├── message.ts
│   ├── notification.ts
│   ├── subscription.ts
│   └── index.ts              # barrel export
└── package.json
```

All types are derived from Zod schemas. Never write a standalone `interface` or `type` for a domain entity — define the Zod schema in `packages/validators` and infer the type:

```typescript
// packages/validators/src/user.validator.ts
import { z } from "zod";

export const CreateProfileSchema = z.object({
  displayName: z.string().min(2).max(30),
  birthDate: z.string().datetime(),
  bio: z.string().max(500).optional(),
  gender: z.enum(["man", "woman", "nonbinary", "other"]),
  interestedIn: z.array(z.enum(["man", "woman", "nonbinary", "other"])).min(1),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
  }),
});

export type CreateProfileDto = z.infer<typeof CreateProfileSchema>;
```

### `packages/utils`
Pure functions only. No side effects, no I/O. Tree-shakeable.

Examples: `calculateAge(birthDate)`, `formatDistance(meters)`, `generateSlug(name)`, `shuffleArray(arr)`.

---

## 5. Backend — NestJS

### Directory Structure

```
apps/backend/
├── src/
│   ├── main.ts                     # Bootstrap, Fastify adapter, global pipes
│   ├── app.module.ts               # Root module
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── jwt-refresh.strategy.ts
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── apple.strategy.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       └── roles.guard.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── schemas/
│   │   │       └── user.schema.ts
│   │   ├── profiles/
│   │   ├── discovery/              # Feed generation, geospatial queries
│   │   ├── swipes/                 # Like/pass/superlike actions
│   │   ├── matches/
│   │   ├── messages/
│   │   ├── media/                  # Cloudinary upload orchestration
│   │   ├── notifications/
│   │   ├── subscriptions/          # Stripe integration
│   │   └── admin/                  # Internal moderation tools
│   ├── gateways/
│   │   └── chat.gateway.ts         # Socket.io gateway
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts    # Standardizes API response shape
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   └── guards/
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   └── database/
│       ├── database.module.ts
│       └── database.service.ts
├── test/
│   ├── auth.e2e-spec.ts
│   └── jest-e2e.json
└── package.json
```

### main.ts Bootstrap Pattern

```typescript
// apps/backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV !== "production" }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(","),
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("Dating App API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
}

bootstrap();
```

### Standardized API Response Shape

Every API response MUST be wrapped by `TransformInterceptor`:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-04-14T00:00:00Z", "requestId": "uuid" }
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 340, "hasNextPage": true }
}

// Error (from HttpExceptionFilter)
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Profile with id xyz does not exist.",
    "statusCode": 404
  },
  "meta": { "timestamp": "...", "requestId": "..." }
}
```

### Module Dependency Rules
- Modules must NEVER import from sibling modules directly (e.g., `MessagesModule` must not import `MatchesModule`). Use NestJS events (`EventEmitter2`) for cross-module side effects.
- `CommonModule` is global — all shared decorators/guards live there.
- `DatabaseModule` is global — exposes Mongoose connections.

---

## 6. Web App — Next.js

### Directory Structure

```
apps/web/
├── app/                            # App Router root
│   ├── (marketing)/                # Route group — public, no auth
│   │   ├── page.tsx                # Landing page
│   │   ├── about/
│   │   └── pricing/
│   ├── (auth)/                     # Route group — login/signup flows
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (app)/                      # Route group — protected, authenticated shell
│   │   ├── layout.tsx              # App shell with nav
│   │   ├── discover/               # Swipe deck
│   │   ├── matches/
│   │   ├── messages/
│   │   │   └── [matchId]/
│   │   ├── profile/
│   │   └── settings/
│   ├── api/                        # Next.js route handlers (thin proxy or webhooks only)
│   │   └── webhooks/
│   │       └── stripe/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # Re-exported + extended shadcn components
│   ├── cards/                      # ProfileCard, SwipeCard
│   ├── chat/                       # MessageBubble, ChatInput, TypingIndicator
│   ├── discovery/                  # SwipeDeck, FilterPanel
│   └── shared/                     # Header, BottomNav, Avatar, etc.
├── hooks/
│   ├── use-swipe.ts
│   ├── use-socket.ts
│   └── use-auth.ts
├── lib/
│   ├── api-client.ts               # Typed fetch wrapper (uses @tanstack/query)
│   ├── auth.ts                     # next-auth or custom cookie auth helpers
│   └── socket.ts                   # Socket.io client singleton
├── stores/
│   └── discovery.store.ts          # Zustand store for swipe deck state
├── middleware.ts                   # Auth protection, edge-compatible
└── package.json
```

### Routing Rules
- `(marketing)` — statically rendered where possible, ISR for dynamic content.
- `(auth)` — client components for form interactivity.
- `(app)` — requires valid JWT in cookie. Middleware redirects to `/login` on 401. All pages here are client-rendered via React Query unless explicitly opting into RSC.

### Data Fetching Pattern

Use **TanStack Query v5** for all server state. No raw `fetch` calls inside components.

```typescript
// hooks/use-discovery-feed.ts
export function useDiscoveryFeed() {
  return useInfiniteQuery({
    queryKey: ["discovery", "feed"],
    queryFn: ({ pageParam }) => apiClient.discovery.getFeed({ cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}
```

### Client-Side Auth
- Access token stored in memory (Zustand store), never in `localStorage`.
- Refresh token stored in `httpOnly` `Secure` cookie.
- On page load, `/api/auth/refresh` is called silently to rehydrate the access token.
- `middleware.ts` checks for the presence of the refresh cookie; if absent, redirect to `/login`.

---

## 7. Mobile App — Expo

### Directory Structure

```
apps/mobile/
├── app/                            # Expo Router (file-based)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── onboarding/
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tab bar config
│   │   ├── discover.tsx
│   │   ├── matches.tsx
│   │   ├── messages/
│   │   │   └── [matchId].tsx
│   │   └── profile.tsx
│   └── _layout.tsx                 # Root layout, font loading, splash
├── components/
│   ├── cards/
│   ├── chat/
│   └── shared/
├── hooks/                          # Same pattern as web, shared logic
├── lib/
│   ├── api-client.ts               # Same typed client, different base URL
│   └── socket.ts
├── stores/                         # Shared Zustand stores (logic mirrors web)
├── constants/
│   └── theme.ts
├── assets/
│   ├── fonts/
│   └── images/
├── app.config.ts                   # Expo dynamic config
└── package.json
```

### Swipe Gesture Implementation
Use `react-native-gesture-handler` + `react-native-reanimated` for the swipe deck. The swipe card component must use Reanimated's `useSharedValue` and `useAnimatedStyle` — no JS thread animation.

### OTA Updates
Configure EAS Update channels:
- `production` — stable releases
- `preview` — internal QA
- `development` — dev client

### Push Notifications
Use `expo-notifications`. On login, register the Expo push token and send it to `PATCH /api/v1/users/push-token`. Backend stores it on the User document and uses it when dispatching notifications.

---

## 8. Database Design — MongoDB

### Connection Strategy
Use Mongoose with a single `MongooseModule.forRootAsync` in `DatabaseModule`. Enable connection pooling (`maxPoolSize: 10`). Use MongoDB Atlas for production; replica set required for transactions.

### Schemas

#### `users`
```typescript
{
  _id: ObjectId,
  email: string,                    // unique, sparse (OAuth users may not have one)
  phone: string | null,             // E.164 format
  passwordHash: string | null,      // null for OAuth-only accounts
  oauthProviders: [{
    provider: "google" | "apple",
    providerId: string,
    email: string,
  }],
  role: "user" | "admin" | "moderator",
  isVerified: boolean,              // email/phone verified
  isPhotoVerified: boolean,         // selfie verification passed
  isBanned: boolean,
  banReason: string | null,
  refreshTokenHash: string | null,  // bcrypt hash of current refresh token
  expoPushToken: string | null,
  stripeCustomerId: string | null,
  subscription: {
    tier: "free" | "gold" | "platinum",
    expiresAt: Date | null,
    stripeSubscriptionId: string | null,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

#### `profiles`
```typescript
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: users — 1:1
  displayName: string,
  birthDate: Date,
  age: number,                      // virtual, computed from birthDate
  bio: string,
  gender: "man" | "woman" | "nonbinary" | "other",
  interestedIn: string[],
  photos: [{
    _id: ObjectId,
    cloudinaryId: string,
    url: string,
    width: number,
    height: number,
    order: number,                  // 0 = primary photo
    isVerificationPhoto: boolean,
  }],
  prompts: [{
    question: string,
    answer: string,
  }],                               // max 3
  location: {
    type: "Point",
    coordinates: [number, number],  // [lng, lat] — GeoJSON
  },
  lastActive: Date,
  preferences: {
    ageRange: { min: number, max: number },
    maxDistanceKm: number,
    genders: string[],
    intent: "relationship" | "casual" | "friendship" | "unsure",
  },
  stats: {
    likesGiven: number,
    likesReceived: number,
    superlikesGiven: number,
    matchCount: number,
  },
  createdAt: Date,
  updatedAt: Date,
}
```
**Index:** `{ location: "2dsphere" }`, `{ userId: 1 }` unique

#### `swipes`
```typescript
{
  _id: ObjectId,
  actorId: ObjectId,               // who swiped
  targetId: ObjectId,              // who was swiped on
  action: "like" | "pass" | "superlike",
  seenAt: Date,
  expiresAt: Date,                 // TTL index for passes (reappear after 30d)
}
```
**Indexes:** `{ actorId: 1, targetId: 1 }` unique, TTL on `expiresAt`

#### `matches`
```typescript
{
  _id: ObjectId,
  participants: [ObjectId, ObjectId],  // always exactly 2
  initiatedBy: ObjectId,               // who liked first
  isSuperlike: boolean,
  status: "active" | "unmatched",
  unmatchedBy: ObjectId | null,
  unmatchedAt: Date | null,
  lastMessageAt: Date | null,
  lastMessagePreview: string | null,
  createdAt: Date,
}
```
**Index:** `{ participants: 1 }`, `{ participants: 1, status: 1 }`

#### `messages`
```typescript
{
  _id: ObjectId,
  matchId: ObjectId,
  senderId: ObjectId,
  type: "text" | "gif" | "image" | "audio",
  content: string,                  // text body or media URL
  readAt: Date | null,              // null = unread
  deletedAt: Date | null,           // soft delete
  createdAt: Date,
}
```
**Index:** `{ matchId: 1, createdAt: -1 }`, `{ senderId: 1 }`

#### `reports`
```typescript
{
  _id: ObjectId,
  reporterId: ObjectId,
  reportedId: ObjectId,
  reason: string,
  details: string | null,
  status: "pending" | "reviewed" | "actioned" | "dismissed",
  reviewedBy: ObjectId | null,
  createdAt: Date,
}
```

#### `notifications`
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  type: "match" | "message" | "superlike" | "system",
  payload: Record<string, unknown>,
  isRead: boolean,
  createdAt: Date,
}
```
**TTL index:** expire after 30 days

### Transactions
Use MongoDB sessions for operations that must be atomic:
- Creating a match (insert `match` + update both `profile.stats.matchCount`)
- Sending the first message (verify match exists and is active)

---

## 9. Authentication & Authorization

### Token Strategy
- **Access Token:** JWT, 15-minute TTL, signed with RS256 (asymmetric). Contains `sub` (userId), `role`, `tier`.
- **Refresh Token:** Opaque random bytes (32), stored as bcrypt hash in `users.refreshTokenHash`. Sent/received via `httpOnly`, `Secure`, `SameSite=Strict` cookie. 30-day TTL.
- **Refresh Rotation:** Every call to `/auth/refresh` invalidates the old token and issues a new one. If a reused token is detected (hash mismatch), all sessions are revoked immediately (account compromise signal).

### Endpoints

```
POST /api/v1/auth/register          # email + password
POST /api/v1/auth/login             # email + password → tokens
POST /api/v1/auth/refresh           # cookie → new access + refresh
POST /api/v1/auth/logout            # clear cookie, null refreshTokenHash
GET  /api/v1/auth/google            # OAuth redirect
GET  /api/v1/auth/google/callback
GET  /api/v1/auth/apple
POST /api/v1/auth/apple/callback    # Apple uses POST for callback
POST /api/v1/auth/verify-email      # OTP from email
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Guard Hierarchy
```
JwtAuthGuard (default on all routes)
  └── RolesGuard (checks JWT role claim)
      └── SubscriptionGuard (checks tier for premium features)
```

Use `@Public()` decorator to exempt routes (e.g., register, login).

### RBAC
| Role | Capabilities |
|---|---|
| `user` | All user-facing features within their subscription tier |
| `moderator` | Access to report queue, profile suspension |
| `admin` | Full system access, subscription management |

---

## 10. Real-time Layer — WebSockets

### Architecture
NestJS `@WebSocketGateway()` with Socket.io adapter, backed by **Redis pub/sub** (via `@socket.io/redis-adapter`) for horizontal scaling across multiple backend instances.

```
Client ──(WS)──► NestJS Gateway
                      │
              Redis Pub/Sub ◄──► Other backend pods
```

### Namespaces & Rooms
- **Namespace `/chat`:** match-specific messaging
  - Room per match: `match:{matchId}`
- **Namespace `/presence`:** online status
  - Room per user: `user:{userId}`
- **Namespace `/notifications`:** push-to-web notifications

### Events (Client → Server)

| Event | Payload | Description |
|---|---|---|
| `chat:send` | `{ matchId, content, type }` | Send a message |
| `chat:read` | `{ matchId, messageId }` | Mark message as read |
| `chat:typing` | `{ matchId, isTyping }` | Typing indicator |
| `presence:ping` | `{}` | Heartbeat (every 30s) |

### Events (Server → Client)

| Event | Payload | Description |
|---|---|---|
| `chat:message` | `Message` | New message received |
| `chat:read` | `{ matchId, readAt }` | Other user read receipt |
| `chat:typing` | `{ userId, isTyping }` | Typing indicator |
| `match:new` | `Match + Profile` | Mutual like occurred |
| `notification:push` | `Notification` | In-app notification |
| `presence:status` | `{ userId, online, lastSeen }` | Presence update |

### Connection Auth
Socket.io `auth` handshake must include the access token:
```javascript
const socket = io("/chat", { auth: { token: accessToken } });
```
Gateway validates the JWT in the `handleConnection` hook and attaches the user to the socket.

---

## 11. Media & File Storage

### Provider: Cloudinary

All photo uploads flow through the backend — never upload directly from the client to Cloudinary.

```
Client ──(multipart POST)──► Backend ──(upload_stream)──► Cloudinary
                                    │
                             Returns { cloudinaryId, url, width, height }
                                    │
                             Stored in profile.photos[]
```

### Upload Rules
- Maximum 6 photos per profile.
- Accepted formats: JPEG, PNG, WebP, HEIC.
- Max raw upload size: 10MB (enforced by Fastify `bodyLimit`).
- Cloudinary transformation applied on upload: convert to WebP, max 1200px on longest side, quality 85.
- Cloudinary folder structure: `dating-app/{userId}/{timestamp}`.

### Moderation
Enable Cloudinary's AI content moderation add-on. Reject uploads flagged as explicit before storing. Flag borderline for manual review.

### Deletion
When a user deletes a photo or their account, call Cloudinary's Destroy API to remove the asset. Never leave orphaned media.

---

## 12. Matching Engine

### Discovery Feed Generation

The discovery endpoint returns a ranked, paginated deck of profiles. Algorithm:

1. **Hard Filters** (MongoDB `$geoNear` + `$match`):
   - Within `preferences.maxDistanceKm`
   - `gender` in `preferences.interestedIn`
   - `age` within `preferences.ageRange`
   - Not already swiped by actor (exclude `swipes` by actorId)
   - Not blocked/reported/banned
   - Not the actor themselves

2. **Soft Ranking** (in-memory, post-query, on a batch of 200 candidates):
   - Boost recently active profiles (`lastActive` within 24h)
   - Boost verified profiles
   - Deprioritize profiles with low engagement rates (very high like count = desirability signal; very high pass count = quality signal)
   - Randomize within buckets to prevent deterministic ordering

3. **Feed Cache**: Cache the computed deck per user in Redis (`feed:{userId}`) with a 5-minute TTL. Invalidate on swipe.

### Match Creation

When actor `A` likes target `B`:
1. Insert into `swipes`.
2. Check if `B` previously liked `A` (query `swipes` where `actorId=B, targetId=A, action in [like, superlike]`).
3. If yes → atomic transaction:
   - Create `matches` document.
   - Emit `match:new` via Socket.io to both users.
   - Send push notification to both.
   - Increment `profile.stats.matchCount` for both.

---

## 13. Notification System

### In-App (Web + Mobile Real-time)
Delivered via Socket.io `/notifications` namespace on event `notification:push`.

### Push Notifications (Mobile)
Use Expo Push Notifications service. Backend calls Expo's API using `expo-server-sdk`. Batch notifications where possible (max 100 per request). Implement exponential backoff on Expo API failures.

### Email
Use Resend with React Email templates. Templates live in `packages/email-templates/`.

Email types:
- Welcome / verify email
- Password reset
- New match (daily digest, not per-match, to reduce spam)
- Subscription receipts

### Rules
- Never send push + email for the same event simultaneously. Push first; fall back to email if user has push disabled.
- Respect `user.notificationPreferences` (future field).
- Rate limit: max 20 push notifications per user per day for match/message events.

---

## 14. State Management

### Web — Zustand + TanStack Query

| Store | Responsibility |
|---|---|
| `useAuthStore` | Current user, access token (in-memory), auth status |
| `useDiscoveryStore` | Local swipe deck state (current card index, pre-loaded profiles) |
| `useChatStore` | Active match, optimistic messages before server confirmation |
| `useSocketStore` | Socket.io connection instance, connection status |

TanStack Query handles all remote server state (profiles, matches, messages list). Zustand handles ephemeral UI state and auth.

**Rule:** Never put API response data into Zustand. Zustand is for client-only state.

### Mobile — Same pattern
Identical stores (shared logic via `packages/utils` where possible), different UI bindings. Expo Router's `useLocalSearchParams` replaces Next.js `useParams`.

---

## 15. API Design Conventions

### URL Structure
```
/api/v1/{resource}/{id}/{sub-resource}
```

Examples:
```
GET    /api/v1/profiles/me
PATCH  /api/v1/profiles/me
GET    /api/v1/discovery/feed
POST   /api/v1/swipes
GET    /api/v1/matches
GET    /api/v1/matches/:matchId/messages
POST   /api/v1/matches/:matchId/messages
DELETE /api/v1/matches/:matchId
POST   /api/v1/media/photos
DELETE /api/v1/media/photos/:photoId
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
```

### HTTP Methods
- `GET` — reads, never mutates
- `POST` — creates a new resource
- `PATCH` — partial update (always, never `PUT`)
- `DELETE` — remove / soft-delete

### Pagination
Always use cursor-based pagination for feed and messages. Use offset pagination only for admin lists.

```
GET /api/v1/matches/:matchId/messages?cursor=<lastMessageId>&limit=30
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "msg_id_xyz",
    "hasNextPage": true
  }
}
```

### Rate Limiting
Implemented in NestJS via `@nestjs/throttler` backed by Redis store.

| Endpoint | Limit |
|---|---|
| `POST /auth/*` | 10 req / 15 min per IP |
| `POST /swipes` | 200 req / hour per user (free tier: 50/day) |
| `POST /messages` | 60 req / min per user |
| All other endpoints | 300 req / min per user |

---

## 16. Error Handling Strategy

### Backend
All exceptions flow through `HttpExceptionFilter`. Business logic throws typed NestJS `HttpException` subclasses:

```typescript
// Common pattern in services:
if (!profile) {
  throw new NotFoundException({ code: "PROFILE_NOT_FOUND", message: "..." });
}
```

Never throw raw `Error` objects — always use NestJS HTTP exceptions or custom domain exceptions that extend them.

### Frontend (Web + Mobile)
- TanStack Query `onError` callbacks handle global error toasts via a central `useErrorHandler` hook.
- Form errors are handled by `react-hook-form` + Zod resolver.
- Socket.io errors are caught in the `useSocketStore` and surfaced as connection status.
- Never `console.error` in production builds — use a structured logger (Sentry).

### Unhandled Rejections
Backend: NestJS catches all unhandled exceptions via the global filter.
Frontend: Configure Sentry's `ErrorBoundary` at the app root.

---

## 17. Security Model

### Input Validation
Every API input is validated through the `ZodValidationPipe`. The pipe receives the Zod schema from the DTO class metadata. No raw body access in controllers.

### OWASP Top 10 Mitigations

| Threat | Mitigation |
|---|---|
| Injection | Mongoose ODM parameterizes all queries. No raw query string construction. |
| Broken Auth | Short-lived JWTs, refresh rotation, bcrypt for password + token hashing |
| Sensitive Data Exposure | No PII in JWT payload. Photos served via Cloudinary (not origin server). |
| IDOR | Every resource query scopes to authenticated `userId`. Never trust client-provided IDs without authorization check. |
| Security Misconfiguration | Helmet.js on Fastify, strict CORS, no stack traces in production errors |
| XSS | Next.js escapes by default. No `dangerouslySetInnerHTML`. CSP headers via `next.config.ts` |
| CSRF | `SameSite=Strict` cookie + custom `X-Requested-With` header check on mutation routes |
| Rate Limiting | Redis-backed throttler (see §15) |

### Content Moderation
- Cloudinary AI on photo uploads.
- Message content scanning via keyword filter (naive) + optional Perspective API integration.
- User reporting system feeds a moderation queue.

### Data Privacy
- Implement right-to-erasure: `DELETE /api/v1/users/me` soft-deletes the account, schedules hard-delete of all PII (profile, photos, messages) after 30 days via a background job.
- Location is stored as coordinates; never expose raw coordinates to other users — only computed distances.
- GDPR compliance: data export endpoint `GET /api/v1/users/me/export`.

---

## 18. Caching Strategy

### Redis Key Conventions
```
feed:{userId}               TTL: 5m   — ranked discovery deck
profile:{userId}            TTL: 10m  — public profile data
match-list:{userId}         TTL: 1m   — sorted match list
unread-count:{userId}       TTL: 30s  — total unread messages
rate:{ip}:{endpoint}        TTL: 15m  — throttle counters
session:refresh:{userId}    TTL: 30d  — tracks active refresh token
```

### Cache Invalidation Rules
- `feed:{userId}`: invalidate on every swipe by that user.
- `profile:{userId}`: invalidate on `PATCH /profiles/me`.
- `match-list:{userId}`: invalidate on new match or unmatch.
- Never cache mutable writes — cache reads only.

### Next.js Caching
- Landing page, pricing, and blog: `force-cache` with ISR revalidation every 3600s.
- Authenticated pages: `no-store` — never cache personalized responses on CDN.

---

## 19. Testing Strategy

### Backend
| Layer | Tool | Coverage Target |
|---|---|---|
| Unit (services) | Vitest + `@nestjs/testing` | 80% |
| Integration (controllers) | Supertest + in-memory MongoDB (`@shelf/jest-mongodb`) | Key flows |
| E2E (full stack) | Supertest against running app | Auth, match, chat |

### Web
| Layer | Tool | Coverage Target |
|---|---|---|
| Unit (hooks, utils) | Vitest + Testing Library | 70% |
| Component | Storybook (document) + Testing Library | Key components |
| E2E | Playwright | Critical user journeys |

### Mobile
| Layer | Tool |
|---|---|
| Unit | Vitest |
| E2E | Detox |

### Test File Naming Conventions
- `*.spec.ts` — unit tests (co-located with source)
- `*.e2e-spec.ts` — e2e tests (in `/test` directory)
- `*.stories.tsx` — Storybook stories

### Fixtures
Maintain a `test/fixtures/` directory per app with factory functions for creating test data:

```typescript
export const createUserFixture = (overrides?: Partial<User>): User => ({
  _id: new Types.ObjectId(),
  email: "test@example.com",
  role: "user",
  ...overrides,
});
```

---

## 20. CI/CD Pipeline

### GitHub Actions Workflow

```
on: push / pull_request
┌─────────────────────────────────────┐
│  1. turbo lint + type-check         │  (all packages, parallel)
│  2. turbo test                      │  (all packages, parallel)
│  3. turbo build                     │  (with remote cache)
└─────────────────────────────────────┘
         │ (main branch only)
         ▼
┌─────────────────────────────────────┐
│  Deploy backend → Railway/Fly.io    │
│  Deploy web → Vercel                │
│  Deploy mobile → EAS Build          │
└─────────────────────────────────────┘
```

### Environments

| Environment | Branch | Backend URL | Notes |
|---|---|---|---|
| Development | local | `localhost:3001` | Docker Compose for MongoDB + Redis |
| Preview | PR branches | ephemeral | Vercel preview + Railway ephemeral |
| Staging | `develop` | staging subdomain | Full stack, shared test data |
| Production | `main` | production domain | Protected branch, required reviews |

### Docker Compose (Local Dev)

```yaml
# docker-compose.yml (root)
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  mongo_data:
```

---

## 21. Environment & Configuration

### Variable Naming Convention
`{APP}_{SCOPE}_{KEY}` — e.g., `BACKEND_JWT_ACCESS_SECRET`, `WEB_API_BASE_URL`.

### Required Variables per App

#### `apps/backend/.env`
```
# App
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/dating-app
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=         # RS256 private key (PEM)
JWT_ACCESS_PUBLIC=         # RS256 public key (PEM)
JWT_REFRESH_SECRET=        # HS256 secret, 64 random bytes

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_PRIVATE_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Expo
EXPO_ACCESS_TOKEN=
```

#### `apps/web/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

#### `apps/mobile/.env`
```
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
EXPO_PUBLIC_WS_URL=http://localhost:3001
```

### Secrets Management
- Never commit `.env` files. `.env.example` (no values) is committed.
- Production secrets stored in provider vaults (Vercel env vars, Railway secrets, GitHub Actions secrets).
- Rotate JWT secrets on suspected compromise — invalidates all sessions automatically.

---

## 22. Coding Conventions

### TypeScript
- `strict: true` always. No `any`. Use `unknown` + type guards.
- Prefer `type` over `interface` for object shapes. Use `interface` only for class implementations.
- No `namespace`. No `enum` — use `as const` objects instead.
- All exported functions must have explicit return types.

### File Naming
| Type | Convention | Example |
|---|---|---|
| React Components | PascalCase | `SwipeCard.tsx` |
| Hooks | camelCase with `use` prefix | `useSwipeDeck.ts` |
| NestJS modules/services/controllers | kebab-case | `auth.service.ts` |
| Schemas | kebab-case + `.schema.ts` | `user.schema.ts` |
| Utility functions | camelCase | `formatDistance.ts` |
| Constants | SCREAMING_SNAKE_CASE in file, camelCase filename | `config/constants.ts` |
| Zod validators | PascalCase + `Schema` suffix | `CreateProfileSchema` |
| DTOs | PascalCase + `Dto` suffix | `CreateProfileDto` |

### Import Order (enforced by ESLint)
1. Node built-ins
2. External packages
3. Internal monorepo packages (`@dating-app/*`)
4. App-local absolute imports
5. Relative imports

### Component Rules (Web + Mobile)
- One component per file.
- Props interface named `{ComponentName}Props`.
- Decompose if JSX exceeds ~80 lines.
- No inline styles on web (use Tailwind classes). No `StyleSheet.create` on mobile where NativeWind can be used.

### NestJS Service Rules
- Services are the only layer that touches the database. Controllers only call services.
- Services must not import other services directly for cross-domain operations — use `EventEmitter2`.
- Every public service method must have a JSDoc describing side effects and thrown exceptions.

### Git Conventions
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Branch naming: `feat/{ticket-id}-short-description`, `fix/{ticket-id}-short-description`
- PRs require at least 1 reviewer approval + passing CI before merge.
- Squash merge to main to keep a linear history.

---

## 23. Feature Roadmap

### Phase 1 — MVP
- [ ] Auth (email/password, Google, Apple)
- [ ] Profile creation + photo upload
- [ ] Discovery feed with swipe (like/pass)
- [ ] Matching
- [ ] Real-time chat (text only)
- [ ] Push notifications (match + message)
- [ ] Basic preferences (age, distance, gender)

### Phase 2 — Growth
- [ ] Superlike
- [ ] Boost (appear at top of feed for 30 min)
- [ ] Profile verification (selfie comparison)
- [ ] Read receipts + typing indicators
- [ ] GIF messages (Giphy integration)
- [ ] Undo last swipe
- [ ] Subscription (Gold / Platinum tiers via Stripe)

### Phase 3 — Retention
- [ ] Video profiles (short clips)
- [ ] Prompt-based icebreakers
- [ ] Voice messages
- [ ] Activity badges (recently joined, frequently active)
- [ ] Advanced filters (height, religion, education, intention)
- [ ] Explore mode (see who liked you without swiping)

---

*Last updated: 2026-04-14 — Initial architecture definition.*
*Owner: Engineering Lead. All structural changes require updating this document.*
