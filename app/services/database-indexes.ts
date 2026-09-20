import type { Db } from "mongodb";

export async function ensureInviteCodeIndex(database: Db): Promise<void> {
  const workspaces = database.collection("workspaces");
  const indexes = await workspaces.listIndexes().toArray().catch((error) => {
    if (error.code === 26) return []; // A new database has no collection yet.
    throw error;
  });
  // Both legacy sparse and newer non-sparse unique indexes enforce code uniqueness.
  // Preserve either; never replace an existing index during a login request.
  const compatible = indexes.some((index) =>
    index.unique === true && !index.partialFilterExpression &&
    Object.keys(index.key).length === 1 && index.key.inviteCode === 1,
  );
  if (!compatible) {
    await workspaces.createIndex({ inviteCode: 1 }, { unique: true, sparse: true });
  }
}
