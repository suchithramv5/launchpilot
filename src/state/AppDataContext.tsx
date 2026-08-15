import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { SEED_LAUNCHES, SEED_USERS } from '@/data/seed';
import { LocalStorageDataRepository, LocalStorageSessionRepository } from '@/data/repositories/localStorageRepository';
import type { DataRepository, SessionRepository } from '@/data/repositories/types';
import { type Action, type AppState, reducer } from './store';

const dataRepository: DataRepository = new LocalStorageDataRepository();
const sessionRepository: SessionRepository = new LocalStorageSessionRepository();

function loadInitialState(): AppState {
  const saved = dataRepository.load();
  const currentUserId = sessionRepository.getUserId();
  if (saved) return { ...saved, currentUserId };
  return { users: SEED_USERS, launches: SEED_LAUNCHES, currentUserId };
}

interface AppDataContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    dataRepository.save({ users: state.users, launches: state.launches });
  }, [state.users, state.launches]);

  useEffect(() => {
    sessionRepository.setUserId(state.currentUserId);
  }, [state.currentUserId]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
