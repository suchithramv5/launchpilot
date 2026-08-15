export type Role = 'launch_lead' | 'compliance' | 'upstream_ops' | 'marketing' | 'admin';

export type AccessTier = 'owner' | 'member' | 'external';

export type UserStatus = 'active' | 'revoked';

export interface User {
  id: number;
  name: string;
  initial: string;
  email: string;
  role: Role;
  accessTier: AccessTier;
  employeeId: string;
  status: UserStatus;
}

export type TaskStatus = 'not_started' | 'on track' | 'at risk' | 'blocked' | 'completed';

export type SubtaskStatus = 'open' | 'in_progress' | 'closed' | 'flagged';

export interface Subtask {
  id: number;
  name: string;
  assignee: string;
  assignedBy?: string;
  status: SubtaskStatus;
  flagReason?: string;
  flagDetail?: string;
  responseNote?: string;
  needsInfo?: boolean;
  locked?: boolean;
  kind?: 'compliance' | 'general';
  parentSubtaskId?: number | null;
}

export type ReviewStatus = 'none' | 'pending' | 'acknowledged' | 'flagged';

export interface Task {
  id: number;
  step: number;
  name: string;
  owner: string;
  status: TaskStatus;
  custom: boolean;
  blocks: boolean;
  locked: boolean;
  riskReason: string;
  riskComment: string;
  durationDays: number;
  dependsOnTaskId: number | null;
  subtasks: Subtask[];
  reviewStatus: ReviewStatus;
  reviewAssignee: string;
  reviewNote: string;
  /** stamped the first time status leaves 'not_started' */
  startedAt: number | null;
  /** stamped when status becomes 'completed'; cleared if moved back off */
  completedAt: number | null;
}

export type TeamGroup = 'leadership' | 'stakeholder' | 'team' | 'external';

export type TeamMemberFunction = Role | 'external';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: TeamMemberFunction;
  group: TeamGroup;
  title: string;
  permSummary: boolean;
  permRetro: boolean;
}

export type ComplianceFlagStatus = 'open' | 'resolved';

export interface ComplianceFlag {
  id: number;
  name: string;
  task: string;
  status: ComplianceFlagStatus;
}

export interface TrailEntry {
  id: number;
  initial: string;
  name: string;
  action: string;
  old: string;
  new: string;
  task: string;
  time: string;
}

export interface Launch {
  id: number;
  name: string;
  category: string;
  description: string;
  closed: boolean;
  closedAt: number | null;
  createdAt: number;
  tasks: Task[];
  complianceFlags: ComplianceFlag[];
  trailEntries: TrailEntry[];
  team: TeamMember[];
  retroTags: Record<string, string>;
  retroSaved: boolean;
  packetSubmitted: boolean;
  /** vendor-booking adjustment: reflects only the latest adjustment; full history lives in trailEntries */
  bookingAdjusted: boolean;
  bookingVendorName: string;
  bookingReasonLabel: string;
  bookingExtensionDays: number | null;
}

export const OWNER_ROLE: Record<string, Role> = {
  Priya: 'launch_lead',
  Rohan: 'compliance',
  Ananya: 'upstream_ops',
  Karan: 'marketing',
};

export const ROLE_OWNER: Record<string, string> = {
  launch_lead: 'Priya',
  compliance: 'Rohan',
  upstream_ops: 'Ananya',
  marketing: 'Karan',
};

export const ROLE_LABELS: Record<Role, string> = {
  launch_lead: 'NPD manager · launch lead',
  compliance: 'Compliance',
  upstream_ops: 'Upstream ops',
  marketing: 'Marketing (view only)',
  admin: 'Admin',
};

export const TIER_LABELS: Record<AccessTier, string> = {
  owner: 'Launch Owner',
  member: 'Team Member',
  external: 'External',
};

export const GROUP_LABELS: Record<TeamGroup, string> = {
  leadership: 'Leadership',
  stakeholder: 'Stakeholder',
  team: 'Team member',
  external: 'External',
};

export const ROOT_CAUSES = ['upstream dependency', 'vendor delay', 'resourcing', 'external vendor', 'scope change', 'other'];

export const FLAG_REASONS = ['claim not substantiated', 'ingredient restricted', 'packaging claim mismatch', 'other'];

export const OWNERS = ['Priya', 'Rohan', 'Ananya', 'Karan'];
