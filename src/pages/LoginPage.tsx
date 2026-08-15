import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton, TextInput } from '@/components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit() {
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }
    navigate('/launches');
  }

  return (
    <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-accent text-xl font-bold text-white">L</div>
      <div className="mb-1 text-xl font-bold">Log in to LaunchPilot</div>
      <div className="mb-5 text-[13px] text-ink-tertiary">Your assigned role decides which screen you land on.</div>

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
      <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Password</div>
      <TextInput
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError('');
        }}
        placeholder="••••••••"
        className="mb-1.5"
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <div className="mb-3.5 text-[11.5px] text-ink-faint">At least 8 characters.</div>
      {error && <div className="mb-3 text-[12.5px] text-status-blocked-text">{error}</div>}
      <PrimaryButton onClick={submit} className="mb-2.5 w-full">
        Log in
      </PrimaryButton>
      <div className="mb-2 text-center">
        <Link to="/reset-password" className="text-[12.5px]">
          Forgot password?
        </Link>
      </div>
      <div className="mt-4 text-center text-xs text-ink-faint">Roles are assigned by an admin or launch lead.</div>
    </div>
  );
}
