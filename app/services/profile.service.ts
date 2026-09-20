import type { Connection } from 'mongoose';

// Copy the older username data once; keep the original records intact.
// IDs stay stable so shared membership and task ownership remain connected.
export async function restoreUsernameProfile(connection: Connection, id: string, version: number) {
  const db = connection.db!;
  const prefix = process.env.MONGODB_COLLECTION_PREFIX || 'original_';
  if (!prefix) throw new Error('Username profiles require separate collections');
  const users = db.collection(`${prefix}users`);
  const source = await db.collection('users').findOne({ id, authMode: 'username', sessionVersion: version });
  if (!source) return null;
  const migrations = db.collection(`${prefix}username_restorations`);
  if (!await migrations.findOne({ _id: id as never })) {
    const workspaces = await db.collection('workspaces').find({ memberIds: id }).toArray();
    const memberIds = [...new Set([id, ...workspaces.flatMap(w => w.memberIds)])];
    const members = await db.collection('users').find({ id: { $in: memberIds }, authMode: 'username' }).toArray();
    if (members.length !== memberIds.length) throw new Error('Workspace contains an unsupported account type');
    for (const member of members) {
      const existing = await users.findOne({ id: member.id });
      if (existing && (existing.authMode !== 'username' || existing.username !== member.username)) throw new Error('Account identity conflict');
      await users.updateOne({ id: member.id }, { $setOnInsert: {
        id: member.id, username: member.username, authMode: 'username', name: member.name,
        email: `username:${member.username}`, passwordHash: '!', title: '', twoFactorEnabled: false,
        deleting: false, createdAt: member.createdAt || new Date(), updatedAt: new Date(),
      } }, { upsert: true });
    }
    const asMember = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Unknown task member');
      return { id: member.id, name: member.name, initials: member.name.slice(0, 2).toUpperCase(), color: '#4896ac' };
    };
    for (const workspace of workspaces) {
      if (await migrations.findOne({ _id: `workspace:${workspace.id}` as never })) continue;
      const target = db.collection(`${prefix}workspaces`);
      const existing = await target.findOne({ id: workspace.id });
      if (existing) {
        if (existing.legacyUsernameWorkspace !== true) throw new Error('Workspace identity conflict');
        await migrations.updateOne({ _id: `workspace:${workspace.id}` as never }, { $setOnInsert: { restoredAt: new Date() } }, { upsert: true });
        continue;
      }
      const tasks = await db.collection('tasks').find({ workspaceId: workspace.id }).toArray();
      for (const task of tasks) {
        const { _id, creatorId, ...record } = task;
        const existingTask = await db.collection(`${prefix}tasks`).findOne({ id: task.id });
        if (existingTask && existingTask.legacyUsernameTask !== true) throw new Error('Task identity conflict');
        await db.collection(`${prefix}tasks`).updateOne({ id: task.id }, { $setOnInsert: {
          ...record, legacyUsernameTask: true,
          ...(task.assignedMemberId ? { assignee: asMember(task.assignedMemberId) } : {}),
          ...(creatorId ? { creator: asMember(creatorId) } : {}),
        } }, { upsert: true });
      }
      const { _id, memberIds: oldMemberIds, ...record } = workspace;
      // Publish the workspace only after its tasks have been copied successfully.
      await target.updateOne({ id: workspace.id }, { $setOnInsert: {
        ...record, legacyUsernameWorkspace: true, deleting: false,
        members: oldMemberIds.map((memberId: string) => ({ ...asMember(memberId), userId: memberId,
          email: '', title: '', role: workspace.ownerId === memberId ? 'owner' : 'member' })),
      } }, { upsert: true });
      await migrations.updateOne({ _id: `workspace:${workspace.id}` as never }, { $setOnInsert: { restoredAt: new Date() } }, { upsert: true });
    }
    await migrations.updateOne({ _id: id as never }, { $setOnInsert: { restoredAt: new Date() } }, { upsert: true });
  }
  return users.findOne({ id, authMode: 'username', deleting: false });
}
