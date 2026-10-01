'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { parseKnowledgeForm, type KnowledgeKind } from '@/lib/knowledge/model';

export type EditorState = { message: string; ok: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function adminClient() {
  if (!supabaseConfigured()) redirect('/login');
  const supabase = await createClient();
  const { data: identity } = await supabase.auth.getClaims();
  const claims = identity?.claims;
  if (!claims) redirect('/login');
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', claims.sub).maybeSingle();
  if (error || !data) redirect('/account');
  return { supabase, userId: claims.sub };
}

export async function saveKnowledge(_state: EditorState, form: FormData): Promise<EditorState> {
  const { supabase } = await adminClient();
  try {
    const values = parseKnowledgeForm(form);
    const id = String(form.get('id') || '');
    const result = id
      ? uuid.test(id) ? await supabase.from('knowledge_records').update({ ...values, status: 'draft', reviewed_at: null, reviewed_by: null, expires_at: null }).eq('id', id).select('id').single() : { error: { message: 'Invalid record ID.' } }
      : await supabase.from('knowledge_records').insert({ ...values, status: 'draft' }).select('id').single();
    if (result.error) return { message: result.error.message, ok: false };
    revalidatePath('/admin');
    return { message: id ? 'Changes saved as a draft. Review and approve again.' : 'Draft saved. Open its source before approving.', ok: true };
  } catch (cause) { return { message: cause instanceof Error ? cause.message : 'Could not save the record.', ok: false }; }
}

function reviewDays(kind: KnowledgeKind) { return kind === 'stay' ? 30 : kind === 'connection' ? 60 : kind === 'destination' ? 180 : 90; }

export async function approveKnowledge(id: string) {
  const { supabase, userId } = await adminClient();
  if (!uuid.test(id)) return;
  const { data, error } = await supabase.from('knowledge_records').select('kind,source_url,claim,provider_url').eq('id', id).single();
  if (error || !data || !data.source_url || !data.claim) return;
  const now = new Date();
  const expires = new Date(now.getTime() + reviewDays(data.kind as KnowledgeKind) * 86400000);
  const { error: updateError } = await supabase.from('knowledge_records').update({ status: 'approved', retrieved_at: now.toISOString(), reviewed_at: now.toISOString(), reviewed_by: userId, expires_at: expires.toISOString() }).eq('id', id);
  if (updateError) throw new Error(`Could not approve this record: ${updateError.message}`);
  revalidatePath('/admin');
}

export async function archiveKnowledge(id: string) {
  const { supabase } = await adminClient();
  if (!uuid.test(id)) return;
  const { error } = await supabase.from('knowledge_records').update({ status: 'archived' }).eq('id', id);
  if (error) throw new Error(`Could not archive this record: ${error.message}`);
  revalidatePath('/admin');
}
