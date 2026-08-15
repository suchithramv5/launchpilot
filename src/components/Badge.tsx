import type { BadgeStyle } from '@/lib/statusLabels';

export function Badge({ style, size = 'md' }: { style: BadgeStyle; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-bold ${style.bg} ${style.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      {style.label}
    </span>
  );
}
