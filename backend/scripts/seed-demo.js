// Explicit, non-destructive fixture creation for a local development server.
const base = process.env.DEMO_API_URL || 'http://127.0.0.1:5001';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Demo seeding is restricted to localhost.');
const password = 'NeoDemo!2026Review';
async function client(name, email, title) {
  let cookie = '';
  async function request(path, method = 'GET', body) {
    const response = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error), { status: response.status });
    return result;
  }
  let user;
  try { user = await request('/auth/register', 'POST', { name, email, password }); }
  catch (error) { if (error.status !== 409) throw error; user = await request('/auth/login', 'POST', { email, password }); }
  await request('/users/me', 'PATCH', { name, title });
  return { user, request };
}
async function main() {
  const aria = await client('Aria Chen', 'aria@neo.example', 'Frontend Developer');
  const ben = await client('Ben Nakamura', 'ben@neo.example', 'Backend Developer');
  const cleo = await client('Cleo Santos', 'cleo@neo.example', 'UI/UX Designer');
  const owned = await aria.request('/users/me/workspaces');
  const result = [];
  for (const [name, titles] of [
    ['Web Dev Team', ['Design login page UI', 'Set up React Router', 'Build workspace settings', 'Review pull request', 'Test mobile navigation', 'Document API endpoints']],
    ['Design Club', ['Create onboarding screens', 'Review dashboard layout', 'Prepare accessible color palette', 'Export presentation assets']],
  ]) {
    const existing = owned.find(workspace => workspace.name === name && workspace.ownerId === aria.user.id);
    if (existing) { result.push({ name, id: existing.id, status: 'Existing workspace preserved' }); continue; }
    const workspace = await aria.request('/workspaces', 'POST', { workspaceName: name, creatorName: aria.user.name });
    await ben.request(`/workspaces/${workspace.id}/members`, 'POST', { name: ben.user.name });
    await cleo.request(`/workspaces/${workspace.id}/members`, 'POST', { name: cleo.user.name });
    for (const [index, title] of titles.entries()) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + [-2, 0, 2, 4, 6, 8][index % 6]);
      dueDate.setHours(12, 0, 0, 0);
      await aria.request('/tasks', 'POST', {
        workspaceId: workspace.id, title,
        description: 'Demo task for reviewing the NEO team workflow.',
        status: ['todo', 'in-progress', 'done'][index % 3],
        priority: ['high', 'medium', 'low'][index % 3],
        assignedMemberId: [aria.user.id, ben.user.id, cleo.user.id][index % 3],
        dueDate: dueDate.toISOString(),
      });
    }
    result.push({ name, id: workspace.id, inviteCode: workspace.inviteCode });
  }
  console.log(JSON.stringify({ demoOnly: true, email: 'aria@neo.example', password, workspaces: result }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
