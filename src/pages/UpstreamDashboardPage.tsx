import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions, useLaunchRosterProfiles } from '@/state/LaunchDataContext';
import { isLaunchOwnerUser } from '@/lib/permissions';
import { ROOT_CAUSES } from '@/types';
import { taskBadgeStyle } from '@/lib/statusLabels';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { EstimatedLaunchDateBanner } from '@/components/EstimatedLaunchDateBanner';
import { TrailPreviewCard } from '@/components/TrailPreviewCard';
import { ComplianceReviewList } from '@/components/ComplianceReviewList';
import { SubtaskActionRow } from '@/components/SubtaskActionRow';
import { FlagConcernModal } from '@/components/FlagConcernModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { TaskTimingBadges } from '@/components/TaskTimingBadges';
import { PrimaryButton, Select, SuccessBanner, TextInput } from '@/components/ui';

const BASE_BUFFER_DAYS = 5;

export function UpstreamDashboardPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);
  const ownerOptions = useLaunchRosterProfiles(launch);

  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const [flagTarget, setFlagTarget] = useState<{ taskId: number; subtaskId: number; name: string } | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [extensionDays, setExtensionDays] = useState(3);

  const mySubtasks = useMemo(() => {
    if (!launch || !currentUser) return [];
    return launch.tasks.flatMap((t) => t.subtasks.filter((s) => s.assigneeId === currentUser.id).map((s) => ({ task: t, subtask: s })));
  }, [launch, currentUser]);

  if (!launch || !currentUser) return null;

  const myTasks = launch.tasks.filter((t) => t.ownerId === currentUser.id);
  const openCount = myTasks.filter((t) => t.status !== 'completed').length;
  const vendorTasks = launch.tasks.filter((t) => t.name === 'Packaging tooling' || t.name === 'Manufacturing');
  const vendorLeadTimeDays = vendorTasks.reduce((sum, t) => sum + (t.durationDays || 0), 0);
  const bufferDaysLeft = Math.max(0, BASE_BUFFER_DAYS - (launch.bookingAdjusted ? launch.bookingExtensionDays || 0 : 0));
  const bufferColor = bufferDaysLeft === 0 ? 'text-status-blocked-text' : bufferDaysLeft <= 2 ? 'text-[oklch(45%_0.12_80)]' : 'text-status-ontrack-text';

  const vendorOptions = launch.team.filter((t) => t.group === 'external');
  const canEditUpstream = currentUser.role === 'upstream_ops' || isLaunchOwnerUser(currentUser);
  const bookingText = launch.bookingAdjusted
    ? `✓ Booking window extended ${launch.bookingExtensionDays || 3} ${(launch.bookingExtensionDays || 3) === 1 ? 'day' : 'days'} with ${launch.bookingVendorName || 'the vendor'} — reason: ${launch.bookingReasonLabel || 'vendor delay'}. Vendor notified.`
    : '';

  function submitBooking() {
    if (!canEditUpstream || !vendorId || !reasonCode) return;
    if (reasonCode === 'other' && !otherReason.trim()) return;
    const vendor = vendorOptions.find((v) => String(v.id) === vendorId);
    const vendorName = vendor ? vendor.title || vendor.name : 'the vendor';
    const reason = reasonCode === 'other' ? otherReason.trim() : reasonCode;
    actions.adjustVendorBooking(vendorName, reason, extensionDays);
    setVendorId('');
    setReasonCode('');
    setOtherReason('');
    setExtensionDays(3);
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] p-8">
      <div className="mb-6 text-xl font-bold">{launch.name}</div>
      <div className="-mt-4 mb-6 text-[13px] text-ink-muted">{currentUser.name}&apos;s upstream dashboard · update your task status</div>

      <EstimatedLaunchDateBanner launch={launch} />

      <div className="mb-6 flex gap-4">
        <StatCard label="Upstream tasks still open" value={openCount} />
        <StatCard label="Vendor lead time" value={vendorTasks.length ? `${vendorLeadTimeDays} ${vendorLeadTimeDays === 1 ? 'day' : 'days'}` : '—'} />
        <StatCard label="Buffer before rush order" value={`${bufferDaysLeft} ${bufferDaysLeft === 1 ? 'day' : 'days'}`} valueClassName={bufferColor} />
      </div>

      <div className="mb-2.5 text-[13px] font-bold">Upstream of you</div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {myTasks.map((t) => (
          <div key={t.id} onClick={() => setOpenTaskId(t.id)} className="cursor-pointer border-b border-border-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-page">
            <div className="flex items-center gap-3">
              <div className="flex-1 text-sm font-semibold">{t.name}</div>
              <Badge style={taskBadgeStyle(t.status)} />
              <TaskTimingBadges task={t} launch={launch} />
            </div>
            {(t.status === 'at risk' || t.status === 'blocked') && t.riskReason && (
              <div className="mt-1.5 text-xs text-[#8a6a3d]">
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
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
        {mySubtasks.map(({ task, subtask }) => (
          <SubtaskActionRow
            key={subtask.id}
            subtask={subtask}
            parentTaskName={task.name}
            onChangeStatus={(status) => actions.changeSubtaskStatus(task.id, subtask.id, status)}
            onHold={() => actions.holdSubtask(task.id, subtask.id)}
            onFlag={() => setFlagTarget({ taskId: task.id, subtaskId: subtask.id, name: subtask.name })}
            onReassign={(newAssigneeId, newAssigneeName) => actions.reassignSubtask(task.id, subtask.id, newAssigneeId, newAssigneeName)}
            reassignOptions={ownerOptions}
          />
        ))}
        {mySubtasks.length === 0 && <div className="px-4 py-3.5 text-[12.5px] text-ink-muted">No subtasks routed to you right now.</div>}
      </div>

      {bookingText && <SuccessBanner>{bookingText}</SuccessBanner>}

      {canEditUpstream ? (
        <div className="mb-6 rounded-card border border-border bg-card p-4 shadow-card">
          <div className="mb-2.5 text-[13px] font-bold">Adjust vendor booking</div>
          <div className="mb-3 flex flex-wrap gap-2.5">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="min-w-[180px] flex-[1.4]">
              <option value="">Which vendor is delayed?…</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title || v.name}
                </option>
              ))}
            </Select>
            <Select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="min-w-[160px] flex-1">
              <option value="">Reason code…</option>
              {ROOT_CAUSES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-1.5">
              <TextInput type="number" min={1} value={extensionDays} onChange={(e) => setExtensionDays(Number(e.target.value) || 1)} className="w-16" />
              <span className="text-[12.5px] text-ink-tertiary">days extension</span>
            </div>
          </div>
          {reasonCode === 'other' && (
            <TextInput value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="Describe the reason" className="mb-3" />
          )}
          <PrimaryButton onClick={submitBooking} className="px-5 py-2.5 text-[13.5px]">
            Adjust booking
          </PrimaryButton>
        </div>
      ) : (
        <div className="mb-6 text-[12.5px] text-ink-muted">🔒 View only — adjusting the booking is limited to upstream ops or the launch lead.</div>
      )}

      <TrailPreviewCard
        launch={launch}
        currentUser={currentUser}
        launchId={launchId}
        subtitle="Full launch activity, including compliance sign-offs — so you know when it's safe to start your own work."
      />

      {openTaskId != null && <TaskDetailModal launchId={launchId} taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
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
