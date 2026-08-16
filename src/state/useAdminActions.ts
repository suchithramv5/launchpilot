import { useCallback } from 'react';
import type { AccessTier, Role } from '@/types';
import * as mutations from '@/data/api/mutations';
import { useAppData } from './AppDataContext';

export function useAdminActions() {
  const { refetchProfiles } = useAppData();

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      await fn();
      await refetchProfiles();
    },
    [refetchProfiles],
  );

  return {
    inviteUser: useCallback((email: string, role: Role, accessTier: AccessTier) => run(() => mutations.inviteUser(email, role, accessTier)), [run]),
    revokeUser: useCallback((userId: string) => run(() => mutations.revokeUser(userId)), [run]),
    restoreUser: useCallback((userId: string) => run(() => mutations.restoreUser(userId)), [run]),
    updateUserRole: useCallback((userId: string, role: Role) => run(() => mutations.updateUserRole(userId, role)), [run]),
  };
}
