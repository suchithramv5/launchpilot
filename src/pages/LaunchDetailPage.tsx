import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions } from '@/state/LaunchDataContext';
import { canViewRetro, canViewSummary, isLaunchOwnerUser } from '@/lib/permissions';
import { PrimaryButton, SecondaryButton, TextArea } from '@/components/ui';

export function LaunchDetailPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!launch) return <div className="p-8 text-sm text-ink-muted">Launch not found.</div>;

  const showSummary = canViewSummary(launch, currentUser);
  const showRetro = canViewRetro(launch, currentUser);
  const isLead = isLaunchOwnerUser(currentUser);

  return (
    <div className="mx-auto w-full max-w-[720px] p-8">
      <div onClick={() => navigate('/launches')} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to your launches
      </div>
      <div className="mb-5 text-[22px] font-bold">{launch.name}</div>

      <div className="mb-6 rounded-card border border-border bg-card p-5 shadow-card">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="text-[13px] font-bold">Description</div>
          {editing ? (
            <div className="flex gap-2.5">
              <div
                onClick={() => {
                  actions.updateDescription(draft);
                  setEditing(false);
                }}
                className="cursor-pointer text-xs font-bold text-accent"
              >
                Save
              </div>
              <div onClick={() => setEditing(false)} className="cursor-pointer text-xs font-semibold text-ink-muted">
                Cancel
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                setDraft(launch.description);
                setEditing(true);
              }}
              className="cursor-pointer text-xs font-bold text-accent"
            >
              Edit
            </div>
          )}
        </div>
        {editing ? (
          <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[90px]" />
        ) : launch.description ? (
          <div className="text-[13.5px] leading-relaxed text-ink">{launch.description}</div>
        ) : (
          <div className="text-[13px] italic text-ink-muted">No description yet.</div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <HubLink title="Launch dashboard →" sub="Your daily task list and updates for this launch" onClick={() => navigate(`/launches/${launchId}/dashboard`)} />
        {showSummary && (
          <HubLink title="Launch summary →" sub="Overall progress, risks and open compliance flags" onClick={() => navigate(`/launches/${launchId}/summary`)} />
        )}
        {showRetro && (
          <HubLink title="Retrospective →" sub="Tag slips and root causes now that this launch is closed" onClick={() => navigate(`/launches/${launchId}/retro`)} />
        )}
        {isLead && (
          <HubLink
            title="Team, leadership & stakeholders →"
            sub="View and edit team, leadership, external contacts, and who can view launch summary/retrospective"
            onClick={() => navigate(`/launches/${launchId}/roster`)}
          />
        )}
      </div>
    </div>
  );
}

function HubLink({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer rounded-card border border-border bg-card p-4.5 shadow-card hover:border-accent">
      <div className="mb-1 text-sm font-bold">{title}</div>
      <div className="text-[12.5px] text-ink-muted">{sub}</div>
    </div>
  );
}
