import type { AppData, DataRepository, SessionRepository } from './types';

const DATA_KEY = 'launchpilot:data:v1';
const SESSION_KEY = 'launchpilot:session:v1';

export class LocalStorageDataRepository implements DataRepository {
  load(): AppData | null {
    try {
      const raw = window.localStorage.getItem(DATA_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AppData;
    } catch {
      return null;
    }
  }

  save(data: AppData): void {
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      // storage unavailable (private mode / quota) — fail silently, in-memory state still works
    }
  }
}

export class LocalStorageSessionRepository implements SessionRepository {
  getUserId(): number | null {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setUserId(userId: number | null): void {
    try {
      if (userId === null) {
        window.localStorage.removeItem(SESSION_KEY);
      } else {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(userId));
      }
    } catch {
      // ignore
    }
  }
}
