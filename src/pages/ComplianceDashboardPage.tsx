import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions } from '@/state/LaunchDataContext';
import { openComplianceFlagCount } from '@/lib/launchMetrics';
import { complianceFlagBadgeStyle, taskBadgeStyle } from '@/lib/statusLabels';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { EstimatedLaunchDateBanner } from '@/components/EstimatedLaunchDateBanner';
import { TrailPreviewCard } from '@/components/TrailPreviewCard';
import { SubtaskActionRow } from '@/components/SubtaskActionRow';
import { FlagConcernModal } from '@/components/FlagConcernModal';
import { SecondaryButton } from '@/components/ui';

export function ComplianceDashboardPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);

  const [flagTaskId, setFlagTaskId] = useState<number | null>(null);
  const [flagSubtaskTarget, setFlagSubtaskTarget] = useState<{ taskId: number; subtaskId: number; name: string } | null>(null);

  const mySubtasks = useMemo(() => {
    if (!launch) return [];
    return launch.tasks.flatMap((t) => t.subtasks.filter((s) => s.assignee === 'Rohan').map((s) => ({ task: t, subtask: s })));
  }, [launch]);

  if (!launch || !currentUser) return null;

  const flags = openComplianceFlagCount(launch);
  const signOffQueue = launch.tasks.filter((t) => t.locked && t.reviewStatus === 'pending');
  const reviewedTasks = launch.tasks.filter((t) => t.locked && (t.reviewStatus === 'acknowledged' || t.reviewStatus === 'flagged'));
  const regulatoryTask = launch.tasks.find((t) => t.name === 'Regulatory compliance review');
  const regulatoryBadge = regulatoryTask ? taskBadgeStyle(regulatoryTask.status) : taskBadgeStyle('on track');

  let deadlineLabel = '—';
  if (regulatoryTask) {
    const sorted = [...launch.tasks].sort((a, b) => a.step - b.step);
    let cumulative = 0;
    for (const t of sorted) {
      cumulative += t.durationDays || 1;
      if (t.id === regulatoryTask.id) break;
    }
    const dueDate = new Date(launch.createdAt + cumulative * 86400000);
    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
    deadlineLabel = daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` : 'overdue';
  }

  const flaggedTask = flagTaskId != null ? launch.tasks.find((t) => t.id === flagTaskId) : null;

  return (
    <div className="mx-auto w-full max-w-[1000px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-bold">{launch.name}</div>
          <div className="text-[13px] text-ink-muted">Rohan&apos;s compliance dashboard</div>
        </div>
      </div>

      <EstimatedLaunchDateBanner launch={launch} />

      <div className="mb-6 flex gap-4">
        <StatCard label="Open compliance flags" value={flags} valueClassName={flags > 0 ? 'text-status-blocked-text' : ''} />
        <StatCard label="Regulatory review status" value={<Badge style={regulatoryBadge} />} />
        <StatCard label="Days to submission deadline" value={deadlineLabel} valueClassName={deadlineLabel === 'overdue' ? 'text-status-blocked-text' : ''} />
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Sign-off queue</div>
      <div className="mb-2.5 text-[12.5px] text-ink-muted">Tasks marked locked/final by their owner, awaiting your review.</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {signOffQueue.map((t) => (
          <div key={t.id} className="border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="mt-0.5 text-xs text-ink-muted">{launch.name}</div>
              </div>
              <SecondaryButton onClick={() => actions.acknowledgeComplianceReview(t.id)} className="whitespace-nowrap px-3.5 py-2 text-xs">
                Acknowledge
              </SecondaryButton>
              <button onClick={() => setFlagTaskId(t.id)} className="whitespace-nowrap rounded-control border border-border-input px-3.5 py-2 text-xs font-semibold">
                Flag a concern
              </button>
            </div>
          </div>
        ))}
        {signOffQueue.length === 0 && <div className="px-4 py-4 text-[13px] text-ink-muted">No tasks awaiting sign-off right now.</div>}
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Subtasks routed to you</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {mySubtasks.map(({ task, subtask }) => (
          <SubtaskActionRow
            key={subtask.id}
            subtask={subtask}
            parentTaskName={task.name}
            onChangeStatus={(status) => actions.changeSubtaskStatus(task.id, subtask.id, status)}
            onHold={() => actions.holdSubtask(task.id, subtask.id)}
            onFlag={() => setFlagSubtaskTarget({ taskId: task.id, subtaskId: subtask.id, name: subtask.name })}
            onReassign={(newAssignee) => actions.reassignSubtask(task.id, subtask.id, newAssignee)}
          />
        ))}
        {mySubtasks.length === 0 && <div className="px-4 py-3.5 text-[12.5px] text-ink-muted">No subtasks routed to you right now.</div>}
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Reviewed tasks</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {reviewedTasks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex-1 text-sm font-semibold">{t.name}</div>
            <Badge style={t.reviewStatus === 'flagged' ? { label: 'Flagged', bg: 'bg-status-blocked-bg', text: 'text-status-blocked-text' } : { label: 'Signed off', bg: 'bg-status-ontrack-bg', text: 'text-status-ontrack-text' }} />
          </div>
        ))}
        {reviewedTasks.length === 0 && <div className="px-4 py-4 text-[13px] text-ink-muted">No tasks reviewed yet.</div>}
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Compliance flags</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {launch.complianceFlags.map((f) => (
          <div key={f.id} className="flex items-center gap-3 border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex-1">
              <div className="text-sm font-semibold">{f.name}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{f.task}</div>
            </div>
            <Badge style={complianceFlagBadgeStyle(f.status)} />
            {f.status === 'open' && (
              <button onClick={() => actions.resolveComplianceFlag(f.id)} className="rounded-control border border-border-input px-3.5 py-2 text-xs font-semibold">
                Resolve
              </button>
            )}
          </div>
        ))}
      </div>

      <TrailPreviewCard
        launch={launch}
        currentUser={currentUser}
        launchId={launchId}
        subtitle="Full launch activity, including packaging/manufacturing progress — so you know what's ready for compliance review."
      />

      {flaggedTask && (
        <FlagConcernModal
          itemName={flaggedTask.name}
          onClose={() => setFlagTaskId(null)}
          onSubmit={(reason, detail) => actions.flagComplianceReview(flaggedTask.id, reason, detail)}
        />
      )}
      {flagSubtaskTarget && (
        <FlagConcernModal
          itemName={flagSubtaskTarget.name}
          onClose={() => setFlagSubtaskTarget(null)}
          onSubmit={(reason, detail) => actions.submitSubtaskFlag(flagSubtaskTarget.taskId, flagSubtaskTarget.subtaskId, reason, detail)}
        />
      )}
    </div>
  );
}
