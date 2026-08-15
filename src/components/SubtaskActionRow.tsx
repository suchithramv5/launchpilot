import { useState } from 'react';
import type { Subtask } from '@/types';
import { OWNERS } from '@/types';
import { subtaskBadgeStyle, SUBTASK_STATUS_OPTIONS } from '@/lib/statusLabels';
import { Badge } from '@/components/Badge';
import { Select } from '@/components/ui';

export function SubtaskActionRow({
  subtask,
  parentTaskName,
  readOnly = false,
  onChangeStatus,
  onHold,
  onFlag,
  onReassign,
}: {
  subtask: Subtask;
  parentTaskName: string;
  readOnly?: boolean;
  onChangeStatus?: (status: Subtask['status']) => void;
  onHold?: () => void;
  onFlag?: () => void;
  onReassign?: (newAssignee: string) => void;
}) {
  const [reassignValue, setReassignValue] = useState('');

  return (
    <div className="border-b border-border-divider px-4 py-3.5 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold">{subtask.name}</div>
          <div className="text-[11.5px] text-ink-muted">
            for {parentTaskName}
            {subtask.assignedBy && <span> · reassigned by {subtask.assignedBy}</span>}
          </div>
        </div>
        <Badge style={subtaskBadgeStyle(subtask.status)} size="sm" />
      </div>
      {subtask.flagDetail && (
        <div className="mt-1 text-[11.5px] text-status-blocked-text">
          {subtask.flagReason} — {subtask.flagDetail}
        </div>
      )}
      {subtask.responseNote && <div className="mt-1 text-[11.5px] text-ink-secondary">💬 {subtask.responseNote}</div>}
      {subtask.needsInfo && <div className="mt-1 text-[11px] text-[#8a6a3d]">⏳ waiting on owner for more info</div>}

      {!readOnly && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {onHold && (
            <button onClick={onHold} className="rounded-control border border-border-input px-3 py-1.5 text-[11.5px] font-semibold">
              Keep with me
            </button>
          )}
          {onChangeStatus && (
            <Select value={subtask.status === 'flagged' ? 'open' : subtask.status} onChange={(e) => onChangeStatus(e.target.value as Subtask['status'])} className="py-1.5 text-[11.5px]">
              {SUBTASK_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
          {onFlag && (
            <button onClick={onFlag} className="rounded-control border border-border-input px-3 py-1.5 text-[11.5px] font-semibold">
              Flag a concern
            </button>
          )}
          {onReassign && (
            <Select
              value={reassignValue}
              onChange={(e) => {
                setReassignValue(e.target.value);
                if (e.target.value) onReassign(e.target.value);
              }}
              className="py-1.5 text-[11.5px]"
            >
              <option value="">Reassign to…</option>
              {OWNERS.filter((o) => o !== subtask.assignee).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
