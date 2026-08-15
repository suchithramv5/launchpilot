import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunches } from '@/state/LaunchDataContext';
import { isLaunchOwnerUser, visibleLaunches } from '@/lib/permissions';
import { LaunchCard } from '@/components/LaunchCard';
import { PrimaryButton } from '@/components/ui';

export function LaunchesHomePage() {
  const { currentUser } = useAuth();
  const launches = useLaunches();
  const navigate = useNavigate();
  const isOwner = isLaunchOwnerUser(currentUser);
  const mine = visibleLaunches(launches, currentUser);

  return (
    <div className="mx-auto w-full max-w-[1000px] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-bold">Your launches</div>
          <div className="text-[13px] text-ink-muted">
            {isOwner ? "Priya's parallel product launches · beauty & personal care" : "Launches you're part of · click one to open its details"}
          </div>
        </div>
        {isOwner && <PrimaryButton onClick={() => navigate('/launches/new')}>+ New launch</PrimaryButton>}
      </div>
      <div className="flex flex-col gap-3.5">
        {mine.map((l) => (
          <LaunchCard key={l.id} launch={l} actionLabel="view details →" onClick={() => navigate(`/launches/${l.id}`)} />
        ))}
        {mine.length === 0 && <div className="text-[13px] text-ink-muted">No launches yet.</div>}
      </div>
    </div>
  );
}
