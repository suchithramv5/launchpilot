import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions } from '@/state/LaunchDataContext';
import { isLaunchOwnerUser } from '@/lib/permissions';
import { blockedCount, computeNextMilestone, openComplianceFlagCount, taskCounts } from '@/lib/launchMetrics';
import { taskBadgeStyle } from '@/lib/statusLabels';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { PrimaryButton, SecondaryButton, TextInput } from '@/components/ui';
import { AddTaskModal } from '@/components/AddTaskModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { ComplianceReviewList } from '@/components/ComplianceReviewList';
import { SubtaskActionRow } from '@/components/SubtaskActionRow';
import { FlagConcernModal } from '@/components/FlagConcernModal';
import { EstimatedLaunchDateBanner } from '@/components/EstimatedLaunchDateBanner';
import { TrailPreviewCard } from '@/components/TrailPreviewCard';
import { TaskTimingBadges } from '@/components/TaskTimingBadges';

const STATUS_PILLS: { status: string; label: string }[] = [
  { status: 'not_started', label: 'Not Started' },
  { status: 'on track', label: 'On track' },
  { status: 'at risk', label: 'At risk' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'completed', label: 'Completed' },
];

export function DailyDashboardPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);
  const navigate = useNavigate();

  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [flagTarget, setFlagTarget] = useState<{ taskId: number; subtaskId: number; name: string } | null>(null);

  const mySubtasks = useMemo(() => {
    if (!launch || !currentUser) return [];
    const firstName = currentUser.name.split(' ')[0];
    return launch.tasks.flatMap((t) => t.subtasks.filter((s) => s.assignee === firstName).map((s) => ({ task: t, subtask: s })));
  }, [launch, currentUser]);

  if (!launch || !currentUser) return null;

  const counts = taskCounts(launch.tasks);
  const milestone = computeNextMilestone(launch);
  const flags = openComplianceFlagCount(launch);
  const overallRisk = counts.blocked > 0 ? 'Blocked' : counts.at_risk > 0 ? 'At risk' : 'On track';
  const overallRiskStyle = counts.blocked > 0 ? taskBadgeStyle('blocked') : counts.at_risk > 0 ? taskBadgeStyle('at risk') : taskBadgeStyle('on track');
  const isLead = isLaunchOwnerUser(currentUser);
  const myTasks = launch.tasks.filter((t) => t.owner === 'Priya');

  return (
    <div className="mx-auto w-full max-w-[1040px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          {isLead && (
            <div onClick={() => navigate(`/launches/${launchId}`)} className="mb-1.5 cursor-pointer text-xs font-semibold text-ink-tertiary">
              ← back to launch details
            </div>
          )}
          <div className="text-xl font-bold">{launch.name}</div>
          <div className="text-[13px] text-ink-muted">Priya&apos;s daily dashboard · beauty &amp; personal care</div>
        </div>
        <div className="flex items-center gap-3">
          <Badge style={{ label: overallRisk, bg: overallRiskStyle.bg, text: overallRiskStyle.text }} />
          {isLead && !launch.closed && (
            <SecondaryButton
              onClick={() => {
                actions.closeLaunch();
                navigate(`/launches/${launchId}/retro`);
              }}
            >
              Mark launch complete
            </SecondaryButton>
          )}
        </div>
      </div>

      <EstimatedLaunchDateBanner launch={launch} />

      <div className="mb-4 flex flex-wrap gap-2.5">
        {STATUS_PILLS.map((p) => {
          const style = taskBadgeStyle(p.status as any);
          const count = (counts as any)[p.status === 'not_started' ? 'not_started' : p.status.replace(' ', '_')];
          return (
            <div key={p.status} className={`flex items-center gap-2 rounded-[10px] px-3.5 py-2 ${style.bg}`}>
              <div className={`text-[15px] font-bold ${style.text}`}>{count}</div>
              <div className={`text-xs font-semibold ${style.text}`}>{p.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 flex gap-4">
        <StatCard label="Blocked tasks" value={blockedCount(launch.tasks)} valueClassName="text-status-blocked-text" />
        <StatCard label="Next milestone" value={milestone?.task.name ?? '—'} sub={milestone?.dueLabel} />
        <StatCard label="Open compliance flags" value={flags} valueClassName={flags > 0 ? 'text-status-blocked-text' : ''} />
      </div>

      <div className="flex items-start gap-5">
        <div className="flex-[1.4]">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="text-[13px] font-bold">Launch readiness checklist</div>
            <a onClick={() => setShowAddTask(true)} className="cursor-pointer text-xs font-semibold">
              + add task
            </a>
          </div>
          <div className="mb-5 overflow-hidden rounded-card border border-border bg-card shadow-card">
            {[...launch.tasks]
              .sort((a, b) => a.step - b.step)
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => setOpenTaskId(t.id)}
                  className="cursor-pointer border-b border-border-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-page"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-sm font-semibold">{t.name}</div>
                    <div className="w-[90px] text-xs text-ink-tertiary">{t.owner}</div>
                    <Badge style={taskBadgeStyle(t.status)} />
                    <TaskTimingBadges task={t} launch={launch} showLock />
                    {isLead && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          actions.deleteTask(t.id);
                        }}
                        className="cursor-pointer text-[15px] text-ink-faint"
                      >
                        ✕
                      </div>
                    )}
                  </div>
                  {(t.status === 'at risk' || t.status === 'blocked') && t.riskReason && (
                    <div className="mt-1.5 pl-0.5 text-xs text-[#8a6a3d]">
                      ⚠ <strong>{t.riskReason}</strong>
                      {t.riskComment && ` — ${t.riskComment}`}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="mb-2.5 text-[13px] font-bold">Compliance review updates</div>
          <ComplianceReviewList tasks={myTasks} onReply={(taskId, note) => actions.replyComplianceReview(taskId, note)} />

          <div className="mb-2.5 text-[13px] font-bold">Subtasks routed to you</div>
          <div className="mb-5 overflow-hidden rounded-card border border-border bg-card shadow-card">
            {mySubtasks.map(({ task, subtask }) => (
              <SubtaskActionRow
                key={subtask.id}
                subtask={subtask}
                parentTaskName={task.name}
                onChangeStatus={(status) => actions.changeSubtaskStatus(task.id, subtask.id, status)}
                onHold={() => actions.holdSubtask(task.id, subtask.id)}
                onFlag={() => setFlagTarget({ taskId: task.id, subtaskId: subtask.id, name: subtask.name })}
                onReassign={(newAssignee) => actions.reassignSubtask(task.id, subtask.id, newAssignee)}
              />
            ))}
            {mySubtasks.length === 0 && <div className="px-4 py-3.5 text-[12.5px] text-ink-muted">No subtasks routed to you right now.</div>}
          </div>

          <div className="mb-2.5 text-[13px] font-bold">Log a status update</div>
          <div className="flex gap-2">
            <TextInput
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              placeholder="e.g. Stability testing extended by 2 days"
              className="flex-1"
            />
            <PrimaryButton
              onClick={() => {
                if (!statusUpdate.trim()) return;
                actions.postStatusUpdate(statusUpdate.trim());
                setStatusUpdate('');
              }}
              className="whitespace-nowrap"
            >
              Post update
            </PrimaryButton>
          </div>
        </div>

        <div className="flex-1">
          <TrailPreviewCard launch={launch} currentUser={currentUser} launchId={launchId} />
        </div>
      </div>

      {openTaskId != null && <TaskDetailModal launchId={launchId} taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
      {showAddTask && <AddTaskModal tasks={launch.tasks} onClose={() => setShowAddTask(false)} onConfirm={(task, insertAfter) => actions.addTask(task, insertAfter)} />}
      {flagTarget && (
        <FlagConcernModal
          itemName={flagTarget.name}
          onClose={() => setFlagTarget(null)}
          onSubmit={(reason, detail) => actions.submitSubtaskFlag(flagTarget.taskId, flagTarget.subtaskId, reason, detail)}
        />
      )}
    </div>
  );
}
