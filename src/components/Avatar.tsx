export function Avatar({ initial, size = 30, accent = false }: { initial: string; size?: number; accent?: boolean }) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${
        accent ? 'bg-accent text-white' : 'bg-border-input text-ink-tertiary'
      }`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.42) }}
    >
      {initial}
    </div>
  );
}
