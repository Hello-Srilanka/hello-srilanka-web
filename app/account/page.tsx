import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { signOut } from '@/app/auth/actions';
import { Navbar } from '@/components/Navbar';
import { getAccountProfile } from '@/lib/auth/profile';
import { ProfileAvatar } from './ProfileAvatar';
import './account.css';

export const metadata: Metadata = { title: 'Your account | HelloSriLanka', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ page?: string; code?: string }> }) {
  if (!supabaseConfigured()) redirect('/login');
  const params = await searchParams;
  const requestedPage = Number(params.page || '1');
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect('/login');
  if (params.code) redirect('/account');
  const [{ data: account }, { data: admin }, { data: history, error: historyError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('user_id').eq('user_id', claims.sub).maybeSingle(),
    supabase.from('itinerary_history').select('id,title,mode,generated_at').eq('user_id', claims.sub).order('generated_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20),
  ]);
  const profile = getAccountProfile(account.user?.id === claims.sub ? account.user : null, typeof claims.email === 'string' ? claims.email : '');
  const trips = history?.slice(0, 20) ?? [];
  return <><Navbar account /><main id="main" className="profile-page"><div className="profile-shell">
    <div className="profile-header">
      <div><p className="eyebrow">YOUR SPACE</p><h1>Your account</h1>
        <div className="profile-identity"><ProfileAvatar src={profile.avatar} name={profile.name} /><div className="profile-person"><p className="profile-name">{profile.name}</p><p className="profile-email">{profile.email || 'Signed in'}</p>{profile.joined && <p className="profile-joined">Member since {profile.joined}</p>}</div></div>
      </div>
      <form action={signOut}><button type="submit">Sign out</button></form>
    </div>
    <div className="profile-actions">
      <Link className="profile-plan" href="/plan">Plan a trip <span aria-hidden="true">→</span></Link>
      {admin && <Link className="profile-admin" href="/admin">Knowledge admin →</Link>}
    </div>
    <section className="profile-history" aria-labelledby="history-heading">
      <h2 id="history-heading">Saved itineraries</h2>
      {historyError ? <p role="alert">Your trips are temporarily unavailable.</p> : trips.length ? <>
        <ul>{trips.map(trip => <li key={trip.id}><Link href={`/account/itineraries/${trip.id}`}><span><strong>{trip.title}</strong><small>{new Date(trip.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} · {trip.mode === 'sample' ? 'Sample' : 'Personalised'}</small></span><span aria-hidden="true">→</span></Link></li>)}</ul>
        <nav className="profile-history-pages" aria-label="Trip history pages">{page > 1 && <Link href={`/account?page=${page - 1}`}>← Newer</Link>}{history && history.length > 20 && <Link href={`/account?page=${page + 1}`}>Older →</Link>}</nav>
      </> : <p>{page > 1 ? 'No more saved trips.' : 'Your completed trips will appear here.'}</p>}
    </section>
  </div></main></>;
}
