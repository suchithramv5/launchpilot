import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export function PrimaryButton({ className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={twMerge(
        'rounded-control bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    />
  );
}

export function SecondaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={twMerge(
        'rounded-control border border-border-input px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#f3f1ec] disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    />
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={twMerge('w-full rounded-control border border-border-input px-3 py-2.5 text-sm outline-none focus:border-accent', className)}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={twMerge('rounded-control border border-border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-accent', className)}
    >
      {children}
    </select>
  );
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={twMerge('w-full resize-y rounded-control border border-border-input px-3 py-2.5 text-sm outline-none focus:border-accent', className)}
    />
  );
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={twMerge('rounded-card border border-border bg-card shadow-card', className)}>{children}</div>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold text-ink-secondary">{children}</div>;
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-4 py-4 text-[13px] text-ink-muted">{children}</div>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <div className="mb-3 text-[12.5px] text-status-blocked-text">{children}</div>;
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return <div className="mb-4 rounded-control bg-status-ontrack-bg px-3.5 py-2.5 text-[13px] font-semibold text-status-ontrack-text">{children}</div>;
}

export function LockNotice({ children }: { children: ReactNode }) {
  return <div className="text-[12.5px] text-ink-muted">🔒 {children}</div>;
}
