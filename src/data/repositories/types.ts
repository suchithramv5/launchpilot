import type { Launch, User } from '@/types';

export interface AppData {
  users: User[];
  launches: Launch[];
}

/**
 * Abstraction over where app data lives. The in-memory/localStorage
 * implementation is a stand-in for a future HTTP-backed repository —
 * consumers (the reducer in state/store.ts) never touch storage directly.
 */
export interface DataRepository {
  load(): AppData | null;
  save(data: AppData): void;
}

export interface SessionRepository {
  getUserId(): number | null;
  setUserId(userId: number | null): void;
}
