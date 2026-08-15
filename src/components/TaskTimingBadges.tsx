import type { Launch, Task } from '@/types';
import { daysLaggingLabel, daysToCompleteLabel } from '@/lib/launchMetrics';
import { lockBadgeStyle } from '@/lib/statusLabels';

/** The "✓ N days" / "⏱ N days behind" / lock-status badges shared across every checklist-style list in the app. */
export function TaskTimingBadges({ task, launch, showLock = false }: { task: Task; launch: Pick<Launch, 'createdAt'>; showLock?: boolean }) {
  const completeLabel = daysToCompleteLabel(task, launch);
  const lagLabel = daysLaggingLabel(task, launch);
  const lock = showLock && task.locked ? lockBadgeStyle(task.reviewStatus) : null;

  return (
    <>
      {completeLabel && <div className="whitespace-nowrap text-[11px] text-ink-tertiary">✓ {completeLabel}</div>}
      {lagLabel && <div className="whitespace-nowrap text-[11px] font-bold text-status-blocked-text">⏱ {lagLabel}</div>}
      {lock && <div className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${lock.bg} ${lock.text}`}>🔒 {lock.label}</div>}
    </>
  );
}
