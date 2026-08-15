import { OWNER_ROLE, ROLE_OWNER, type Launch, type Task, type TrailEntry, type User } from '@/types';

/** admin, or the role that OWNER_ROLE maps this task's owner name to */
export function canEditTask(task: Pick<Task, 'owner'>, user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return OWNER_ROLE[task.owner] === user.role;
}

export function canEditSubtaskAssignee(assignee: string, user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return OWNER_ROLE[assignee] === user.role;
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

/** Launches Home: launch_lead/admin see everything, others only launches they're rostered on */
export function visibleLaunches(launches: Launch[], user: User | null | undefined): Launch[] {
  if (isLaunchOwnerUser(user)) return launches;
  if (!user) return [];
  return launches.filter((l) => l.team.some((t) => t.email.toLowerCase() === user.email.toLowerCase()));
}

/**
 * Accountability trail scoping: owners see all, everyone else sees only
 * entries touching their own tasks (per the README), or entries they
 * personally authored. The prototype this ports from actually compared a
 * task *name* to a person's *name* here (`e.task === trailOwnerName`),
 * which could never match — this recreates the evidently-intended behavior
 * instead of that bug, using the task-ownership list it computed but
 * never applied.
 */
export function scopedTrailEntries(launch: Launch, user: User | null | undefined): TrailEntry[] {
  if (isLaunchOwnerUser(user)) return launch.trailEntries;
  if (!user) return [];
  const ownerName = ROLE_OWNER[user.role];
  const myTaskNames = new Set(launch.tasks.filter((t) => t.owner === ownerName).map((t) => t.name));
  const firstName = user.name.split(' ')[0];
  return launch.trailEntries.filter((e) => myTaskNames.has(e.task) || e.name === firstName);
}
