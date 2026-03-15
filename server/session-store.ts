// ============================================================
// Server — In-Memory Session Store
// Stores active coaching sessions keyed by UUID.
// TTL-based cleanup prevents unbounded memory growth.
// ============================================================

import type { CoachSession } from '../src/coach';

interface StoredSession {
  data: CoachSession;
  createdAt: number;
  lastAccessedAt: number;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const store = new Map<string, StoredSession>();

export function setSession(id: string, session: CoachSession): void {
  store.set(id, {
    data: session,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  });
  pruneExpired();
}

export function getSession(id: string): CoachSession | undefined {
  const entry = store.get(id);
  if (!entry) return undefined;
  entry.lastAccessedAt = Date.now();
  return entry.data;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (now - entry.lastAccessedAt > SESSION_TTL_MS) {
      store.delete(id);
    }
  }
}
