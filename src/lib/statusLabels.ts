import type { ReviewStatus, SubtaskStatus, TaskStatus } from '@/types';

export function badgeStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'blocked':
      return 'Blocked';
    case 'at risk':
      return 'At risk';
    case 'completed':
      return 'Completed';
    case 'not_started':
      return 'Not Started';
    default:
      return 'On track';
  }
}

export interface BadgeStyle {
  label: string;
  bg: string;
  text: string;
}

export function taskBadgeStyle(status: TaskStatus): BadgeStyle {
  switch (status) {
    case 'blocked':
      return { label: 'Blocked', bg: 'bg-status-blocked-bg', text: 'text-status-blocked-text' };
    case 'at risk':
      return { label: 'At risk', bg: 'bg-status-risk-bg', text: 'text-status-risk-text' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-accent/10', text: 'text-accent' };
    case 'not_started':
      return { label: 'Not Started', bg: 'bg-status-notstarted-bg', text: 'text-status-notstarted-text' };
    default:
      return { label: 'On track', bg: 'bg-status-ontrack-bg', text: 'text-status-ontrack-text' };
  }
}

export function subtaskBadgeStyle(status: SubtaskStatus): BadgeStyle {
  switch (status) {
    case 'flagged':
      return { label: 'Flagged', bg: 'bg-status-blocked-bg', text: 'text-status-blocked-text' };
    case 'closed':
      return { label: 'Closed', bg: 'bg-status-ontrack-bg', text: 'text-status-ontrack-text' };
    case 'in_progress':
      return { label: 'In progress', bg: 'bg-status-risk-bg', text: 'text-status-risk-text' };
    default:
      return { label: 'Open', bg: 'bg-status-neutral-bg', text: 'text-ink-tertiary' };
  }
}

/** For a locked task's review-status pill on the checklist rows ("Pending sign-off" / "Signed off" / "Flagged by compliance"). */
export function lockBadgeStyle(reviewStatus: ReviewStatus): BadgeStyle | null {
  switch (reviewStatus) {
    case 'flagged':
      return { label: 'Flagged by compliance', bg: 'bg-status-blocked-bg', text: 'text-status-blocked-text' };
    case 'acknowledged':
      return { label: 'Signed off', bg: 'bg-status-ontrack-bg', text: 'text-status-ontrack-text' };
    case 'pending':
      return { label: 'Pending sign-off', bg: 'bg-status-neutral-bg', text: 'text-ink-tertiary' };
    default:
      return null;
  }
}

export function complianceFlagBadgeStyle(status: 'open' | 'resolved'): BadgeStyle {
  return status === 'open'
    ? { label: 'Open', bg: 'bg-status-risk-bg', text: 'text-status-risk-text' }
    : { label: 'Resolved', bg: 'bg-status-ontrack-bg', text: 'text-status-ontrack-text' };
}

export const TASK_STATUS_OPTIONS: TaskStatus[] = ['not_started', 'on track', 'at risk', 'blocked', 'completed'];
export const SUBTASK_STATUS_OPTIONS: { value: SubtaskStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
];
