import type { Launch } from '@/types';
import { computeLaunchEstimate } from '@/lib/launchMetrics';

export function EstimatedLaunchDateBanner({ launch }: { launch: Pick<Launch, 'tasks' | 'createdAt'> }) {
  const estimate = computeLaunchEstimate(launch);

  return (
    <div className="mb-4 flex items-center justify-between rounded-card border border-border bg-card px-5.5 py-4.5 shadow-card">
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Estimated launch date</div>
        <div className="text-[32px] font-extrabold leading-none text-[oklch(45%_0.13_150)]">{estimate.estimatedLabel}</div>
        <div className="mt-1.5 text-[11px] text-ink-faint">Estimated, based on current task durations and delays</div>
      </div>
      {estimate.isDelayed && (
        <div className="text-right">
          <div className="text-[12.5px] text-ink-faint line-through">Originally {estimate.plannedLabel}</div>
          <div className="mt-1 text-[13.5px] font-bold text-status-blocked-text">{estimate.lagDays === 1 ? '1 day' : `${estimate.lagDays} days`} slip</div>
        </div>
      )}
    </div>
  );
}
