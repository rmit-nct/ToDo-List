import type { Task } from "./types";

type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
type Change = { id: string; patch: Partial<Task> | null };
type Snapshot = {
  tasks: Task[];
  error: string | null;
  isLoading: boolean;
  pendingCount: number;
};

// Keep confirmed server data separate from pending user intent. Responses replace
// the confirmed record; newer edits are replayed on top until their own response.
export class OptimisticTasks {
  private confirmed: Task[] = [];
  private pending: Change[] = [];
  private queues = new Map<string, Promise<void>>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private creates = 0;
  private loadError: string | null = null;
  private hasLoaded = false;
  private visible = (_task: Task) => true;
  private snapshot: Snapshot = {
    tasks: [],
    error: null,
    isLoading: true,
    pendingCount: 0,
  };
  constructor(private request: Request) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;
  private publish(
    error = this.snapshot.error,
    isLoading = this.snapshot.isLoading,
  ) {
    let tasks = [...this.confirmed];
    for (const change of this.pending)
      tasks =
        change.patch === null
          ? tasks.filter((task) => task.id !== change.id)
          : tasks.map((task) =>
              task.id === change.id ? { ...task, ...change.patch } : task,
            );
    this.snapshot = {
      tasks: tasks.filter(this.visible),
      error,
      isLoading,
      pendingCount: this.pending.length + this.creates,
    };
    this.listeners.forEach((listener) => listener());
  }
  clearError = () => this.publish(null);
  async refresh(path: string, signal: AbortSignal, mine = false) {
    if (this.pending.length || this.creates) return;
    const revision = ++this.revision;
    this.publish(this.snapshot.error === this.loadError ? null : this.snapshot.error, !this.hasLoaded || (!!this.loadError && this.confirmed.length === 0));
    try {
      const [tasks, account] = await Promise.all([
        this.request<Task[]>(path, { signal }),
        mine
          ? this.request<{ id: string }>("/users/me", { signal })
          : Promise.resolve(null),
      ]);
      if (signal.aborted || revision !== this.revision) return;
      this.confirmed = tasks;
      this.visible = account
        ? (task) => (task.assignedMemberId || task.assignee?.id) === account.id
        : () => true;
      const error = this.snapshot.error === this.loadError ? null : this.snapshot.error;
      this.loadError = null;
      this.hasLoaded = true;
      this.publish(error, false);
    } catch (reason) {
      if (!signal.aborted && revision === this.revision) {
        if (reason && typeof reason === 'object' && 'status' in reason && (reason.status === 401 || reason.status === 403)) this.confirmed = [];
        this.loadError = reason instanceof Error ? reason.message : "Unable to load tasks.";
        this.publish(this.loadError, false);
      }
    }
  }
  private change(
    id: string,
    patch: Partial<Task> | null,
    method: string,
    suffix = "",
  ) {
    if (!this.confirmed.some((task) => task.id === id))
      return Promise.reject(
        new Error("Task is no longer available. Refresh and try again."),
      );
    const change = { id, patch };
    this.pending.push(change);
    this.revision++;
    this.publish(null);
    const previous = this.queues.get(id) || Promise.resolve();
    const operation = previous
      .catch(() => {})
      .then(async () => {
        try {
          const saved = await this.request<Task>(`/tasks/${id}${suffix}`, {
            method,
            body: JSON.stringify(patch || {}),
          });
          this.confirmed =
            patch === null
              ? this.confirmed.filter((task) => task.id !== id)
              : this.confirmed.map((task) => (task.id === id ? saved : task));
        } catch (reason) {
          this.publish(
            `${reason instanceof Error ? reason.message : "Unable to save task."} Your change was not saved.`,
          );
          throw reason;
        } finally {
          this.pending = this.pending.filter((item) => item !== change);
          this.revision++;
          this.publish();
        }
      });
    this.queues.set(id, operation);
    const cleanup = () => {
      if (this.queues.get(id) === operation) this.queues.delete(id);
    };
    operation.then(cleanup, cleanup);
    return operation;
  }
  save = async (task: Task) => {
    const existing =
      this.snapshot.tasks.find((item) => item.id === task.id) ??
      this.confirmed.find((item) => item.id === task.id);
    if (existing) {
      // Send only changed fields, so a concurrent status move is not overwritten
      // by a full record captured when the editor was opened.
      const patch = Object.fromEntries(
        Object.entries(task).filter(
          ([key, value]) =>
            !["id", "createdAt", "workspaceId"].includes(key) &&
            JSON.stringify(value) !==
              JSON.stringify(existing[key as keyof Task]),
        ),
      );
      return this.change(task.id, patch, "PUT");
    }
    this.creates++;
    this.revision++;
    this.publish(null);
    try {
      const saved = await this.request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });
      this.confirmed = [saved, ...this.confirmed];
    } catch (reason) {
      this.publish(
        reason instanceof Error ? reason.message : "Unable to create task.",
      );
      throw reason;
    } finally {
      this.creates--;
      this.revision++;
      this.publish();
    }
  };
  move = (id: string, status: Task["status"]) =>
    this.change(id, { status }, "PATCH", "/status");
  remove = (id: string) => this.change(id, null, "DELETE");
}
