import test from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const base = process.env.TEST_URL || "http://localhost:3100";

test("unified sign-in persists accounts, workspaces and tasks across fresh browser sessions", async () => {
  const browser = await chromium.launch();
  try {
    for (const method of ["username", "email"]) {
      const context = await browser.newContext({ baseURL: base });
      const page = await context.newPage();
      const identity = `qa-${method}-${Date.now()}`;
      const password = "TemporaryPassword!123";
      async function login(register = false) {
        if (method === "email") {
          await page
            .getByRole("button", { name: "Email", exact: true })
            .click();
          if (register) {
            await page
              .getByRole("button", { name: "Sign up", exact: true })
              .click();
            await page.getByLabel("Display name").fill(identity);
          }
          await page
            .getByLabel("Email", { exact: true })
            .fill(`${identity}@example.test`);
          await page.getByLabel("Password", { exact: true }).fill(password);
        } else
          await page.getByLabel("Username", { exact: true }).fill(identity);
        await page
          .locator("form")
          .getByRole("button", {
            name: register && method === "email" ? "Create account" : "Sign in",
            exact: true,
          })
          .click();
      }
      await page.goto("/account");
      await login(true);
      await expect(
        page.getByRole("heading", { name: `Welcome, ${identity}.` }),
      ).toBeVisible();
      await page.getByLabel("Workspace Name").fill(identity);
      await page
        .getByRole("button", { name: "Create Workspace", exact: true })
        .click();
      await page.waitForURL("**/app/home");
      const workspaceId = new URL(page.url()).pathname.split("/")[2];
      const account = await (await context.request.get("/api/users/me")).json();
      const response = await context.request.post("/api/tasks", {
        headers: { Origin: base },
        data: {
          workspaceId,
          assignedMemberId: account.id,
          title: "Persisted browser task",
          description: "Survives fresh login",
          status: "todo",
          priority: "medium",
          dueDate: "2026-09-20T12:00:00.000Z",
        },
      });
      assert.equal(response.status(), 201, await response.text());
      await page.reload();
      assert.equal((await context.request.get("/api/users/me")).status(), 200);
      await page.goto("/account");
      await expect(
        page.getByRole("button", { name: identity, exact: false }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Welcome back" }),
      ).toBeVisible();
      assert.equal((await context.request.get("/api/users/me")).status(), 401);
      // Clear all client storage: returning data must come from MongoDB.
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      await page.goto(
        `/login?returnTo=${encodeURIComponent(`/workspace/${workspaceId}/app/today`)}`,
      );
      await login();
      await page.waitForURL("**/app/today");
      const tasks = await (
        await context.request.get(`/api/tasks?workspaceId=${workspaceId}`)
      ).json();
      assert.equal(tasks[0].title, "Persisted browser task");
      const workspaces = await (
        await context.request.get("/api/users/me/workspaces")
      ).json();
      assert.equal(workspaces[0].id, workspaceId);
      await page.goto("/account/email");
      await expect(
        page.getByRole("heading", { name: `Welcome, ${identity}.` }),
      ).toBeVisible();
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('assignment, optimistic editing and dragging reconcile with saved data and roll back failures', async () => {
  const browser = await chromium.launch();
  const owner = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  const teammate = await browser.newContext({ baseURL: base });
  const page = await owner.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    const suffix = Date.now();
    for (const [context, name] of [[owner, 'Alex Owner'], [teammate, 'Sam Teammate']] as const) {
      const response = await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name, email: `${name.split(' ')[0]}-${suffix}@example.test`, password: 'TemporaryPassword!123' } });
      assert.equal(response.status(), 201);
    }
    const team = await (await owner.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Design team', creatorName: 'Alex Owner', requireAccount: true } })).json();
    const sam = await (await teammate.request.post(`/api/workspaces/${team.id}/members`, { headers: { Origin: base }, data: { name: 'Sam Teammate' } })).json();
    await page.goto(`/workspace/${team.id}/app/home`);
    assert.ok(await page.title());
    await expect(page.getByRole('heading', { name: 'Team tasks' })).toBeVisible();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const controls = page.locator('.workspace-actions button');
      await expect(controls).toHaveCount(3);
      const boxes = await controls.evaluateAll(elements => elements.map(el => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      }));
      assert.ok(boxes.every(box => Math.abs(box.y - boxes[0].y) < 1), `Actions share one row at ${width}`);
      assert.ok(boxes[2].x + boxes[2].width <= width, `Actions fit at ${width}`);
      assert.ok(boxes[0].x + boxes[0].width < boxes[1].x);
      if (width < 760) await expect.poll(async () => (await page.locator('.sidebar').boundingBox())!.x).toBeLessThan(-250);
      await page.screenshot({ path: `/tmp/nct-actions-${width}.png`, animations: 'disabled' });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Ship assignment UI');
    await page.getByLabel('Assignee', { exact: true }).selectOption(sam.id);
    await page.getByRole('button', { name: 'Create task', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit Ship assignment UI', exact: true })).toContainText('Sam Teammate');
    const saved = (await (await owner.request.get(`/api/tasks?workspaceId=${team.id}`)).json())[0];
    assert.equal((await (await teammate.request.get('/api/users/me/tasks')).json())[0].id, saved.id);
    // Hold the response until the changed title and assignee are already visible.
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(`**/api/tasks/${saved.id}`, async route => { if (route.request().method() === 'PUT') { await gate; await route.continue(); } else await route.continue(); });
    await page.getByRole('button', { name: 'Edit Ship assignment UI', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Ready for review');
    await page.getByLabel('Assignee', { exact: true }).selectOption('');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit Ready for review', exact: true })).toContainText('Unassigned');
    await expect(page.getByText('Saving change…', { exact: true })).toBeVisible();
    release();
    await expect(page.getByText('Saving change…', { exact: true })).toHaveCount(0);
    await page.unroute(`**/api/tasks/${saved.id}`);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Edit Ready for review', exact: true })).toContainText('Unassigned');
    assert.deepEqual(await (await teammate.request.get('/api/users/me/tasks')).json(), []);
    await page.route(`**/api/tasks/${saved.id}`, route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Simulated edit failure' }) }));
    await page.getByRole('button', { name: 'Edit Ready for review', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Failed edit');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByText(/Simulated edit failure/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Ready for review', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss message' }).click();
    await page.unroute(`**/api/tasks/${saved.id}`);
    const invalid = await owner.request.put(`/api/tasks/${saved.id}`, { headers: { Origin: base }, data: { assignedMemberId: 'outsider' } });
    assert.equal(invalid.status(), 400);
    await page.screenshot({ path: '/tmp/nct-task-overview-desktop.png', fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await page.locator('.sidebar').boundingBox())!.x).toBeLessThan(-250);
    await page.screenshot({ path: '/tmp/nct-task-overview-mobile.png', fullPage: true, animations: 'disabled' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    await page.getByRole('button', { name: 'Assign to me', exact: true }).click();
    await expect(page.getByLabel('Assignee', { exact: true })).not.toHaveValue('');
    await page.screenshot({ path: '/tmp/nct-task-editor-mobile.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await page.screenshot({ path: '/tmp/nct-task-overview-dark.png', fullPage: true, animations: 'disabled' });
    await page.goto(`/workspace/${team.id}/app/board`);
    let releaseDrag!: () => void;
    const dragGate = new Promise<void>(resolve => { releaseDrag = resolve; });
    await page.route(`**/api/tasks/${saved.id}/status`, async route => { await dragGate; await route.continue(); });
    const done = page.locator('.kanban-column[data-status="done"]');
    await page.locator('[draggable="true"]').filter({ hasText: 'Ready for review' }).dragTo(done);
    await expect(done.getByRole('heading', { name: 'Ready for review' })).toBeVisible();
    await expect(page.getByText('Saving change…', { exact: true })).toBeVisible();
    releaseDrag();
    await expect(page.getByText('Saving change…', { exact: true })).toHaveCount(0);
    await page.unroute(`**/api/tasks/${saved.id}/status`);
    await page.reload();
    await expect(done.getByRole('heading', { name: 'Ready for review' })).toBeVisible();
    await page.route(`**/api/tasks/${saved.id}/status`, route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Simulated save failure' }) }));
    await page.locator('[draggable="true"]').filter({ hasText: 'Ready for review' }).dragTo(page.locator('.kanban-column[data-status="todo"]'));
    await expect(page.getByText(/Simulated save failure/)).toBeVisible();
    await expect(done.getByRole('heading', { name: 'Ready for review' })).toBeVisible();
    await page.screenshot({ path: '/tmp/nct-task-drag-rollback.png', fullPage: true, animations: 'disabled' });
    await page.locator('.brand-home-link').click();
    await expect(page).toHaveURL(`${base}/`);
    await expect(page.getByRole('heading', { name: 'Welcome, Alex.' })).toBeVisible();
    await page.goto(`/workspace/${team.id}/app/home`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mobile-header').getByRole('link', { name: 'NEO home' }).click();
    await expect(page).toHaveURL(`${base}/`);
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});

test('one account settings entry and accessible theme controls fit desktop and narrow screens', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const signup = await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Settings Layout Owner With A Long Name', email: `layout-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    assert.equal(signup.status(), 201);
    const workspace = await (await context.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Settings layout', creatorName: 'Owner', requireAccount: true } })).json();
    await page.goto(`/workspace/${workspace.id}/app/home`);
    await expect(page.locator('.sidebar-footer a')).toHaveCount(1);
    await page.getByRole('link', { name: 'Account settings', exact: true }).click();
    await expect(page).toHaveURL(`${base}/workspace/${workspace.id}/app/settings`);
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Account settings', exact: true })).toHaveAttribute('aria-current', 'page');
    const theme = page.getByRole('group', { name: 'Color theme', exact: true });
    await expect(theme).toBeVisible();
    for (const option of ['Light', 'Dark', 'System']) {
      await theme.getByRole('radio', { name: option, exact: true }).check();
      await expect(theme.getByRole('radio', { name: option, exact: true })).toBeChecked();
    }
    await theme.getByRole('radio', { name: 'Dark', exact: true }).check();
    await page.reload();
    await expect(theme.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
    await theme.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/nct-settings-desktop.png', animations: 'disabled' });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await theme.scrollIntoViewIfNeeded();
      await expect.poll(async () => (await page.locator('.sidebar').boundingBox())!.x).toBeLessThan(-250);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await theme.evaluate(element => element.scrollWidth <= element.clientWidth));
      const legend = await theme.locator('legend').boundingBox();
      assert.ok(legend && legend.width <= 1 && legend.height <= 1);
      for (const radio of await theme.getByRole('radio').all()) {
        const bounds = await radio.boundingBox();
        assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width);
      }
      await page.screenshot({ path: `/tmp/nct-settings-${width}.png`, animations: 'disabled' });
    }
    await theme.getByRole('radio', { name: 'Light', exact: true }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(theme.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('link', { name: 'Account settings', exact: true }).click();
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});

test('shared sign-in preserves the original welcome design without narrow-screen overflow', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Your team. One board.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stay organized' })).toBeVisible();
    await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
    await page.screenshot({ path: '/tmp/nct-welcome-desktop.png', animations: 'disabled' });
    const access = page.getByRole('group', { name: 'Account access', exact: true });
    await expect(access).toHaveCount(1);
    await expect(access.getByRole('button')).toHaveCount(3);
    await access.getByRole('button', { name: 'Email', exact: true }).click();
    await expect(access.getByRole('button', { name: 'Email', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Email', { exact: true })).toHaveAttribute('placeholder', 'you@example.com');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('placeholder', 'Enter your password');
    await page.screenshot({ path: '/tmp/nct-email-form-desktop.png', animations: 'disabled' });
    await access.getByRole('button', { name: 'Sign up', exact: true }).click();
    await expect(access.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.getByLabel('Display name')).toBeVisible();
    for (const width of [800, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await expect(page.getByRole('heading', { name: 'Your team. One board.' })).toBeVisible();
      if (width === 390) await page.screenshot({ path: '/tmp/nct-welcome-mobile.png', fullPage: true, animations: 'disabled' });
    }
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: '/tmp/nct-welcome-dark.png', animations: 'disabled' });
  } finally { await browser.close(); }
});

test('skeletons replace loading text and empty states while data is pending', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Skeleton QA', email: `skeleton-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    const workspace = await (await context.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Skeleton QA', creatorName: 'Owner' } })).json();
    const screens = [
      ['/account', 'Loading your account'],
      [`/workspace/${workspace.id}/app/home`, 'Loading tasks'],
      [`/workspace/${workspace.id}/app/today`, 'Loading dashboard'],
      [`/workspace/${workspace.id}/app/board`, 'Loading board'],
      [`/workspace/${workspace.id}/app/my-tasks`, 'Loading your tasks'],
      [`/workspace/${workspace.id}/app/settings`, 'Loading settings'],
      [`/workspace/${workspace.id}`, 'Loading workspace'],
    ];
    for (const [path, label] of screens) {
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      await page.route('**/api/**', async route => { await gate; await route.continue(); });
      try {
        await page.goto(path);
        const skeleton = page.getByRole('status', { name: label, exact: true });
        await expect(skeleton).toBeVisible();
        await expect(skeleton).toHaveAttribute('aria-busy', 'true');
        assert.equal(await skeleton.locator('.skeleton-shape').first().evaluate(el => getComputedStyle(el).animationName), 'none');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await expect(page.getByText('No tasks assigned yet', { exact: true })).toHaveCount(0);
        if (label === 'Loading settings' || label === 'Loading board') await page.screenshot({ path: `/tmp/nct-skeleton-${label.split(' ')[1]}.png`, animations: 'disabled' });
      } finally { release(); }
      await expect(page.getByRole('status', { name: label, exact: true })).toHaveCount(0);
      await page.unroute('**/api/**');
    }
    await page.goto(`/workspace/${workspace.id}/app/home`);
    await expect(page.getByRole('button', { name: 'New task', exact: true })).toBeEnabled();
    let memberReads = 0;
    page.on('request', request => { if (request.url().endsWith(`/api/workspaces/${workspace.id}`)) memberReads++; });
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading teammates', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Assignee', { exact: true })).toBeVisible();
    assert.equal(memberReads, 0, 'Editor reuses loaded workspace members');
  } finally { await browser.close(); }
});

test('workspace reads are shared and returning task views stay usable during refresh', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  let release = () => {};
  try {
    const signup = await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Cache QA', email: `cache-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    assert.equal(signup.status(), 201);
    const account = await signup.json();
    const workspace = await (await context.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Cache QA', creatorName: 'Owner' } })).json();
    await context.request.post('/api/tasks', { headers: { Origin: base }, data: { workspaceId: workspace.id, title: 'Cached task', status: 'todo', priority: 'medium', dueDate: '2026-09-20', assignedMemberId: account.id } });
    let reads = 0;
    page.on('request', request => { if (request.url().endsWith(`/api/workspaces/${workspace.id}`)) reads++; });
    await page.goto(`/workspace/${workspace.id}/app/home`);
    await expect(page.getByRole('button', { name: 'Edit Cached task', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    await expect(page.getByLabel('Assignee', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(reads, 1, 'Sidebar, overview and editor share one workspace read');
    await page.getByRole('link', { name: 'My Tasks', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading your tasks', exact: true })).toHaveCount(0);
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/tasks?**', async route => { await gate; await route.continue(); });
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Cached task', exact: true })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Loading tasks', exact: true })).toHaveCount(0);
    assert.equal(reads, 1, 'Navigation reuses workspace data');
  } finally { release(); await browser.close(); }
});

test('workspace chooser shows pending list and opening feedback and recovers from failure', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base });
  const page = await context.newPage();
  let releaseList = () => {};
  let releaseOpen = () => {};
  try {
    const signup = await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Chooser QA', email: `chooser-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    assert.equal(signup.status(), 201);
    const workspace = await (await context.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Chooser workspace', creatorName: 'Owner' } })).json();
    const listGate = new Promise<void>(resolve => { releaseList = resolve; });
    await page.route('**/api/users/me/workspaces', async route => { await listGate; await route.continue(); });
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Welcome, Chooser.' })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Loading your workspaces', exact: true })).toBeVisible();
    releaseList();
    const card = page.getByRole('button', { name: 'Chooser workspace', exact: true });
    await expect(card).toBeVisible();
    const openGate = new Promise<void>(resolve => { releaseOpen = resolve; });
    await page.route(`**/api/workspaces/${workspace.id}`, async route => { await openGate; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporarily unavailable' }) }); });
    await card.click();
    await expect(page.getByRole('status').filter({ hasText: 'Opening…' })).toBeVisible();
    await expect(page.locator('.account-workspaces button')).toBeDisabled();
    releaseOpen();
    await expect(page.getByRole('alert').filter({ hasText: 'Temporarily unavailable' })).toBeVisible();
    await expect(card).toBeEnabled();
    await page.unroute(`**/api/workspaces/${workspace.id}`);
    await card.click();
    await page.waitForURL('**/app/today');
    await expect(page.getByRole('heading', { name: 'Today Dashboard', exact: true })).toBeVisible();
  } finally { releaseList(); releaseOpen(); await browser.close(); }
});

test('invite links preserve sign-in return, skip duplicate identity and codes accept casing and whitespace', async () => {
  const browser = await chromium.launch();
  const owner = await browser.newContext({ baseURL: base });
  const context = await browser.newContext({ baseURL: base });
  const page = await context.newPage();
  try {
    const signup = await owner.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Invite Owner', email: `invite-owner-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    assert.equal(signup.status(), 201);
    const workspace = await (await owner.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Invitation QA', creatorName: 'Owner' } })).json();
    assert.equal((await context.request.post(`/api/workspaces/${workspace.id}/members`, { headers: { Origin: base }, data: { name: 'Guest' } })).status(), 401);
    await page.goto(`/workspace/${workspace.id}`);
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Sign in to join workspace', exact: true }).click();
    const username = `invite-${Date.now()}`;
    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(`**/workspace/${workspace.id}`);
    await expect(page.getByText(`Joining as ${username}.`)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveCount(0);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key.startsWith('memberIdentity:')) throw new DOMException('Storage blocked', 'SecurityError');
        return original.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: 'Join Workspace', exact: true }).click();
    await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
    await page.goto('/account');
    await page.getByLabel('Invite code', { exact: true }).fill('NCT-NOT-VALID');
    await page.getByRole('button', { name: 'Join workspace', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Invite code not found' })).toBeVisible();
    await page.getByLabel('Invite code', { exact: true }).fill(`  ${workspace.inviteCode.toLowerCase()}  `);
    await page.getByRole('button', { name: 'Join workspace', exact: true }).click();
    await page.waitForURL('**/app/today');
    const members = (await (await owner.request.get(`/api/workspaces/${workspace.id}`)).json()).members;
    assert.equal(members.length, 2, 'Repeated joins do not duplicate memberships');
    const repeated = await Promise.all([0, 1].map(() => context.request.post(`/api/workspaces/${workspace.id}/members`, { headers: { Origin: base }, data: {} })));
    assert.ok(repeated.every(response => response.status() === 200));
    assert.equal((await (await owner.request.get(`/api/workspaces/${workspace.id}`)).json()).members.length, 2);
    assert.equal((await context.request.get(`/api/invites/${encodeURIComponent(` ${workspace.inviteCode.toLowerCase()} `)}`)).status(), 200);
    await expect(page.getByRole('heading', { name: 'Today Dashboard', exact: true })).toBeVisible();
  } finally { await browser.close(); }
});

test('workspace action icons and labels are centered on every page in both themes', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  try {
    const signup = await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Alignment QA', email: `align-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    assert.equal(signup.status(), 201);
    const workspace = await (await context.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Alignment QA', creatorName: 'Owner' } })).json();
    for (const route of ['home', 'today', 'board']) {
      await page.goto(`/workspace/${workspace.id}/app/${route}`);
      await expect(page.locator('.workspace-actions button')).toHaveCount(3);
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('.workspace-actions').getByRole('button', { name: theme === 'dark' ? 'Dark' : 'Light', exact: true }).click();
        for (const width of [1440, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          const measurements = await page.locator('.workspace-actions button').evaluateAll(buttons => buttons.map(button => {
            const box = button.getBoundingClientRect();
            const icon = button.querySelector('svg')!.getBoundingClientRect();
            const label = button.querySelector('span');
            const text = label && getComputedStyle(label).display !== 'none' ? label.getBoundingClientRect() : null;
            return { iconOffset: Math.abs(icon.y + icon.height / 2 - box.y - box.height / 2), textOffset: text ? Math.abs(text.y + text.height / 2 - box.y - box.height / 2) : 0, right: box.right };
          }));
          assert.ok(measurements.every(item => item.iconOffset <= 1 && item.textOffset <= 1 && item.right <= width), `${route} ${theme} ${width}: ${JSON.stringify(measurements)}`);
          if (route === 'today' && theme === 'dark') await page.screenshot({ path: `/tmp/nct-centered-actions-${width}.png`, animations: 'disabled' });
        }
      }
    }
  } finally { await browser.close(); }
});

test('My Tasks retries transient reads and recovers in place without false zero counts', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: base });
  const page = await context.newPage();
  let release = () => {};
  try {
    const response = await context.request.post('/api/auth/register', { headers: { Origin: base }, data: { name: 'Retry QA', email: `retry-${Date.now()}@example.test`, password: 'TemporaryPassword!123' } });
    assert.equal(response.status(), 201);
    const user = await response.json();
    const workspace = await (await context.request.post('/api/workspaces', { headers: { Origin: base }, data: { workspaceName: 'Retry QA', creatorName: 'Owner' } })).json();
    await context.request.post('/api/tasks', { headers: { Origin: base }, data: { workspaceId: workspace.id, title: 'Recovered assignment', assignedMemberId: user.id, status: 'todo', priority: 'medium', dueDate: '2026-09-20' } });
    let reads = 0, documents = 0, failing = true;
    const gate = new Promise<void>(resolve => { release = resolve; });
    page.on('request', req => { if (req.isNavigationRequest() && req.frame() === page.mainFrame()) documents++; });
    await page.route('**/api/users/me/tasks', async route => {
      reads++;
      if (failing) await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary read failure' }) });
      else { await gate; await route.continue(); }
    });
    await page.goto(`/workspace/${workspace.id}/app/my-tasks`);
    await expect(page.getByRole('heading', { name: 'Assignments couldn’t be loaded' })).toBeVisible();
    assert.ok(reads >= 2, 'A transient read is retried');
    await expect(page.getByText('0 tasks assigned to you', { exact: true })).toHaveCount(0);
    failing = false;
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.getByRole('status', { name: 'Loading your tasks', exact: true })).toBeVisible();
    release();
    await expect(page.getByRole('button').filter({ hasText: 'Recovered assignment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Assignments couldn’t be loaded' })).toHaveCount(0);
    await expect(page.locator('.sync-messages [role="alert"]')).toHaveCount(0);
    assert.equal(documents, 1, 'Retry does not reload the app');
  } finally { release(); await browser.close(); }
});
