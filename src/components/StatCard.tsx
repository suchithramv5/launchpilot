import type { ReactNode } from 'react';

export function StatCard({ label, value, valueClassName = '', sub }: { label: string; value: ReactNode; valueClassName?: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-card border border-border bg-card p-[18px] shadow-card">
      <div className="mb-2 text-[11px] font-semibold text-ink-muted">{label}</div>
      <div className={`text-[26px] font-bold ${valueClassName}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-tertiary">{sub}</div>}
    </div>
  );
}
