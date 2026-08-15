import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch } from '@/state/LaunchDataContext';
import { isLaunchOwnerUser, scopedTrailEntries } from '@/lib/permissions';
import { ROLE_OWNER } from '@/types';
import { Select } from '@/components/ui';

export function TrailPage() {
  const { id } = useParams();
  const launch = useLaunch(Number(id));
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All tasks');

  if (!launch || !currentUser) return null;

  const scoped = scopedTrailEntries(launch, currentUser);
  const filtered = filter === 'All tasks' ? scoped : scoped.filter((e) => e.task === filter);
  const isOwner = isLaunchOwnerUser(currentUser);
  const taskNames = Array.from(new Set(launch.tasks.map((t) => t.name)));
  const ownerName = ROLE_OWNER[currentUser.role];

  return (
    <div className="mx-auto w-full max-w-[780px] p-8">
      <div onClick={() => navigate(`/launches/${launch.id}/dashboard`)} className="mb-3.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to dashboard
      </div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-xl font-bold">Accountability trail</div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All tasks">All tasks</option>
          {taskNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
      <div className="mb-2 text-[13px] text-ink-muted">Every commitment change on this launch, in order. Entries are system-recorded and can&apos;t be edited or deleted.</div>
      {!isOwner && (
        <div className="mb-4 inline-block rounded-control bg-[#f3f1ec] px-3 py-2 text-xs text-ink-secondary">
          🔒 Showing entries for {ownerName ?? 'your'}&apos;s tasks only.
        </div>
      )}

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {filtered.map((e) => (
          <div key={e.id} className="flex gap-3.5 border-b border-border-divider px-4 py-4 last:border-b-0">
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-xs font-bold text-ink-tertiary">
              {e.initial}
            </div>
            <div className="flex-1">
              <div className="text-[13.5px]">
                <strong>{e.name}</strong> {e.action} on <strong>{e.task}</strong>
              </div>
              <div className="mt-0.5 text-[13px] text-ink-secondary">
                {e.old} → <strong>{e.new}</strong>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-ink-faint">{e.time}</div>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-ink-faint">🔒 locked</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-ink-muted">No activity yet — this launch is new, so nothing has been logged.</div>
        )}
      </div>
    </div>
  );
}
