'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GoogleOneTap from './GoogleOneTap';

export default function AuthForm({ mode, configured, googleClientId, message }: { mode: 'login' | 'signup'; configured: boolean; googleClientId?: string; message?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(message === 'confirmation-failed' ? 'That confirmation link could not be used. Please try signing in.' : '');
  const [error, setError] = useState('');
  const signup = mode === 'signup';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (!configured) { setError('Supabase is not configured yet.'); return; }
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      if (signup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (authError) throw authError;
        if (!data.session) { setNotice('Check your inbox for a confirmation link, then sign in.'); return; }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
      router.replace('/account'); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not continue. Please try again.'); }
    finally { setBusy(false); }
  }
  async function continueWithGoogle() {
    if (!configured) { setError('Supabase is not configured yet.'); return; }
    setError(''); setBusy(true);
    try {
      const { error: authError } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start Google sign-in. Please try again.');
      setBusy(false);
    }
  }
  return <main id="main" className="auth-page"><div className="auth-shell"><Link className="auth-brand" href="/">hello<strong>srilanka</strong><span>.</span></Link><div className="auth-card"><p className="eyebrow">YOUR SRI LANKA. YOUR WAY.</p><h1>{signup ? 'Make an account.' : 'Welcome back.'}</h1><p className="auth-intro">{signup ? 'Create an account to access your travel space.' : 'Sign in to your HelloSriLanka account.'}</p>
    {!configured && <p className="auth-message" role="alert">Account sign-in is awaiting Supabase setup. Add the project URL and publishable key to the server environment.</p>}
    {notice && <p className="auth-message" role="status">{notice}</p>}{error && <p className="auth-message auth-error" role="alert">{error}</p>}
    {configured && googleClientId && <><GoogleOneTap clientId={googleClientId} onError={setError} /><button className="auth-google" type="button" disabled={busy} onClick={continueWithGoogle}>Continue with Google</button><p className="auth-divider"><span>or continue with email</span></p></>}
    <form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={event => setPassword(event.target.value)} /><button className="auth-submit" type="submit" disabled={busy || !configured}>{busy ? 'Working…' : signup ? 'Create account' : 'Sign in'}</button></form>
    <p className="auth-switch">{signup ? 'Already have an account?' : 'New here?'} <Link href={signup ? '/login' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link></p></div><Link className="auth-back" href="/plan">← Back to the planner</Link></div></main>;
}
