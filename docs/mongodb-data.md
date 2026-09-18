# MongoDB data for NEO

## Recommended demo dataset

Use fictional student teams rather than importing unrelated public datasets. The app needs relationships and edge cases that match its own workflows.

| Collection | Suggested records | Purpose |
| --- | --- | --- |
| `users` | Aria Chen (frontend), Ben Nakamura (backend), Cleo Santos (design) | Profile, sign-in, password and authenticator settings |
| `workspaces` | Web Dev Team and Design Club, each with three members | Owner/member permissions, invite codes, shared tasks |
| `tasks` | Ten tasks across both teams | To do, in progress, done; high, medium, low; overdue, today, upcoming |
| `sessions` | Created automatically by sign-in | Expiring, revocable login sessions; never seed raw session tokens |

Run `npm run seed:demo` in `backend` while the API is running. This script only permits localhost, creates missing demo workspaces, and never clears a database. Re-running preserves existing workspace tasks. It updates the three demo profiles to their documented names and roles.

For the isolated review server:

```powershell
$env:DEMO_API_URL = 'http://127.0.0.1:5002'
npm run seed:demo
```

Open `/account` and sign in as `aria@neo.example`, `ben@neo.example`, or `cleo@neo.example`. The shared **local demo only** password is `NeoDemo!2026Review`. Aria owns the seeded workspaces; Ben and Cleo are members. Never seed these credentials into production.

Dates are generated relative to the seed date, so a fresh workspace includes overdue and upcoming tasks. To review an empty state, create a new workspace in the UI.

## Current document structure

Public API IDs remain UUID strings for compatibility with main. MongoDB also assigns its own `_id` to each document. Workspace membership stays embedded because the app targets small teams and typically reads the complete member list with a workspace. Users are referenced by `userId` so one person has a single account across teams.

```json
{
  "id": "workspace-uuid",
  "name": "Web Dev Team",
  "ownerId": "aria-user-uuid",
  "inviteCode": "NCT-EXAMPLE",
  "members": [
    {
      "id": "aria-user-uuid",
      "userId": "aria-user-uuid",
      "name": "Aria Chen",
      "email": "aria@neo.example",
      "title": "Frontend Developer",
      "role": "owner"
    }
  ]
}
```

```json
{
  "id": "task-uuid",
  "workspaceId": "workspace-uuid",
  "title": "Build workspace settings",
  "description": "Implement profile, invite, and member controls.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-09-20T05:00:00.000Z",
  "assignedMemberId": "aria-user-uuid",
  "assignee": { "id": "aria-user-uuid", "name": "Aria Chen", "initials": "AC", "color": "#4896ac" },
  "creator": { "id": "aria-user-uuid", "name": "Aria Chen", "initials": "AC", "color": "#4896ac" }
}
```

These snippets illustrate the shape; use the seed script to generate valid linked IDs, password hashes and dates. Do not paste the placeholder records into a live database.

## Indexes and later improvements

Implemented: unique user ID/email, unique workspace ID/invite code, workspace owner ID, unique task ID and task workspace ID, unique hashed session token, session user ID, and TTL expiry on sessions. Sessions are also checked against their expiry on every request because TTL cleanup is asynchronous.

If personal cross-workspace queries become a bottleneck, add a compound task index on `{ assignedMemberId: 1, status: 1, dueDate: 1 }` after measuring the actual query. Keep ISO date strings for this branch's compatibility with main; a future migration can convert `dueDate` to BSON Date consistently across the API and frontend. If teams become large, move memberships into their own collection with a unique `{ workspaceId, userId }` index.

MongoDB's guidance supports choosing embedding or references according to how related data is read and updated: [Document relationships](https://www.mongodb.com/docs/manual/applications/data-models-relationships/) and [Embedding](https://www.mongodb.com/docs/manual/data-modeling/embedding/).

## Ownership and existing data

Old link-based workspaces are not silently assigned to an email or to whoever opens them first. They remain readable through the existing link flow, but owner-only settings require a verified `ownerId`. Create a signed-in workspace for the complete feature. Migrating an old team requires a deliberate, reviewed mapping to authenticated users; do not infer ownership from a client-side member ID.

Passwords are salted scrypt hashes; authenticator secrets are encrypted with `SETTINGS_ENCRYPTION_KEY`; session tokens are stored as SHA-256 hashes. Real secrets, `.env`, `.settings-key`, and MongoDB data folders must stay outside Git.

Workspace deletion tombstones the workspace before deleting tasks and membership data. Cleanup is retryable, but multi-collection deletion is not a database transaction. For production with concurrent writes, use a replica-set transaction or a durable cleanup job. Account email verification, password recovery delivery, and 2FA recovery codes are separate follow-up work; keep a secure backup of the authenticator setup key in this version.
