import { useState } from 'react';
import type { Task } from '@/types';
import { OWNERS } from '@/types';
import { PrimaryButton, SecondaryButton, Select, TextInput } from '@/components/ui';

export function AddTaskModal({
  tasks,
  onClose,
  onConfirm,
}: {
  tasks: Task[];
  onClose: () => void;
  onConfirm: (task: Omit<Task, 'id' | 'step'>, insertAfterTaskId: number | null) => void;
}) {
  const [name, setName] = useState('');
  const [insertAfter, setInsertAfter] = useState<number | null>(tasks.length ? tasks[tasks.length - 1].id : null);
  const [owner, setOwner] = useState(OWNERS[0]);
  const [durationDays, setDurationDays] = useState(3);
  const [blocks, setBlocks] = useState(true);

  function confirm() {
    if (!name.trim()) return;
    onConfirm(
      {
        name: name.trim(),
        owner,
        status: 'not_started',
        custom: true,
        blocks,
        locked: false,
        riskReason: '',
        riskComment: '',
        durationDays,
        dependsOnTaskId: insertAfter,
        subtasks: [],
        reviewStatus: 'none',
        reviewAssignee: '',
        reviewNote: '',
        startedAt: null,
        completedAt: null,
      },
      insertAfter,
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="w-[460px] rounded-modal border border-border bg-white p-6 shadow-modal">
        <div className="mb-1 text-[17px] font-bold">Add a task</div>
        <div className="mb-5 text-[13px] text-ink-tertiary">Custom tasks don&apos;t count against your checklist coverage score.</div>

        <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Task name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Influencer seeding" className="mb-4" />

        <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Insert after</div>
        <Select
          value={insertAfter ?? ''}
          onChange={(e) => setInsertAfter(e.target.value ? Number(e.target.value) : null)}
          className="mb-4 w-full"
        >
          <option value="">(start of checklist)</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>

        <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Owner</div>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="mb-4 w-full">
          {OWNERS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>

        <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Time required (days)</div>
        <TextInput type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value) || 1)} className="mb-5" />

        <div onClick={() => setBlocks((b) => !b)} className="mb-5.5 flex cursor-pointer items-center justify-between rounded-control border border-border-divider p-3">
          <div>
            <div className="text-[13px] font-semibold">Blocks downstream tasks</div>
            <div className="text-[11px] text-ink-muted">Later tasks can&apos;t start until this is done</div>
          </div>
          <div className={`h-[22px] w-10 rounded-full p-0.5 transition-colors ${blocks ? 'bg-accent' : 'bg-border-input'}`}>
            <div className={`h-[18px] w-[18px] rounded-full bg-white transition-transform ${blocks ? 'translate-x-4.5' : 'translate-x-0'}`} />
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={confirm}>Add task</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
