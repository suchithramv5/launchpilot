import { useCallback, useEffect, useMemo } from 'react';
import type { Launch, Subtask, SubtaskStatus, Task, TaskStatus, User } from '@/types';
import * as mutations from '@/data/api/mutations';
import { useAppData } from './AppDataContext';
import { useAuth } from './AuthContext';

export function useLaunches(): Launch[] {
  const { launches } = useAppData();
  return launches;
}

/**
 * Real people eligible to be a task/subtask owner on this launch: everyone on
 * its roster, plus every launch_lead/admin account (they have universal
 * launch access regardless of roster membership).
 */
export function useLaunchRosterProfiles(launch: Launch | undefined): User[] {
  const { profiles } = useAppData();
  return useMemo(() => {
    if (!launch) return [];
    const emails = new Set(launch.team.map((t) => t.email.toLowerCase()));
    const merged = new Map<string, User>();
    for (const p of profiles) {
      if (emails.has(p.email.toLowerCase()) || p.role === 'launch_lead' || p.role === 'admin') merged.set(p.id, p);
    }
    return Array.from(merged.values());
  }, [launch, profiles]);
}

export function useLaunch(launchId: number | undefined): Launch | undefined {
  const { currentLaunch, currentLaunchId, loadLaunch } = useAppData();

  useEffect(() => {
    if (launchId != null && launchId !== currentLaunchId) {
      loadLaunch(launchId);
    }
  }, [launchId, currentLaunchId, loadLaunch]);

  if (launchId == null || currentLaunchId !== launchId) return undefined;
  return currentLaunch ?? undefined;
}

export function useLaunchActions(launchId: number) {
  const { currentLaunch, refetchCurrentLaunch, refetchLaunches } = useAppData();
  const { currentUser } = useAuth();

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      await fn();
      await Promise.all([refetchCurrentLaunch(), refetchLaunches()]);
    },
    [refetchCurrentLaunch, refetchLaunches],
  );

  const findTask = useCallback((taskId: number) => currentLaunch?.tasks.find((t) => t.id === taskId), [currentLaunch]);
  const findSubtask = useCallback(
    (taskId: number, subtaskId: number): Subtask | undefined => findTask(taskId)?.subtasks.find((s) => s.id === subtaskId),
    [findTask],
  );

  return useMemo(
    () => ({
      updateDescription: (description: string) => run(() => mutations.updateLaunchDescription(launchId, description)),
      closeLaunch: () => {
        if (!currentUser || !currentLaunch) return Promise.resolve();
        return run(() => mutations.closeLaunch(launchId, currentLaunch.name, currentUser));
      },

      changeTaskStatus: (taskId: number, status: TaskStatus) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.changeTaskStatus(launchId, task, status, currentUser));
      },
      changeTaskOwner: (taskId: number, ownerId: string, ownerName: string) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.changeTaskOwner(launchId, task, ownerId, ownerName, currentUser));
      },
      renameTask: (taskId: number, name: string) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.renameTask(launchId, task, name, currentUser));
      },
      changeTaskDuration: (taskId: number, durationDays: number) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.changeTaskDuration(launchId, task, durationDays, currentUser));
      },
      changeTaskRisk: (taskId: number, riskReason: string, riskComment: string) => run(() => mutations.changeTaskRisk(taskId, riskReason, riskComment)),
      addTask: (task: Omit<Task, 'id' | 'step'>, insertAfterTaskId: number | null) =>
        run(() =>
          mutations.addTask(
            launchId,
            currentLaunch?.tasks ?? [],
            { name: task.name, ownerId: task.ownerId, status: task.status, custom: task.custom, blocks: task.blocks, durationDays: task.durationDays },
            insertAfterTaskId,
          ),
        ),
      deleteTask: (taskId: number) => run(() => mutations.deleteTask(currentLaunch?.tasks ?? [], taskId)),
      bulkAddTasks: (newTasks: mutations.BulkTaskInput[]) => run(() => mutations.bulkAddTasks(launchId, currentLaunch?.tasks ?? [], newTasks)),
      markTaskComplete: (taskId: number) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.markTaskComplete(launchId, task, currentUser));
      },
      sendToCompliance: (taskId: number, assigneeId: string, assigneeName: string) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.sendToCompliance(launchId, task, assigneeId, assigneeName, currentUser));
      },
      acknowledgeComplianceReview: (taskId: number) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.acknowledgeComplianceReview(launchId, task, currentUser));
      },
      replyComplianceReview: (taskId: number, note: string) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.replyComplianceReview(launchId, task, note, currentUser));
      },
      flagComplianceReview: (taskId: number, reason: string, detail: string) => {
        const task = findTask(taskId);
        if (!task || !currentUser) return Promise.resolve();
        return run(() => mutations.flagComplianceReview(launchId, task, reason, detail, currentUser));
      },

      addSubtask: (taskId: number, subtask: mutations.NewSubtaskInput) => run(() => mutations.addSubtask(taskId, subtask)),
      changeSubtaskStatus: (taskId: number, subtaskId: number, status: SubtaskStatus) => {
        const task = findTask(taskId);
        const subtask = findSubtask(taskId, subtaskId);
        if (!task || !subtask || !currentUser) return Promise.resolve();
        return run(() => mutations.changeSubtaskStatus(launchId, task, subtask, status, currentUser));
      },
      holdSubtask: (taskId: number, subtaskId: number) => {
        const subtask = findSubtask(taskId, subtaskId);
        if (!subtask || !currentUser) return Promise.resolve();
        return run(() => mutations.holdSubtask(launchId, subtask, currentUser));
      },
      reassignSubtask: (taskId: number, subtaskId: number, newAssigneeId: string, newAssigneeName: string) => {
        const subtask = findSubtask(taskId, subtaskId);
        if (!subtask || !currentUser) return Promise.resolve();
        return run(() => mutations.reassignSubtask(launchId, subtask, newAssigneeId, newAssigneeName, currentUser));
      },
      sendBackSubtask: (taskId: number, subtaskId: number, note: string) => {
        const subtask = findSubtask(taskId, subtaskId);
        if (!subtask || !currentUser) return Promise.resolve();
        return run(() => mutations.sendBackSubtask(launchId, subtask, note, currentUser));
      },
      lockSubtask: (_taskId: number, subtaskId: number) => run(() => mutations.lockSubtask(subtaskId)),
      recallSubtask: (_taskId: number, subtaskId: number) => run(() => mutations.recallSubtask(subtaskId)),

      submitSubtaskFlag: (taskId: number, subtaskId: number, reason: string, detail: string) => {
        const subtask = findSubtask(taskId, subtaskId);
        if (!subtask || !currentUser) return Promise.resolve();
        return run(() => mutations.submitSubtaskFlag(launchId, subtask, reason, detail, currentUser));
      },
      resolveSubtaskFlag: (taskId: number, subtaskId: number, note: string) => {
        const subtask = findSubtask(taskId, subtaskId);
        if (!subtask || !currentUser) return Promise.resolve();
        return run(() => mutations.resolveSubtaskFlag(launchId, subtask, note, currentUser));
      },

      resolveComplianceFlag: (flagId: number) => {
        const flag = currentLaunch?.complianceFlags.find((f) => f.id === flagId);
        if (!flag || !currentUser) return Promise.resolve();
        return run(() => mutations.resolveComplianceFlag(launchId, flagId, flag.task, currentUser));
      },

      adjustVendorBooking: (vendorName: string, reasonLabel: string, extensionDays: number) => {
        if (!currentUser) return Promise.resolve();
        return run(() => mutations.adjustVendorBooking(launchId, vendorName, reasonLabel, extensionDays, currentUser));
      },

      updateRoster: (team: Parameters<typeof mutations.replaceRoster>[1]) => run(() => mutations.replaceRoster(launchId, team)),

      setRetroTag: (milestone: string, tag: string) => {
        const nextTags = { ...(currentLaunch?.retroTags ?? {}), [milestone]: tag };
        return run(() => mutations.setRetroTag(launchId, nextTags));
      },
      saveRetro: () => run(() => mutations.saveRetro(launchId)),

      postStatusUpdate: (text: string) => {
        if (!currentUser || !currentLaunch) return Promise.resolve();
        return run(() => mutations.postStatusUpdate(launchId, currentLaunch.name, text, currentUser));
      },
    }),
    [run, launchId, findTask, findSubtask, currentUser, currentLaunch],
  );
}
