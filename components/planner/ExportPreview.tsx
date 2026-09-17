'use client';
/* eslint-disable @next/next/no-img-element -- Preview the exact generated PNG, not a remote image. */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Image as ImageIcon } from 'lucide-react';
import type { Itinerary } from '@/lib/planner/model';
import { createExport, type ExportImage } from '@/lib/planner/export';
export default function ExportPreview({ itinerary, close }: { itinerary: Itinerary; close: () => void }) {
  const [selection, setSelection] = useState<number | 'overview'>('overview');
  const [costs, setCosts] = useState(true);
  const [images, setImages] = useState<ExportImage[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => {
    let active = true; let created: ExportImage[] = [];
    createExport(itinerary, selection, costs).then(result => {
      created = result;
      if (!active) { result.forEach(i => URL.revokeObjectURL(i.url)); return; }
      setImages(result); setBusy(false);
    }).catch(e => { if (active) { setError(e instanceof Error ? e.message : 'Export failed. Please try again.'); setBusy(false); } });
    return () => { active = false; created.forEach(i => URL.revokeObjectURL(i.url)); };
  }, [itinerary, selection, costs, attempt]);
  return <section className="export-page"><button className="plan-back" onClick={close}><ArrowLeft size={17} /> Back to itinerary</button><div className="export-heading"><p className="eyebrow">TAKE YOUR SRI LANKA WITH YOU</p><h1 tabIndex={-1} ref={heading}>A journey worth keeping.</h1><p>Your itinerary, ready to save. Portrait PNGs with room for every detail.</p></div><div className="export-controls"><label>Choose your image<select value={selection} onChange={e => { setBusy(true); setError(''); setSelection(e.target.value === 'overview' ? 'overview' : Number(e.target.value)); }}><option value="overview">Whole-trip overview</option>{itinerary.days.map(d => <option value={d.number} key={d.number}>Day {d.number} · {d.destination}</option>)}</select></label><label className="check-row"><input type="checkbox" checked={costs} onChange={e => { setBusy(true); setError(''); setCosts(e.target.checked); }} /> Include estimated costs</label><span><ImageIcon size={16} /> 1440 × 1920 px</span></div>
    {busy ? <p className="export-status" role="status">Preparing your images and fonts…</p> : error ? <div className="plan-error" role="alert"><p>{error}</p><button className="plan-text" onClick={() => { setError(''); setBusy(true); setAttempt(v => v + 1); }}>Try again</button></div> : <><p className="export-help">{images.length} {images.length === 1 ? 'image' : 'images'} · Long content is split into readable pages. On mobile, download each image or open it and save to Photos.</p><div className="export-previews">{images.map(img => <figure key={img.url}><img src={img.url} width={img.width} height={img.height} alt={img.label} /><figcaption><strong>{img.label}</strong><a className="plan-primary" href={img.url} download={img.filename}><Download size={17} /> Download PNG</a><a className="plan-text" href={img.url} target="_blank" rel="noreferrer">Open full-size image</a></figcaption></figure>)}</div></>}
  </section>;
}
