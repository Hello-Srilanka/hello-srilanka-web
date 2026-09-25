import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { signOut } from '@/app/auth/actions';
import '../auth/auth.css';

export const metadata: Metadata = { title: 'Your account | HelloSriLanka', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  if (!supabaseConfigured()) redirect('/login');
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect('/login');
  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', claims.sub).maybeSingle();
  return <main id="main" className="auth-page"><div className="auth-shell"><Link className="auth-brand" href="/">hello<strong>srilanka</strong><span>.</span></Link><div className="auth-card"><p className="eyebrow">YOUR SPACE</p><h1>Welcome back.</h1><p className="auth-intro">Signed in as {typeof claims.email === 'string' ? claims.email : 'a traveller'}.</p><div className="account-links"><Link href="/plan">Plan a journey →</Link>{admin && <Link href="/admin">Open knowledge admin →</Link>}</div><p className="auth-help">Trip drafts are temporarily saved in your current tab. Account trip history is not enabled yet.</p><form action={signOut}><button className="auth-submit auth-secondary" type="submit">Sign out</button></form></div></div></main>;
}
