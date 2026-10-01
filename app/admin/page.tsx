import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { archiveKnowledge, approveKnowledge } from './actions';
import KnowledgeEditor from '@/components/admin/KnowledgeEditor';
import type { KnowledgeRecord } from '@/lib/knowledge/model';
import './admin.css';

export const metadata: Metadata = { title: 'Knowledge admin | HelloSriLanka', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  if (!supabaseConfigured()) redirect('/login');
  const supabase = await createClient();
  const { data: identity } = await supabase.auth.getClaims();
  const claims = identity?.claims;
  if (!claims) redirect('/login');
  const { data: admin, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', claims.sub).maybeSingle();
  if (adminError) return <main id="main" className="knowledge-admin"><p>Knowledge tables are not ready. Apply the Supabase migration, then reload.</p></main>;
  if (!admin) redirect('/account');
  const { data, error } = await supabase.from('knowledge_records').select('*').order('updated_at', { ascending: false }).limit(200);
  const records = (data || []) as KnowledgeRecord[];
  records.sort((a, b) => (a.status === 'draft' ? -1 : 0) - (b.status === 'draft' ? -1 : 0));
  return <main id="main" className="knowledge-admin"><div className="knowledge-wrap"><header><Link className="knowledge-brand" href="/">hello<strong>srilanka</strong><span>.</span></Link><nav><Link href="/account">Account</Link><Link href="/plan">Planner</Link></nav></header><p className="eyebrow">REVIEWED SRI LANKA KNOWLEDGE</p><h1>Knowledge admin.</h1><p className="knowledge-intro">Add one sourced claim per record. Open the source and check the claim before approving. Approved records expire automatically and can guide itinerary research.</p>
    <section className="knowledge-panel"><h2>Add a fact</h2><KnowledgeEditor /></section>
    <section className="knowledge-list"><div className="knowledge-list-heading"><h2>Records</h2><span>{records.length} shown</span></div>{error && <p role="alert">Could not load records: {error.message}</p>}{!error && !records.length && <p>No facts yet. Add a draft above.</p>}
      {records.map(record => <article className="knowledge-record" key={record.id}><div className="knowledge-record-head"><div><span className="knowledge-type">{record.kind}</span><h3>{record.title}</h3><p>{record.destination}{record.related_destination ? ` → ${record.related_destination}` : ''}</p></div><span className={`knowledge-status ${record.status}`}>{record.status}</span></div><p>{record.claim}</p><div className="knowledge-meta"><a href={record.source_url} target="_blank" rel="noopener noreferrer">Open source ↗</a><span>Reviewed: {record.reviewed_at ? new Date(record.reviewed_at).toLocaleDateString('en-GB') : 'not yet'}</span><span>Expires: {record.expires_at ? new Date(record.expires_at).toLocaleDateString('en-GB') : 'not set'}</span><span>v{record.version}</span></div><div className="knowledge-actions"><details><summary>Edit record</summary><KnowledgeEditor record={record} /></details><form action={approveKnowledge.bind(null, record.id)}><button type="submit">{record.status === 'approved' ? 'Review again' : 'Approve after checking source'}</button></form>{record.status !== 'archived' && <form action={archiveKnowledge.bind(null, record.id)}><button type="submit" className="knowledge-archive">Archive</button></form>}</div></article>)}</section></div></main>;
}
