import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLaunch } from '@/state/CreateLaunchContext';
import { useAppData } from '@/state/AppDataContext';
import { useAuth } from '@/state/AuthContext';
import type { Task, User } from '@/types';
import { PrimaryButton } from '@/components/ui';
import { ChecklistBuilder, type BulkImportTask } from '@/components/ChecklistBuilder';

export function ChecklistStep() {
  const { draft, setTasks, addTask, updateTask, deleteTask } = useCreateLaunch();
  const { profiles } = useAppData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const ownerOptions = useMemo<User[]>(() => {
    const emails = new Set(draft.team.map((t) => t.email.toLowerCase()));
    const merged = new Map<string, User>();
    for (const p of profiles) {
      if (emails.has(p.email.toLowerCase()) || p.role === 'launch_lead' || p.role === 'admin') merged.set(p.id, p);
    }
    return Array.from(merged.values());
  }, [draft.team, profiles]);

  function handleBulkImport(newTasks: BulkImportTask[]) {
    let idCounter = (draft.tasks.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
    let previousId: number | null = draft.tasks[draft.tasks.length - 1]?.id ?? null;
    const tasks: Task[] = newTasks.map((p) => {
      const id = idCounter++;
      const task: Task = {
        id,
        step: 0,
        name: p.name,
        ownerId: p.ownerId,
        ownerName: p.ownerName || currentUser?.name || '',
        status: 'not_started',
        custom: true,
        blocks: true,
        locked: false,
        riskReason: '',
        riskComment: '',
        durationDays: p.durationDays,
        dependsOnTaskId: previousId,
        subtasks: p.subtasks.map((s, si) => ({ id: si + 1, name: s.name, assigneeId: s.assigneeId, assigneeName: s.assigneeName || currentUser?.name || '', status: 'open' as const })),
        reviewStatus: 'none',
        reviewAssigneeId: null,
        reviewAssigneeName: '',
        reviewNote: '',
        startedAt: null,
        completedAt: null,
      };
      previousId = id;
      return task;
    });
    setTasks([...draft.tasks, ...tasks]);
  }

  return (
    <div className="mx-auto w-full max-w-[880px] p-8 pb-20">
      <div onClick={() => navigate('/launches/new')} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to launch details
      </div>

      <ChecklistBuilder
        launchName={draft.name || 'this launch'}
        tasks={draft.tasks}
        ownerOptions={ownerOptions}
        defaultOwnerId={currentUser?.id ?? null}
        onAddTask={addTask}
        onRenameTask={(taskId, name) => updateTask(taskId, { name })}
        onChangeOwner={(taskId, ownerId, ownerName) => updateTask(taskId, { ownerId, ownerName })}
        onChangeDuration={(taskId, durationDays) => updateTask(taskId, { durationDays })}
        onDeleteTask={deleteTask}
        onBulkImport={handleBulkImport}
      />

      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={() => navigate('/launches/new')} className="px-5.5 py-3">
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}
