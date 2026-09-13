# NEO To-do App

React/TypeScript frontend with a shared Express/Mongoose backend for workspaces and tasks.

## Local development

Requires Node.js 20.19 or newer and npm.

Start the backend:
```bash
cd server
npm install
npm run dev
```

The API listens on port 5001. When MONGODB_URI is absent, a local MongoDB instance starts automatically and stores development data in server/.mongodb-data (ignored by Git). The first run may download MongoDB. For Atlas or an existing database, copy server/.env.example to server/.env and set MONGODB_URI. Production requires MONGODB_URI and NODE_ENV=production.

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
cd ../server
node --check server.js
```
