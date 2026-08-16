import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton, TextInput } from '@/components/ui';

export function UpdatePasswordPage() {
  const { hasSession, passwordRecovery, currentUser, updatePassword, logout } = useAuth();
  const navigate = useNavigate();
  const forcedChange = !!currentUser?.mustChangePassword;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }
    setDone(true);
  }

  if (done) {
    if (forcedChange) {
      return (
        <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
          <div className="mb-1 text-xl font-bold">Password set</div>
          <div className="mb-5 text-[13px] text-ink-tertiary">You&apos;re all set — continuing to LaunchPilot.</div>
          <PrimaryButton onClick={() => navigate('/launches')} className="w-full">
            Continue
          </PrimaryButton>
        </div>
      );
    }
    return (
      <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
        <div className="mb-1 text-xl font-bold">Password updated</div>
        <div className="mb-5 text-[13px] text-ink-tertiary">You can now log in with your new password.</div>
        <PrimaryButton
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="w-full"
        >
          Back to log in
        </PrimaryButton>
      </div>
    );
  }

  if (!hasSession || (!passwordRecovery && !forcedChange)) {
    return (
      <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
        <div className="mb-1 text-xl font-bold">Reset link not found</div>
        <div className="mb-5 text-[13px] text-ink-tertiary">
          This page only works when you arrive here from a password-reset or invite email link. Request a new one from the login screen.
        </div>
        <PrimaryButton onClick={() => navigate('/reset-password')} className="w-full">
          Request a reset link
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
      <div className="mb-1 text-xl font-bold">{forcedChange ? 'Set your password' : 'Set a new password'}</div>
      <div className="mb-5 text-[13px] text-ink-tertiary">
        {forcedChange ? 'Welcome to LaunchPilot — choose a password to finish setting up your account.' : 'Choose a new password for your account.'}
      </div>

      <div className="mb-1.5 text-xs font-semibold text-ink-secondary">New password</div>
      <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mb-3.5" />
      <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Confirm password</div>
      <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className="mb-1.5" onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div className="mb-3.5 text-[11.5px] text-ink-faint">At least 8 characters.</div>
      {error && <div className="mb-3 text-[12.5px] text-status-blocked-text">{error}</div>}
      <PrimaryButton onClick={submit} disabled={submitting} className="w-full">
        {submitting ? 'Please wait…' : 'Update password'}
      </PrimaryButton>
    </div>
  );
}
