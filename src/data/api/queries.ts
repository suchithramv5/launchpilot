import { supabase } from '@/lib/supabaseClient';
import type { Launch, Task, User } from '@/types';
import {
  mapComplianceFlagRow,
  mapLaunchRow,
  mapProfileRow,
  mapSubtaskRow,
  mapTaskRow,
  mapTeamMemberRow,
  mapTrailEntryRow,
  type ComplianceFlagRow,
  type LaunchRow,
  type ProfileLookup,
  type ProfileRow,
  type SubtaskRow,
  type TaskRow,
  type TeamMemberRow,
  type TrailEntryRow,
} from './mappers';

function rethrow(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function fetchAllProfiles(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  rethrow('fetchAllProfiles', error);
  return ((data ?? []) as ProfileRow[]).map(mapProfileRow);
}

export function buildProfileLookup(profiles: User[]): ProfileLookup {
  return new Map(profiles.map((p) => [p.id, { id: p.id, name: p.name, initial: p.initial }]));
}

/** Light-weight launches for list views (Home / All Launches) — tasks + compliance flags only, no subtasks/team/trail. */
export async function fetchLaunchSummaries(profiles: ProfileLookup): Promise<Launch[]> {
  const { data: launchRows, error: launchError } = await supabase.from('launches').select('*').order('created_at', { ascending: false });
  rethrow('fetchLaunchSummaries (launches)', launchError);
  const launches = (launchRows ?? []) as LaunchRow[];
  if (launches.length === 0) return [];

  const launchIds = launches.map((l) => l.id);
  const [{ data: taskRows, error: taskError }, { data: flagRows, error: flagError }] = await Promise.all([
    supabase.from('tasks').select('*').in('launch_id', launchIds),
    supabase.from('compliance_flags').select('*').in('launch_id', launchIds),
  ]);
  rethrow('fetchLaunchSummaries (tasks)', taskError);
  rethrow('fetchLaunchSummaries (compliance_flags)', flagError);

  const tasksByLaunch = new Map<number, Task[]>();
  for (const row of (taskRows ?? []) as TaskRow[]) {
    const task = mapTaskRow(row, profiles);
    const list = tasksByLaunch.get(row.launch_id) ?? [];
    list.push(task);
    tasksByLaunch.set(row.launch_id, list);
  }

  const flagsByLaunch = new Map<number, ComplianceFlagRow[]>();
  for (const row of (flagRows ?? []) as ComplianceFlagRow[]) {
    const list = flagsByLaunch.get(row.launch_id) ?? [];
    list.push(row);
    flagsByLaunch.set(row.launch_id, list);
  }

  return launches.map((row) =>
    mapLaunchRow(
      row,
      (tasksByLaunch.get(row.id) ?? []).sort((a, b) => a.step - b.step),
      [],
      (flagsByLaunch.get(row.id) ?? []).map(mapComplianceFlagRow),
      [],
    ),
  );
}

/** Full nested fetch for a single launch — everything every dashboard/screen needs. */
export async function fetchLaunchDetail(launchId: number, profiles: ProfileLookup): Promise<Launch | null> {
  const { data: launchRow, error: launchError } = await supabase.from('launches').select('*').eq('id', launchId).maybeSingle();
  rethrow('fetchLaunchDetail (launch)', launchError);
  if (!launchRow) return null;

  const [
    { data: teamRows, error: teamError },
    { data: taskRows, error: taskError },
    { data: flagRows, error: flagError },
    { data: trailRows, error: trailError },
  ] = await Promise.all([
    supabase.from('team_members').select('*').eq('launch_id', launchId),
    supabase.from('tasks').select('*').eq('launch_id', launchId).order('step'),
    supabase.from('compliance_flags').select('*').eq('launch_id', launchId),
    supabase.from('trail_entries').select('*').eq('launch_id', launchId).order('created_at', { ascending: false }),
  ]);
  rethrow('fetchLaunchDetail (team_members)', teamError);
  rethrow('fetchLaunchDetail (tasks)', taskError);
  rethrow('fetchLaunchDetail (compliance_flags)', flagError);
  rethrow('fetchLaunchDetail (trail_entries)', trailError);

  const tasks = ((taskRows ?? []) as TaskRow[]).map((row) => mapTaskRow(row, profiles));
  const taskIds = tasks.map((t) => t.id);

  let subtaskRows: SubtaskRow[] = [];
  if (taskIds.length > 0) {
    const { data, error } = await supabase.from('subtasks').select('*').in('task_id', taskIds);
    rethrow('fetchLaunchDetail (subtasks)', error);
    subtaskRows = (data ?? []) as SubtaskRow[];
  }
  const subtasksByTask = new Map<number, typeof tasks[number]['subtasks']>();
  for (const row of subtaskRows) {
    const list = subtasksByTask.get(row.task_id) ?? [];
    list.push(mapSubtaskRow(row, profiles));
    subtasksByTask.set(row.task_id, list);
  }
  for (const task of tasks) {
    task.subtasks = subtasksByTask.get(task.id) ?? [];
  }

  return mapLaunchRow(
    launchRow as LaunchRow,
    tasks,
    ((teamRows ?? []) as TeamMemberRow[]).map(mapTeamMemberRow),
    ((flagRows ?? []) as ComplianceFlagRow[]).map(mapComplianceFlagRow),
    ((trailRows ?? []) as TrailEntryRow[]).map(mapTrailEntryRow),
  );
}
