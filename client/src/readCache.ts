// Session-memory cache only: never persist private API payloads to disk.
export class ReadCache {
  private values = new Map<string, { value: unknown; expires: number }>();
  private pending = new Map<string, Promise<unknown>>();
  private generation = 0;
  peek<T>(key: string): T | undefined {
    const entry = this.values.get(key);
    return entry && entry.expires > Date.now() ? entry.value as T : undefined;
  }
  clear() {
    this.generation++;
    this.values.clear();
    this.pending.clear();
  }
  async read<T>(key: string, fetcher: () => Promise<T>, ttl = 15000): Promise<T> {
    const cached = this.peek<T>(key);
    if (cached !== undefined) return cached;
    const existing = this.pending.get(key);
    if (existing) return existing as Promise<T>;
    const generation = this.generation;
    const request = fetcher().then(value => {
      if (generation === this.generation) {
        if (this.values.size >= 100) this.values.delete(this.values.keys().next().value!);
        this.values.set(key, { value, expires: Date.now() + ttl });
      }
      return value;
    }).finally(() => { if (this.pending.get(key) === request) this.pending.delete(key); });
    this.pending.set(key, request);
    return request;
  }
}
