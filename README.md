# NEO To-do List

Collaborative task management for student teams and club committees. Shared workspaces, task assignment, progress charts, Today Dashboard, and a drag-and-drop sprint board use persisted MongoDB data.

## Development

The root Next.js app serves the React UI in `frontend/src` and the Express API in `backend/` through `app/api/`. Run commands from the repository root:

```sh
npm ci
npm run dev
```

Configure local environment variables from the root `.env.example`. Follow [the teammate Atlas setup guide](docs/atlas-setup.md) to connect to `neo_todo` using your own ignored `.env.local`. Never commit environment files or database data. MongoDB stays in Atlas for production; tests use a disposable MongoDB instance.

`npm run dev` inside `frontend/` also starts the root Next.js app. Install root dependencies first. Username sign-in needs the Next.js `/api/username/*` routes; the standalone Express server does not provide them.

For optional Vite-only frontend development, keep the root Next.js server running on port 3000, then run `npm ci && npm run dev:vite` inside `frontend/`. Its `/api` proxy targets Next.js on port 3000 (override with `VITE_API_TARGET` if needed). Include the Vite origin in `APP_ORIGINS`, as shown in `.env.example`.

## Validation

```sh
npm run typecheck
npm run lint
npm run build:cloudflare
npx playwright install chromium
node scripts/test-server.mjs
# In another terminal:
npm test
```

## Delivery

Production runs on Cloudflare Worker `nct-planner` at https://nct-todo.ttr.gg using OpenNext/Wrangler in the Skora Personal account. The release source is `main`. Verify the exact commit's CI, deploy the corresponding build, and check live behavior with temporary test data.

## Interaction and caching

Username and email entry share one account/workspace flow. Task edits and moves apply immediately and reconcile with the server; failures restore saved state. Workspace/profile reads are deduplicated and cached in session memory for 15 seconds. Writes invalidate reads, account changes clear caches, and cached task views refresh on navigation, focus, and every 30 seconds while visible. No private API payloads are persisted to browser storage.

The welcome design and My Progress / Workspace Progress charts preserve the team's original contributions. Progress charts use native CSS with accessible text counts.
