# NEO To-do List

A collaborative task management web application designed for student teams and club committees.

NEO To-do allows users to create shared workspaces, invite team members, manage tasks, and track progress through dashboards and sprint boards.

## Features

### Workspace Management
- Create a new workspace
- Join an existing workspace through an invite link
- Share workspace invite links
- Edit workspace name
- View workspace members

### Task Management
- Create tasks
- Edit task details
- Delete tasks
- Assign tasks to workspace members
- Set task priority and due date
- Move tasks between different statuses

### Dashboard
- View tasks for the current workspace
- Today Dashboard for tracking current tasks
- Weekly Sprint Board for organizing task progress
- Filter and manage tasks
- Light and dark theme support

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Libraries:** React Router, React Hook Form, Zod, Lucide React

## Project Structure

- `client/`: React frontend application.
- `backend/`: Express backend and API.
- `backend/models/`: MongoDB models for workspaces and tasks.

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ToDo-List
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Create `backend/.env`:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=5001
   ```

4. **Run the backend:**
   ```bash
   npm run dev
   ```

5. **Install and run the frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

6. Open:
   ```text
   http://localhost:5173
   ```

## How to Use

### Create a Workspace

1. Open the application.
2. Enter a workspace name.
3. Enter your name.
4. Optionally enter your email.
5. Click **Create Workspace**.

You will automatically become the first member of the workspace.

### Invite Team Members

1. Open your workspace.
2. Copy the workspace invite link.
3. Send the link to your teammate.
4. The teammate opens the link and enters their name and optional email.
5. After joining, they become a member of the workspace.

### Manage a Workspace

Use the workspace menu in the sidebar to open **Manage Workspace**.

From there, you can:

- Edit the workspace name
- View workspace members
- Copy the workspace invite link

### Manage Tasks

Workspace members can create and manage tasks with information such as:

- Title
- Description
- Status
- Priority
- Due date
- Assignee

Tasks are shared within the workspace and stored in MongoDB.

## Available Views

### Home

Provides an overview of workspace tasks.

### Today Dashboard

Displays tasks relevant to the current day and helps members focus on their current work.

### Weekly Sprint Board

Organizes tasks by status to help the team monitor sprint progress.

## Branch deployment adapter

On `ngoc/production-nextauth`, the root Next.js app serves the React interface and Express API from one origin. Start it with `npm run dev`. `/`, `/login`, `/account`, and `/account/email` share one account page with username and email/password sign-in, email registration, and workspace selection. The email alias initially selects email sign-in. Both methods use the same persisted account session for workspace, task, and settings APIs.

The Cloudflare adapter uses a request-scoped Mongoose connection and the native HTTP bridge to run the Express handlers. Local Next.js uses a serverless HTTP adapter. Configure `MONGODB_URI`, `MONGODB_DB`, `APP_ORIGINS`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`. Set `SETTINGS_ENCRYPTION_KEY` or use the stable key derived from `NEXTAUTH_SECRET`. NextAuth handles username credentials, which are exchanged for the shared backend session. Never commit environment files or credentials.

Validate with `npm run typecheck`, `npm run lint`, and `npm run build`. For integration and browser tests, install Chromium with `npx playwright install chromium`, start `node scripts/test-server.mjs`, then run `npm test` in another terminal. This server uses a disposable MongoDB database, including legacy username fixtures. Tests cover both sign-in methods, workspace/task persistence after clearing browser storage and signing in again, return links, and session expiry. Run `node --test backend/tests/settings.test.js` for isolated account, permissions, password, and 2FA coverage. For Cloudflare validation, build with `npm run build:cloudflare` and start the isolated server with `QA_CLOUDFLARE=1 node scripts/test-server.mjs`.

Production uses the `original_` collection prefix for backend accounts, workspaces, tasks, and sessions. Existing username profiles and their shared workspaces/tasks are copied once from the earlier collections when signing in, retaining IDs and source records. Username and email identities remain separate; choosing another sign-in method does not link accounts. Account workspace creation uses the signed-in profile and rejects expired sessions instead of creating an unowned workspace. Keep releases on this branch; do not merge into main.

### Task assignment and save feedback

Home provides task creation/editing, assignee filters, and teammate invitation navigation. The shared task editor supports assigning a workspace member, assigning yourself, or clearing the assignment. The API validates membership and normalizes assignee details; assignments appear in the recipient's My Tasks view.

Edits and board moves render immediately with a saving indicator. Changes to the same task are sent in order; each server response updates the confirmed record while later edits remain visible. Failed changes roll back with an error, and background refreshes cannot replace pending changes. Creation waits for the server-generated task ID. `tests/optimistic-tasks.test.ts` covers racing responses, rollback, stale reads, and My Tasks membership; browser coverage exercises delayed saves and failed drag requests against isolated MongoDB.
