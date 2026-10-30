# Manual acceptance checklist

Run the stack (`docker compose up -d --build`, see [`DEPLOYMENT.md`](../DEPLOYMENT.md))
or start the backend and `npm run dev` in `frontend/`.

Seeded accounts: `admin@platform.it / ChangeMe!2026` and
`marco@test.it / Worker123!`.

## Landing and auth

| Area | Steps | Expected |
| --- | --- | --- |
| Landing | Open `/` | Hero, partner logos, FAQ, footer render |
| Register | `/auth/signup`, pick 1-6 specialities | Account created, redirected to `/onboarding` |
| Login | `/auth/login` with seeded worker | Redirected to `/for-you` with real posts |
| Wrong password | Login with a bad password | "Credenziali non valide", no crash |
| Logout | Profile → Settings → delete flow, or clear cookies | Session ends |

## Password reset

| Area | Steps | Expected |
| --- | --- | --- |
| Request | `/auth/recover`, submit a registered email | "Controlla la tua email" confirmation |
| Unknown address | Submit an unregistered email | Identical confirmation (no account enumeration) |
| Email | `docker compose logs api --tail 30` (no SMTP configured) | Message logged with a `/auth/reset-password?token=…` link |
| Set password | Open the link, submit matching strong passwords | "Password aggiornata", redirect to login |
| Old password | Log in with the old password | Rejected (401) |
| New password | Log in with the new password | Works |
| Token reuse | Open the same link again | "Link non valido o scaduto" |

## Worker journey

| Area | Steps | Expected |
| --- | --- | --- |
| Feed | `/for-you` | Cards show speciality names, salary, match score |
| Like | Click a heart | Toggles and persists after refresh |
| Browse | `/browse`, filter by city/type | Result count updates, no validation error |
| Detail | Open a post | Requirements, benefits, company, views |
| Apply | Click "Candidati", submit | Success screen; duplicate apply is blocked |
| Applications | `/applications` | Shows post title, company, city and status tabs |
| Withdraw | On a submitted application | Status becomes "Ritirata" |
| Messages | `/messages` | Thread list shows names and timestamps (no "Invalid Date") |
| Profile | `/profile` | Overview, work history, documents, settings all load |
| Documents | Upload a PDF résumé | Appears with size and scan status |

## Admin

| Area | Steps | Expected |
| --- | --- | --- |
| Dashboard | `/admin/dashboard` | Stats, funnel, top posts |
| Review | `/admin/applications`, accept one | Status changes; worker receives a notification |
| Posts | `/admin/posts` | Publish/close/archive actions work |
| Users | `/admin/users` | List, activate/deactivate |
| Broadcast | `POST /api/v1/notifications/broadcast` | Response reports how many users were notified |
| Audit | `/admin/audit` | Status changes appear with before/after |

## Access control

| Case | Expected |
| --- | --- |
| Another user's application id | 403 |
| Worker calling `/admin/stats` | 403 |
| No cookie calling `/auth/me` | 401 |
| Another user's file download | 403 |
| Swagger in production | 404 (disabled) |

## Not included yet

Password reset emails send; **email verification** is not implemented, and
there is no billing module. See the limitations section in `DEPLOYMENT.md`.
