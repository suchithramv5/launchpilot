function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Relative-then-absolute trail timestamp label, e.g. "5 hours ago", "Yesterday, 4:12 PM", "Aug 2, 8:05 PM". */
export function formatTrailTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return `Yesterday, ${formatClock(timestamp)}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formatClock(timestamp)}`;
}
