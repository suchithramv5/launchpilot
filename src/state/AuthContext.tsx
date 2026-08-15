import { useCallback, useMemo } from 'react';
import type { User } from '@/types';
import { useAppData } from './AppDataContext';

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export function useAuth() {
  const { state, dispatch } = useAppData();

  const currentUser: User | null = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const login = useCallback(
    (email: string, password: string): LoginResult => {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !password) return { ok: false, error: 'Enter your email and password.' };
      if (!/^\S+@\S+\.\S+$/.test(trimmed)) return { ok: false, error: 'Enter a valid email address.' };
      if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
      const user = state.users.find((u) => u.email.toLowerCase() === trimmed);
      if (!user) return { ok: false, error: 'No account found for that email.' };
      if (user.status === 'revoked') return { ok: false, error: 'Access to LaunchPilot has been revoked for this account.' };
      dispatch({ type: 'LOGIN', userId: user.id });
      return { ok: true };
    },
    [state.users, dispatch],
  );

  const requestReset = useCallback(
    (email: string): LoginResult => {
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) return { ok: false, error: 'Enter your email.' };
      if (!/^\S+@\S+\.\S+$/.test(trimmed)) return { ok: false, error: 'Enter a valid email address.' };
      const user = state.users.find((u) => u.email.toLowerCase() === trimmed);
      if (!user) return { ok: false, error: 'No account found for that email.' };
      return { ok: true };
    },
    [state.users],
  );

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), [dispatch]);

  return { currentUser, login, logout, requestReset };
}
