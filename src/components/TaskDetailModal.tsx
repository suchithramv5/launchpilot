import { useState } from 'react';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions } from '@/state/LaunchDataContext';
import { canEditTask } from '@/lib/permissions';
import { OWNERS, ROOT_CAUSES, type Subtask } from '@/types';
import { subtaskBadgeStyle, TASK_STATUS_OPTIONS, badgeStatusLabel } from '@/lib/statusLabels';
import { Badge } from '@/components/Badge';
import { PrimaryButton, Select, TextArea, TextInput } from '@/components/ui';

export function TaskDetailModal({ launchId, taskId, onClose }: { launchId: number; taskId: number; onClose: () => void }) {
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [complianceAssignee, setComplianceAssignee] = useState('Rohan');
  const [resendDrafts, setResendDrafts] = useState<Record<number, string>>({});

  const task = launch?.tasks.find((t) => t.id === taskId);
  if (!launch || !task) return null;

  const canEdit = canEditTask(task, currentUser);
  const needsRiskReason = task.status === 'at risk' || task.status === 'blocked';
  const canComplete = canEdit && task.status !== 'completed' && task.subtasks.length > 0 && task.subtasks.every((s) => s.locked);
  const needsComplianceSend = canEdit && task.reviewStatus === 'none';

  const taskTrail = launch.trailEntries.filter((e) => e.task === task.name).slice(0, 8);

  function addSubtask() {
    if (!newSubtaskName.trim() || !newSubtaskAssignee) return;
    const nextId = (task!.subtasks.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
    const subtask: Subtask = { id: nextId, name: newSubtaskName.trim(), assignee: newSubtaskAssignee, status: 'open' };
    actions.addSubtask(task!.id, subtask);
    setNewSubtaskName('');
    setNewSubtaskAssignee('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="max-h-[86vh] w-[480px] overflow-y-auto rounded-modal border border-border bg-white p-6 shadow-modal">
        <div className="mb-1 flex items-start justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Task {task.step}</div>
          <div onClick={onClose} className="cursor-pointer text-base leading-none text-ink-faint">
            ✕
          </div>
        </div>
        <div className="mb-3.5 text-[19px] font-bold">{task.name}</div>

        {!canEdit && (
          <div className="mb-3.5 rounded-control border border-border-divider bg-page px-3 py-2.5 text-xs text-ink-tertiary">
            🔒 View only — you don&apos;t have edit access for this task.
          </div>
        )}

        <div className="mb-4.5 flex gap-3">
          <div className="flex-1">
            <div className="mb-1.5 text-[11px] font-semibold text-ink-secondary">Status</div>
            <Select value={task.status} disabled={!canEdit} onChange={(e) => actions.changeTaskStatus(task.id, e.target.value as any)} className="w-full">
              {TASK_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {badgeStatusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1">
            <div className="mb-1.5 text-[11px] font-semibold text-ink-secondary">Owner</div>
            <Select value={task.owner} disabled={!canEdit} onChange={(e) => actions.changeTaskOwner(task.id, e.target.value)} className="w-full">
              {OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[100px]">
            <div className="mb-1.5 text-[11px] font-semibold text-ink-secondary">Days</div>
            <TextInput
              type="number"
              min={1}
              disabled={!canEdit}
              value={task.durationDays}
              onChange={(e) => actions.changeTaskDuration(task.id, Number(e.target.value) || 1)}
            />
          </div>
        </div>

        {needsRiskReason && (
          <div className="mb-4.5 rounded-control border border-border-divider bg-page p-3">
            <div className="mb-1.5 text-[11px] font-semibold text-ink-secondary">Reason code</div>
            <Select
              value={task.riskReason}
              disabled={!canEdit}
              onChange={(e) => actions.changeTaskRisk(task.id, e.target.value, task.riskComment)}
              className="mb-2.5 w-full"
            >
              <option value="">Select a reason…</option>
              {ROOT_CAUSES.map((rc) => (
                <option key={rc} value={rc}>
                  {rc}
                </option>
              ))}
            </Select>
            <div className="mb-1.5 text-[11px] font-semibold text-ink-secondary">Comment</div>
            <TextArea
              value={task.riskComment}
              disabled={!canEdit}
              onChange={(e) => actions.changeTaskRisk(task.id, task.riskReason, e.target.value)}
              placeholder="What's causing this and what's needed to unblock it"
              className="min-h-[56px]"
            />
          </div>
        )}

        {task.blocks && (
          <div className="mb-4.5 rounded-control border border-border-divider bg-page px-3 py-2.5 text-xs text-ink-secondary">
            🔗 Blocks downstream tasks — later steps can&apos;t start until this is done.
          </div>
        )}

        <div className="mb-4.5 rounded-control border border-border-divider p-3">
          {needsComplianceSend && (
            <div className="mb-3 flex items-center gap-2 rounded-control border border-border-input bg-white p-2.5">
              <div className="flex-1 text-[12.5px] font-bold text-ink-secondary">Send to compliance for review</div>
              <Select value={complianceAssignee} onChange={(e) => setComplianceAssignee(e.target.value)} className="py-1.5 text-xs">
                {OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
              <PrimaryButton onClick={() => actions.sendToCompliance(task.id, complianceAssignee)} className="whitespace-nowrap px-3 py-1.5 text-xs">
                Send
              </PrimaryButton>
            </div>
          )}
          {!needsComplianceSend && task.reviewStatus !== 'none' && (
            <div className="mb-3 text-[12px] text-ink-muted">
              Compliance status: <strong>{task.reviewStatus}</strong>
              {task.reviewStatus === 'flagged' && ' — reply from your dashboard’s compliance review updates.'}
            </div>
          )}

          <div className="mb-2 text-xs font-bold text-ink-secondary">Subtasks — people you depend on</div>
          {task.subtasks.map((sub) => (
            <div key={sub.id} className="border-t border-border-divider2 py-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 text-sm font-semibold">{sub.name}</div>
                <div className="text-[11.5px] text-ink-tertiary">{sub.assignee}</div>
                <Badge style={subtaskBadgeStyle(sub.status)} size="sm" />
              </div>
              {sub.flagDetail && (
                <div className="mt-1 text-[11.5px] text-status-blocked-text">
                  {sub.flagReason} — {sub.flagDetail}
                </div>
              )}
              {sub.status === 'flagged' && canEdit && (
                <div className="mt-1.5">
                  <TextArea
                    placeholder="Optional: what changed since the flag"
                    value={resendDrafts[sub.id] ?? ''}
                    onChange={(e) => setResendDrafts((d) => ({ ...d, [sub.id]: e.target.value }))}
                    className="mb-1.5 min-h-8 text-[11.5px]"
                  />
                  <button
                    onClick={() => {
                      actions.resolveSubtaskFlag(task.id, sub.id, resendDrafts[sub.id] ?? '');
                      setResendDrafts((d) => ({ ...d, [sub.id]: '' }));
                    }}
                    className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    Update &amp; send back
                  </button>
                </div>
              )}
              {sub.responseNote && <div className="mt-1 text-[11.5px] text-ink-secondary">💬 {sub.responseNote}</div>}
              {sub.needsInfo && <div className="mt-1 text-[11px] text-[#8a6a3d]">⏳ they need more info from you</div>}
              {canEdit && sub.status === 'closed' && !sub.locked && (
                <button onClick={() => actions.lockSubtask(task.id, sub.id)} className="mt-1.5 rounded-full border border-border-input px-2.5 py-1 text-[11px] font-bold">
                  Lock — sign-off received
                </button>
              )}
              {canEdit && sub.locked && (
                <button onClick={() => actions.recallSubtask(task.id, sub.id)} className="mt-1.5 ml-1.5 rounded-full border border-border-input px-2.5 py-1 text-[11px] font-semibold text-[#8a6a3d]">
                  Recall
                </button>
              )}
              {sub.locked && <div className="mt-1 text-[11px] text-ink-faint">🔒 locked</div>}
            </div>
          ))}
          {task.subtasks.length === 0 && <div className="py-1 text-xs text-ink-faint">No subtasks yet.</div>}

          {canEdit && (
            <div className="mt-3">
              <div className="mb-1.5 text-[11px] font-semibold text-ink-muted">Add a custom subtask</div>
              <div className="flex gap-1.5">
                <TextInput value={newSubtaskName} onChange={(e) => setNewSubtaskName(e.target.value)} placeholder="Subtask name" className="flex-[1.4] py-2 text-[12.5px]" />
                <Select value={newSubtaskAssignee} onChange={(e) => setNewSubtaskAssignee(e.target.value)} className="flex-1 py-2 text-[12.5px]">
                  <option value="">Assignee…</option>
                  {OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
                <button onClick={addSubtask} className="whitespace-nowrap rounded-control bg-accent px-3 py-2 text-xs font-bold text-white">
                  + add
                </button>
              </div>
            </div>
          )}

          {canComplete && (
            <button
              onClick={() => actions.markTaskComplete(task.id)}
              className="mt-3 inline-block rounded-control bg-status-ontrack-bg px-3 py-2 text-xs font-bold text-status-ontrack-text"
            >
              ✓ Mark task completed
            </button>
          )}
        </div>

        <div className="mb-2 text-xs font-bold text-ink-secondary">Recent activity on this task</div>
        <div className="mb-4.5 overflow-hidden rounded-control border border-border-divider">
          {taskTrail.map((e) => (
            <div key={e.id} className="flex gap-2.5 border-b border-border-divider2 px-3 py-2.5 last:border-b-0">
              <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[10px] font-bold text-ink-tertiary">
                {e.initial}
              </div>
              <div className="flex-1">
                <div className="text-xs">
                  <strong>{e.name}</strong> {e.action}
                </div>
                <div className="text-[11.5px] text-ink-tertiary">
                  {e.old} → {e.new}
                </div>
              </div>
              <div className="flex-shrink-0 text-[10.5px] text-ink-faint">{e.time}</div>
            </div>
          ))}
          {taskTrail.length === 0 && <div className="px-3 py-2.5 text-xs text-ink-muted">No activity yet.</div>}
        </div>

        <div className="text-right">
          <button onClick={onClose} className="rounded-control border border-border-input px-4 py-2 text-[13px] font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
