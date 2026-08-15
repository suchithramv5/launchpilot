import { useCallback, useMemo } from 'react';
import type { Launch, Subtask, SubtaskStatus, Task, TaskStatus, TeamMember } from '@/types';
import { useAppData } from './AppDataContext';
import { useAuth } from './AuthContext';

export function useLaunches(): Launch[] {
  const { state } = useAppData();
  return state.launches;
}

export function useLaunch(launchId: number | undefined): Launch | undefined {
  const launches = useLaunches();
  return useMemo(() => launches.find((l) => l.id === launchId), [launches, launchId]);
}

export function useAddLaunch() {
  const { dispatch } = useAppData();
  return useCallback((launch: Launch) => dispatch({ type: 'ADD_LAUNCH', launch }), [dispatch]);
}

export function useLaunchActions(launchId: number) {
  const { dispatch } = useAppData();
  const { currentUser } = useAuth();
  const actingUserName = currentUser?.name ?? 'Someone';

  return useMemo(
    () => ({
      updateDescription: (description: string) => dispatch({ type: 'UPDATE_LAUNCH_DESCRIPTION', launchId, description }),
      closeLaunch: () => dispatch({ type: 'CLOSE_LAUNCH', launchId, actingUserName }),

      changeTaskStatus: (taskId: number, status: TaskStatus) => dispatch({ type: 'CHANGE_TASK_STATUS', launchId, taskId, status, actingUserName }),
      changeTaskOwner: (taskId: number, owner: string) => dispatch({ type: 'CHANGE_TASK_OWNER', launchId, taskId, owner, actingUserName }),
      changeTaskDuration: (taskId: number, durationDays: number) => dispatch({ type: 'CHANGE_TASK_DURATION', launchId, taskId, durationDays, actingUserName }),
      changeTaskRisk: (taskId: number, riskReason: string, riskComment: string) => dispatch({ type: 'CHANGE_TASK_RISK', launchId, taskId, riskReason, riskComment }),
      addTask: (task: Omit<Task, 'id' | 'step'>, insertAfterTaskId: number | null) => dispatch({ type: 'ADD_TASK', launchId, task, insertAfterTaskId }),
      deleteTask: (taskId: number) => dispatch({ type: 'DELETE_TASK', launchId, taskId }),
      markTaskComplete: (taskId: number) => dispatch({ type: 'MARK_TASK_COMPLETE', launchId, taskId, actingUserName }),
      sendToCompliance: (taskId: number, assignee: string) => dispatch({ type: 'SEND_TO_COMPLIANCE', launchId, taskId, assignee, actingUserName }),
      acknowledgeComplianceReview: (taskId: number) => dispatch({ type: 'ACKNOWLEDGE_COMPLIANCE_REVIEW', launchId, taskId, actingUserName }),
      replyComplianceReview: (taskId: number, note: string) => dispatch({ type: 'REPLY_COMPLIANCE_REVIEW', launchId, taskId, note, actingUserName }),
      flagComplianceReview: (taskId: number, reason: string, detail: string) => dispatch({ type: 'FLAG_COMPLIANCE_REVIEW', launchId, taskId, reason, detail, actingUserName }),

      addSubtask: (taskId: number, subtask: Subtask) => dispatch({ type: 'ADD_SUBTASK', launchId, taskId, subtask }),
      changeSubtaskStatus: (taskId: number, subtaskId: number, status: SubtaskStatus) =>
        dispatch({ type: 'CHANGE_SUBTASK_STATUS', launchId, taskId, subtaskId, status, actingUserName }),
      holdSubtask: (taskId: number, subtaskId: number) => dispatch({ type: 'HOLD_SUBTASK', launchId, taskId, subtaskId, actingUserName }),
      reassignSubtask: (taskId: number, subtaskId: number, newAssignee: string) =>
        dispatch({ type: 'REASSIGN_SUBTASK', launchId, taskId, subtaskId, newAssignee, actingUserName }),
      sendBackSubtask: (taskId: number, subtaskId: number, note: string) =>
        dispatch({ type: 'SEND_BACK_SUBTASK', launchId, taskId, subtaskId, note, actingUserName }),
      lockSubtask: (taskId: number, subtaskId: number) => dispatch({ type: 'LOCK_SUBTASK', launchId, taskId, subtaskId }),
      recallSubtask: (taskId: number, subtaskId: number) => dispatch({ type: 'RECALL_SUBTASK', launchId, taskId, subtaskId }),

      submitSubtaskFlag: (taskId: number, subtaskId: number, reason: string, detail: string) =>
        dispatch({ type: 'SUBMIT_SUBTASK_FLAG', launchId, taskId, subtaskId, reason, detail, actingUserName }),
      resolveSubtaskFlag: (taskId: number, subtaskId: number, note: string) => dispatch({ type: 'RESOLVE_SUBTASK_FLAG', launchId, taskId, subtaskId, note, actingUserName }),

      resolveComplianceFlag: (flagId: number) => dispatch({ type: 'RESOLVE_COMPLIANCE_FLAG', launchId, flagId, actingUserName }),

      adjustVendorBooking: (vendorName: string, reasonLabel: string, extensionDays: number) =>
        dispatch({ type: 'ADJUST_VENDOR_BOOKING', launchId, vendorName, reasonLabel, extensionDays, actingUserName }),

      updateRoster: (team: TeamMember[]) => dispatch({ type: 'UPDATE_ROSTER', launchId, team }),

      setRetroTag: (milestone: string, tag: string) => dispatch({ type: 'SET_RETRO_TAG', launchId, milestone, tag }),
      saveRetro: () => dispatch({ type: 'SAVE_RETRO', launchId }),

      postStatusUpdate: (text: string) => dispatch({ type: 'POST_STATUS_UPDATE', launchId, text, actingUserName }),
    }),
    [dispatch, launchId, actingUserName],
  );
}
