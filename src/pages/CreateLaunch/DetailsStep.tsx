import { useNavigate } from 'react-router-dom';
import { useCreateLaunch } from '@/state/CreateLaunchContext';
import { PrimaryButton, TextArea, TextInput } from '@/components/ui';

export function DetailsStep() {
  const { draft, setName, setDescription, createLaunch } = useCreateLaunch();
  const navigate = useNavigate();

  async function handleCreate() {
    const id = await createLaunch();
    navigate(`/launches/${id}/confirm`);
  }

  return (
    <div className="mx-auto w-full max-w-[720px] p-8 pb-20">
      <div onClick={() => navigate('/launches')} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to your launches
      </div>
      <div className="mb-1 text-[22px] font-bold">Create a new launch</div>
      <div className="mb-7 text-sm text-ink-tertiary">Start with the basics — you&apos;ll set up tasks and team next.</div>

      <div className="mb-5 flex gap-4">
        <div className="flex-1">
          <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Launch name</div>
          <TextInput value={draft.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Glow serum duo" />
        </div>
        <div className="flex-1">
          <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Category</div>
          <TextInput value="Beauty & personal care" disabled className="bg-[#f3f1ec] text-ink-tertiary" />
        </div>
      </div>

      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-xs font-semibold text-ink-secondary">Description</div>
        <div className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-[#f3f1ec] px-2.5 py-1 text-[11.5px] font-bold text-ink-faint" title="Coming soon">
          <span>✨</span>
          <span>Suggest description (coming soon)</span>
        </div>
      </div>
      <TextArea
        value={draft.description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is this launch and why does it matter?"
        className="mb-6 min-h-[80px]"
      />

      <div className="mb-7 flex gap-3.5">
        <div onClick={() => navigate('/launches/new/checklist')} className="flex-1 cursor-pointer rounded-card border border-border bg-card p-4.5 shadow-card hover:bg-page">
          <div className="mb-1 text-sm font-bold">Launch readiness checklist →</div>
          <div className="text-[12.5px] text-ink-muted">{draft.tasks.length} tasks configured</div>
        </div>
        <div onClick={() => navigate('/launches/new/team')} className="flex-1 cursor-pointer rounded-card border border-border bg-card p-4.5 shadow-card hover:bg-page">
          <div className="mb-1 text-sm font-bold">Team, leadership &amp; stakeholders →</div>
          <div className="text-[12.5px] text-ink-muted">{draft.team.length} people added</div>
        </div>
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={handleCreate} className="px-5.5 py-3">
          Create launch
        </PrimaryButton>
      </div>
    </div>
  );
}
