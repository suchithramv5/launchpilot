import { useNavigate } from 'react-router-dom';
import { useCreateLaunch } from '@/state/CreateLaunchContext';
import { RosterEditor } from '@/components/RosterEditor';
import { PrimaryButton } from '@/components/ui';

export function TeamStep() {
  const { draft, setTeam } = useCreateLaunch();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[720px] p-8 pb-20">
      <div onClick={() => navigate('/launches/new')} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to launch details
      </div>
      <div className="mb-1 text-[22px] font-bold">Team, leadership &amp; stakeholders</div>
      <div className="mb-7 text-sm text-ink-tertiary">
        Add everyone involved in &quot;{draft.name || 'this launch'}&quot; — team members, leadership, other stakeholders, or external contacts — and set what
        they can view.
      </div>

      <RosterEditor team={draft.team} onChange={setTeam} />

      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={() => navigate('/launches/new')} className="px-5.5 py-3">
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}
