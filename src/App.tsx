import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from '@/components/Shell';
import { RequireAuth } from '@/routes/RequireAuth';
import { RequireRole } from '@/routes/RequireRole';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { LaunchesHomePage } from '@/pages/LaunchesHomePage';
import { AllLaunchesPage } from '@/pages/AllLaunchesPage';
import { LaunchDetailPage } from '@/pages/LaunchDetailPage';
import { SummaryPage } from '@/pages/SummaryPage';
import { CreateLaunchLayout } from '@/pages/CreateLaunch/CreateLaunchLayout';
import { DetailsStep } from '@/pages/CreateLaunch/DetailsStep';
import { ChecklistStep } from '@/pages/CreateLaunch/ChecklistStep';
import { TeamStep } from '@/pages/CreateLaunch/TeamStep';
import { ConfirmPage } from '@/pages/CreateLaunch/ConfirmPage';
import { DashboardRouterPage } from '@/pages/DashboardRouterPage';
import { TrailPage } from '@/pages/TrailPage';
import { RetroPage } from '@/pages/RetroPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { RosterPage } from '@/pages/RosterPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<Shell />}>
          <Route path="/" element={<Navigate to="/launches" replace />} />
          <Route path="/launches" element={<LaunchesHomePage />} />
          <Route path="/launches/all" element={<AllLaunchesPage />} />

          <Route element={<RequireRole roles={['launch_lead', 'admin']} />}>
            <Route element={<CreateLaunchLayout />}>
              <Route path="/launches/new" element={<DetailsStep />} />
              <Route path="/launches/new/checklist" element={<ChecklistStep />} />
              <Route path="/launches/new/team" element={<TeamStep />} />
            </Route>
          </Route>

          <Route path="/launches/:id" element={<LaunchDetailPage />} />
          <Route path="/launches/:id/confirm" element={<ConfirmPage />} />
          <Route path="/launches/:id/dashboard" element={<DashboardRouterPage />} />
          <Route path="/launches/:id/trail" element={<TrailPage />} />
          <Route path="/launches/:id/retro" element={<RetroPage />} />
          <Route path="/launches/:id/summary" element={<SummaryPage />} />

          <Route element={<RequireRole roles={['launch_lead', 'admin']} />}>
            <Route path="/launches/:id/roster" element={<RosterPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
