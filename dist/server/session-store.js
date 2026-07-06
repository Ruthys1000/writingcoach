"use strict";
// ============================================================
// Server — In-Memory Session Store
// Stores active coaching sessions keyed by UUID.
// TTL-based cleanup prevents unbounded memory growth.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSession = setSession;
exports.getSession = getSession;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const store = new Map();
function setSession(id, session) {
    store.set(id, {
        data: session,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
    });
    pruneExpired();
}
function getSession(id) {
    const entry = store.get(id);
    if (!entry)
        return undefined;
    entry.lastAccessedAt = Date.now();
    return entry.data;
}
function pruneExpired() {
    const now = Date.now();
    for (const [id, entry] of store.entries()) {
        if (now - entry.lastAccessedAt > SESSION_TTL_MS) {
            store.delete(id);
        }
    }
}
//# sourceMappingURL=session-store.js.map