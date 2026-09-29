type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

/**
 * Simple in-memory TTL cache.
 *
 * Why not Redis?  For an analytics dashboard refreshed every 60 s on a single
 * server instance, a process-local cache is perfectly sufficient and adds zero
 * infrastructure.  Swap this out for Redis if you ever run multiple replicas.
 */
export class InMemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
