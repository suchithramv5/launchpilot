import type { Launch, Task } from '@/types';

/**
 * All progress/risk/flag numbers shown anywhere in the app (Launches Home,
 * All Launches, Launch Summary, every role dashboard) must be derived by
 * calling these functions against the shared `launch` object from context —
 * never recomputed or cached separately per screen. That's the product's
 * core "single source of truth" guarantee.
 */

export function taskCounts(tasks: Task[]) {
  return {
    not_started: tasks.filter((t) => t.status === 'not_started').length,
    on_track: tasks.filter((t) => t.status === 'on track').length,
    at_risk: tasks.filter((t) => t.status === 'at risk').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };
}

export function progressPct(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

export function atRiskCount(tasks: Task[]): number {
  return tasks.filter((t) => t.status === 'at risk').length;
}

export function blockedCount(tasks: Task[]): number {
  return tasks.filter((t) => t.status === 'blocked').length;
}

export function openComplianceFlagCount(launch: Pick<Launch, 'complianceFlags'>): number {
  return launch.complianceFlags.filter((f) => f.status === 'open').length;
}

export interface NextMilestone {
  task: Task;
  day: number;
  dueLabel: string;
}

export function computeNextMilestone(launch: Pick<Launch, 'tasks' | 'createdAt'>): NextMilestone | null {
  const sorted = [...launch.tasks].sort((a, b) => a.step - b.step);
  if (sorted.length === 0) return null;
  let cumulative = 0;
  let best: Task | null = null;
  let bestDay = 0;
  for (const t of sorted) {
    cumulative += t.durationDays || 1;
    if (!best && t.status !== 'completed') {
      best = t;
      bestDay = cumulative;
    }
  }
  const task = best ?? sorted[sorted.length - 1];
  const day = best ? bestDay : cumulative;
  return { task, day, dueLabel: formatDueDate(launch.createdAt, day) };
}

export function formatDueDate(createdAt: number, dayOffset: number): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  d.setDate(d.getDate() + dayOffset);
  return 'due ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function launchTimelineDays(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.durationDays || 1), 0);
}

const DAY_MS = 86400000;

/** "✓ N days" badge for a completed task — days from startedAt (or launch createdAt fallback) to completedAt. */
export function daysToCompleteLabel(task: Task, launch: Pick<Launch, 'createdAt'>): string {
  if (task.status !== 'completed' || !task.completedAt) return '';
  const start = task.startedAt || launch.createdAt || task.completedAt;
  const days = Math.max(0, Math.round((task.completedAt - start) / DAY_MS));
  return days === 1 ? '1 day' : `${days} days`;
}

/** "⏱ N days behind" badge for an at-risk/blocked task that's actually behind its planned duration — empty if not. */
export function daysLaggingLabel(task: Task, launch: Pick<Launch, 'createdAt'>): string {
  if (task.status !== 'at risk' && task.status !== 'blocked') return '';
  const start = task.startedAt || launch.createdAt || Date.now();
  const elapsedDays = Math.floor((Date.now() - start) / DAY_MS);
  const lag = Math.max(0, elapsedDays - (task.durationDays || 0));
  if (lag <= 0) return '';
  return lag === 1 ? '1 day behind' : `${lag} days behind`;
}

export interface LaunchEstimate {
  plannedLabel: string;
  estimatedLabel: string;
  isDelayed: boolean;
  lagDays: number;
}

/**
 * Deterministic arithmetic over task durations/delays the team entered —
 * NOT a prediction or ML forecast. Planned date = createdAt + sum of every
 * task's planned durationDays. Slip = sum, across every at-risk/blocked
 * task on the critical path (blocks: true), of how far its elapsed time
 * (since startedAt, or launch createdAt as a fallback) exceeds its planned
 * duration. Estimated date = planned date + slip.
 */
export function computeLaunchEstimate(launch: Pick<Launch, 'tasks' | 'createdAt'>): LaunchEstimate {
  const totalPlannedDays = launch.tasks.reduce((sum, t) => sum + (t.durationDays || 1), 0);
  const plannedDate = new Date(launch.createdAt + totalPlannedDays * DAY_MS);

  const lagDays = launch.tasks.reduce((sum, t) => {
    if ((t.status !== 'at risk' && t.status !== 'blocked') || !t.blocks) return sum;
    const start = t.startedAt || launch.createdAt;
    const elapsedDays = Math.floor((Date.now() - start) / DAY_MS);
    const lag = Math.max(0, elapsedDays - (t.durationDays || 0));
    return sum + lag;
  }, 0);

  const estimatedDate = lagDays > 0 ? new Date(plannedDate.getTime() + lagDays * DAY_MS) : plannedDate;
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return { plannedLabel: fmt(plannedDate), estimatedLabel: fmt(estimatedDate), isDelayed: lagDays > 0, lagDays };
}

export interface RetroMilestone {
  taskId: number;
  name: string;
  plannedLabel: string;
  actualLabel: string;
  slipDays: number;
}

/**
 * Per-task planned vs actual vs slip, computed from real task data (planned
 * date via cumulative durationDays from createdAt; actual via completedAt,
 * falling back to the launch's closedAt for tasks never completed).
 */
export function computeRetroMilestones(launch: Pick<Launch, 'tasks' | 'createdAt' | 'closedAt'>): RetroMilestone[] {
  const sorted = [...launch.tasks].sort((a, b) => a.step - b.step);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let cumulative = 0;
  return sorted.map((t) => {
    cumulative += t.durationDays || 1;
    const plannedDate = new Date(launch.createdAt + cumulative * DAY_MS);
    const actualTime = t.completedAt ?? launch.closedAt;
    const actualDate = actualTime ? new Date(actualTime) : null;
    const slipDays = actualDate ? Math.round((actualDate.getTime() - plannedDate.getTime()) / DAY_MS) : 0;
    return {
      taskId: t.id,
      name: t.name,
      plannedLabel: fmt(plannedDate),
      actualLabel: actualDate ? fmt(actualDate) : '—',
      slipDays: Math.max(0, slipDays),
    };
  });
}

/** Latest vendor-booking adjustment, if any — shown as a confirmation banner on Ananya's dashboard and the Launch Summary. */
export function bookingConfirmationText(launch: Pick<Launch, 'bookingAdjusted' | 'bookingVendorName' | 'bookingReasonLabel' | 'bookingExtensionDays'>): string {
  if (!launch.bookingAdjusted) return '';
  const days = launch.bookingExtensionDays || 3;
  const vendor = launch.bookingVendorName || 'the vendor';
  const reason = launch.bookingReasonLabel || 'vendor delay';
  return `✓ Booking window extended ${days} ${days === 1 ? 'day' : 'days'} with ${vendor} — reason: ${reason}. Vendor notified.`;
}
