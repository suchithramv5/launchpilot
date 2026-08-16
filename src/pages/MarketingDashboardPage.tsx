import { useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch } from '@/state/LaunchDataContext';
import { taskBadgeStyle } from '@/lib/statusLabels';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { EstimatedLaunchDateBanner } from '@/components/EstimatedLaunchDateBanner';
import { TrailPreviewCard } from '@/components/TrailPreviewCard';
import { TaskTimingBadges } from '@/components/TaskTimingBadges';

export function MarketingDashboardPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser, logout } = useAuth();

  if (!launch || !currentUser) return null;

  const myTasks = launch.tasks.filter((t) => t.ownerId === currentUser.id);
  const openCount = myTasks.filter((t) => t.status !== 'completed').length;
  // Upstream dependencies: any task marketing's own tasks depend on (single-dependency chain) plus anything blocking, still open.
  const upstreamDeps = launch.tasks.filter((t) => t.ownerId !== currentUser.id && t.blocks && t.status !== 'completed');
  const blockerCount = upstreamDeps.filter((t) => t.status === 'at risk' || t.status === 'blocked').length;
  const listingTask = launch.tasks.find((t) => t.name === 'Listing live');
  const listingLabel = listingTask ? taskBadgeStyle(listingTask.status).label : '—';

  return (
    <div className="mx-auto w-full max-w-[1000px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-bold">{launch.name}</div>
          <div className="text-[13px] text-ink-muted">{currentUser.name}&apos;s marketing view · view only</div>
        </div>
        <div onClick={logout} className="cursor-pointer text-[13px] font-semibold text-ink-tertiary">
          log out
        </div>
      </div>

      <EstimatedLaunchDateBanner launch={launch} />

      <div className="mb-6 flex gap-4">
        <StatCard label="Your open tasks" value={openCount} />
        <StatCard label="Upstream blockers still open" value={blockerCount} valueClassName={blockerCount > 0 ? 'text-status-blocked-text' : ''} />
        <StatCard label="Listing live" value={listingLabel} />
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Your marketing tasks</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {myTasks.map((t) => (
          <div key={t.id} className="border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 text-sm font-semibold">{t.name}</div>
              <Badge style={taskBadgeStyle(t.status)} />
              <TaskTimingBadges task={t} launch={launch} />
            </div>
            {(t.status === 'at risk' || t.status === 'blocked') && t.riskReason && (
              <div className="mt-1.5 text-xs text-[#8a6a3d]">
                ⚠ <strong>{t.riskReason}</strong>
                {t.riskComment && ` — ${t.riskComment}`}
              </div>
            )}
          </div>
        ))}
        {myTasks.length === 0 && <div className="px-4 py-4 text-[12.5px] text-ink-muted">No tasks assigned yet.</div>}
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Upstream dependencies to watch</div>
      <div className="mb-2.5 text-[12.5px] text-ink-muted">Tasks that must clear before your work can safely proceed.</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {upstreamDeps.map((t) => (
          <div key={t.id} className="flex items-center gap-3 border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex-1">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="mt-0.5 text-xs text-ink-muted">Owner: {t.ownerName}</div>
            </div>
            <Badge style={taskBadgeStyle(t.status)} />
            <TaskTimingBadges task={t} launch={launch} />
          </div>
        ))}
        {upstreamDeps.length === 0 && <div className="px-4 py-4 text-[12.5px] text-ink-muted">No open upstream blockers right now.</div>}
      </div>

      <TrailPreviewCard
        launch={launch}
        currentUser={currentUser}
        launchId={launchId}
        subtitle="Full launch activity, including compliance sign-offs — so you know when it's safe to start your own work."
      />
    </div>
  );
}
