'use client';
import { useActionState } from 'react';
import { interests, months } from '@/lib/planner/model';
import { knowledgeKinds, type KnowledgeRecord } from '@/lib/knowledge/model';
import { saveKnowledge, type EditorState } from '@/app/admin/actions';

const initial: EditorState = { message: '', ok: false };
export default function KnowledgeEditor({ record }: { record?: KnowledgeRecord }) {
  const [state, action, pending] = useActionState(saveKnowledge, initial);
  return <form action={action} className="knowledge-editor">{record && <input type="hidden" name="id" value={record.id} />}
    <div className="knowledge-grid"><label>Type<select name="kind" defaultValue={record?.kind || 'activity'}>{knowledgeKinds.map(kind => <option key={kind} value={kind}>{kind}</option>)}</select></label><label>Title<input name="title" maxLength={140} required defaultValue={record?.title || ''} placeholder="e.g. Tea estate visit" /></label><label>Destination or connection from<input name="destination" maxLength={140} required defaultValue={record?.destination || ''} placeholder="e.g. Ella" /></label><label>Connection to (if applicable)<input name="related_destination" maxLength={140} defaultValue={record?.related_destination || ''} placeholder="e.g. Kandy" /></label><label>Duration minutes (optional; verify transport times)<input name="duration_minutes" type="number" min={1} max={720} defaultValue={record?.duration_minutes ?? ''} /></label><label>Source URL<input name="source_url" type="url" required maxLength={1000} defaultValue={record?.source_url || ''} placeholder="https://..." /></label><label>Direct provider URL (required for stays; same as source)<input name="provider_url" type="url" maxLength={1000} defaultValue={record?.provider_url || ''} placeholder="https://..." /></label></div>
    <label>One factual claim<textarea name="claim" minLength={10} maxLength={800} rows={3} required defaultValue={record?.claim || ''} placeholder="Describe exactly what this source supports." /></label>
    <fieldset><legend>Relevant interests</legend><div className="knowledge-checks">{interests.map(([name]) => <label key={name}><input name="interests" type="checkbox" value={name} defaultChecked={record?.interests.includes(name)} />{name}</label>)}</div></fieldset>
    <fieldset><legend>Relevant months (leave blank for year-round)</legend><div className="knowledge-checks">{months.slice(1).map((name, index) => <label key={name}><input name="months" type="checkbox" value={index + 1} defaultChecked={record?.months.includes(index + 1)} />{name}</label>)}</div></fieldset>
    <button type="submit" disabled={pending}>{pending ? 'Saving…' : record ? 'Save as draft' : 'Add draft'}</button>{state.message && <p role={state.ok ? 'status' : 'alert'} className={state.ok ? 'knowledge-success' : 'knowledge-error'}>{state.message}</p>}
  </form>;
}
