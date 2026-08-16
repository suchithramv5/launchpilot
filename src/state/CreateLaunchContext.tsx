import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Task, TeamMember } from '@/types';
import { DEFAULT_CHECKLIST_TEMPLATE } from '@/data/checklistTemplate';
import { createLaunchWithTasksAndTeam, type DraftTaskInput } from '@/data/api/mutations';
import { useAuth } from './AuthContext';
import { useAppData } from './AppDataContext';

function buildDefaultTasks(ownerId: string, ownerName: string): Task[] {
  return DEFAULT_CHECKLIST_TEMPLATE.map((s, i) => ({
    id: i + 1,
    step: i + 1,
    name: s.name,
    ownerId,
    ownerName,
    status: 'not_started',
    custom: false,
    blocks: s.blocks,
    locked: false,
    riskReason: '',
    riskComment: '',
    durationDays: s.durationDays,
    dependsOnTaskId: i > 0 ? i : null,
    subtasks: [],
    reviewStatus: 'none' as const,
    reviewAssigneeId: null,
    reviewAssigneeName: '',
    reviewNote: '',
    startedAt: null,
    completedAt: null,
  }));
}

interface DraftState {
  name: string;
  description: string;
  tasks: Task[];
  team: TeamMember[];
}

interface CreateLaunchContextValue {
  draft: DraftState;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'step'>, insertAfterTaskId: number | null) => void;
  updateTask: (taskId: number, patch: Partial<Task>) => void;
  deleteTask: (taskId: number) => void;
  setTeam: (team: TeamMember[]) => void;
  createLaunch: () => Promise<number>;
}

const CreateLaunchContext = createContext<CreateLaunchContextValue | null>(null);

export function CreateLaunchProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { refetchLaunches } = useAppData();
  const [draft, setDraft] = useState<DraftState>({ name: '', description: '', tasks: [], team: [] });

  // currentUser can still be loading (profiles fetch in flight) the instant this
  // provider mounts, so seed the default checklist reactively rather than only
  // at the useState initializer — but only once, so it never overwrites the
  // user's own edits if they clear the checklist down to zero tasks later.
  const seededDefaultTasks = useRef(false);
  useEffect(() => {
    if (currentUser && !seededDefaultTasks.current) {
      seededDefaultTasks.current = true;
      setDraft((d) => (d.tasks.length === 0 ? { ...d, tasks: buildDefaultTasks(currentUser.id, currentUser.name) } : d));
    }
  }, [currentUser]);

  const renumber = (tasks: Task[]): Task[] => tasks.map((t, i) => ({ ...t, step: i + 1 }));

  const setName = useCallback((name: string) => setDraft((d) => ({ ...d, name })), []);
  const setDescription = useCallback((description: string) => setDraft((d) => ({ ...d, description })), []);
  const setTasks = useCallback((tasks: Task[]) => setDraft((d) => ({ ...d, tasks: renumber(tasks) })), []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'step'>, insertAfterTaskId: number | null) => {
    setDraft((d) => {
      const nextId = (d.tasks.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
      const newTask: Task = { ...task, id: nextId, step: 0, dependsOnTaskId: insertAfterTaskId };
      const idx = insertAfterTaskId ? d.tasks.findIndex((t) => t.id === insertAfterTaskId) : -1;
      const next = idx >= 0 ? [...d.tasks.slice(0, idx + 1), newTask, ...d.tasks.slice(idx + 1)] : [...d.tasks, newTask];
      return { ...d, tasks: renumber(next) };
    });
  }, []);

  const updateTask = useCallback((taskId: number, patch: Partial<Task>) => {
    setDraft((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }));
  }, []);

  const deleteTask = useCallback((taskId: number) => {
    setDraft((d) => ({ ...d, tasks: renumber(d.tasks.filter((t) => t.id !== taskId)) }));
  }, []);

  const setTeam = useCallback((team: TeamMember[]) => setDraft((d) => ({ ...d, team })), []);

  const createLaunch = useCallback(async (): Promise<number> => {
    const taskInputs: DraftTaskInput[] = draft.tasks.map((t) => ({
      localId: t.id,
      name: t.name,
      ownerId: t.ownerId,
      durationDays: t.durationDays,
      blocks: t.blocks,
      custom: t.custom,
      dependsOnLocalId: t.dependsOnTaskId,
      subtasks: t.subtasks.map((s) => ({ name: s.name, assigneeId: s.assigneeId })),
    }));
    const launchId = await createLaunchWithTasksAndTeam(draft.name, draft.description, taskInputs, draft.team, currentUser?.id ?? '');
    await refetchLaunches();
    return launchId;
  }, [draft, currentUser, refetchLaunches]);

  const value = useMemo(
    () => ({ draft, setName, setDescription, setTasks, addTask, updateTask, deleteTask, setTeam, createLaunch }),
    [draft, setName, setDescription, setTasks, addTask, updateTask, deleteTask, setTeam, createLaunch],
  );

  return <CreateLaunchContext.Provider value={value}>{children}</CreateLaunchContext.Provider>;
}

export function useCreateLaunch(): CreateLaunchContextValue {
  const ctx = useContext(CreateLaunchContext);
  if (!ctx) throw new Error('useCreateLaunch must be used within CreateLaunchProvider');
  return ctx;
}

export { buildDefaultTasks };
