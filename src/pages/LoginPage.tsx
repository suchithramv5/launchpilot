import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton, TextInput } from '@/components/ui';

export function LoginPage() {
  const { login, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signedUp, setSignedUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError('');
    if (mode === 'login') {
      const result = await login(email, password);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        return;
      }
      navigate('/launches');
    } else {
      const result = await signUp(email, password, name);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        return;
      }
      setSignedUp(true);
    }
  }

  if (signedUp) {
    return (
      <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-accent text-xl font-bold text-white">L</div>
        <div className="mb-1 text-xl font-bold">Check your email</div>
        <div className="mb-5 text-[13px] text-ink-tertiary">
          We sent a confirmation link to {email}. Click it, then come back and log in.
        </div>
        <PrimaryButton
          onClick={() => {
            setSignedUp(false);
            setMode('login');
          }}
          className="w-full"
        >
          Back to log in
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="mx-auto my-16 max-w-[460px] rounded-modal border border-border bg-white p-10 shadow-[0_4px_16px_rgba(32,29,25,0.06)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-accent text-xl font-bold text-white">L</div>
      <div className="mb-1 text-xl font-bold">{mode === 'login' ? 'Log in to LaunchPilot' : 'Create your LaunchPilot account'}</div>
      <div className="mb-5 text-[13px] text-ink-tertiary">
        {mode === 'login' ? 'Your assigned role decides which screen you land on.' : "If an admin already granted you access, you'll land with that role automatically."}
      </div>

      {mode === 'signup' && (
        <>
          <div className="mb-1.5 text-xs font-semibold text-ink-secondary">Name</div>
          <TextInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Your name"
            className="mb-3.5"
          />
        </>
      )}

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
      <PrimaryButton onClick={submit} disabled={submitting} className="mb-2.5 w-full">
        {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
      </PrimaryButton>

      {mode === 'login' ? (
        <>
          <div className="mb-2 text-center">
            <Link to="/reset-password" className="text-[12.5px]">
              Forgot password?
            </Link>
          </div>
          <div className="text-center text-[12.5px] text-ink-tertiary">
            New here?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode('signup');
                setError('');
              }}
            >
              Create an account
            </a>
          </div>
        </>
      ) : (
        <div className="text-center text-[12.5px] text-ink-tertiary">
          Already have an account?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMode('login');
              setError('');
            }}
          >
            Log in
          </a>
        </div>
      )}
    </div>
  );
}
