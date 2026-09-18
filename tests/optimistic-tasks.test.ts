import test from "node:test";
import assert from "node:assert/strict";
import { OptimisticTasks } from "../client/src/optimisticTasks";
import type { Task } from "../client/src/types";
const task: Task = {
  id: "one",
  title: "Original",
  status: "todo",
  priority: "medium",
  dueDate: "2026-09-19",
  workspaceId: "team",
  assignedMemberId: "me",
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("rapid moves are immediate, serialized and reconciled without overwriting newer intent", async () => {
  const first = deferred<Task>(),
    second = deferred<Task>();
  let writes = 0;
  const store = new OptimisticTasks((async (_path, options) =>
    options?.method
      ? ++writes === 1
        ? first.promise
        : second.promise
      : [task]) as never);
  await store.refresh("/tasks", new AbortController().signal);
  const move1 = store.move("one", "in-progress");
  const move2 = store.move("one", "done");
  assert.equal(store.getSnapshot().tasks[0].status, "done");
  await tick();
  assert.equal(writes, 1);
  first.resolve({ ...task, status: "in-progress" });
  await move1;
  assert.equal(store.getSnapshot().tasks[0].status, "done");
  await tick();
  second.resolve({ ...task, status: "done", title: "Server normalized" });
  await move2;
  assert.equal(store.getSnapshot().tasks[0].title, "Server normalized");
  assert.equal(store.getSnapshot().pendingCount, 0);
});

test("failed older move preserves newer edit; stale reads cannot undo pending changes", async () => {
  const moveResponse = deferred<Task>(),
    editResponse = deferred<Task>(),
    stale = deferred<Task[]>();
  let writes = 0,
    reads = 0;
  const store = new OptimisticTasks((async (_path, options) =>
    options?.method
      ? ++writes === 1
        ? moveResponse.promise
        : editResponse.promise
      : ++reads === 1
        ? [task]
        : stale.promise) as never);
  await store.refresh("/tasks", new AbortController().signal);
  const refresh = store.refresh("/tasks", new AbortController().signal);
  const move = store.move("one", "done");
  const rejected = assert.rejects(move, /offline/);
  const edit = store.save({
    ...store.getSnapshot().tasks[0],
    title: "New title",
  });
  stale.resolve([task]);
  await refresh;
  assert.equal(store.getSnapshot().tasks[0].title, "New title");
  await tick();
  moveResponse.reject(new Error("offline"));
  await rejected;
  assert.equal(store.getSnapshot().tasks[0].title, "New title");
  assert.equal(store.getSnapshot().tasks[0].status, "todo");
  await tick();
  editResponse.resolve({ ...task, title: "New title" });
  await edit;
  assert.match(store.getSnapshot().error!, /not saved/);
});

test("failed edit rolls back and reassignment removes tasks from My Tasks immediately", async () => {
  const response = deferred<Task>();
  const store = new OptimisticTasks((async (path, options) =>
    options?.method
      ? response.promise
      : path === "/users/me"
        ? { id: "me" }
        : [task]) as never);
  await store.refresh("/users/me/tasks", new AbortController().signal, true);
  const edit = store.save({ ...task, assignedMemberId: "teammate" });
  const rejected = assert.rejects(edit);
  assert.deepEqual(store.getSnapshot().tasks, []);
  await tick();
  response.reject(new Error("Save failed"));
  await rejected;
  assert.equal(store.getSnapshot().tasks[0].assignedMemberId, "me");
});
