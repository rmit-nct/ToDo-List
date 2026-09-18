import test from "node:test";
import assert from "node:assert/strict";
import { request } from "@playwright/test";
const base = process.env.TEST_URL || "http://localhost:3100";

test("original entry flow and persisted task CRUD", async () => {
  const client = await request.newContext({
    baseURL: base,
    extraHTTPHeaders: { Origin: base },
  });
  async function call(
    path: string,
    method = "GET",
    data?: unknown,
    status = 200,
  ) {
    const response = await client.fetch("/api" + path, {
      method,
      data: method === "DELETE" && data === undefined ? {} : data,
    });
    const body = await response.json();
    assert.equal(response.status(), status, JSON.stringify(body));
    return body;
  }
  try {
    const denied = await client.post("/api/workspaces", {
      headers: { Origin: "https://untrusted.example" },
      data: { workspaceName: "Rejected", creatorName: "No" },
    });
    assert.equal(denied.status(), 403);
    const workspace = await call(
      "/workspaces",
      "POST",
      {
        workspaceName: "Original entry",
        creatorName: "Original creator",
        creatorEmail: "",
      },
      201,
    );
    assert.equal(workspace.members.length, 1);
    const member = await call(
      `/workspaces/${workspace.id}/members`,
      "POST",
      { name: "Teammate" },
      201,
    );
    const fields = {
      workspaceId: workspace.id,
      title: "Original task",
      description: "Task CRUD",
      priority: "medium",
      status: "todo",
      dueDate: "2026-09-18T12:00:00.000Z",
      assignedMemberId: member.id,
      assignee: { ...member, initials: "T", color: "#4896ac" },
    };
    const task = await call("/tasks", "POST", fields, 201);
    assert.ok(task.id);
    assert.equal(
      (await call(`/tasks?workspaceId=${workspace.id}`))[0].title,
      fields.title,
    );
    await call(`/tasks/${task.id}`, "PUT", { ...fields, title: "Edited task" });
    await call(`/tasks/${task.id}/status`, "PATCH", { status: "in-progress" });
    const saved = (await call(`/tasks?workspaceId=${workspace.id}`))[0];
    assert.equal(saved.title, "Edited task");
    assert.equal(saved.status, "in-progress");
    await call(`/tasks/${task.id}`, "DELETE");
    assert.deepEqual(await call(`/tasks?workspaceId=${workspace.id}`), []);
  } finally {
    await client.dispose();
  }
});

test("teammate account and settings routes work through Next adapter", async () => {
  const client = await request.newContext({
    baseURL: base,
    extraHTTPHeaders: { Origin: base },
  });
  try {
    const signup = await client.post("/api/auth/register", {
      data: {
        name: "Settings Owner",
        email: `settings-${Date.now()}@example.test`,
        password: "TemporaryPassword!123",
      },
    });
    assert.equal(signup.status(), 201, await signup.text());
    const profile = await client.get("/api/users/me");
    assert.equal(profile.status(), 200, await profile.text());
    assert.equal((await profile.json()).name, "Settings Owner");
    const workspaces = await client.get("/api/users/me/workspaces");
    assert.equal(workspaces.status(), 200);
    const patch = await client.patch("/api/users/me", {
      data: { name: "Updated Owner", title: "Designer" },
    });
    assert.equal(patch.status(), 200);
    assert.equal((await patch.json()).title, "Designer");
  } finally {
    await client.dispose();
  }
});
