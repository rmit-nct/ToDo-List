import test from "node:test";
import assert from "node:assert/strict";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ensureInviteCodeIndex } from "../app/auth-lib/indexes";

test("invite code initialization supports legacy and current databases", async () => {
  const server = await MongoMemoryServer.create();
  const client = new MongoClient(server.getUri());
  try {
    await client.connect();
    for (const layout of ["new", "legacy", "sparse", "nonSparse"]) {
      const database = client.db(layout);
      const collection = database.collection("workspaces");
      if (layout === "legacy" || layout === "sparse") {
        await collection.insertMany([{ id: "one" }, { id: "two" }]);
      }
      if (layout === "sparse" || layout === "nonSparse") {
        await collection.createIndex({ inviteCode: 1 }, { unique: true, sparse: layout === "sparse" });
      }
      await ensureInviteCodeIndex(database);
      await ensureInviteCodeIndex(database);
      await collection.insertOne({ inviteCode: "SAME-CODE" });
      await assert.rejects(collection.insertOne({ inviteCode: "SAME-CODE" }), { code: 11000 });
      const index = (await collection.listIndexes().toArray()).find(i => i.key.inviteCode === 1);
      assert.equal(index?.unique, true);
      assert.equal(Boolean(index?.sparse), layout !== "nonSparse");
    }
  } finally {
    await client.close();
    await server.stop();
  }
});
