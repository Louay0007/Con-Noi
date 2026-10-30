# Con-Noi

Worker placement platform — NestJS API + React frontend, packaged for
single-command deployment.

| Path | Stack | Description |
| --- | --- | --- |
| `backend/` | NestJS 11, MongoDB/Mongoose, JWT, Swagger | REST API under `/api/v1` |
| `frontend/` | React 19, TypeScript, Vite, Tailwind, shadcn/ui | Landing, auth, worker workspace, admin |
| `DEPLOYMENT.md` | — | Docker Compose and manual VPS deployment |
| `UI_UX_BLUEPRINT.md` | — | Design tokens and UI specification |

## What works today

- Landing page, registration, login, logout, cookie-based sessions
- Worker onboarding: specialities, resume upload, work history
- Personalised "For You" feed (scores by speciality overlap, city, recency)
- Browse with filters, job detail, apply with cover letter and attachments
- My applications with status tracking and withdraw
- Messaging between users with unread counts
- Profile: overview, work history, documents, GDPR export and deletion
- Admin: dashboard stats, post lifecycle, application review, user management,
  audit log, broadcast notifications
- Health endpoint at `/api/v1/health` plus container healthchecks

## Prerequisites

- Node.js 24
- MongoDB 7 (replica set recommended)
- Docker + Compose plugin (for the containerised path)

## Run locally

```sh
# 1. Database
docker run -d --name connoi-mongo -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec connoi-mongo mongosh --quiet --eval "rs.initiate()"

# 2. Backend
cd backend
cp .env.example .env
node scripts/gen-secrets.js       # strong JWT secrets
npm install --legacy-peer-deps
npm run seed
npm run start:dev                 # http://localhost:4000

# 3. Frontend (second terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev                       # http://localhost:8080
```

Test credentials after seeding:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@platform.it` | `ChangeMe!2026` |
| Worker | `marco@test.it` | `Worker123!` |

Change the admin password before exposing the app publicly.

## Verify

```sh
# backend
cd backend
npx tsc --noEmit -p tsconfig.json
npx jest                  # unit
npm run test:e2e          # end-to-end, in-memory Mongo

# frontend
cd frontend
npx tsc -p tsconfig.app.json --noEmit
npx eslint .
npx vitest run
npm run build
```

## Deploy

See [`DEPLOYMENT.md`](DEPLOYMENT.md). Short version:

```sh
cd backend && cp .env.example .env && node scripts/gen-secrets.js
# edit .env: FRONTEND_URL, SEED_ADMIN_*
cd .. && docker compose up -d --build
docker compose exec api npm run seed
```

## API

Base path `/api/v1`. Interactive docs at `/api/v1/docs` in development;
disabled automatically when `NODE_ENV=production`.

## Security notes

- JWT access and refresh tokens are stored in `httpOnly` cookies, not
  `localStorage`; refresh tokens are hashed at rest with SHA-256 and rotate.
- Config validation refuses to start production with secrets under 32
  characters.
- Helmet sets a strict CSP in production; CORS is an explicit allowlist.
- Rate limiting is enforced globally with per-route overrides on auth and
  upload endpoints.

## License

Commercial. All rights reserved.
