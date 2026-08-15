import { useState } from 'react';
import type { Task } from '@/types';
import { PrimaryButton, TextInput } from '@/components/ui';

const REVIEW_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending review', bg: 'bg-status-risk-bg', text: 'text-status-risk-text' },
  acknowledged: { label: 'Acknowledged', bg: 'bg-status-ontrack-bg', text: 'text-status-ontrack-text' },
  flagged: { label: 'Needs your reply', bg: 'bg-status-blocked-bg', text: 'text-status-blocked-text' },
};

export function ComplianceReviewList({ tasks, onReply }: { tasks: Task[]; onReply: (taskId: number, note: string) => void }) {
  const reviewTasks = tasks.filter((t) => t.reviewStatus !== 'none');
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  return (
    <div className="mb-6 overflow-hidden rounded-card border border-border bg-card shadow-card">
      {reviewTasks.map((t) => {
        const badge = REVIEW_BADGE[t.reviewStatus];
        return (
          <div key={t.id} className="border-b border-border-divider px-4 py-3.5 last:border-b-0">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 text-sm font-semibold">{t.name}</div>
              <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.bg} ${badge.text}`}>{badge.label}</div>
            </div>
            {t.reviewNote && <div className="mt-1 text-[11.5px] text-ink-secondary">💬 {t.reviewNote}</div>}
            {t.reviewStatus === 'flagged' && (
              <div className="mt-2 flex gap-2">
                <TextInput
                  value={drafts[t.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                  placeholder="Reply to compliance"
                  className="flex-1 py-1.5 text-xs"
                />
                <PrimaryButton
                  onClick={() => {
                    onReply(t.id, drafts[t.id] ?? '');
                    setDrafts((d) => ({ ...d, [t.id]: '' }));
                  }}
                  className="whitespace-nowrap px-3 py-1.5 text-xs"
                >
                  Send
                </PrimaryButton>
              </div>
            )}
          </div>
        );
      })}
      {reviewTasks.length === 0 && <div className="px-4 py-4 text-[12.5px] text-ink-muted">No compliance review activity yet.</div>}
    </div>
  );
}
