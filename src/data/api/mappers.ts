import type { ComplianceFlag, Launch, Role, Subtask, Task, TeamMember, TrailEntry, User } from '@/types';
import { formatTrailTime } from './time';

export interface ProfileLite {
  id: string;
  name: string;
  initial: string;
}

export type ProfileLookup = Map<string, ProfileLite>;

function resolveName(id: string | null, profiles: ProfileLookup): string {
  if (!id) return '';
  return profiles.get(id)?.name ?? 'Unknown';
}

// ---- raw row shapes (snake_case, as returned by supabase-js) ----

export interface ProfileRow {
  id: string;
  name: string;
  initial: string;
  email: string;
  role: Role;
  access_tier: User['accessTier'];
  employee_id: string;
  status: User['status'];
  must_change_password: boolean;
}

export interface TaskRow {
  id: number;
  launch_id: number;
  step: number;
  name: string;
  owner_id: string | null;
  status: Task['status'];
  custom: boolean;
  blocks: boolean;
  locked: boolean;
  risk_reason: string;
  risk_comment: string;
  duration_days: number;
  depends_on_task_id: number | null;
  review_status: Task['reviewStatus'];
  review_assignee_id: string | null;
  review_note: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface SubtaskRow {
  id: number;
  task_id: number;
  name: string;
  assignee_id: string | null;
  assigned_by_id: string | null;
  status: Subtask['status'];
  flag_reason: string | null;
  flag_detail: string | null;
  response_note: string | null;
  needs_info: boolean;
  locked: boolean;
  kind: string | null;
}

export interface TeamMemberRow {
  id: number;
  launch_id: number;
  name: string;
  email: string;
  role: TeamMember['role'];
  team_group: TeamMember['group'];
  title: string;
  perm_summary: boolean;
  perm_retro: boolean;
}

export interface ComplianceFlagRow {
  id: number;
  launch_id: number;
  name: string;
  task: string;
  status: ComplianceFlag['status'];
}

export interface TrailEntryRow {
  id: number;
  launch_id: number;
  actor_id: string | null;
  actor_initial: string;
  actor_name: string;
  action: string;
  old_value: string;
  new_value: string;
  task: string;
  created_at: string;
}

export interface LaunchRow {
  id: number;
  name: string;
  category: string;
  description: string;
  closed: boolean;
  closed_at: string | null;
  created_at: string;
  created_by: string | null;
  retro_tags: Record<string, string>;
  retro_saved: boolean;
  packet_submitted: boolean;
  booking_adjusted: boolean;
  booking_vendor_name: string;
  booking_reason_label: string;
  booking_extension_days: number | null;
}

// ---- mappers ----

export function mapProfileRow(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    initial: row.initial,
    email: row.email,
    role: row.role,
    accessTier: row.access_tier,
    employeeId: row.employee_id,
    status: row.status,
    mustChangePassword: row.must_change_password,
  };
}

export function mapTaskRow(row: TaskRow, profiles: ProfileLookup): Task {
  return {
    id: row.id,
    step: row.step,
    name: row.name,
    ownerId: row.owner_id,
    ownerName: resolveName(row.owner_id, profiles),
    status: row.status,
    custom: row.custom,
    blocks: row.blocks,
    locked: row.locked,
    riskReason: row.risk_reason,
    riskComment: row.risk_comment,
    durationDays: row.duration_days,
    dependsOnTaskId: row.depends_on_task_id,
    subtasks: [],
    reviewStatus: row.review_status,
    reviewAssigneeId: row.review_assignee_id,
    reviewAssigneeName: resolveName(row.review_assignee_id, profiles),
    reviewNote: row.review_note,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
  };
}

export function mapSubtaskRow(row: SubtaskRow, profiles: ProfileLookup): Subtask {
  return {
    id: row.id,
    name: row.name,
    assigneeId: row.assignee_id,
    assigneeName: resolveName(row.assignee_id, profiles),
    assignedById: row.assigned_by_id,
    assignedByName: row.assigned_by_id ? resolveName(row.assigned_by_id, profiles) : undefined,
    status: row.status,
    flagReason: row.flag_reason ?? undefined,
    flagDetail: row.flag_detail ?? undefined,
    responseNote: row.response_note ?? undefined,
    needsInfo: row.needs_info,
    locked: row.locked,
    kind: (row.kind as Subtask['kind']) ?? undefined,
  };
}

export function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    group: row.team_group,
    title: row.title,
    permSummary: row.perm_summary,
    permRetro: row.perm_retro,
  };
}

export function mapComplianceFlagRow(row: ComplianceFlagRow): ComplianceFlag {
  return { id: row.id, name: row.name, task: row.task, status: row.status };
}

export function mapTrailEntryRow(row: TrailEntryRow): TrailEntry {
  const createdAt = new Date(row.created_at).getTime();
  return {
    id: row.id,
    actorId: row.actor_id,
    initial: row.actor_initial,
    name: row.actor_name,
    action: row.action,
    old: row.old_value,
    new: row.new_value,
    task: row.task,
    createdAt,
    time: formatTrailTime(createdAt),
  };
}

export function mapLaunchRow(
  row: LaunchRow,
  tasks: Task[],
  team: TeamMember[],
  complianceFlags: ComplianceFlag[],
  trailEntries: TrailEntry[],
): Launch {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    closed: row.closed,
    closedAt: row.closed_at ? new Date(row.closed_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    createdBy: row.created_by,
    tasks,
    complianceFlags,
    trailEntries,
    team,
    retroTags: row.retro_tags ?? {},
    retroSaved: row.retro_saved,
    packetSubmitted: row.packet_submitted,
    bookingAdjusted: row.booking_adjusted,
    bookingVendorName: row.booking_vendor_name,
    bookingReasonLabel: row.booking_reason_label,
    bookingExtensionDays: row.booking_extension_days,
  };
}
