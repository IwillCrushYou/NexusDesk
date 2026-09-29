"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryCache = void 0;
/**
 * Simple in-memory TTL cache.
 *
 * Why not Redis?  For an analytics dashboard refreshed every 60 s on a single
 * server instance, a process-local cache is perfectly sufficient and adds zero
 * infrastructure.  Swap this out for Redis if you ever run multiple replicas.
 */
class InMemoryCache {
    store = new Map();
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
    invalidate(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
}
exports.InMemoryCache = InMemoryCache;
