import type { Launch, Subtask, Task, TrailEntry, User } from '@/types';

/** The task's assigned owner, or admin — the real per-account edit gate (Row Level Security enforces this server-side too). */
export function canEditTask(task: Pick<Task, 'ownerId'>, user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || task.ownerId === user.id;
}

export function canEditSubtaskAssignee(subtask: Pick<Subtask, 'assigneeId'>, user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || subtask.assigneeId === user.id;
}

export function isLaunchOwnerUser(user: User | null | undefined): boolean {
  return !!user && (user.role === 'launch_lead' || user.role === 'admin');
}

export function canAccessAdmin(user: User | null | undefined): boolean {
  return !!user && (user.role === 'admin' || user.role === 'launch_lead');
}

export function currentRosterEntry(launch: Launch, user: User | null | undefined) {
  if (!user) return undefined;
  return launch.team.find((t) => t.email.toLowerCase() === user.email.toLowerCase());
}

export function canViewSummary(launch: Launch, user: User | null | undefined): boolean {
  if (isLaunchOwnerUser(user)) return true;
  const entry = currentRosterEntry(launch, user);
  return !!entry?.permSummary;
}

export function canViewRetro(launch: Launch, user: User | null | undefined): boolean {
  if (!launch.closed) return false;
  if (isLaunchOwnerUser(user)) return true;
  const entry = currentRosterEntry(launch, user);
  return !!entry?.permRetro;
}

/**
 * Launches Home filtering. In practice `useLaunches()` already only returns
 * RLS-visible rows, so this is a defense-in-depth restatement of the same
 * rule, not the primary enforcement — the database is.
 */
export function visibleLaunches(launches: Launch[], user: User | null | undefined): Launch[] {
  if (isLaunchOwnerUser(user)) return launches;
  if (!user) return [];
  return launches.filter((l) => l.team.some((t) => t.email.toLowerCase() === user.email.toLowerCase()));
}

/**
 * Trail entries are already scoped server-side by the `trail_entries` RLS
 * policy (owner/admin see all; others see only entries on tasks they own or
 * that they authored) — this just exposes that same rows-as-fetched list,
 * plus whether the current view is a restricted one (for the UI notice).
 */
export function scopedTrailEntries(launch: Launch, _user: User | null | undefined): TrailEntry[] {
  return launch.trailEntries;
}

export function isTrailScoped(user: User | null | undefined): boolean {
  return !isLaunchOwnerUser(user);
}
