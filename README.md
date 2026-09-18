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
cd frontend
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
cd frontend
npm run build
npm run lint
cd ../backend
node --check server.js
```

## Settings and appearance

Open `/workspace/:workspaceId/app/settings` from the sidebar. Light, Dark, and System modes apply across the app, persist in this browser, and synchronize between tabs. System mode follows live device changes. The header toggle selects an explicit Light or Dark preference.

Profile edits update the current workspace member through `PATCH /api/workspaces/:workspaceId/members/:memberId`. Name is required (80 characters maximum); email is optional. Workspace details, members, and invite sharing reuse the existing Manage Workspace page.

Integration limitation: main uses link-based workspace membership, not authenticated accounts. Member IDs are not authentication credentials. Password changes, 2FA, verified owner roles, owner-only workspace deletion, and account deletion need the authentication/authorization work before release. No destructive account controls are simulated here. Existing workspace-management routes also lack owner authorization.
