# NEO To-do App

React/TypeScript frontend with a shared Express/Mongoose backend for workspaces and tasks.

## Local development

Requires Node.js 20.19 or newer and npm.

Start the backend:
```bash
cd backend
npm install
npm run dev
```

The API listens on port 5001. When MONGODB_URI is absent, a local MongoDB instance starts automatically and stores development data in backend/.mongodb-data (ignored by Git). The first run may download MongoDB. For Atlas or an existing database, copy backend/.env.example to backend/.env and set MONGODB_URI. Production requires MONGODB_URI and NODE_ENV=production.

In another terminal:
```bash
cd client
npm install
npm run dev
```

Open the displayed frontend URL. Create or join a workspace with your name. The app uses that workspace's actual member IDs and entered names for profiles and task assignees. Routes are /workspace/:workspaceId/app/home, /today, and /board.

VITE_API_URL is the server origin (for example http://localhost:5001), without /api. PORT controls the server port. Never commit .env or database files.

## API

- POST /api/workspaces — create a workspace and its creator
- GET /api/workspaces/:workspaceId — workspace details and joined members
- POST /api/workspaces/:workspaceId/members — join/add a member
- GET /api/tasks?workspaceId=... — list tasks
- POST /api/tasks — create a task
- PUT /api/tasks/:taskId — edit a task
- PATCH /api/tasks/:taskId/status — move a task
- DELETE /api/tasks/:taskId — delete a task

The task model and IDs follow the shared backend already merged into main. Task failures keep the form open and show an error.

## Verification

```bash
cd client
npm run build
npm run lint
cd ../backend
node --check server.js
```


## Settings, account and theme feature

Start at `/account` to sign up or sign in, then create a workspace or join with an invite code. Use **Settings** in the sidebar. The `/workspace/:workspaceId/app/workspace` route also opens the integrated Settings screen.

- Profile display name and role persist in MongoDB and update workspace membership snapshots.
- Only authenticated owners can rename or delete a workspace. Members can leave. Invite codes resolve to real workspaces.
- Password changes require the current password, and a fresh authenticator code when 2FA is enabled. Other sessions are revoked.
- Authenticator-based 2FA provides QR/manual setup, code verification, login enforcement and replay prevention. A setup expires after ten minutes.
- Account deletion removes owned workspaces/tasks, removes other memberships, clears task assignments and anonymizes creator snapshots in other teams.
- Light/Dark/System applies across the app, persists locally and synchronizes across tabs.
- Native confirmation dialogs support keyboard focus containment, Escape/Cancel and inline failure messages. Destructive actions require a password and typed confirmation.

The visual reference is the provided [Figma Settings prototype](https://www.figma.com/make/8Zz0v0zPw8dTMWgCLzLd1G/Notion-inspired-app-wireframe). Its grouped panels and controls are adapted to the existing main-branch shell and brand assets. Appearance and a workspace switcher are added for the working application.

### Development demo and database design

See [MongoDB data guide](docs/mongodb-data.md) for collections, example documents, indexes, demo credentials and migration limitations. With the API running, `cd backend` and `npm run seed:demo` creates three fictional members, two workspaces and ten varied tasks. It does not clear existing data.

### Settings verification

```bash
cd backend
npm test
cd ../client
npm run build
npm run lint
```

Backend tests use their own temporary MongoDB database, not the development database. They cover profile validation, owner/member/outsider access, invitation lookup, task permissions, password/session revocation, 2FA and replay rejection, leaving and deletion cascades.

### Environment and integration notes

The client defaults to same-origin `/api`; Vite proxies it to port 5001. Use `VITE_API_TARGET` to point that development proxy at another local API, or `VITE_API_URL` for an explicit API origin. The review instance uses frontend port 5174 and backend port 5002 with `LOCAL_DB_DIRECTORY=.mongodb-settings-data`.

`APP_ORIGINS` is an explicit comma-separated allowlist. Production requires HTTPS, `NODE_ENV=production`, `MONGODB_URI`, and a stable 32-byte `SETTINGS_ENCRYPTION_KEY` encoded as 64 hex characters. Store that key securely and keep it stable to decrypt existing authenticator secrets. Local development creates `.settings-key`, which is ignored. Sessions use HttpOnly, SameSite=Strict cookies; deploy the API on the same site (preferably behind `/api`). Sign-in and sensitive operations are rate-limited.

Existing link-only workspaces are readable but receive no inferred owner permissions. Start a new signed-in workspace for all Settings controls; plan a verified ownership migration for old teams. This is supporting account infrastructure for Settings and should be reconciled with Member A's authentication work before integration. Email verification, password-reset delivery and 2FA recovery codes are not part of this branch. Multi-collection deletion is retryable cleanup, not a transaction; see the data guide before a production rollout.
