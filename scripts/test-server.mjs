import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
const db = await MongoMemoryServer.create({
  instance: { dbName: "nct-isolated-qa" },
});
const child = spawn(
  process.execPath,
  [
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
      NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
      NEXTAUTH_URL: "http://localhost:3100",
    },
  },
);
async function stop() {
  child.kill("SIGTERM");
  await db.stop();
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", async (code) => {
  await db.stop();
  process.exit(code ?? 1);
});
