import { useNavigate, useParams } from 'react-router-dom';
import { useLaunch } from '@/state/LaunchDataContext';
import { launchTimelineDays } from '@/lib/launchMetrics';
import { PrimaryButton } from '@/components/ui';

export function ConfirmPage() {
  const { id } = useParams();
  const launch = useLaunch(Number(id));
  const navigate = useNavigate();
  if (!launch) return null;

  const first = [...launch.tasks].sort((a, b) => a.step - b.step)[0];
  const timelineDays = launchTimelineDays(launch.tasks);

  return (
    <div className="mx-auto my-16 max-w-[560px] rounded-modal border border-border bg-white p-10 text-center shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
      <div className="mx-auto mb-4.5 flex h-13 w-13 items-center justify-center rounded-full bg-status-ontrack-bg text-2xl text-status-ontrack-text">✓</div>
      <div className="mb-1.5 text-xl font-bold">Launch created</div>
      <div className="mb-7 text-[15px] text-ink-secondary">{launch.name} is now live in LaunchPilot.</div>

      <div className="mb-7 flex gap-3">
        <div className="flex-1 rounded-card border border-border-divider p-4 text-left">
          <div className="mb-1.5 text-[11px] font-semibold text-ink-muted">First milestone</div>
          <div className="text-sm font-bold">{first?.name ?? '—'}</div>
          <div className="mt-0.5 text-xs text-ink-tertiary">Owner: {first?.owner ?? '—'}</div>
        </div>
        <div className="flex-1 rounded-card border border-border-divider p-4 text-left">
          <div className="mb-1.5 text-[11px] font-semibold text-ink-muted">Launch timeline</div>
          <div className="text-xl font-bold">Day 1 of {timelineDays}</div>
        </div>
      </div>

      <PrimaryButton onClick={() => navigate(`/launches/${launch.id}/dashboard`)} className="px-6 py-3">
        Go to dashboard
      </PrimaryButton>
    </div>
  );
}
