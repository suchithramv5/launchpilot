import { useEffect, useState } from 'react';
import type { Task, User } from '@/types';
import { checklistParseError, parseChecklistFile, type ParsedTask } from '@/lib/parseChecklistFile';
import { PrimaryButton, Select, TextInput } from '@/components/ui';
import { AddTaskModal } from '@/components/AddTaskModal';

/** Owner-resolved shape of a parsed task, ready to hand to onBulkImport. */
export interface BulkImportTask {
  name: string;
  ownerId: string | null;
  ownerName: string;
  durationDays: number;
  subtasks: { name: string; assigneeId: string | null; assigneeName: string }[];
}

export function ChecklistBuilder({
  launchName,
  tasks,
  ownerOptions,
  defaultOwnerId,
  onAddTask,
  onRenameTask,
  onChangeOwner,
  onChangeDuration,
  onDeleteTask,
  onBulkImport,
}: {
  launchName: string;
  tasks: Task[];
  ownerOptions: User[];
  defaultOwnerId: string | null;
  onAddTask: (task: Omit<Task, 'id' | 'step'>, insertAfterTaskId: number | null) => void;
  onRenameTask: (taskId: number, name: string) => void;
  onChangeOwner: (taskId: number, ownerId: string, ownerName: string) => void;
  onChangeDuration: (taskId: number, durationDays: number) => void;
  onDeleteTask: (taskId: number) => void;
  onBulkImport: (tasks: BulkImportTask[]) => void;
}) {
  const [showAddTask, setShowAddTask] = useState(false);

  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedTask[] | null>(null);
  const [parsedOwnerIds, setParsedOwnerIds] = useState<string[]>([]);

  const sorted = [...tasks].sort((a, b) => a.step - b.step);
  const timelineDays = sorted.reduce((sum, t) => sum + (t.durationDays || 1), 0);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError('');
    setParsed(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const rows = parseChecklistFile(text);
      const err = checklistParseError(text, rows);
      setLoading(false);
      if (err) {
        setError(err);
        return;
      }
      setParsed(rows);
      setParsedOwnerIds(rows.map(() => defaultOwnerId ?? ''));
    };
    reader.onerror = () => {
      setLoading(false);
      setError('Could not read that file.');
    };
    reader.readAsText(file);
  }

  function updateParsedField(index: number, patch: Partial<ParsedTask>) {
    if (!parsed) return;
    setParsed(parsed.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function useParsedChecklist() {
    if (!parsed) return;
    const newTasks: BulkImportTask[] = parsed.map((p, i) => {
      const ownerId = parsedOwnerIds[i] || defaultOwnerId;
      const owner = ownerOptions.find((o) => o.id === ownerId);
      return {
        name: p.name,
        ownerId,
        ownerName: owner?.name ?? '',
        durationDays: p.durationDays ?? 3,
        subtasks: p.subtasks.map((s) => ({ name: s.name, assigneeId: ownerId, assigneeName: owner?.name ?? '' })),
      };
    });
    onBulkImport(newTasks);
    setParsed(null);
    setParsedOwnerIds([]);
    setFileName('');
  }

  function discardParsed() {
    setParsed(null);
    setParsedOwnerIds([]);
    setFileName('');
    setError('');
  }

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Launch readiness checklist</div>
      <div className="mb-7 text-sm text-ink-tertiary">Set up the launch readiness checklist and assign owners for &quot;{launchName}&quot;.</div>

      <div className="mb-5 rounded-card border border-border-input bg-page p-4">
        <div className="mb-1 text-[12.5px] font-bold">Upload your own launch checklist</div>
        <div className="mb-2.5 text-[11.5px] text-ink-muted">
          Numbered items like &quot;1. Task name — 5 days&quot; with optional indented &quot;- Sub-item&quot; lines — reads and builds tasks, defaulted to you as owner until you reassign them.
        </div>
        <input type="file" accept=".txt,.md,text/plain" onChange={handleFile} className="text-[12.5px]" />
        {loading && <div className="mt-2 text-[12.5px] text-ink-muted">Reading &quot;{fileName}&quot;…</div>}
        {error && <div className="mt-2 text-[12.5px] text-status-blocked-text">{error}</div>}
        {parsed && (
          <>
            <div className="mt-3 overflow-hidden rounded-control border border-border bg-white">
              {parsed.map((p, i) => (
                <div key={i} className="border-b border-border-divider px-3 py-2.5 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <TextInput value={p.name} onChange={(e) => updateParsedField(i, { name: e.target.value })} className="flex-1 py-1.5 text-[12.5px] font-semibold" />
                    <Select
                      value={parsedOwnerIds[i] ?? ''}
                      onChange={(e) => setParsedOwnerIds((ids) => ids.map((id, idx) => (idx === i ? e.target.value : id)))}
                      className="py-1.5 text-xs"
                    >
                      {ownerOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </Select>
                    <TextInput
                      type="number"
                      min={1}
                      value={p.durationDays ?? 3}
                      onChange={(e) => updateParsedField(i, { durationDays: Number(e.target.value) || 1 })}
                      className="w-14 py-1.5 text-center text-xs"
                      title="Days required"
                    />
                  </div>
                  {p.subtasks.map((s, si) => (
                    <div key={si} className="mt-1.5 ml-4 text-xs text-ink-secondary">
                      ↳ {s.name} {s.durationDays ? `— ${s.durationDays} days` : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex gap-2">
              <PrimaryButton onClick={useParsedChecklist} className="px-3.5 py-2 text-[12.5px]">
                Use this checklist
              </PrimaryButton>
              <button onClick={discardParsed} className="rounded-control border border-border-input px-3.5 py-2 text-[12.5px] font-semibold">
                Discard
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-bold">Launch readiness checklist</div>
        <div className="flex items-center gap-2">
          <div
            className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-[#f3f1ec] px-3 py-1.5 text-xs font-bold text-ink-faint"
            title="Coming soon"
          >
            <span>✨</span>
            <span>Suggest tasks with AI (coming soon)</span>
          </div>
          <div className="rounded-full bg-status-ontrack-bg px-2.5 py-1 text-xs font-semibold text-status-ontrack-text">Est. {timelineDays}-day timeline</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
        {sorted.map((t) => (
          <ChecklistTaskRow
            key={t.id}
            task={t}
            ownerOptions={ownerOptions}
            onRenameTask={onRenameTask}
            onChangeOwner={onChangeOwner}
            onChangeDuration={onChangeDuration}
            onDeleteTask={onDeleteTask}
          />
        ))}
        <div
          onClick={() => setShowAddTask(true)}
          className="m-2.5 flex cursor-pointer items-center gap-2.5 rounded-control border border-dashed border-[#c7c2b8] px-4 py-3.5 text-[13px] font-semibold text-ink-tertiary"
        >
          <div className="text-base leading-none">+</div> add a brand-specific task
        </div>
      </div>

      {showAddTask && <AddTaskModal tasks={tasks} ownerOptions={ownerOptions} onClose={() => setShowAddTask(false)} onConfirm={onAddTask} />}
    </div>
  );
}

function ChecklistTaskRow({
  task,
  ownerOptions,
  onRenameTask,
  onChangeOwner,
  onChangeDuration,
  onDeleteTask,
}: {
  task: Task;
  ownerOptions: User[];
  onRenameTask: (taskId: number, name: string) => void;
  onChangeOwner: (taskId: number, ownerId: string, ownerName: string) => void;
  onChangeDuration: (taskId: number, durationDays: number) => void;
  onDeleteTask: (taskId: number) => void;
}) {
  const [name, setName] = useState(task.name);
  const [duration, setDuration] = useState(task.durationDays);

  useEffect(() => setName(task.name), [task.id, task.name]);
  useEffect(() => setDuration(task.durationDays), [task.id, task.durationDays]);

  return (
    <div className="flex items-center gap-3 border-b border-border-divider px-4 py-3.5 last:border-b-0">
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[11px] font-bold text-ink-tertiary">{task.step}</div>
      <TextInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed && trimmed !== task.name) onRenameTask(task.id, trimmed);
          else setName(task.name);
        }}
        className="flex-1 py-1.5 text-sm font-semibold"
      />
      {task.custom && <div className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">custom</div>}
      <Select
        value={task.ownerId ?? ''}
        onChange={(e) => {
          const owner = ownerOptions.find((o) => o.id === e.target.value);
          if (owner) onChangeOwner(task.id, owner.id, owner.name);
        }}
        className="w-[150px] py-1.5"
      >
        {task.ownerId && !ownerOptions.some((o) => o.id === task.ownerId) && <option value={task.ownerId}>{task.ownerName}</option>}
        {ownerOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
      <TextInput
        type="number"
        min={1}
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value) || 1)}
        onBlur={() => {
          if (duration !== task.durationDays) onChangeDuration(task.id, duration);
        }}
        className="w-14 py-1.5 text-center"
        title="Days required"
      />
      <div className="w-8 text-xs text-ink-muted">days</div>
      <div onClick={() => onDeleteTask(task.id)} className="cursor-pointer text-[15px] text-ink-faint">
        ✕
      </div>
    </div>
  );
}
