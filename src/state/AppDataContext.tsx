import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Launch, User } from '@/types';
import { buildProfileLookup, fetchAllProfiles, fetchLaunchDetail, fetchLaunchSummaries } from '@/data/api/queries';
import type { ProfileLookup } from '@/data/api/mappers';

interface AppDataContextValue {
  session: Session | null;
  authLoading: boolean;
  /** true once Supabase fires PASSWORD_RECOVERY (user arrived via a reset-password email link) */
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
  profiles: User[];
  profilesLookup: ProfileLookup;
  currentUser: User | null;
  refetchProfiles: () => Promise<void>;

  launches: Launch[];
  launchesLoading: boolean;
  refetchLaunches: () => Promise<void>;

  currentLaunch: Launch | null;
  currentLaunchId: number | null;
  currentLaunchLoading: boolean;
  loadLaunch: (id: number) => Promise<void>;
  refetchCurrentLaunch: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [profiles, setProfiles] = useState<User[]>([]);

  const [launches, setLaunches] = useState<Launch[]>([]);
  const [launchesLoading, setLaunchesLoading] = useState(false);

  const [currentLaunch, setCurrentLaunch] = useState<Launch | null>(null);
  const [currentLaunchId, setCurrentLaunchId] = useState<number | null>(null);
  const [currentLaunchLoading, setCurrentLaunchLoading] = useState(false);

  const profilesLookup = useMemo(() => buildProfileLookup(profiles), [profiles]);

  const refetchProfiles = useCallback(async () => {
    const data = await fetchAllProfiles();
    setProfiles(data);
  }, []);

  // Auth session bootstrap + listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  useEffect(() => {
    if (session) {
      refetchProfiles();
    } else {
      setProfiles([]);
      setLaunches([]);
      setCurrentLaunch(null);
      setCurrentLaunchId(null);
    }
  }, [session, refetchProfiles]);

  const currentUser = useMemo<User | null>(() => {
    if (!session) return null;
    return profiles.find((p) => p.id === session.user.id) ?? null;
  }, [session, profiles]);

  const refetchLaunches = useCallback(async () => {
    setLaunchesLoading(true);
    try {
      const data = await fetchLaunchSummaries(profilesLookup);
      setLaunches(data);
    } finally {
      setLaunchesLoading(false);
    }
  }, [profilesLookup]);

  useEffect(() => {
    if (currentUser) refetchLaunches();
  }, [currentUser, refetchLaunches]);

  const loadLaunch = useCallback(
    async (id: number) => {
      setCurrentLaunchLoading(true);
      try {
        const data = await fetchLaunchDetail(id, profilesLookup);
        setCurrentLaunch(data);
        setCurrentLaunchId(id);
      } finally {
        setCurrentLaunchLoading(false);
      }
    },
    [profilesLookup],
  );

  const refetchCurrentLaunch = useCallback(async () => {
    if (currentLaunchId != null) await loadLaunch(currentLaunchId);
  }, [currentLaunchId, loadLaunch]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      session,
      authLoading,
      passwordRecovery,
      clearPasswordRecovery,
      profiles,
      profilesLookup,
      currentUser,
      refetchProfiles,
      launches,
      launchesLoading,
      refetchLaunches,
      currentLaunch,
      currentLaunchId,
      currentLaunchLoading,
      loadLaunch,
      refetchCurrentLaunch,
    }),
    [
      session,
      authLoading,
      passwordRecovery,
      clearPasswordRecovery,
      profiles,
      profilesLookup,
      currentUser,
      refetchProfiles,
      launches,
      launchesLoading,
      refetchLaunches,
      currentLaunch,
      currentLaunchId,
      currentLaunchLoading,
      loadLaunch,
      refetchCurrentLaunch,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
