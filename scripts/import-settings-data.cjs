// Copy only the approved Settings import into the Next.js API collections.
// Preview: node --env-file=.env.local scripts/import-settings-data.cjs
// Apply:   node --env-file=.env.local scripts/import-settings-data.cjs --apply
const { MongoClient, BSON } = require('mongodb');
const assert = require('node:assert/strict');
const workspaceIds = ['8e79a7b1-58a1-4dd7-9b77-a0fd20e9a90b','9d10e28a-62c4-4f5d-839d-6036cef10d4f','b3a0d42c-76ad-4ec4-8119-eaf6dad2cc69','c9489e28-fe04-4302-84ef-78b83fcb6887','e231f210-a8df-4c32-968e-a5496083bbd2','e2ac0750-fb10-45b3-a5ee-2bde95a51992','ecbcee45-c392-47b1-b206-6ba9fb8b4c2a'];
const userIds = ['b61f0527-2f93-4f7d-9386-0d9a1753f4ca','c1a60758-5107-4143-bbf8-b25e777b0892','922394d2-310b-4761-87be-f53b1302dbb3'];
async function run() {
  assert(process.env.MONGODB_URI, 'MONGODB_URI is required');
  assert.equal(process.env.MONGODB_DB, 'neo_todo', 'This import only supports neo_todo');
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('neo_todo');
    const plan = [];
    for (const [name, query] of [['users', {id: {$in: userIds}}], ['workspaces', {id: {$in: workspaceIds}}], ['tasks', {workspaceId: {$in: workspaceIds}}]]) {
      const records = await db.collection(name).find(query).toArray();
      assert.equal(records.length, {users:3,workspaces:7,tasks:12}[name], 'Unexpected source count: ' + name);
      const target = db.collection('original_' + name);
      const inserts = [];
      for (const record of records) {
        delete record._id;
        const existing = await target.findOne({id:record.id});
        if (existing) { console.log(name + ': preserving existing ID ' + record.id); continue; }
        if (name === 'users') {
          assert(!record.twoFactorEnabled, 'Encrypted 2FA requires key migration');
          assert(!await target.findOne({email:record.email}), 'Email conflict');
        }
        if (name === 'workspaces' && record.inviteCode) assert(!await target.findOne({inviteCode:record.inviteCode}), 'Invite code conflict');
        inserts.push(record);
      }
      plan.push({name,target,inserts});
    }
    for (const {name,target,inserts} of plan) {
      console.log(name + ': ' + inserts.length + ' new records');
      if (!process.argv.includes('--apply')) continue;
      for (const record of inserts) {
        await target.updateOne({id:record.id}, {$setOnInsert:record}, {upsert:true});
        const saved=await target.findOne({id:record.id}); delete saved._id;
        assert.deepEqual(saved,BSON.deserialize(BSON.serialize(record)),'Verification failed');
      }
    }
    console.log(process.argv.includes('--apply') ? 'Import verified; source records and sessions unchanged.' : 'Preview only; no writes.');
  } finally { await client.close(); }
}
run().catch(error => { console.error('Import failed:', error.name, error.code || '', error.name === 'AssertionError' ? error.message : 'Check configuration and access.'); process.exitCode=1; });
