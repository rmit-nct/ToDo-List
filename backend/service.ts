import { randomBytes, randomUUID } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { currentUser } from "./auth";
import {
  HttpError,
  checkOrigin,
  readJson,
  emailSchema,
  passwordSchema,
  nameSchema,
  rateLimit,
  digest,
} from "./security";
const statusSchema = z.enum(["todo", "in-progress", "done"]);
export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(""),
  status: statusSchema,
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().datetime(),
  assignedMemberId: z.string().max(100).default(""),
});
const publicUser = (u: { id: string; name: string; email: string }) => ({
  id: u.id,
  name: u.name,
  email: u.email.startsWith("username:") ? undefined : u.email,
  initials: u.name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  color: "#4896ac",
});
export async function handle(request: Request, path: string[]) {
  checkOrigin(request);
  const database = await db();
  const method = request.method;
  const [resource, id, action] = path;
  if (resource === "health" && method === "GET") {
    await database.command({ ping: 1 });
    return { status: "ok" };
  }
  if (resource === "register" && method === "POST") {
    const body = z
      .object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
      })
      .parse(await readJson(request));
    await rateLimit(
      "register",
      request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-vercel-forwarded-for") ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        "local",
      10,
      60,
    );
    await rateLimit("register-email", body.email, 4, 60);
    const recoveryCode = randomBytes(24).toString("base64url");
    try {
      await database.collection("users").insertOne({
        id: randomUUID(),
        name: body.name,
        email: body.email,
        passwordHash: await hash(body.password, 12),
        recoveryHash: digest(recoveryCode),
        sessionVersion: 0,
        theme: "system",
        createdAt: new Date(),
      });
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw new HttpError(
          409,
          "Unable to create this account. Try signing in or use account recovery.",
        );
      throw e;
    }
    return { recoveryCode };
  }
  if (resource === "recover" && method === "POST") {
    const body = z
      .object({
        email: emailSchema,
        recoveryCode: z.string().min(10).max(100),
        password: passwordSchema,
      })
      .parse(await readJson(request));
    await rateLimit("recover", body.email, 5, 60);
    const recoveryCode = randomBytes(24).toString("base64url");
    const result = await database.collection("users").updateOne(
      { email: body.email, recoveryHash: digest(body.recoveryCode) },
      {
        $set: {
          passwordHash: await hash(body.password, 12),
          recoveryHash: digest(recoveryCode),
        },
        $inc: { sessionVersion: 1 },
      },
    );
    if (!result.matchedCount)
      throw new HttpError(400, "Email or recovery code is incorrect.");
    return { recoveryCode };
  }
  const user = await currentUser();
  const workspaces = database.collection("workspaces");
  const tasks = database.collection("tasks");
  const getWorkspace = async (workspaceId: string) => {
    const workspace = await workspaces.findOne({
      id: workspaceId,
      memberIds: user.id,
    });
    if (!workspace)
      throw new HttpError(404, "Workspace not found or access denied.");
    return workspace;
  };
  const membersFor = async (memberIds: string[]) => {
    const members = await database
      .collection("users")
      .find(
        { id: { $in: memberIds } },
        { projection: { id: 1, name: 1, email: 1 } },
      )
      .toArray();
    return members.map((u) =>
      publicUser(u as unknown as Parameters<typeof publicUser>[0]),
    );
  };
  if (resource === "account") {
    if (method === "GET") return user;
    if (method === "PATCH") {
      const body = z
        .object({
          name: nameSchema.optional(),
          theme: z.enum(["light", "dark", "system"]).optional(),
          currentPassword: passwordSchema.optional(),
          newPassword: passwordSchema.optional(),
        })
        .parse(await readJson(request));
      const changes: Record<string, unknown> = {};
      if (body.name) changes.name = body.name;
      if (body.theme) changes.theme = body.theme;
      if (body.newPassword && user.username)
        throw new HttpError(400, "Username profiles do not use passwords.");
      if (body.newPassword) {
        await rateLimit("password-change", user.id, 5);
        const record = await database
          .collection("users")
          .findOne({ id: user.id });
        if (
          !body.currentPassword ||
          !(await compare(body.currentPassword, record!.passwordHash))
        )
          throw new HttpError(400, "Current password is incorrect.");
        changes.passwordHash = await hash(body.newPassword, 12);
      }
      await database.collection("users").updateOne(
        { id: user.id },
        {
          $set: changes,
          ...(body.newPassword ? { $inc: { sessionVersion: 1 } } : {}),
        },
      );
      return { ok: true, signInAgain: !!body.newPassword };
    }
  }
  if (resource === "workspaces") {
    if (!id && method === "GET")
      return workspaces
        .find(
          { memberIds: user.id },
          { projection: { _id: 0, id: 1, name: 1, ownerId: 1 } },
        )
        .toArray();
    if (!id && method === "POST") {
      await rateLimit("create-workspace", user.id, 10, 60);
      const body = z
        .object({ name: z.string().trim().min(1).max(80) })
        .parse(await readJson(request));
      const workspace = {
        id: randomUUID(),
        name: body.name,
        ownerId: user.id,
        memberIds: [user.id],
        inviteCode: randomBytes(18).toString("base64url"),
        createdAt: new Date(),
      };
      await workspaces.insertOne(workspace);
      return { id: workspace.id, name: workspace.name };
    }
    if (id === "join" && method === "POST") {
      await rateLimit("join-workspace", user.id, 20);
      const body = z
        .object({ code: z.string().trim().min(10).max(100) })
        .parse(await readJson(request));
      const workspace = await workspaces.findOneAndUpdate(
        { inviteCode: body.code },
        { $addToSet: { memberIds: user.id } },
        { returnDocument: "after" },
      );
      if (!workspace)
        throw new HttpError(
          404,
          "This invite is invalid or has been replaced.",
        );
      return { id: workspace.id, name: workspace.name };
    }
    const workspace = await getWorkspace(id);
    if (!action && method === "GET")
      return {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.ownerId,
        inviteCode:
          workspace.ownerId === user.id ? workspace.inviteCode : undefined,
        members: await membersFor(workspace.memberIds),
      };
    if (!action && method === "PATCH") {
      if (workspace.ownerId !== user.id)
        throw new HttpError(
          403,
          "Only the workspace owner can change these settings.",
        );
      const body = z
        .object({
          name: z.string().trim().min(1).max(80).optional(),
          rotateInvite: z.boolean().optional(),
        })
        .parse(await readJson(request));
      const changes = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.rotateInvite
          ? { inviteCode: randomBytes(18).toString("base64url") }
          : {}),
      };
      await workspaces.updateOne({ id }, { $set: changes });
      return { ok: true };
    }
  }
  if (resource === "tasks") {
    if (!id && method === "GET") {
      const url = new URL(request.url);
      const workspace = await getWorkspace(
        url.searchParams.get("workspaceId") || "",
      );
      const members = await membersFor(workspace.memberIds);
      const records = await tasks
        .find({ workspaceId: workspace.id }, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(5000)
        .toArray();
      return records.map((task) => ({
        ...task,
        assignee: members.find((m) => m.id === task.assignedMemberId),
        creator: members.find((m) => m.id === task.creatorId),
      }));
    }
    const existing = id ? await tasks.findOne({ id }) : null;
    if (id && !existing) throw new HttpError(404, "Task not found.");
    if (!id && method !== "POST")
      throw new HttpError(405, "Method not allowed.");
    if (id && method === "GET") {
      const workspace = await getWorkspace(existing!.workspaceId);
      const members = await membersFor(workspace.memberIds);
      const { _id, ...task } = existing!;
      return {
        ...task,
        assignee: members.find((m) => m.id === task.assignedMemberId),
        creator: members.find((m) => m.id === task.creatorId),
      };
    }
    const body = method === "DELETE" ? {} : await readJson(request);
    const workspace = await getWorkspace(
      existing?.workspaceId || z.string().parse(body.workspaceId),
    );
    if (method === "DELETE") {
      await tasks.deleteOne({ id, workspaceId: workspace.id });
      return { ok: true };
    }
    await rateLimit("task-write", user.id, 200);
    let fields;
    if (method === "PATCH" && action === "status")
      fields = { status: statusSchema.parse(body.status) };
    else if (method === "POST" || method === "PUT") {
      fields = taskSchema.parse(body);
      if (
        fields.assignedMemberId &&
        !workspace.memberIds.includes(fields.assignedMemberId)
      )
        throw new HttpError(400, "Select a member of this workspace.");
    } else throw new HttpError(405, "Method not allowed.");
    const record = existing
      ? { ...existing, ...fields, updatedAt: new Date().toISOString() }
      : {
          ...fields,
          id: randomUUID(),
          workspaceId: workspace.id,
          creatorId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
    if (existing)
      await tasks.updateOne(
        { id, workspaceId: workspace.id },
        { $set: { ...fields, updatedAt: record.updatedAt } },
      );
    else await tasks.insertOne(record);
    const members = await membersFor(workspace.memberIds);
    const { _id, ...clean } = record as typeof record & { _id?: unknown };
    return {
      ...clean,
      assignee: members.find(
        (m) => m.id === (record as Record<string, unknown>).assignedMemberId,
      ),
      creator: members.find(
        (m) => m.id === (record as Record<string, unknown>).creatorId,
      ),
    };
  }
  throw new HttpError(404, "Endpoint not found.");
}
