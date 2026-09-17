import test from "node:test";
import assert from "node:assert/strict";
import { request, type APIRequestContext } from "@playwright/test";
const base = process.env.TEST_URL || "http://localhost:3100";
const password = "QA temporary passphrase! 827";
async function client() {
  return request.newContext({
    baseURL: base,
    extraHTTPHeaders: { Origin: base },
  });
}
async function json(
  c: APIRequestContext,
  path: string,
  method = "GET",
  data?: unknown,
  status = 200,
) {
  const response = await c.fetch("/api" + path, { method, data });
  const body = await response.json();
  assert.equal(
    response.status(),
    status,
    `${method} ${path}: ${JSON.stringify(body)}`,
  );
  return body;
}
async function login(c: APIRequestContext, email: string, pw = password) {
  const { csrfToken } = await json(c, "/auth/csrf");
  const response = await c.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password: pw, json: "true", callbackUrl: base },
  });
  assert.equal(response.status(), 200, await response.text());
  const session = await json(c, "/auth/session");
  assert.ok(session.user?.id, "Session must contain persisted user");
  return session.user;
}
test("accounts, session revocation, workspace isolation and persistent task lifecycle", async () => {
  const anonymous = await client(),
    owner = await client(),
    member = await client();
  const suffix = Date.now();
  const email = `owner-${suffix}@example.test`;
  const other = `member-${suffix}@example.test`;
  try {
    await json(anonymous, "/workspaces", "GET", undefined, 401);
    await json(
      anonymous,
      "/register",
      "POST",
      { name: "Bad", email: "nope", password: "short" },
      400,
    );
    const registration = await json(owner, "/register", "POST", {
      name: "QA Owner",
      email,
      password,
    });
    assert.ok(registration.recoveryCode);
    await json(member, "/register", "POST", {
      name: "QA Member",
      email: other,
      password,
    });
    const u = await login(owner, email),
      v = await login(member, other);
    const w = await json(owner, "/workspaces", "POST", {
      name: "QA isolated workspace",
    });
    assert.equal((await json(owner, "/workspaces")).length, 1);
    assert.equal((await json(member, "/workspaces")).length, 0);
    const details = await json(owner, `/workspaces/${w.id}`);
    assert.equal(details.members.length, 1);
    await json(member, `/workspaces/${w.id}`, "GET", undefined, 404);
    await json(member, `/tasks?workspaceId=${w.id}`, "GET", undefined, 404);
    const fields = {
      workspaceId: w.id,
      title: "Real persisted task",
      description: "Test lifecycle",
      status: "todo",
      priority: "high",
      dueDate: "2026-09-18T12:00:00.000Z",
      assignedMemberId: u.id,
    };
    await json(
      owner,
      "/tasks",
      "POST",
      { ...fields, assignedMemberId: v.id },
      400,
    );
    await json(owner, "/tasks", "POST", { ...fields, status: "invalid" }, 400);
    const task = await json(owner, "/tasks", "POST", {
      ...fields,
      creator: { id: v.id },
      creatorId: v.id,
    });
    assert.equal(task.creator.id, u.id);
    assert.equal(
      (await json(owner, `/tasks?workspaceId=${w.id}`))[0].title,
      fields.title,
    );
    await json(member, `/tasks/${task.id}`, "PUT", fields, 404);
    await json(member, `/tasks/${task.id}`, "DELETE", undefined, 404);
    await json(member, "/workspaces/join", "POST", {
      code: details.inviteCode,
    });
    await json(member, "/workspaces/join", "POST", {
      code: details.inviteCode,
    });
    assert.equal(
      (await json(owner, `/workspaces/${w.id}`)).members.length,
      2,
      "Join is idempotent",
    );
    assert.equal(
      (await json(member, `/workspaces/${w.id}`)).inviteCode,
      undefined,
      "Only owners receive invitation secrets",
    );
    await json(member, `/workspaces/${w.id}`, "PATCH", { name: "Hijack" }, 403);
    const updated = await json(owner, `/tasks/${task.id}`, "PUT", {
      ...fields,
      title: "Edited task",
      assignedMemberId: v.id,
      workspaceId: "forged",
    });
    assert.equal(updated.workspaceId, w.id);
    assert.equal(updated.assignee.id, v.id);
    await json(member, `/tasks/${task.id}/status`, "PATCH", { status: "done" });
    assert.equal((await json(owner, `/tasks/${task.id}`)).status, "done");
    await json(owner, "/account", "PATCH", {
      name: "QA Renamed",
      theme: "dark",
    });
    assert.equal((await json(owner, "/auth/session")).user.name, "QA Renamed");
    await json(owner, `/workspaces/${w.id}`, "PATCH", { rotateInvite: true });
    await json(
      member,
      "/workspaces/join",
      "POST",
      { code: details.inviteCode },
      404,
    );
    const cross = await owner.post("/api/tasks", {
      data: fields,
      headers: { Origin: "https://attacker.example" },
    });
    assert.equal(cross.status(), 403);
    await json(owner, `/tasks/${task.id}`, "DELETE");
    assert.deepEqual(await json(owner, `/tasks?workspaceId=${w.id}`), []);
    const newPassword = "Changed QA password 932!";
    await json(owner, "/account", "PATCH", {
      currentPassword: password,
      newPassword,
    });
    await json(owner, "/workspaces", "GET", undefined, 401);
    await login(owner, email, newPassword);
    const recovered = await json(anonymous, "/recover", "POST", {
      email,
      recoveryCode: registration.recoveryCode,
      password,
    });
    assert.notEqual(recovered.recoveryCode, registration.recoveryCode);
    await json(owner, "/workspaces", "GET", undefined, 401);
    await login(owner, email);
    await json(
      anonymous,
      "/recover",
      "POST",
      { email, recoveryCode: registration.recoveryCode, password },
      400,
    );
  } finally {
    await Promise.all([anonymous.dispose(), owner.dispose(), member.dispose()]);
  }
});
