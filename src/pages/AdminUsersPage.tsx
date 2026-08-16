import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { useAdminActions } from '@/state/useAdminActions';
import { useAuth } from '@/state/AuthContext';
import type { AccessTier, Role } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton, Select, SuccessBanner, TextInput } from '@/components/ui';

const ROLE_OPTIONS: Role[] = ['launch_lead', 'compliance', 'upstream_ops', 'marketing', 'admin'];

function tierForRole(role: Role): AccessTier {
  return role === 'launch_lead' || role === 'admin' ? 'owner' : 'member';
}

export function AdminUsersPage() {
  const { profiles } = useAppData();
  const { createPendingInvite, revokeUser, restoreUser, updateUserRole } = useAdminActions();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('marketing');
  const [confirmation, setConfirmation] = useState('');
  const [search, setSearch] = useState('');

  async function grantAccess() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed) || !currentUser) return;
    await createPendingInvite(trimmed, role, tierForRole(role), currentUser.id);
    setConfirmation(`✓ ${trimmed} can now sign up and will land with the ${ROLE_LABELS[role]} role automatically.`);
    setEmail('');
  }

  const query = search.trim().toLowerCase();
  const filteredUsers = profiles.filter(
    (u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.employeeId.toLowerCase().includes(query),
  );

  return (
    <div className="mx-auto w-full max-w-[640px] p-8">
      <div onClick={() => navigate(-1)} className="mb-3.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back
      </div>
      <div className="mb-6 text-xl font-bold">Manage user roles</div>

      {confirmation && <SuccessBanner>{confirmation}</SuccessBanner>}

      <div className="mb-2.5 text-[13px] font-bold">Grant access for a new user</div>
      <div className="mb-2 text-[12px] text-ink-muted">They still create their own account (and password) — this just pre-assigns their role.</div>
      <div className="mb-7 flex flex-wrap gap-2">
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@brand.com" className="flex-[1.6]" />
        <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className="flex-1">
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
        <PrimaryButton onClick={grantAccess} className="whitespace-nowrap">
          Grant access
        </PrimaryButton>
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Find a user</div>
      <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or employee ID" className="mb-4" />

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {filteredUsers.map((u) => {
          const isRevoked = u.status === 'revoked';
          const isSelf = u.id === currentUser?.id;
          return (
            <div key={u.id} className={`flex items-center gap-2.5 border-b border-border-divider px-4 py-3 last:border-b-0 ${isRevoked ? 'opacity-50' : ''}`}>
              <Avatar initial={u.initial} size={28} accent={u.role === 'launch_lead'} />
              <div className="flex-[1.4]">
                <div className="text-[13.5px] font-semibold">{u.name}</div>
                <div className="text-[11.5px] text-ink-muted">
                  {u.email} · {u.employeeId}
                </div>
              </div>
              {isSelf ? (
                <div className="rounded-full bg-[#f3f1ec] px-2.5 py-1 text-xs font-bold text-ink-secondary">You</div>
              ) : (
                <Select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value as Role)} className="w-[190px] py-1.5 text-[13px]">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              )}
              {!isSelf &&
                (isRevoked ? (
                  <button onClick={() => restoreUser(u.id)} className="whitespace-nowrap rounded-control bg-accent px-3 py-1.5 text-xs font-bold text-white">
                    Restore access
                  </button>
                ) : (
                  <button onClick={() => revokeUser(u.id)} className="whitespace-nowrap rounded-control border border-border-input px-3 py-1.5 text-xs font-semibold">
                    Revoke access
                  </button>
                ))}
            </div>
          );
        })}
        {filteredUsers.length === 0 && <div className="px-4 py-4 text-[13px] text-ink-muted">No users match &quot;{search}&quot;.</div>}
      </div>
    </div>
  );
}
