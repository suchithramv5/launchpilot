import type { Launch, User } from '@/types';

export const SEED_USERS: User[] = [
  { id: 1, name: 'Priya Sharma', initial: 'P', email: 'priya@brand.com', role: 'launch_lead', accessTier: 'owner', employeeId: 'EMP-1001', status: 'active' },
  { id: 2, name: 'Rohan Mehta', initial: 'R', email: 'rohan@brand.com', role: 'compliance', accessTier: 'member', employeeId: 'EMP-1002', status: 'active' },
  { id: 3, name: 'Ananya Rao', initial: 'A', email: 'ananya@brand.com', role: 'upstream_ops', accessTier: 'member', employeeId: 'EMP-1003', status: 'active' },
  { id: 4, name: 'Karan Bose', initial: 'K', email: 'karan@brand.com', role: 'marketing', accessTier: 'member', employeeId: 'EMP-1004', status: 'active' },
  { id: 5, name: 'Devika Nair', initial: 'D', email: 'devika@brand.com', role: 'admin', accessTier: 'owner', employeeId: 'EMP-1005', status: 'active' },
];

/** No demo launches — a launch only exists once launch_lead/admin creates one via the Create Launch flow. */
export const SEED_LAUNCHES: Launch[] = [];
