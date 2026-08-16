import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as mutations from '@/data/api/mutations';
import { useAppData } from './AppDataContext';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export function useAuth() {
  const { currentUser, authLoading, session, refetchProfiles, passwordRecovery, clearPasswordRecovery } = useAppData();

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) return { ok: false, error: 'Enter a valid email address.' };
    if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
    if (!name.trim()) return { ok: false, error: 'Enter your name.' };

    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) return { ok: false, error: 'Enter your email and password.' };
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return { ok: false, error: 'Enter a valid email address.' };

    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    if (error) return { ok: false, error: error.message };
    await refetchProfiles();
    return { ok: true };
  }, [refetchProfiles]);

  const requestReset = useCallback(async (email: string): Promise<AuthResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return { ok: false, error: 'Enter your email.' };
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return { ok: false, error: 'Enter a valid email address.' };

    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthResult> => {
      if (newPassword.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: error.message };
      await mutations.clearMustChangePassword().catch(() => {});
      clearPasswordRecovery();
      await refetchProfiles();
      return { ok: true };
    },
    [clearPasswordRecovery, refetchProfiles],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { currentUser, authLoading, hasSession: !!session, passwordRecovery, signUp, login, logout, requestReset, updatePassword };
}
