import { useAuth } from '@/state/AuthContext';
import { DailyDashboardPage } from './DailyDashboardPage';
import { ComplianceDashboardPage } from './ComplianceDashboardPage';
import { UpstreamDashboardPage } from './UpstreamDashboardPage';
import { MarketingDashboardPage } from './MarketingDashboardPage';
import { ComingSoonPage } from './ComingSoonPage';

export function DashboardRouterPage() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  switch (currentUser.role) {
    case 'launch_lead':
    case 'admin':
      return <DailyDashboardPage />;
    case 'compliance':
      return <ComplianceDashboardPage />;
    case 'upstream_ops':
      return <UpstreamDashboardPage />;
    case 'marketing':
      return <MarketingDashboardPage />;
    default:
      return <ComingSoonPage label="Dashboard" />;
  }
}
