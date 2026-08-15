import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Launch, Task, TeamMember } from '@/types';
import { DEFAULT_CHECKLIST_TEMPLATE } from '@/data/checklistTemplate';
import { useAddLaunch, useLaunches } from './LaunchDataContext';

function buildDefaultTasks(): Task[] {
  return DEFAULT_CHECKLIST_TEMPLATE.map((s, i) => ({
    id: i + 1,
    step: i + 1,
    name: s.name,
    owner: s.owner,
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
    reviewAssignee: '',
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
  createLaunch: () => number;
}

const CreateLaunchContext = createContext<CreateLaunchContextValue | null>(null);

export function CreateLaunchProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<DraftState>({ name: '', description: '', tasks: buildDefaultTasks(), team: [] });
  const addLaunch = useAddLaunch();
  const launches = useLaunches();
  const navigate = useNavigate();

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

  const createLaunch = useCallback((): number => {
    const nextId = (launches.reduce((max, l) => Math.max(max, l.id), 0) || 0) + 1;
    const launch: Launch = {
      id: nextId,
      name: draft.name.trim() || 'Untitled launch',
      category: 'Beauty & personal care',
      description: draft.description,
      closed: false,
      closedAt: null,
      createdAt: Date.now(),
      tasks: draft.tasks,
      complianceFlags: [],
      trailEntries: [],
      team: draft.team,
      retroTags: {},
      retroSaved: false,
      packetSubmitted: false,
      bookingAdjusted: false,
      bookingVendorName: '',
      bookingReasonLabel: '',
      bookingExtensionDays: null,
    };
    addLaunch(launch);
    return nextId;
  }, [addLaunch, draft, launches]);

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
