import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions } from '@/state/LaunchDataContext';
import { isLaunchOwnerUser } from '@/lib/permissions';
import { computeRetroMilestones } from '@/lib/launchMetrics';
import { ROOT_CAUSES } from '@/types';
import { PrimaryButton, Select, SuccessBanner } from '@/components/ui';

export function RetroPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);
  const navigate = useNavigate();

  if (!launch || !currentUser) return null;

  if (!launch.closed) {
    return (
      <div className="mx-auto w-full max-w-[560px] p-8 text-center text-sm text-ink-muted">
        The retrospective unlocks once this launch is marked complete.
        <div onClick={() => navigate(`/launches/${launchId}/dashboard`)} className="mt-3 cursor-pointer text-[13px] font-semibold text-accent">
          ← back to dashboard
        </div>
      </div>
    );
  }

  const milestones = computeRetroMilestones(launch);
  const onTimeCount = milestones.filter((m) => m.slipDays === 0).length;
  const totalSlip = milestones.reduce((sum, m) => sum + m.slipDays, 0);
  const untaggedSlips = milestones.filter((m) => m.slipDays > 0 && !launch.retroTags[m.name]);
  const canEdit = isLaunchOwnerUser(currentUser);
  const saveDisabled = untaggedSlips.length > 0;

  return (
    <div className="mx-auto w-full max-w-[900px] p-8">
      <div onClick={() => navigate(`/launches/${launchId}/dashboard`)} className="mb-3.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to dashboard
      </div>
      <div className="mb-1 text-xl font-bold">Retrospective — {launch.name}</div>
      <div className="mb-6 text-[13px] text-ink-muted">Tag every slip with a root cause before saving.</div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 rounded-card border border-border bg-card p-4.5 shadow-card">
          <div className="mb-2 text-[11px] font-semibold text-ink-muted">On-time milestones</div>
          <div className="text-[26px] font-bold text-status-ontrack-text">
            {onTimeCount} of {milestones.length}
          </div>
        </div>
        <div className="flex-1 rounded-card border border-border bg-card p-4.5 shadow-card">
          <div className="mb-2 text-[11px] font-semibold text-ink-muted">Total slip</div>
          <div className="text-[26px] font-bold">{totalSlip} days</div>
        </div>
        <div className="flex-1 rounded-card border border-border bg-card p-4.5 shadow-card">
          <div className="mb-2 text-[11px] font-semibold text-ink-muted">Untagged slips</div>
          <div className={`text-[26px] font-bold ${untaggedSlips.length > 0 ? 'text-status-blocked-text' : ''}`}>{untaggedSlips.length}</div>
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-card border border-border bg-card shadow-card">
        <div className="flex bg-page px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
          <div className="flex-[1.6]">Milestone</div>
          <div className="flex-1">Planned</div>
          <div className="flex-1">Actual</div>
          <div className="flex-[0.8]">Slip</div>
          <div className="flex-[1.6]">Root cause</div>
        </div>
        {milestones.map((m) => (
          <div key={m.taskId} className="flex items-center border-b border-border-divider px-4 py-3 last:border-b-0">
            <div className="flex-[1.6] text-[13.5px] font-semibold">{m.name}</div>
            <div className="flex-1 text-[13px] text-ink-secondary">{m.plannedLabel}</div>
            <div className="flex-1 text-[13px] text-ink-secondary">{m.actualLabel}</div>
            <div className={`flex-[0.8] text-[13px] font-bold ${m.slipDays > 0 ? 'text-status-blocked-text' : 'text-ink-faint'}`}>
              {m.slipDays > 0 ? `${m.slipDays}d` : '—'}
            </div>
            <div className="flex-[1.6]">
              {m.slipDays === 0 ? (
                <span className="text-xs text-ink-faint">—</span>
              ) : canEdit ? (
                <Select
                  value={launch.retroTags[m.name] ?? ''}
                  onChange={(e) => actions.setRetroTag(m.name, e.target.value)}
                  className={`w-full py-1.5 text-[12.5px] ${!launch.retroTags[m.name] ? 'border-status-blocked-text' : ''}`}
                >
                  <option value="">Select a reason…</option>
                  {ROOT_CAUSES.map((rc) => (
                    <option key={rc} value={rc}>
                      {rc}
                    </option>
                  ))}
                </Select>
              ) : (
                <span className="text-[12.5px] text-ink-secondary">{launch.retroTags[m.name] || '—'}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit ? (
        <>
          {launch.retroSaved && <SuccessBanner>✓ Retrospective saved.</SuccessBanner>}
          {saveDisabled && <div className="mb-3 text-[12.5px] text-status-blocked-text">Tag all slips with a root cause to save.</div>}
          <div className="flex justify-end">
            <PrimaryButton onClick={() => actions.saveRetro()} disabled={saveDisabled}>
              Save retrospective
            </PrimaryButton>
          </div>
        </>
      ) : (
        <div className="text-[12.5px] text-ink-muted">🔒 View only — root-cause tagging is limited to the launch lead.</div>
      )}
    </div>
  );
}
