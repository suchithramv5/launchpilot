import type { AccessTier, ComplianceFlag, Launch, Subtask, SubtaskStatus, Task, TaskStatus, TeamMember, TrailEntry, User } from '@/types';
import { badgeStatusLabel } from '@/lib/statusLabels';

export interface AppState {
  users: User[];
  launches: Launch[];
  currentUserId: number | null;
}

function timeNow(): string {
  return new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function nextTrailId(launch: Launch): number {
  return (launch.trailEntries.reduce((max, e) => Math.max(max, e.id), 0) || 0) + 1;
}

function pushTrail(launch: Launch, entry: Omit<TrailEntry, 'id' | 'time'>): Launch {
  const trailEntry: TrailEntry = { ...entry, id: nextTrailId(launch), time: timeNow() };
  return { ...launch, trailEntries: [trailEntry, ...launch.trailEntries] };
}

function actorTag(name: string): { initial: string; name: string } {
  const first = name.split(' ')[0];
  return { initial: first[0]?.toUpperCase() ?? '?', name: first };
}

function mapLaunch(state: AppState, launchId: number, fn: (l: Launch) => Launch): AppState {
  return { ...state, launches: state.launches.map((l) => (l.id === launchId ? fn(l) : l)) };
}

function mapTask(launch: Launch, taskId: number, fn: (t: Task) => Task): Launch {
  return { ...launch, tasks: launch.tasks.map((t) => (t.id === taskId ? fn(t) : t)) };
}

function mapSubtask(task: Task, subtaskId: number, fn: (s: Subtask) => Subtask): Task {
  return { ...task, subtasks: task.subtasks.map((s) => (s.id === subtaskId ? fn(s) : s)) };
}

export type Action =
  | { type: 'LOGIN'; userId: number }
  | { type: 'LOGOUT' }
  | { type: 'ADD_USER'; email: string; tier: AccessTier }
  | { type: 'REVOKE_USER'; userId: number }
  | { type: 'RESTORE_USER'; userId: number }
  | { type: 'UPDATE_USER_TIER'; userId: number; tier: AccessTier }
  | { type: 'ADD_LAUNCH'; launch: Launch }
  | { type: 'UPDATE_LAUNCH_DESCRIPTION'; launchId: number; description: string }
  | { type: 'CLOSE_LAUNCH'; launchId: number; actingUserName: string }
  | { type: 'CHANGE_TASK_STATUS'; launchId: number; taskId: number; status: TaskStatus; actingUserName: string }
  | { type: 'CHANGE_TASK_OWNER'; launchId: number; taskId: number; owner: string; actingUserName: string }
  | { type: 'CHANGE_TASK_DURATION'; launchId: number; taskId: number; durationDays: number; actingUserName: string }
  | { type: 'CHANGE_TASK_RISK'; launchId: number; taskId: number; riskReason: string; riskComment: string }
  | { type: 'ADD_TASK'; launchId: number; task: Omit<Task, 'id' | 'step'>; insertAfterTaskId: number | null }
  | { type: 'DELETE_TASK'; launchId: number; taskId: number }
  | { type: 'MARK_TASK_COMPLETE'; launchId: number; taskId: number; actingUserName: string }
  | { type: 'SEND_TO_COMPLIANCE'; launchId: number; taskId: number; assignee: string; actingUserName: string }
  | { type: 'ACKNOWLEDGE_COMPLIANCE_REVIEW'; launchId: number; taskId: number; actingUserName: string }
  | { type: 'REPLY_COMPLIANCE_REVIEW'; launchId: number; taskId: number; note: string; actingUserName: string }
  | { type: 'FLAG_COMPLIANCE_REVIEW'; launchId: number; taskId: number; reason: string; detail: string; actingUserName: string }
  | { type: 'ADD_SUBTASK'; launchId: number; taskId: number; subtask: Subtask }
  | { type: 'CHANGE_SUBTASK_STATUS'; launchId: number; taskId: number; subtaskId: number; status: SubtaskStatus; actingUserName: string }
  | { type: 'HOLD_SUBTASK'; launchId: number; taskId: number; subtaskId: number; actingUserName: string }
  | { type: 'REASSIGN_SUBTASK'; launchId: number; taskId: number; subtaskId: number; newAssignee: string; actingUserName: string }
  | { type: 'SEND_BACK_SUBTASK'; launchId: number; taskId: number; subtaskId: number; note: string; actingUserName: string }
  | { type: 'LOCK_SUBTASK'; launchId: number; taskId: number; subtaskId: number }
  | { type: 'RECALL_SUBTASK'; launchId: number; taskId: number; subtaskId: number }
  | { type: 'SUBMIT_SUBTASK_FLAG'; launchId: number; taskId: number; subtaskId: number; reason: string; detail: string; actingUserName: string }
  | { type: 'RESOLVE_SUBTASK_FLAG'; launchId: number; taskId: number; subtaskId: number; note: string; actingUserName: string }
  | { type: 'RESOLVE_COMPLIANCE_FLAG'; launchId: number; flagId: number; actingUserName: string }
  | { type: 'ADJUST_VENDOR_BOOKING'; launchId: number; vendorName: string; reasonLabel: string; extensionDays: number; actingUserName: string }
  | { type: 'UPDATE_ROSTER'; launchId: number; team: TeamMember[] }
  | { type: 'SET_RETRO_TAG'; launchId: number; milestone: string; tag: string }
  | { type: 'SAVE_RETRO'; launchId: number }
  | { type: 'POST_STATUS_UPDATE'; launchId: number; text: string; actingUserName: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN': {
      const user = state.users.find((u) => u.id === action.userId);
      if (!user || user.status === 'revoked') return state;
      return { ...state, currentUserId: action.userId };
    }
    case 'LOGOUT':
      return { ...state, currentUserId: null };

    case 'ADD_USER': {
      const email = action.email.trim().toLowerCase();
      if (!email || state.users.some((u) => u.email.toLowerCase() === email)) return state;
      const namePart = email.split('@')[0].replace(/[._]+/g, ' ');
      const name = namePart.replace(/\b\w/g, (c) => c.toUpperCase());
      const nextId = (state.users.reduce((max, u) => Math.max(max, u.id), 0) || 0) + 1;
      const role = action.tier === 'owner' ? 'launch_lead' : action.tier === 'external' ? 'marketing' : 'marketing';
      const newUser: User = {
        id: nextId,
        name,
        initial: name.trim()[0]?.toUpperCase() ?? '?',
        email,
        role,
        accessTier: action.tier,
        employeeId: 'EMP-' + (1000 + nextId),
        status: 'active',
      };
      return { ...state, users: [...state.users, newUser] };
    }
    case 'REVOKE_USER':
      return { ...state, users: state.users.map((u) => (u.id === action.userId ? { ...u, status: 'revoked' } : u)) };
    case 'RESTORE_USER':
      return { ...state, users: state.users.map((u) => (u.id === action.userId ? { ...u, status: 'active' } : u)) };
    case 'UPDATE_USER_TIER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.userId
            ? { ...u, accessTier: action.tier, role: action.tier === 'owner' ? 'launch_lead' : u.role === 'admin' ? 'admin' : 'marketing' }
            : u,
        ),
      };

    case 'ADD_LAUNCH':
      return { ...state, launches: [...state.launches, action.launch] };

    case 'UPDATE_LAUNCH_DESCRIPTION':
      return mapLaunch(state, action.launchId, (l) => ({ ...l, description: action.description }));

    case 'CLOSE_LAUNCH':
      return mapLaunch(state, action.launchId, (l) =>
        pushTrail({ ...l, closed: true, closedAt: Date.now() }, { ...actorTag(action.actingUserName), action: 'marked the launch complete', old: 'Open', new: 'Closed', task: l.name }),
      );

    case 'CHANGE_TASK_STATUS':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const now = Date.now();
        const newStatus = action.status;
        const next = mapTask(l, action.taskId, (t) => {
          const wasNotStarted = t.status === 'not_started';
          const wasCompleted: boolean = t.status === 'completed';
          const patch: Partial<Task> = { status: newStatus };
          if (wasNotStarted && newStatus !== 'not_started' && !t.startedAt) patch.startedAt = now;
          if (newStatus === 'completed') patch.completedAt = now;
          else if (wasCompleted) patch.completedAt = null;
          return { ...t, ...patch };
        });
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'changed status', old: badgeStatusLabel(task.status), new: badgeStatusLabel(action.status), task: task.name });
      });

    case 'CHANGE_TASK_OWNER':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, owner: action.owner }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'reassigned owner', old: task.owner, new: action.owner, task: task.name });
      });

    case 'CHANGE_TASK_DURATION':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, durationDays: action.durationDays }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'changed duration', old: `${task.durationDays} days`, new: `${action.durationDays} days`, task: task.name });
      });

    case 'CHANGE_TASK_RISK':
      return mapLaunch(state, action.launchId, (l) => mapTask(l, action.taskId, (t) => ({ ...t, riskReason: action.riskReason, riskComment: action.riskComment })));

    case 'ADD_TASK':
      return mapLaunch(state, action.launchId, (l) => {
        const nextId = (l.tasks.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
        const newTask: Task = { ...action.task, id: nextId, step: 0, dependsOnTaskId: action.insertAfterTaskId };
        const idx = action.insertAfterTaskId ? l.tasks.findIndex((t) => t.id === action.insertAfterTaskId) : -1;
        const nextTasks = idx >= 0 ? [...l.tasks.slice(0, idx + 1), newTask, ...l.tasks.slice(idx + 1)] : [...l.tasks, newTask];
        return { ...l, tasks: nextTasks.map((t, i) => ({ ...t, step: i + 1 })) };
      });

    case 'DELETE_TASK':
      return mapLaunch(state, action.launchId, (l) => ({ ...l, tasks: l.tasks.filter((t) => t.id !== action.taskId).map((t, i) => ({ ...t, step: i + 1 })) }));

    case 'MARK_TASK_COMPLETE':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, status: 'completed' }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'marked task completed', old: badgeStatusLabel(task.status), new: 'Completed', task: task.name });
      });

    case 'SEND_TO_COMPLIANCE':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, locked: true, reviewStatus: 'pending', reviewAssignee: action.assignee, reviewNote: '' }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'sent to compliance for review', old: '-', new: action.assignee, task: task.name });
      });

    case 'ACKNOWLEDGE_COMPLIANCE_REVIEW':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, reviewStatus: 'acknowledged' }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'acknowledged compliance review', old: 'Pending', new: 'Acknowledged', task: task.name });
      });

    case 'REPLY_COMPLIANCE_REVIEW':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, reviewStatus: 'pending', reviewNote: action.note }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'replied to compliance', old: '-', new: action.note || '(no note)', task: task.name });
      });

    case 'FLAG_COMPLIANCE_REVIEW':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        if (!task) return l;
        const next = mapTask(l, action.taskId, (t) => ({ ...t, reviewStatus: 'flagged', reviewNote: action.detail, riskReason: action.reason, riskComment: action.detail }));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'flagged compliance review', old: '-', new: action.reason, task: task.name });
      });

    case 'ADD_SUBTASK':
      return mapLaunch(state, action.launchId, (l) => mapTask(l, action.taskId, (t) => ({ ...t, subtasks: [...t.subtasks, action.subtask] })));

    case 'CHANGE_SUBTASK_STATUS':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        const subtask = task?.subtasks.find((s) => s.id === action.subtaskId);
        if (!task || !subtask) return l;
        const next = mapTask(l, action.taskId, (t) => mapSubtask(t, action.subtaskId, (s) => ({ ...s, status: action.status })));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'changed subtask status', old: subtask.status, new: action.status, task: subtask.name });
      });

    case 'HOLD_SUBTASK':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        const subtask = task?.subtasks.find((s) => s.id === action.subtaskId);
        if (!task || !subtask) return l;
        return pushTrail(l, { ...actorTag(action.actingUserName), action: 'kept the subtask', old: '-', new: '-', task: subtask.name });
      });

    case 'REASSIGN_SUBTASK':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        const subtask = task?.subtasks.find((s) => s.id === action.subtaskId);
        if (!task || !subtask) return l;
        const next = mapTask(l, action.taskId, (t) => mapSubtask(t, action.subtaskId, (s) => ({ ...s, assignee: action.newAssignee })));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'reassigned subtask', old: subtask.assignee, new: action.newAssignee, task: subtask.name });
      });

    case 'SEND_BACK_SUBTASK':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        const subtask = task?.subtasks.find((s) => s.id === action.subtaskId);
        if (!task || !subtask) return l;
        const next = mapTask(l, action.taskId, (t) => mapSubtask(t, action.subtaskId, (s) => ({ ...s, responseNote: action.note, needsInfo: false })));
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'sent a note back to owner', old: '-', new: action.note || '(no note)', task: subtask.name });
      });

    case 'LOCK_SUBTASK':
      return mapLaunch(state, action.launchId, (l) => mapTask(l, action.taskId, (t) => mapSubtask(t, action.subtaskId, (s) => ({ ...s, locked: true }))));

    case 'RECALL_SUBTASK':
      return mapLaunch(state, action.launchId, (l) => mapTask(l, action.taskId, (t) => mapSubtask(t, action.subtaskId, (s) => ({ ...s, locked: false }))));

    case 'SUBMIT_SUBTASK_FLAG':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        const subtask = task?.subtasks.find((s) => s.id === action.subtaskId);
        if (!task || !subtask) return l;
        const next = mapTask(l, action.taskId, (t) =>
          mapSubtask(t, action.subtaskId, (s) => ({ ...s, status: 'flagged', flagReason: action.reason, flagDetail: action.detail })),
        );
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'flagged a concern', old: '-', new: action.reason, task: subtask.name });
      });

    case 'RESOLVE_SUBTASK_FLAG':
      return mapLaunch(state, action.launchId, (l) => {
        const task = l.tasks.find((t) => t.id === action.taskId);
        const subtask = task?.subtasks.find((s) => s.id === action.subtaskId);
        if (!task || !subtask) return l;
        const next = mapTask(l, action.taskId, (t) =>
          mapSubtask(t, action.subtaskId, (s) => ({ ...s, status: 'open', responseNote: action.note, flagReason: undefined, flagDetail: undefined })),
        );
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'responded to a flagged subtask', old: 'Flagged', new: action.note || '(no note)', task: subtask.name });
      });

    case 'RESOLVE_COMPLIANCE_FLAG':
      return mapLaunch(state, action.launchId, (l) => {
        const flag = l.complianceFlags.find((f) => f.id === action.flagId);
        if (!flag) return l;
        const next = { ...l, complianceFlags: l.complianceFlags.map((f) => (f.id === action.flagId ? { ...f, status: 'resolved' as ComplianceFlag['status'] } : f)) };
        return pushTrail(next, { ...actorTag(action.actingUserName), action: 'resolved compliance flag', old: 'Open', new: 'Resolved', task: flag.task });
      });

    case 'ADJUST_VENDOR_BOOKING':
      return mapLaunch(state, action.launchId, (l) => {
        const next: Launch = {
          ...l,
          bookingAdjusted: true,
          bookingVendorName: action.vendorName,
          bookingReasonLabel: action.reasonLabel,
          bookingExtensionDays: action.extensionDays,
        };
        return pushTrail(next, {
          ...actorTag(action.actingUserName),
          action: 'adjusted vendor booking',
          old: `${action.vendorName} — ${action.reasonLabel}`,
          new: `+${action.extensionDays} ${action.extensionDays === 1 ? 'day' : 'days'}`,
          task: 'Vendor booking',
        });
      });

    case 'UPDATE_ROSTER':
      return mapLaunch(state, action.launchId, (l) => ({ ...l, team: action.team }));

    case 'SET_RETRO_TAG':
      return mapLaunch(state, action.launchId, (l) => ({ ...l, retroTags: { ...l.retroTags, [action.milestone]: action.tag } }));

    case 'SAVE_RETRO':
      return mapLaunch(state, action.launchId, (l) => ({ ...l, retroSaved: true }));

    case 'POST_STATUS_UPDATE':
      return mapLaunch(state, action.launchId, (l) => pushTrail(l, { ...actorTag(action.actingUserName), action: 'posted a status update', old: '-', new: action.text, task: l.name }));

    default:
      return state;
  }
}
