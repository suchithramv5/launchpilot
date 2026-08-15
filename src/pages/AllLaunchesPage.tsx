import { useNavigate } from 'react-router-dom';
import { useLaunches } from '@/state/LaunchDataContext';
import { LaunchCard } from '@/components/LaunchCard';

export function AllLaunchesPage() {
  const launches = useLaunches();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[1000px] p-8">
      <div className="mb-1 text-xl font-bold">All launches</div>
      <div className="mb-6 text-[13px] text-ink-muted">Every product in flight · click one for its overall status summary.</div>
      <div className="flex flex-col gap-3.5">
        {launches.map((l) => (
          <LaunchCard key={l.id} launch={l} actionLabel="view summary →" onClick={() => navigate(`/launches/${l.id}/summary`)} />
        ))}
      </div>
    </div>
  );
}
