<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project delivery rules

- Use GitHub account `myngoc0703` for every authenticated GitHub operation in this project. Verify `gh api user --jq .login` before pushing or creating pull requests; never fall back to another account.
- Use `ngoc/` for feature branches. Preserve teammates' work and review current `origin/main` before integration.
- Deploy this project to the Cloudflare `Skora Personal` account (owner of `ttr.gg`) with OpenNext/Wrangler. Keep releases on `ngoc/production-nextauth`; do not merge into main. Keep MongoDB directly in Atlas.
- Never commit credentials, connection strings, recovery keys, `.env` files, or database data.
- Run the root Next.js app with `npm run dev`. Server code lives in `backend/` and is exposed through `app/api/`.
- Validate with `npm run typecheck`, `npm run lint`, `npm run build`, isolated MongoDB integration tests, and browser QA before release. Never run destructive tests against an existing production workspace.
