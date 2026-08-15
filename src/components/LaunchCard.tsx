import type { ReactNode } from 'react';
import type { Launch } from '@/types';
import { atRiskCount, blockedCount, computeNextMilestone, openComplianceFlagCount, progressPct } from '@/lib/launchMetrics';

export function LaunchCard({ launch, onClick, actionLabel }: { launch: Launch; onClick: () => void; actionLabel: string }) {
  const milestone = computeNextMilestone(launch);
  const atRisk = atRiskCount(launch.tasks);
  const blocked = blockedCount(launch.tasks);
  const flags = openComplianceFlagCount(launch);

  return (
    <div onClick={onClick} className="cursor-pointer rounded-card border border-border bg-card p-5 shadow-card transition-colors hover:bg-page">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="text-[16px] font-bold">{launch.name}</div>
        <div className="text-xs text-ink-faint">{actionLabel}</div>
      </div>
      <div className="flex gap-6">
        <Stat label="Progress" value={`${progressPct(launch.tasks)}%`} />
        <Stat label="At risk / blocked" value={`${atRisk} / ${blocked}`} className={atRisk + blocked > 0 ? 'text-status-risk-text' : ''} />
        <Stat label="Next milestone" value={milestone ? milestone.task.name : '—'} />
        <Stat label="Open compliance flags" value={flags} className={flags > 0 ? 'text-status-blocked-text' : ''} />
      </div>
    </div>
  );
}

function Stat({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-ink-muted">{label}</div>
      <div className={`text-[15px] font-bold ${className}`}>{value}</div>
    </div>
  );
}
