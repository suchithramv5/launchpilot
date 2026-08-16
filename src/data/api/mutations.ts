import { supabase } from '@/lib/supabaseClient';
import type { AccessTier, Role, Subtask, SubtaskStatus, Task, TaskStatus, TeamMember, User } from '@/types';
import { badgeStatusLabel } from '@/lib/statusLabels';

function rethrow(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function actorFields(user: User) {
  const first = user.name.split(' ')[0];
  return { actor_id: user.id, actor_initial: first[0]?.toUpperCase() ?? '?', actor_name: first };
}

async function insertTrail(
  launchId: number,
  actingUser: User,
  fields: { action: string; old: string; new: string; task: string },
): Promise<void> {
  const { error } = await supabase.from('trail_entries').insert({
    launch_id: launchId,
    ...actorFields(actingUser),
    action: fields.action,
    old_value: fields.old,
    new_value: fields.new,
    task: fields.task,
  });
  rethrow('insertTrail', error);
}

// ---- launch-level ----

export async function updateLaunchDescription(launchId: number, description: string): Promise<void> {
  const { error } = await supabase.from('launches').update({ description }).eq('id', launchId);
  rethrow('updateLaunchDescription', error);
}

export async function closeLaunch(launchId: number, launchName: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('launches').update({ closed: true, closed_at: new Date().toISOString() }).eq('id', launchId);
  rethrow('closeLaunch', error);
  await insertTrail(launchId, actingUser, { action: 'marked the launch complete', old: 'Open', new: 'Closed', task: launchName });
}

export async function adjustVendorBooking(
  launchId: number,
  vendorName: string,
  reasonLabel: string,
  extensionDays: number,
  actingUser: User,
): Promise<void> {
  const { error } = await supabase
    .from('launches')
    .update({ booking_adjusted: true, booking_vendor_name: vendorName, booking_reason_label: reasonLabel, booking_extension_days: extensionDays })
    .eq('id', launchId);
  rethrow('adjustVendorBooking', error);
  await insertTrail(launchId, actingUser, {
    action: 'adjusted vendor booking',
    old: `${vendorName} — ${reasonLabel}`,
    new: `+${extensionDays} ${extensionDays === 1 ? 'day' : 'days'}`,
    task: 'Vendor booking',
  });
}

export async function setRetroTag(launchId: number, retroTags: Record<string, string>): Promise<void> {
  const { error } = await supabase.from('launches').update({ retro_tags: retroTags }).eq('id', launchId);
  rethrow('setRetroTag', error);
}

export async function saveRetro(launchId: number): Promise<void> {
  const { error } = await supabase.from('launches').update({ retro_saved: true }).eq('id', launchId);
  rethrow('saveRetro', error);
}

export async function postStatusUpdate(launchId: number, launchName: string, text: string, actingUser: User): Promise<void> {
  await insertTrail(launchId, actingUser, { action: 'posted a status update', old: '-', new: text, task: launchName });
}

// ---- tasks ----

export async function changeTaskStatus(launchId: number, task: Task, status: TaskStatus, actingUser: User): Promise<void> {
  const now = new Date().toISOString();
  const wasNotStarted = task.status === 'not_started';
  const wasCompleted: boolean = task.status === 'completed';
  const patch: Record<string, unknown> = { status };
  if (wasNotStarted && status !== 'not_started' && !task.startedAt) patch.started_at = now;
  if (status === 'completed') patch.completed_at = now;
  else if (wasCompleted) patch.completed_at = null;

  const { error } = await supabase.from('tasks').update(patch).eq('id', task.id);
  rethrow('changeTaskStatus', error);
  await insertTrail(launchId, actingUser, { action: 'changed status', old: badgeStatusLabel(task.status), new: badgeStatusLabel(status), task: task.name });
}

export async function changeTaskOwner(launchId: number, task: Task, newOwnerId: string, newOwnerName: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('tasks').update({ owner_id: newOwnerId }).eq('id', task.id);
  rethrow('changeTaskOwner', error);
  await insertTrail(launchId, actingUser, { action: 'reassigned owner', old: task.ownerName || '-', new: newOwnerName, task: task.name });
}

export async function renameTask(launchId: number, task: Task, name: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('tasks').update({ name }).eq('id', task.id);
  rethrow('renameTask', error);
  await insertTrail(launchId, actingUser, { action: 'renamed task', old: task.name, new: name, task: name });
}

export async function changeTaskDuration(launchId: number, task: Task, durationDays: number, actingUser: User): Promise<void> {
  const { error } = await supabase.from('tasks').update({ duration_days: durationDays }).eq('id', task.id);
  rethrow('changeTaskDuration', error);
  await insertTrail(launchId, actingUser, { action: 'changed duration', old: `${task.durationDays} days`, new: `${durationDays} days`, task: task.name });
}

export async function changeTaskRisk(taskId: number, riskReason: string, riskComment: string): Promise<void> {
  const { error } = await supabase.from('tasks').update({ risk_reason: riskReason, risk_comment: riskComment }).eq('id', taskId);
  rethrow('changeTaskRisk', error);
}

export interface NewTaskInput {
  name: string;
  ownerId: string | null;
  status: TaskStatus;
  custom: boolean;
  blocks: boolean;
  durationDays: number;
}

/** Adds a task after `insertAfterTaskId` (or at the end if null), renumbering steps for the launch's current task list. */
export async function addTask(launchId: number, currentTasks: Task[], input: NewTaskInput, insertAfterTaskId: number | null): Promise<void> {
  const sorted = [...currentTasks].sort((a, b) => a.step - b.step);
  const idx = insertAfterTaskId ? sorted.findIndex((t) => t.id === insertAfterTaskId) : -1;
  const insertAtStep = idx >= 0 ? sorted[idx].step + 1 : sorted.length + 1;

  const toShift = sorted.filter((t) => t.step >= insertAtStep);
  if (toShift.length > 0) {
    await Promise.all(toShift.map((t) => supabase.from('tasks').update({ step: t.step + 1 }).eq('id', t.id)));
  }

  const { error } = await supabase.from('tasks').insert({
    launch_id: launchId,
    step: insertAtStep,
    name: input.name,
    owner_id: input.ownerId,
    status: input.status,
    custom: input.custom,
    blocks: input.blocks,
    duration_days: input.durationDays,
    depends_on_task_id: insertAfterTaskId,
  });
  rethrow('addTask', error);
}

export interface BulkTaskInput {
  name: string;
  ownerId: string | null;
  durationDays: number;
  subtasks: { name: string; assigneeId: string | null }[];
}

/** Appends a batch of tasks (e.g. from a parsed checklist upload) after the launch's current tasks, chained in order. */
export async function bulkAddTasks(launchId: number, currentTasks: Task[], newTasks: BulkTaskInput[]): Promise<void> {
  const sorted = [...currentTasks].sort((a, b) => a.step - b.step);
  let step = sorted.length + 1;
  let previousTaskId: number | null = sorted[sorted.length - 1]?.id ?? null;

  for (const t of newTasks) {
    const dependsOn: number | null = previousTaskId;
    const { data: taskRow, error } = await supabase
      .from('tasks')
      .insert({
        launch_id: launchId,
        step: step++,
        name: t.name,
        owner_id: t.ownerId,
        custom: true,
        blocks: true,
        duration_days: t.durationDays,
        depends_on_task_id: dependsOn,
      })
      .select('id')
      .single();
    rethrow('bulkAddTasks', error);
    const realId: number = (taskRow as { id: number }).id;
    previousTaskId = realId;

    if (t.subtasks.length > 0) {
      const { error: subError } = await supabase
        .from('subtasks')
        .insert(t.subtasks.map((s) => ({ task_id: realId, name: s.name, assignee_id: s.assigneeId, status: 'open' })));
      rethrow('bulkAddTasks (subtasks)', subError);
    }
  }
}

export async function deleteTask(currentTasks: Task[], taskId: number): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  rethrow('deleteTask', error);

  const remaining = currentTasks.filter((t) => t.id !== taskId).sort((a, b) => a.step - b.step);
  await Promise.all(remaining.map((t, i) => (t.step !== i + 1 ? supabase.from('tasks').update({ step: i + 1 }).eq('id', t.id) : null)));
}

export async function markTaskComplete(launchId: number, task: Task, actingUser: User): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', task.id);
  rethrow('markTaskComplete', error);
  await insertTrail(launchId, actingUser, { action: 'marked task completed', old: badgeStatusLabel(task.status), new: 'Completed', task: task.name });
}

export async function sendToCompliance(launchId: number, task: Task, assigneeId: string, assigneeName: string, actingUser: User): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ locked: true, review_status: 'pending', review_assignee_id: assigneeId, review_note: '' })
    .eq('id', task.id);
  rethrow('sendToCompliance', error);
  await insertTrail(launchId, actingUser, { action: 'sent to compliance for review', old: '-', new: assigneeName, task: task.name });
}

export async function acknowledgeComplianceReview(launchId: number, task: Task, actingUser: User): Promise<void> {
  const { error } = await supabase.from('tasks').update({ review_status: 'acknowledged' }).eq('id', task.id);
  rethrow('acknowledgeComplianceReview', error);
  await insertTrail(launchId, actingUser, { action: 'acknowledged compliance review', old: 'Pending', new: 'Acknowledged', task: task.name });
}

export async function replyComplianceReview(launchId: number, task: Task, note: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('tasks').update({ review_status: 'pending', review_note: note }).eq('id', task.id);
  rethrow('replyComplianceReview', error);
  await insertTrail(launchId, actingUser, { action: 'replied to compliance', old: '-', new: note || '(no note)', task: task.name });
}

export async function flagComplianceReview(launchId: number, task: Task, reason: string, detail: string, actingUser: User): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ review_status: 'flagged', review_note: detail, risk_reason: reason, risk_comment: detail })
    .eq('id', task.id);
  rethrow('flagComplianceReview', error);
  await insertTrail(launchId, actingUser, { action: 'flagged compliance review', old: '-', new: reason, task: task.name });
}

// ---- subtasks ----

export interface NewSubtaskInput {
  name: string;
  assigneeId: string;
}

export async function addSubtask(taskId: number, input: NewSubtaskInput): Promise<void> {
  const { error } = await supabase.from('subtasks').insert({ task_id: taskId, name: input.name, assignee_id: input.assigneeId, status: 'open' });
  rethrow('addSubtask', error);
}

export async function changeSubtaskStatus(launchId: number, task: Task, subtask: Subtask, status: SubtaskStatus, actingUser: User): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ status }).eq('id', subtask.id);
  rethrow('changeSubtaskStatus', error);
  await insertTrail(launchId, actingUser, { action: 'changed subtask status', old: subtask.status, new: status, task: subtask.name });
}

export async function holdSubtask(launchId: number, subtask: Subtask, actingUser: User): Promise<void> {
  await insertTrail(launchId, actingUser, { action: 'kept the subtask', old: '-', new: '-', task: subtask.name });
}

export async function reassignSubtask(launchId: number, subtask: Subtask, newAssigneeId: string, newAssigneeName: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ assignee_id: newAssigneeId }).eq('id', subtask.id);
  rethrow('reassignSubtask', error);
  await insertTrail(launchId, actingUser, { action: 'reassigned subtask', old: subtask.assigneeName || '-', new: newAssigneeName, task: subtask.name });
}

export async function sendBackSubtask(launchId: number, subtask: Subtask, note: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ response_note: note, needs_info: false }).eq('id', subtask.id);
  rethrow('sendBackSubtask', error);
  await insertTrail(launchId, actingUser, { action: 'sent a note back to owner', old: '-', new: note || '(no note)', task: subtask.name });
}

export async function lockSubtask(subtaskId: number): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ locked: true }).eq('id', subtaskId);
  rethrow('lockSubtask', error);
}

export async function recallSubtask(subtaskId: number): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ locked: false }).eq('id', subtaskId);
  rethrow('recallSubtask', error);
}

export async function submitSubtaskFlag(launchId: number, subtask: Subtask, reason: string, detail: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ status: 'flagged', flag_reason: reason, flag_detail: detail }).eq('id', subtask.id);
  rethrow('submitSubtaskFlag', error);
  await insertTrail(launchId, actingUser, { action: 'flagged a concern', old: '-', new: reason, task: subtask.name });
}

export async function resolveSubtaskFlag(launchId: number, subtask: Subtask, note: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ status: 'open', response_note: note, flag_reason: null, flag_detail: null }).eq('id', subtask.id);
  rethrow('resolveSubtaskFlag', error);
  await insertTrail(launchId, actingUser, { action: 'responded to a flagged subtask', old: 'Flagged', new: note || '(no note)', task: subtask.name });
}

// ---- compliance flags ----

export async function resolveComplianceFlag(launchId: number, flagId: number, flagTask: string, actingUser: User): Promise<void> {
  const { error } = await supabase.from('compliance_flags').update({ status: 'resolved' }).eq('id', flagId);
  rethrow('resolveComplianceFlag', error);
  await insertTrail(launchId, actingUser, { action: 'resolved compliance flag', old: 'Open', new: 'Resolved', task: flagTask });
}

// ---- roster ----

export async function replaceRoster(launchId: number, team: TeamMember[]): Promise<void> {
  const { error: deleteError } = await supabase.from('team_members').delete().eq('launch_id', launchId);
  rethrow('replaceRoster (delete)', deleteError);
  if (team.length === 0) return;
  const { error: insertError } = await supabase.from('team_members').insert(
    team.map((m) => ({
      launch_id: launchId,
      name: m.name,
      email: m.email,
      role: m.role === 'external' ? 'marketing' : m.role,
      team_group: m.group,
      title: m.title,
      perm_summary: m.permSummary,
      perm_retro: m.permRetro,
    })),
  );
  rethrow('replaceRoster (insert)', insertError);
}

// ---- launch creation ----

export interface DraftTaskInput {
  localId: number;
  name: string;
  ownerId: string | null;
  durationDays: number;
  blocks: boolean;
  custom: boolean;
  dependsOnLocalId: number | null;
  subtasks: { name: string; assigneeId: string | null }[];
}

/** Creates a launch plus its checklist tasks (with dependency chain + subtasks) and roster, in one flow. Returns the new launch id. */
export async function createLaunchWithTasksAndTeam(
  name: string,
  description: string,
  tasks: DraftTaskInput[],
  team: TeamMember[],
  createdBy: string,
): Promise<number> {
  const { data: launchRow, error: launchError } = await supabase
    .from('launches')
    .insert({ name: name.trim() || 'Untitled launch', description, created_by: createdBy })
    .select('id')
    .single();
  rethrow('createLaunch (launch)', launchError);
  const launchId = (launchRow as { id: number }).id;

  const idMap = new Map<number, number>();
  let step = 1;
  for (const t of tasks) {
    const { data: taskRow, error: taskError } = await supabase
      .from('tasks')
      .insert({ launch_id: launchId, step: step++, name: t.name, owner_id: t.ownerId, custom: t.custom, blocks: t.blocks, duration_days: t.durationDays })
      .select('id')
      .single();
    rethrow('createLaunch (task)', taskError);
    const realId = (taskRow as { id: number }).id;
    idMap.set(t.localId, realId);

    if (t.subtasks.length > 0) {
      const { error: subError } = await supabase
        .from('subtasks')
        .insert(t.subtasks.map((s) => ({ task_id: realId, name: s.name, assignee_id: s.assigneeId, status: 'open' })));
      rethrow('createLaunch (subtasks)', subError);
    }
  }

  const dependencyUpdates = tasks.filter((t) => t.dependsOnLocalId != null && idMap.has(t.dependsOnLocalId));
  await Promise.all(
    dependencyUpdates.map((t) => supabase.from('tasks').update({ depends_on_task_id: idMap.get(t.dependsOnLocalId!) }).eq('id', idMap.get(t.localId))),
  );

  if (team.length > 0) {
    const { error: teamError } = await supabase.from('team_members').insert(
      team.map((m) => ({
        launch_id: launchId,
        name: m.name,
        email: m.email,
        role: m.role === 'external' ? 'marketing' : m.role,
        team_group: m.group,
        title: m.title,
        perm_summary: m.permSummary,
        perm_retro: m.permRetro,
      })),
    );
    rethrow('createLaunch (team)', teamError);
  }

  return launchId;
}

// ---- admin ----

export async function createPendingInvite(email: string, role: Role, accessTier: AccessTier, invitedBy: string): Promise<void> {
  const { error } = await supabase.from('pending_invites').upsert({ email: email.toLowerCase(), role, access_tier: accessTier, invited_by: invitedBy });
  rethrow('createPendingInvite', error);
}

export async function revokeUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'revoked' }).eq('id', userId);
  rethrow('revokeUser', error);
}

export async function restoreUser(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
  rethrow('restoreUser', error);
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  const accessTier: AccessTier = role === 'launch_lead' || role === 'admin' ? 'owner' : 'member';
  const { error } = await supabase.from('profiles').update({ role, access_tier: accessTier }).eq('id', userId);
  rethrow('updateUserRole', error);
}
