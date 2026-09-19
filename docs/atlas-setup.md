# Connect a teammate to MongoDB Atlas

1. From the repository root, copy the template: `Copy-Item .env.example .env.local` (PowerShell). Do not overwrite an existing configured file.
2. Ask the database owner privately for a database username and password for NEO-Todo-Cluster. Replace the two placeholders in MONGODB_URI; percent-encode special characters in credentials. Atlas website login credentials are separate from database credentials.
3. Keep MONGODB_DB=neo_todo. This selects the database that received the imported Settings data. Do not substitute nct-todo-production.
4. Generate NEXTAUTH_SECRET and SETTINGS_ENCRYPTION_KEY separately using the command in the template. Keep them stable between restarts. Existing encrypted 2FA data requires the matching encryption key.
5. If Atlas rejects the network connection, ask the project owner to allow your current IP in Network Access. Do not open access to every IP.
6. Run npm ci, then npm run dev from the repository root. Open http://localhost:3000. Restart the dev server after changing .env.local.
7. Open http://localhost:3000/api/health to check the app can reach MongoDB.

## Collections and imported data

The imported records are in neo_todo.users, neo_todo.workspaces and neo_todo.tasks. The current Next.js API defaults to original_users, original_workspaces and original_tasks for its legacy account API, while username authentication also uses unprefixed collections. The approved Settings data is copied into original_users, original_workspaces and original_tasks with scripts/import-settings-data.cjs. The script previews by default; use --apply only to apply this specific import. It preserves existing target IDs and checks identity conflicts. Sessions are never copied. Sign in with the imported email/password account to see its workspaces; a username login is a separate identity.

## Sharing

Commit only .env.example and this guide. Each teammate creates their own .env.local and receives database credentials privately. The configured .env.local on this machine is ignored by Git; pulling the repository will not download it. Use a database user restricted to the required database when the project owner provisions teammate access. Never put MONGODB_URI in a NEXT_PUBLIC variable or frontend code.
