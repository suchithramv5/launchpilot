import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLaunch } from '@/state/CreateLaunchContext';
import { OWNERS, type Task } from '@/types';
import { checklistParseError, parseChecklistFile, type ParsedTask } from '@/lib/parseChecklistFile';
import { PrimaryButton, Select, TextInput } from '@/components/ui';
import { AddTaskModal } from '@/components/AddTaskModal';

export function ChecklistStep() {
  const { draft, setTasks, addTask, updateTask, deleteTask } = useCreateLaunch();
  const navigate = useNavigate();
  const [showAddTask, setShowAddTask] = useState(false);

  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedTask[] | null>(null);

  const timelineDays = draft.tasks.reduce((sum, t) => sum + (t.durationDays || 1), 0);

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
    let idCounter = (draft.tasks.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
    let previousId: number | null = draft.tasks[draft.tasks.length - 1]?.id ?? null;
    const newTasks: Task[] = parsed.map((p) => {
      const id = idCounter++;
      const task: Task = {
        id,
        step: 0,
        name: p.name,
        owner: p.owner,
        status: 'not_started',
        custom: true,
        blocks: true,
        locked: false,
        riskReason: '',
        riskComment: '',
        durationDays: p.durationDays ?? 3,
        dependsOnTaskId: previousId,
        subtasks: p.subtasks.map((s, si) => ({ id: si + 1, name: s.name, assignee: s.assignee, status: 'open' as const })),
        reviewStatus: 'none',
        reviewAssignee: '',
        reviewNote: '',
        startedAt: null,
        completedAt: null,
      };
      previousId = id;
      return task;
    });
    setTasks([...draft.tasks, ...newTasks]);
    setParsed(null);
    setFileName('');
  }

  function discardParsed() {
    setParsed(null);
    setFileName('');
    setError('');
  }

  return (
    <div className="mx-auto w-full max-w-[880px] p-8 pb-20">
      <div onClick={() => navigate('/launches/new')} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to launch details
      </div>
      <div className="mb-1 text-[22px] font-bold">Launch readiness checklist</div>
      <div className="mb-7 text-sm text-ink-tertiary">
        Set up the launch readiness checklist and assign owners for &quot;{draft.name || 'this launch'}&quot;.
      </div>

      <div className="mb-5 rounded-card border border-border-input bg-page p-4">
        <div className="mb-1 text-[12.5px] font-bold">Upload your own launch checklist</div>
        <div className="mb-2.5 text-[11.5px] text-ink-muted">
          Numbered items like &quot;1. Task name — 5 days&quot; with optional indented &quot;- Sub-item&quot; lines — reads and builds tasks with owners assigned by keyword.
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
                    <Select value={p.owner} onChange={(e) => updateParsedField(i, { owner: e.target.value })} className="py-1.5 text-xs">
                      {OWNERS.map((o) => (
                        <option key={o} value={o}>
                          {o}
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
                      ↳ {s.name} {s.durationDays ? `— ${s.durationDays} days` : ''} <span className="text-ink-muted">({s.assignee})</span>
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
        {draft.tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[11px] font-bold text-ink-tertiary">{t.step}</div>
            <div className="flex-1 text-sm font-semibold">{t.name}</div>
            {t.custom && <div className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">custom</div>}
            <Select value={t.owner} onChange={(e) => updateTask(t.id, { owner: e.target.value })} className="w-[150px] py-1.5">
              {OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
            <TextInput
              type="number"
              min={1}
              value={t.durationDays}
              onChange={(e) => updateTask(t.id, { durationDays: Number(e.target.value) || 1 })}
              className="w-14 py-1.5 text-center"
              title="Days required"
            />
            <div className="w-8 text-xs text-ink-muted">days</div>
            <div onClick={() => deleteTask(t.id)} className="cursor-pointer text-[15px] text-ink-faint">
              ✕
            </div>
          </div>
        ))}
        <div
          onClick={() => setShowAddTask(true)}
          className="m-2.5 flex cursor-pointer items-center gap-2.5 rounded-control border border-dashed border-[#c7c2b8] px-4 py-3.5 text-[13px] font-semibold text-ink-tertiary"
        >
          <div className="text-base leading-none">+</div> add a brand-specific task
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={() => navigate('/launches/new')} className="px-5.5 py-3">
          Done
        </PrimaryButton>
      </div>

      {showAddTask && <AddTaskModal tasks={draft.tasks} onClose={() => setShowAddTask(false)} onConfirm={addTask} />}
    </div>
  );
}
