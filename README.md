# NEO To-Do List

A collaborative task management web application designed for student teams and club committees.

NEO To-Do List provides a shared workspace where team members can organize tasks, track progress, manage members, and collaborate through a simple and centralized interface.

## Demo

🎥 **Video Demo:** 
![demo video](docs/demo/NEO-TODO-LIST.gif)

## Features

- Create and join team workspaces
- Username and email account access
- Create, edit, and manage tasks
- Assign tasks to workspace members
- Track task status and priority
- Today Dashboard for current tasks
- Weekly Sprint Board for planning and progress tracking
- Workspace member management
- Workspace rename and management
- Shareable workspace invitation links
- Form validation and error handling
- Light and dark mode
- Responsive user interface

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Lucide React

### Backend

- Next.js
- Node.js
- MongoDB
- Mongoose
- NextAuth

## Project Structure

```text
ToDo-List/
├── app/                  # Next.js application and API routes
├── backend/              # Backend services
├── client/               # React client application
├── docs/                 # Documentation and demo materials
├── public/               # Static assets
├── scripts/              # Project scripts
├── tests/                # Automated tests
├── .env.example          # Environment variable template
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and project scripts
├── tsconfig.json         # TypeScript configuration
└── README.md

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js 22 or later
- npm
- Access to the project's MongoDB database

### 1. Clone the repository

```bash
git clone https://github.com/rmit-nct/ToDo-List.git
cd ToDo-List
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure environment variables

Create a `.env` file in the project root based on `.env.example`.

```bash
cp .env.example .env
```

Configure the required MongoDB and authentication environment variables.

> Do not commit the `.env` file or database credentials to GitHub.

### 5. Start the application

Start the backend from the project root:

```bash
npm run dev
```

Then start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the frontend URL shown by Vite in your browser.

## Main User Flow

1. Sign up or sign in.
2. Create a new workspace or join an existing workspace.
3. Invite other team members using the workspace invite link.
4. Create and assign tasks.
5. Manage task status, priority, and due dates.
6. Track work through the Today Dashboard and Weekly Sprint Board.
7. Manage workspace information and members.
