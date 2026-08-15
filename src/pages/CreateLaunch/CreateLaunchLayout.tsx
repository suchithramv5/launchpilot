import { Outlet } from 'react-router-dom';
import { CreateLaunchProvider } from '@/state/CreateLaunchContext';

export function CreateLaunchLayout() {
  return (
    <CreateLaunchProvider>
      <Outlet />
    </CreateLaunchProvider>
  );
}
