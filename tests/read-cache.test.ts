import test from 'node:test';
import assert from 'node:assert/strict';
import { ReadCache } from '../client/src/readCache';

test('shared reads deduplicate and cache, while invalidation fences late responses', async () => {
  const cache = new ReadCache();
  let calls = 0;
  let resolve!: (value: string) => void;
  const fetcher = () => { calls++; return new Promise<string>(done => { resolve = done; }); };
  const first = cache.read('/workspace', fetcher);
  const duplicate = cache.read('/workspace', fetcher);
  assert.equal(calls, 1);
  resolve('before');
  assert.equal(await first, 'before');
  assert.equal(await duplicate, 'before');
  assert.equal(await cache.read('/workspace', fetcher), 'before');
  assert.equal(calls, 1);
  cache.clear();
  const late = cache.read('/workspace', fetcher);
  cache.clear();
  await cache.read('/workspace', async () => 'after');
  resolve('stale');
  await late;
  assert.equal(cache.peek('/workspace'), 'after');
  cache.clear();
  assert.equal(cache.peek('/workspace'), undefined);
});

test('failed reads are retryable and zero TTL does not retain stale data', async () => {
  const cache = new ReadCache();
  await assert.rejects(cache.read('/me', async () => { throw new Error('offline'); }));
  assert.equal(await cache.read('/me', async () => 'recovered', 0), 'recovered');
  assert.equal(cache.peek('/me'), undefined);
});
