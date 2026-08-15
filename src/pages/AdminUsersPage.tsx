import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/state/AppDataContext';
import { useAdminActions } from '@/state/useAdminActions';
import { useAuth } from '@/state/AuthContext';
import type { AccessTier } from '@/types';
import { TIER_LABELS } from '@/types';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton, Select, SuccessBanner, TextInput } from '@/components/ui';

const TIER_OPTIONS: AccessTier[] = ['owner', 'member', 'external'];

export function AdminUsersPage() {
  const { state } = useAppData();
  const { addUser, revokeUser, restoreUser, updateUserTier } = useAdminActions();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<AccessTier>('member');
  const [confirmation, setConfirmation] = useState('');
  const [search, setSearch] = useState('');

  function grantAccess() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) return;
    addUser(trimmed, tier);
    setConfirmation(`✉️ Signup email sent to ${trimmed} — they can now log in as a ${TIER_LABELS[tier]}.`);
    setEmail('');
  }

  const query = search.trim().toLowerCase();
  const filteredUsers = state.users.filter(
    (u) => !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.employeeId.toLowerCase().includes(query),
  );

  return (
    <div className="mx-auto w-full max-w-[640px] p-8">
      <div onClick={() => navigate(-1)} className="mb-3.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back
      </div>
      <div className="mb-6 text-xl font-bold">Manage user roles</div>

      {confirmation && <SuccessBanner>{confirmation}</SuccessBanner>}

      <div className="mb-2.5 text-[13px] font-bold">Add access for a new user</div>
      <div className="mb-7 flex flex-wrap gap-2">
        <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@brand.com" className="flex-[1.6]" />
        <Select value={tier} onChange={(e) => setTier(e.target.value as AccessTier)} className="flex-1">
          {TIER_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
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
          const isAdminRole = u.role === 'admin';
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
              {isAdminRole && <div className="rounded-full bg-[#f3f1ec] px-2.5 py-1 text-xs font-bold text-ink-secondary">Admin</div>}
              {!isAdminRole && !isSelf && (
                <Select value={u.accessTier} onChange={(e) => updateUserTier(u.id, e.target.value as AccessTier)} className="w-[150px] py-1.5 text-[13px]">
                  {TIER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {TIER_LABELS[t]}
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
                  !isAdminRole && (
                    <button onClick={() => revokeUser(u.id)} className="whitespace-nowrap rounded-control border border-border-input px-3 py-1.5 text-xs font-semibold">
                      Revoke access
                    </button>
                  )
                ))}
            </div>
          );
        })}
        {filteredUsers.length === 0 && <div className="px-4 py-4 text-[13px] text-ink-muted">No users match &quot;{search}&quot;.</div>}
      </div>
    </div>
  );
}
