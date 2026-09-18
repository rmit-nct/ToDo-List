import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
const db = await MongoMemoryServer.create({
  instance: { dbName: "nct-isolated-qa" },
});
const { MongoClient } = await import('mongodb');
const fixtureClient = new MongoClient(db.getUri());
await fixtureClient.connect();
const fixtures = fixtureClient.db('nct-isolated-qa');
await fixtures.collection('users').insertMany(['restored-qa', 'teammate-qa'].map(username => ({ id: username, name: username, username, authMode: 'username', email: `username:${username}`, sessionVersion: 0 })));
await fixtures.collection('workspaces').insertOne({ id: 'restored-workspace', name: 'Restored workspace', ownerId: 'restored-qa', memberIds: ['restored-qa', 'teammate-qa'], inviteCode: 'restored-qa-invite' });
await fixtures.collection('tasks').insertOne({ id: 'restored-task', workspaceId: 'restored-workspace', title: 'Restored task', description: 'Legacy fixture', status: 'todo', priority: 'high', assignedMemberId: 'restored-qa', creatorId: 'teammate-qa', dueDate: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() });
await fixtureClient.close();
const worker = process.env.QA_CLOUDFLARE === "1";
const varsPath = new URL("../.dev.vars", import.meta.url);
if (worker) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    varsPath,
    `MONGODB_URI=${db.getUri()}
MONGODB_DB=nct-isolated-qa
MONGODB_COLLECTION_PREFIX=original_
NEXTAUTH_SECRET=${randomBytes(32).toString("hex")}
NEXTAUTH_URL=http://localhost:3100
APP_ORIGINS=http://localhost:3100,http://nct-todo.ttr.gg
`,
    { mode: 0o600, flag: "wx" },
  );
}
const child = spawn(
  process.execPath,
  worker
    ? [
        "node_modules/wrangler/bin/wrangler.js",
        "dev",
        "--port",
        "3100",
        "--local",
      ]
    : [
        "node_modules/next/dist/bin/next",
        process.env.QA_PRODUCTION ? "start" : "dev",
        "-p",
        "3100",
      ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      MONGODB_URI: db.getUri(),
      MONGODB_DB: "nct-isolated-qa",
      MONGODB_COLLECTION_PREFIX: "original_",
      NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
      NEXTAUTH_URL: "http://localhost:3100",
      APP_ORIGINS: "http://localhost:3100",
    },
  },
);
async function cleanup() {
  if (worker) {
    const { unlink } = await import("node:fs/promises");
    await unlink(varsPath).catch(() => {});
  }
}
async function stop() {
  child.kill("SIGTERM");
  await db.stop();
  await cleanup();
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", async (code) => {
  await db.stop();
  await cleanup();
  process.exit(code ?? 1);
});
