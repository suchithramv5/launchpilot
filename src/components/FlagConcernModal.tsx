import { useState } from 'react';
import { FLAG_REASONS } from '@/types';
import { PrimaryButton, SecondaryButton, Select, TextArea } from '@/components/ui';

export function FlagConcernModal({
  itemName,
  onClose,
  onSubmit,
}: {
  itemName: string;
  onClose: () => void;
  onSubmit: (reason: string, detail: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');

  function submit() {
    if (!reason) return;
    onSubmit(reason, detail);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="w-[440px] rounded-modal border border-border bg-white p-6 shadow-modal">
        <div className="mb-1 text-[17px] font-bold">Flag a concern</div>
        <div className="mb-5 text-[13px] text-ink-tertiary">{itemName} — routes back to the task owner and is visible to the launch lead.</div>

        <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Reason category</div>
        <Select value={reason} onChange={(e) => setReason(e.target.value)} className="mb-4 w-full">
          <option value="">Select a reason…</option>
          {FLAG_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Detail (optional)</div>
        <TextArea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Add any specifics for the owner" className="mb-5 min-h-[70px]" />

        <div className="flex justify-end gap-2.5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={!reason}>
            Submit flag
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
