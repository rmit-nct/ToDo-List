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

On `ngoc/production-nextauth`, the root Next.js app serves the original interface and Express API from one origin. Start it with `npm run dev`. The original teammate-owned pages, entry flow, account/settings handlers, and schemas are preserved from `ad2f5ed`; task feature changes are limited to Today Dashboard, Sprint Board, and task CRUD. The previously added username-only login, calendar, workload, CSV export, and branding overrides are removed.

The Cloudflare adapter uses a request-scoped Mongoose connection and the native HTTP bridge to run the original Express handlers. Local Next.js uses a serverless HTTP adapter. Configure `MONGODB_URI`, `MONGODB_DB`, `APP_ORIGINS`, and `SETTINGS_ENCRYPTION_KEY`. The existing `NEXTAUTH_SECRET` can supply a stable derived encryption key for deployment compatibility; NextAuth is no longer used for login. Never commit environment files or credentials.

Validate with `npm run typecheck`, `npm run lint`, and `npm run build:cloudflare`. Run `QA_CLOUDFLARE=1 node scripts/test-server.mjs`, then `npm test` and `node scripts/browser-qa.mjs`, using only its disposable MongoDB database. The original teammate backend suite is `node --test backend/tests/settings.test.js` with a temporary `SETTINGS_ENCRYPTION_KEY`.

Production data created by the removed username-only implementation uses a different account/workspace schema. Production uses the `original_` collection prefix for the restored flow, retaining the earlier username-only collections unchanged. Earlier username-only profiles and workspaces do not appear in the restored flow. The pre-release audit found no tasks in those earlier collections. Keep releases on this branch; do not merge into main.
