# NEO — Neo Culture Tech

A team task workspace with Today, a sprint board, searchable overview, My Tasks, task quick actions, settings, and responsive NCT light/dark branding.

## Stack and structure

Next.js 16 serves the React interface and backend from one origin. NextAuth.js manages encrypted HTTP-only JWT sessions; accounts, workspace memberships, invitations, preferences, and tasks persist in MongoDB through a pooled Mongoose connection.

- `app/`: Next.js entrypoints and API routes.
- `backend/`: authentication, validation, database access, and authorization.
- `client/src/`: interactive pages, task components, and branding.
- `tests/`: HTTP integration tests using separate accounts and workspaces.

The old unauthenticated Express/Vite servers and mock members have been replaced. Run commands from the repository root.

## Local setup

Use Node.js 22 or 24 and npm:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Configure `MONGODB_URI`, `MONGODB_DB`, `NEXTAUTH_URL`, and a randomly generated `NEXTAUTH_SECRET` in `.env.local`. Generate a secret with `openssl rand -base64 32`; keep it private. Use a local MongoDB installation or a dedicated Atlas development database. Production never starts an ephemeral database or falls back to mock data.

Visit http://localhost:3000, enter a username, then select, create, or join a workspace. No password, email, signup form, or recovery key is required. Usernames are 3–32 ASCII letters, numbers, dots, underscores, or hyphens; case and surrounding whitespace are normalized. A profile is created on first use and restored when the same username is entered on another device.

## Shared username access

This is a trusted-team identity picker, not proof of identity. **Anyone who knows a username can use its profile and its workspaces**, including owner actions. Do not use this mode for confidential data. NextAuth still maintains the browser session; membership checks prevent one profile from accessing another profile's workspaces, but usernames themselves are not secrets.

- Workspace selection lists the current profile's memberships. New profiles create a workspace or join with an invite.
- Members can create, edit, move, and delete workspace tasks. Only the owner profile can rename a workspace or replace an invite.
- Profile names and themes persist. Changing a display name does not change the login username.
- Sign-in and writes are rate limited; mutation endpoints validate origin and input.
- Existing email/password records and their memberships are preserved and are never claimed by matching a display name. They do not appear in the username login flow. The legacy registration/recovery APIs remain for compatibility; ownership migration must be explicit.

Calendar deadlines, team workload, search, deadline/status/priority filters, and CSV export use real workspace tasks. CSV export includes only the filtered tasks and neutralizes spreadsheet formulas.

## API

NextAuth endpoints are under `/api/auth/*`.

| Endpoint                         | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `POST /api/register`             | Legacy account registration               |
| `POST /api/recover`              | Legacy account recovery                   |
| `GET/PATCH /api/account`         | Read/update profile and theme (passwords only for legacy records)                |
| `GET/POST /api/workspaces`       | List own workspaces / create workspace              |
| `POST /api/workspaces/join`      | Join using invite code                              |
| `GET/PATCH /api/workspaces/:id`  | Read authorized workspace / owner settings          |
| `GET /api/tasks?workspaceId=...` | List authorized workspace tasks                     |
| `POST /api/tasks`                | Create task                                         |
| `GET/PUT/DELETE /api/tasks/:id`  | Read/edit/delete authorized task                    |
| `PATCH /api/tasks/:id/status`    | Move task                                           |
| `GET /api/health`                | Database readiness without configuration disclosure |

Search, status/priority/assignee filters and sorting operate on the current workspace's fetched tasks. Task lists currently support up to 5,000 records per workspace; larger datasets require pagination before extending this limit.

## Verification

```sh
npm run typecheck
npm run lint
npm run build
```

Start a disposable MongoDB instance and test app (never reads existing database files):

```sh
node scripts/test-server.mjs
# In a second terminal:
npm test
node scripts/browser-qa.mjs
```

Browser QA uses an isolated, headless Google Chrome profile. Screenshots go to `/tmp/nct-qa`. To test the production build locally, build first and set `QA_PRODUCTION=1` when starting the test server. Integration/browser test accounts only belong in disposable QA databases. Do not point these scripts at production.

## Deployment

Deploy the repository root as a Next.js project in Vercel's **Tuturuuu** team (`nct-todo`), with the app in Singapore (`sin1`). Create the production cluster directly in MongoDB Atlas and a database user limited to this app's database. Configure Atlas network access for the deployment's egress; dynamic Vercel egress may require a broad Atlas network rule unless fixed egress is configured. Database authentication remains mandatory.

Set private Vercel production environment variables:

- `MONGODB_URI`: Atlas driver connection string with the dedicated database user.
- `MONGODB_DB`: dedicated production database name.
- `NEXTAUTH_SECRET`: unique, random server secret.
- `NEXTAUTH_URL`: canonical production HTTPS URL.

Keep preview databases separate from production. Never expose these values using `NEXT_PUBLIC_` variables. After deployment verify account creation/sign-in, workspace invitation, task persistence, theme settings, authorization, logs, and the canonical domain. A successful build alone does not prove the database is connected.

GitHub operations must use **myngoc0703**, with `ngoc/` feature branches. See `AGENTS.md`.
