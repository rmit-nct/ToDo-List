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

Visit http://localhost:3000, create an account, save the one-time recovery key in a password manager, and sign in. Create a workspace or join through an owner's invite link. Signing in from another device restores workspace access and preferences.

## Accounts and permissions

- Passwords use bcrypt (cost 12); validation enforces at least 12 characters and a maximum of 72 UTF-8 bytes.
- Each workspace is private to its members. Task assignments must reference actual members; identity and task creator are derived on the server.
- Members can create, edit, move, and delete workspace tasks. Deletion requires UI confirmation.
- Only the workspace owner can rename the workspace or retrieve/replace its invite link.
- Invitations are unguessable bearer links. Share privately. Replacing a link immediately invalidates the old link.
- Registration, sign-in, recovery, and task writes have database-backed rate limits. Mutation endpoints validate request origin and JSON input.
- Password changes and recovery invalidate existing sessions. Recovery uses the one-time key saved at signup and issues a new key. No email delivery provider is required; email addresses are login identifiers and are not verified.
- Theme and display-name settings persist in the account. No demo accounts or members are inserted.

Legacy name-only workspace identities are not accounts. This release uses a dedicated database and does not silently claim or import legacy records. Existing data must be reviewed and ownership mapped before a separate migration.

## API

NextAuth endpoints are under `/api/auth/*`.

| Endpoint                         | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `POST /api/register`             | Create account and issue recovery key               |
| `POST /api/recover`              | Reset password using recovery key                   |
| `GET/PATCH /api/account`         | Read/update profile, theme, password                |
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
