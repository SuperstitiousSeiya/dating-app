# Spark — Setup & Running Guide

## Prerequisites

| Tool | Min version | Notes |
|------|-------------|-------|
| [Node.js](https://nodejs.org) | 20.x | Required by all apps |
| [Bun](https://bun.sh) | 1.1.0 | Primary package manager |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | any | Runs MongoDB + Redis |
| [Git](https://git-scm.com) | any | |

> **Windows users** — enable long path support once (run PowerShell **as Administrator**):
> ```powershell
> reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
> ```
> Then **restart your terminal**. This is required because React Native packages exceed Windows's 260-character path limit.

---

## 1. Install dependencies

```bash
bun install
```

Bun links all workspace packages automatically. The `@dating-app/*` packages are symlinked into each app's `node_modules` — no extra steps needed.

---

## 2. Set up environment variables

### Backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

Open `apps/backend/.env` and fill in at minimum:

```env
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/dating-app
REDIS_URL=redis://localhost:6379

# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=change-me-access-secret-at-least-32-chars
# Generate with: openssl rand -base64 64
JWT_REFRESH_SECRET=change-me-refresh-secret-at-least-64-chars
```

The following are optional for local dev (features are no-ops without them):

| Variable | Feature |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login |
| `APPLE_CLIENT_ID` / `APPLE_PRIVATE_KEY` | Apple Sign-in |
| `CLOUDINARY_*` | Photo uploads |
| `STRIPE_*` | Subscriptions |
| `RESEND_API_KEY` | Transactional email |
| `EXPO_ACCESS_TOKEN` | Push notifications |

### Web

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

`apps/web/.env.local` — defaults work out of the box for local dev:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=   # optional
```

### Mobile

Copy and edit `apps/mobile/.env.example` if it exists, or set `API_URL` and `WS_URL` inside `apps/mobile/app.config.ts` → `extra` section. Defaults point to `localhost:3001`.

---

## 3. Start databases

```bash
bun docker:up
```

This starts two containers in the background:

| Container | Port | Purpose |
|-----------|------|---------|
| `dating-app-mongo` | `27017` | MongoDB 7 |
| `dating-app-redis` | `6379` | Redis 7 |

To also launch Redis Commander (web UI for Redis):

```bash
docker-compose --profile tools up -d
# Open http://localhost:8081
```

Check that both are healthy:

```bash
docker ps
```

Both containers should show `(healthy)` in the `STATUS` column.

---

## 4. Run the apps

### All apps at once (recommended)

```bash
bun dev
```

Turborepo starts all apps in parallel with dependency-aware ordering:

| App | URL | Description |
|-----|-----|-------------|
| Backend (NestJS) | `http://localhost:3001` | REST API + WebSocket |
| Web (Next.js) | `http://localhost:3000` | Browser app |
| Mobile (Expo) | Expo Go / simulator | React Native app |

### Individual apps

```bash
# Backend only
bun dev:backend

# Web only
bun dev:web

# Mobile only (from the mobile app directory)
cd apps/mobile
bun run dev          # starts Expo dev server
```

### Swagger API docs

When the backend is running in `development` mode, the interactive API docs are available at:

```
http://localhost:3001/api/docs
```

---

## 5. Mobile — device / simulator setup

**Expo Go (easiest — no build needed):**

1. Install [Expo Go](https://expo.dev/client) on your phone.
2. Run `bun dev` from the repo root (or `bun run dev` inside `apps/mobile`).
3. Scan the QR code printed in the terminal.

**iOS Simulator (macOS only):**

```bash
cd apps/mobile
bun run ios
```

**Android Emulator:**

```bash
cd apps/mobile
bun run android
```

> Make sure Android Studio is installed and an AVD is running before executing the above.

---

## 6. Build for production

```bash
# Build all packages and apps
bun run build

# Build a single app
bun run build --filter=@dating-app/backend
bun run build --filter=@dating-app/web
```

**Mobile production build (via EAS):**

```bash
cd apps/mobile
bun run build:preview     # TestFlight / Internal track
bun run build:production  # App Store / Play Store
```

---

## 7. Other useful commands

```bash
# Type-check all packages
bun run type-check

# Lint everything
bun run lint

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Format all files
bun run format

# Stop and remove Docker containers
bun docker:down

# Clean all build artifacts and node_modules
bun run clean
```

---

## Project structure (quick reference)

```
dating-app/
├── apps/
│   ├── backend/          # NestJS API  (port 3001)
│   ├── web/              # Next.js 16  (port 3000)
│   └── mobile/           # Expo SDK 51
├── packages/
│   ├── validators/        # Zod schemas  (@dating-app/validators)
│   ├── types/             # Shared TS types  (@dating-app/types)
│   ├── utils/             # Pure utility functions  (@dating-app/utils)
│   ├── config-typescript/ # Shared tsconfig bases
│   ├── config-eslint/     # Shared ESLint configs
│   └── config-tailwind/   # Shared Tailwind preset
├── docs/
│   └── architecture.md    # Full system architecture
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Troubleshooting

**`bun install` fails with ENOENT on Windows**
Long paths are disabled. Run the registry command in step 0, restart your terminal, and re-run `bun install`.

**TypeScript error: `File '@dating-app/config-typescript/nestjs.json' not found`**
Run `bun install` so Bun creates the workspace symlinks, then restart the TypeScript server in your editor (`Ctrl+Shift+P` → `TypeScript: Restart TS Server`).

**MongoDB connection refused**
Docker containers aren't running. Run `bun docker:up` and wait ~10 s for the health checks to pass.

**Port already in use**
Change `PORT` in `apps/backend/.env` (and update `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` to match).

**Expo: `metro` can't resolve `@dating-app/*`**
Make sure `bun install` was run from the **repo root** (not inside `apps/mobile`). Workspace symlinks are created from the root.
