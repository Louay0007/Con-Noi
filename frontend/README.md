# Con-Noi frontend

React 19, TypeScript, Vite, Tailwind CSS and shadcn/ui. The landing page, the
authentication flow, the worker workspace and the admin area.

See the [repository README](../README.md) for the product overview and
[`DEPLOYMENT.md`](../DEPLOYMENT.md) for hosting.

## Run locally

```sh
cd frontend
npm install
npm run dev          # http://localhost:8080
```

Node.js 24. The dev server proxies `/api` to `http://localhost:4000`
(override with `API_PROXY_TARGET`), so start the backend too or the workspace
screens will render their empty states.

## Routes

Routes live in [`src/App.tsx`](src/App.tsx), lazy-loaded per screen.

| Path | Screen |
| --- | --- |
| `/` | Landing page |
| `/auth/login`, `/auth/signup` | Sign in, register |
| `/auth/recover` | Request a password-reset email |
| `/auth/reset-password?token=…` | Set a new password from the emailed link |
| `/onboarding` | Specialities, résumé, work history |
| `/for-you` | Personalised feed |
| `/browse`, `/posts/:id`, `/apply/:postId` | Search, job detail, apply |
| `/applications`, `/messages`, `/profile` | Worker account area |
| `/admin/dashboard`, `/admin/posts`, `/admin/applications`, `/admin/users`, `/admin/audit` | Admin area |

## Backend contract

Everything goes through `src/lib/api.ts`, which prefixes `/api/v1`, sends
cookies (`credentials: "include"`) and unwraps the `{ data, meta }` envelope.

## Verify

```sh
npx tsc -p tsconfig.app.json --noEmit
npx eslint .
npx vitest run
npm run build
```

## Notes

- `src/lib/routes.ts` is legacy from an earlier product idea and is **not**
  imported anywhere. Treat `src/App.tsx` as the source of truth.
- The landing page and auth screens work without a backend; every other screen
  needs the API running.
