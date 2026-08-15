import { useNavigate, useParams } from 'react-router-dom';
import { useLaunch, useLaunchActions } from '@/state/LaunchDataContext';
import { RosterEditor } from '@/components/RosterEditor';
import { PrimaryButton } from '@/components/ui';

export function RosterPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const actions = useLaunchActions(launchId);
  const navigate = useNavigate();

  if (!launch) return null;

  return (
    <div className="mx-auto w-full max-w-[720px] p-8 pb-20">
      <div onClick={() => navigate(`/launches/${launchId}`)} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to launch details
      </div>
      <div className="mb-1 text-[22px] font-bold">Team, leadership &amp; stakeholders</div>
      <div className="mb-7 text-sm text-ink-tertiary">
        Add everyone involved in &quot;{launch.name}&quot; — team members, leadership, other stakeholders, or external contacts — and set what they can view.
      </div>

      <RosterEditor team={launch.team} onChange={(team) => actions.updateRoster(team)} />

      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={() => navigate(`/launches/${launchId}`)} className="px-5.5 py-3">
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}
