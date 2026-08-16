import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { useLaunch, useLaunchActions, useLaunchRosterProfiles } from '@/state/LaunchDataContext';
import { ChecklistBuilder } from '@/components/ChecklistBuilder';
import { PrimaryButton } from '@/components/ui';

export function ChecklistEditorPage() {
  const { id } = useParams();
  const launchId = Number(id);
  const launch = useLaunch(launchId);
  const { currentUser } = useAuth();
  const actions = useLaunchActions(launchId);
  const ownerOptions = useLaunchRosterProfiles(launch);
  const navigate = useNavigate();

  if (!launch) return null;

  return (
    <div className="mx-auto w-full max-w-[880px] p-8 pb-20">
      <div onClick={() => navigate(`/launches/${launchId}`)} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to launch details
      </div>

      <ChecklistBuilder
        launchName={launch.name}
        tasks={launch.tasks}
        ownerOptions={ownerOptions}
        defaultOwnerId={currentUser?.id ?? null}
        onAddTask={(task, insertAfter) => actions.addTask(task, insertAfter)}
        onRenameTask={(taskId, name) => actions.renameTask(taskId, name)}
        onChangeOwner={(taskId, ownerId, ownerName) => actions.changeTaskOwner(taskId, ownerId, ownerName)}
        onChangeDuration={(taskId, durationDays) => actions.changeTaskDuration(taskId, durationDays)}
        onDeleteTask={(taskId) => actions.deleteTask(taskId)}
        onBulkImport={(tasks) => actions.bulkAddTasks(tasks)}
      />

      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={() => navigate(`/launches/${launchId}`)} className="px-5.5 py-3">
          Done
        </PrimaryButton>
      </div>
    </div>
  );
}
