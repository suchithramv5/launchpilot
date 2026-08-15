import { useCallback } from 'react';
import type { AccessTier } from '@/types';
import { useAppData } from './AppDataContext';

export function useAdminActions() {
  const { dispatch } = useAppData();
  return {
    addUser: useCallback((email: string, tier: AccessTier) => dispatch({ type: 'ADD_USER', email, tier }), [dispatch]),
    revokeUser: useCallback((userId: number) => dispatch({ type: 'REVOKE_USER', userId }), [dispatch]),
    restoreUser: useCallback((userId: number) => dispatch({ type: 'RESTORE_USER', userId }), [dispatch]),
    updateUserTier: useCallback((userId: number, tier: AccessTier) => dispatch({ type: 'UPDATE_USER_TIER', userId, tier }), [dispatch]),
  };
}
