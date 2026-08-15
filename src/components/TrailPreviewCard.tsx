import { useNavigate } from 'react-router-dom';
import type { Launch, User } from '@/types';
import { scopedTrailEntries } from '@/lib/permissions';

/**
 * Scoped the same way as the full Trail screen (owner-scoping for non-lead
 * roles) — the dashboard preview must never show more than "view all" leads
 * to, so it reuses the same scoping function rather than the launch's raw
 * trailEntries.
 */
export function TrailPreviewCard({ launch, currentUser, launchId, subtitle }: { launch: Launch; currentUser: User | null; launchId: number; subtitle?: string }) {
  const navigate = useNavigate();
  const entries = scopedTrailEntries(launch, currentUser).slice(0, 3);

  return (
    <div className="rounded-card border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[13px] font-bold">Accountability trail</div>
        <a onClick={() => navigate(`/launches/${launchId}/trail`)} className="cursor-pointer text-xs font-semibold">
          view all
        </a>
      </div>
      {subtitle && <div className="mb-2.5 text-[11.5px] text-ink-muted">{subtitle}</div>}
      {entries.map((e) => (
        <div key={e.id} className="flex gap-2.5 border-b border-border-divider2 py-2.5 last:border-b-0">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[11px] font-bold text-ink-tertiary">{e.initial}</div>
          <div className="flex-1">
            <div className="text-[12.5px]">
              <strong>{e.name}</strong> {e.action} on <strong>{e.task}</strong>
            </div>
            <div className="mt-0.5 text-xs text-ink-tertiary">
              {e.old} → {e.new}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-faint">{e.time}</div>
          </div>
        </div>
      ))}
      {entries.length === 0 && <div className="py-2.5 text-[12.5px] text-ink-muted">No activity yet.</div>}
    </div>
  );
}
