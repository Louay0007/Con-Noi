# Elseview frontend

React 19, TypeScript, Vite, Tailwind CSS and shadcn/ui. Holds the landing page, the authentication flow, and two separate product spaces: the **researcher** workspace and the **tester** space.

See the [repository README](../README.md) for what Elseview is and where the product stands.

> **Status:** this is an interactive preview. The landing page and auth flow are complete; workspace and tester screens render demonstration data, and the auth flow does not establish identity. Use fictional information only.

Every path lives in [`src/lib/routes.ts`](src/lib/routes.ts). No component writes a path literal — they import the table and use `withQuery`/`authRoute` to attach query parameters. Adding or renaming a route is a one-line change there, and `src/lib/auth.test.ts` fails if a route stops being served or a link loses its destination.

## Run locally

```sh
cd frontend
pnpm install --frozen-lockfile
pnpm dev --host localhost --port 8080 --strictPort
```

Use Node.js 24 and pnpm. Open the URL printed by Vite and visit `/` for the landing page.

Workspace and tester screens call the backend through `apiFetch` (`src/lib/api.ts`) against `/api/v1`. Without a reachable backend those pages render their empty state; the landing page, the auth flow and the legal pages work standalone.

## Routes

**Landing and legal**

| Path | Screen |
| --- | --- |
| `/` | Landing page |
| `/legal/terms`, `/legal/privacy` | Legal copy (placeholders — the policies are not published yet) |

**Authentication** — each mode mounts `AuthFlow` under its own key, so a refresh or a shared link lands on the right step. `?role=researcher|tester` selects the space the account belongs to.

| Path | Screen |
| --- | --- |
| `/auth/login` | Sign in |
| `/auth/signup` | Register; no invitation required |
| `/auth/verify-email` | Enter the email code; `?resend=1` opens the resend form |
| `/auth/recover`, `/auth/reset-password` | Request instructions, then set a new password |
| `/auth/invitation` | Workspace invitation code, separate from registration |
| `/auth/complete-profile` | Profile completion; includes Log out |

**Researcher workspace**

| Path | Screen |
| --- | --- |
| `/dashboard` | Home: test templates, results at a glance |
| `/studies/new`, `/studies/:studyId/edit` | Study builder |
| `/recruit`, `/publish` | Recruitment and publishing steps |
| `/reviews`, `/reports/:reportId` | Report queue and one report |
| `/preview` | Participant-facing runner preview |
| `/analytics`, `/history` | Results and past work |
| `/account`, `/account/notifications`, `/account/refer` | Profile, notifications, referral |
| `/settings`, `/workspace/billing`, `/workspace/credits`, `/workspace/credits/buy` | Settings, billing, credits |

The builder passes a study between steps as a query string. `studyQuery` returns params, not a pre-built string, so `withQuery` owns encoding and an unnamed study travels without an empty `name=`.

**Tester space** — a tester must never reach a researcher page that manages studies, credits, reports or billing. All `/tester/*` pages currently render fixture data.

`/tester`, `/tester/onboarding`, `/tester/studies`, `/tester/runner`, `/tester/test`, `/tester/sessions`, `/tester/history`, `/tester/notifications`, `/tester/earnings`, `/tester/profile`, `/tester/verify-id`, `/tester/guidelines`

`/tester/test` is one complete test, start to finish — the demo the dashboard links to above the single-method exercises. It is the first tester screen built from a model rather than from fixtures: `testFlow.ts` defines a test as an ordered list of blocks (welcome, questions, method brief, a task interstitial and a task per prototype task, more questions, a closing card, thanks) and `testBlocks` flattens that into what the runner walks. The runner knows nothing about the demo's content, so a new method is a new block rather than a change to the runner.

Questions are numbered inside their own group rather than across the test — `QUESTION 1/1`, then the prototype, then `QUESTION 1/2` — because counting across the whole test would tell a tester there are three questions while showing them two tasks they have not been counted in.

The runner's frame is `TestChrome`, not `TesterShell` — but it renders `TesterHeader`, the dashboard's own bar, so a tester moving between the two is not told they have left the product. What the shell does not bring is its wallet column, its grey footer band and its floating help button: mid-answer a tester needs to stay put, so the runner carries a slim strip with support and an exit instead. The prototype tasks run in `TaskPreview`, a static drawing that says so on its face — a fake prototype that looks live is worse than one that admits its limits. Every route out of a test raises the same dialog, so abandoning a paid test is always a choice. `testFlowTheme.ts` holds the flow's palette as one blue ramp — ink, deep, accent, mid, pale — dark enough at the bottom to tie into the black header bar, and the closing card runs along three of its steps. `testFlow.test.tsx` checks the block order, the question numbering, the answer rules for all three kinds, that no string ships untranslated, that every route out goes through the dialog, and that every colour in the flow is either a neutral or a blue with white text readable on it.

`/tester/guidelines` is where a tester reads the rules they are measured against — how the score moves, what a low score costs, what a profile is checked for, and what a payout needs. The account header links to it beside the score pill, since a tester reads the two together. Rules that describe a number are laid out beside that number (`TesterScoreMeter`) rather than inside a sentence.

The page's dark surfaces live in `guidelinesTheme.ts` as one navy ramp — the instrument panels, the meter track and the closing panel — rather than as flat fills, so the page reads as a single surface. `guidelines.test.tsx` computes WCAG contrast for every stop and for each text colour on the panel, and fails the build if a colour change makes a dark surface unreadable or reintroduces the plum and pink the page was moved off.

The payout threshold is imported from `testerPayouts.ts` so this page and `/tester/earnings` cannot disagree about it, and `guidelines.test.tsx` fails the build if a second copy of the number appears.

`/tester/verify-id` opens `VerifyIdDialog`, which walks a tester through one photo per step — selfie, front of the ID, back of the ID, then a review of all three. The same dialog is mounted from the tester's home dashboard, from step 1 of `/tester/onboarding`, and from the payout and profile notices, so identity verification has one implementation rather than one per entry point. The dashboard mounts it in place rather than navigating away — a tester asking to verify their ID is not asking to re-do their profile questionnaire.

Photos are held as object URLs in tab memory and revoked on replace, remove, close or unmount. Nothing is uploaded and nothing is written to `localStorage` — a picture of an identity document must not outlive the tab that photographed it. `verify-id.test.tsx` fails the build if that ever changes.

**Legacy aliases** — an old bookmark or shared link redirects instead of hitting the not-found page: `/login`, `/signup`, `/mfa`, `/auth/mfa`, `/auth/enroll-mfa`, `/studies/create`, `/study-preview`, `/terms`, `/privacy`.

Anything else renders `NotFound`.

## Verify

```sh
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm lint
pnpm test
pnpm build
pnpm preview --host localhost
```

The tests cover authentication validation, the route table and its invariants, an audit that every link in `src` resolves to a real route, landing copy and SEO, and the identity-verification step contract. See [the local testing guide](docs/local-testing.md) for browser checks.

## Preview boundaries

The authentication flow is a UI simulation: it does not establish identity, verify codes, send email, or call an API. Use fictional information and demo passwords only. Actual authorization, token transport, email delivery and durable account lifecycle remain integration work.