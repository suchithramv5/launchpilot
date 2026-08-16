import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton, SecondaryButton, TextInput } from '@/components/ui';

export function ResetPasswordPage() {
  const { requestReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit() {
    const result = await requestReset(email);
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
      <div onClick={() => navigate('/login')} className="mb-4.5 cursor-pointer text-[13px] font-semibold text-ink-tertiary">
        ← back to log in
      </div>
      <div className="mb-1 text-xl font-bold">Reset your password</div>
      <div className="mb-6 text-[13px] text-ink-tertiary">
        Works for any role — enter the email on your account and we&apos;ll send reset instructions.
      </div>

      {sent ? (
        <>
          <div className="mb-4.5 rounded-control bg-status-ontrack-bg px-3.5 py-3.5 text-[13.5px] text-status-ontrack-text">
            ✓ Reset instructions sent to {email}. Check your inbox for the link.
          </div>
          <SecondaryButton onClick={() => navigate('/login')} className="w-full text-center">
            Back to log in
          </SecondaryButton>
        </>
      ) : (
        <>
          <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Email</div>
          <TextInput
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="you@brand.com"
            className="mb-3.5"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {error && <div className="mb-3 text-[12.5px] text-status-blocked-text">{error}</div>}
          <PrimaryButton onClick={submit} className="w-full">
            Send reset link
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
