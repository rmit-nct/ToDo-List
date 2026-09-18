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