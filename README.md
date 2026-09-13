# NEO To-do App

A collaborative task-management app for creating, assigning, filtering, and tracking work through a Today dashboard and weekly sprint board.

## Project structure

- `client/` - React, TypeScript, and Vite frontend
- `server/` - Express, TypeScript, MongoDB, and Mongoose API

## Requirements

- Node.js 20.19 or newer
- npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Backend setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Set `MONGODB_URI` in `server/.env` to use MongoDB Atlas or another external database. Never commit the `.env` file. During local development, the server automatically starts a local MongoDB database in `server/.mongodb-data` when `MONGODB_URI` is not set.

The API runs at `http://localhost:4000` by default. Check it with:

```bash
curl http://localhost:4000/api/health
```

## Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Vite proxies `/api` requests to `http://localhost:4000`, so the frontend and backend can be developed together without putting database credentials in the browser.

## API endpoints

### Tasks

- `GET /api/tasks?workspaceId=web-dev` - list tasks
- `GET /api/tasks/:id` - read a task
- `POST /api/tasks` - create a task
- `PUT /api/tasks/:id` - replace a task
- `PATCH /api/tasks/:id` - update fields such as status
- `DELETE /api/tasks/:id` - delete a task

Task lists support `q`, `status`, `priority`, and `sort=dueDate|newest|title` query parameters.

### Team members

- `GET /api/members?workspaceId=web-dev` - list members
- `POST /api/members` - create a member
- `PUT /api/members/:id` - replace a member
- `DELETE /api/members/:id` - delete a member

## Validation

```bash
cd server && npm run build
cd ../client && npm run build && npm run lint
```

## Environment variables

| Variable | Location | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | `server/.env` | MongoDB connection string |
| `PORT` | `server/.env` | API port; defaults to `4000` |
| `CLIENT_ORIGIN` | `server/.env` | Allowed frontend origin for direct API calls |
| `VITE_API_URL` | `client/.env` | Optional API base override; defaults to `/api` |
