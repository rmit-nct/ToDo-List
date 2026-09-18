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
