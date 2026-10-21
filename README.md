# Con-Noi

Monorepo for the **Con-Noi** platform: a NestJS backend and a React/Vite frontend.

> **Status:** interactive preview. The landing page and auth flow are complete; workspace and tester screens render demonstration data. Use fictional information only.

## Repository layout

| Path | Stack | Description |
| --- | --- | --- |
| [`backend/`](backend) | NestJS 11, MongoDB/Mongoose, JWT, Swagger | REST API under `/api/v1` — auth, users, applications, matching, messages, notifications, files, audit, admin |
| [`frontend/`](frontend) | React 19, TypeScript, Vite, Tailwind, shadcn/ui | Landing page, authentication flow, researcher workspace and tester space |
| [`UI_UX_BLUEPRINT.md`](UI_UX_BLUEPRINT.md) | — | Design tokens, layout grid and UI/UX specification |

The frontend routes are defined in one table (`frontend/src/lib/routes.ts`); the API surface is documented by Swagger at `/api/docs` when the backend is running.

## Prerequisites

- Node.js 24
- pnpm (frontend) and npm (backend)
- MongoDB with a replica set (`rs0`) for transactions
- Redis (optional, used for throttling/session features)

## Run locally

### Backend

```sh
cd backend
cp .env.example .env      # then edit MONGO_URI, JWT secrets, S3 credentials
npm install
npm run start:dev
```

The API listens on `http://localhost:4000`, Swagger UI on `http://localhost:4000/api/docs`.

Seed an admin account with:

```sh
npm run seed
```

### Frontend

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev --host localhost --port 8080 --strictPort
```

Frontend calls go through `apiFetch` (`frontend/src/lib/api.ts`) against `/api/v1`. Without a reachable backend the workspace and tester screens render their empty state; the landing page, auth flow and legal pages work standalone.

## Verify

```sh
# backend
cd backend && npm run lint && npm test && npm run build

# frontend
cd frontend && pnpm exec tsc -p tsconfig.app.json --noEmit && pnpm lint && pnpm test && pnpm build
```

Browser checks are described in [`frontend/docs/local-testing.md`](frontend/docs/local-testing.md).

## Configuration

Environment variables are read only through `ConfigService` — no secrets are committed. `backend/.env.example` lists every variable with a placeholder value. Local `.env` files, `node_modules/`, `dist/` and `uploads/` are ignored by git.

## License

All rights reserved.
