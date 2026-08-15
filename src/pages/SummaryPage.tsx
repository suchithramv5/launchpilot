import { useNavigate, useParams } from 'react-router-dom';
import { useLaunch } from '@/state/LaunchDataContext';
import { atRiskCount, blockedCount, bookingConfirmationText, computeNextMilestone, openComplianceFlagCount, progressPct } from '@/lib/launchMetrics';
import { taskBadgeStyle } from '@/lib/statusLabels';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { EstimatedLaunchDateBanner } from '@/components/EstimatedLaunchDateBanner';
import { TaskTimingBadges } from '@/components/TaskTimingBadges';
import { SuccessBanner } from '@/components/ui';

export function SummaryPage() {
  const { id } = useParams();
  const launch = useLaunch(Number(id));
  const navigate = useNavigate();
  if (!launch) return <div className="p-8 text-sm text-ink-muted">Launch not found.</div>;

  const milestone = computeNextMilestone(launch);
  const flags = openComplianceFlagCount(launch);
  const bookingText = bookingConfirmationText(launch);

  return (
    <div className="mx-auto w-full max-w-[1000px] p-8">
      <div onClick={() => navigate(`/launches/${launch.id}`)} className="mb-3.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to launch details
      </div>
      <div className="mb-2 text-xl font-bold">{launch.name}</div>
      <div className="mb-5 text-[13px] text-ink-muted">Overall launch status · read only, shared across every role</div>

      <EstimatedLaunchDateBanner launch={launch} />
      {bookingText && <SuccessBanner>{bookingText}</SuccessBanner>}

      <div className="mb-6 flex gap-4">
        <StatCard label="Overall progress" value={`${progressPct(launch.tasks)}%`} sub="stages on track" />
        <StatCard label="At risk / blocked" value={`${atRiskCount(launch.tasks)} / ${blockedCount(launch.tasks)}`} valueClassName="text-status-risk-text" />
        <StatCard label="Next milestone" value={milestone ? milestone.task.name : '—'} />
        <StatCard label="Open compliance flags" value={flags} valueClassName={flags > 0 ? 'text-status-blocked-text' : ''} />
      </div>

      <div className="mb-2.5 text-[13px] font-bold">All launch stages</div>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {[...launch.tasks]
          .sort((a, b) => a.step - b.step)
          .map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-border-divider px-4 py-3.5 last:border-b-0">
              <div className="w-[22px] text-xs text-ink-faint">{t.step}</div>
              <div className="flex-1 text-sm font-semibold">{t.name}</div>
              <div className="w-[90px] text-xs text-ink-tertiary">{t.owner}</div>
              <Badge style={taskBadgeStyle(t.status)} />
              <TaskTimingBadges task={t} launch={launch} />
            </div>
          ))}
      </div>
    </div>
  );
}
