export function ComingSoonPage({ label }: { label: string }) {
  return (
    <div className="mx-auto w-full max-w-[720px] p-8">
      <div className="rounded-card border border-border bg-card p-6 text-sm text-ink-muted shadow-card">{label} — under construction.</div>
    </div>
  );
}
