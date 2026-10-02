'use client';
/* eslint-disable @next/next/no-img-element -- Preview the exact generated PNG. */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronLeft, ChevronRight, Download, FileImage, FileText, LoaderCircle } from 'lucide-react';
import type { Itinerary } from '@/lib/planner/model';
import { createExport, type ExportImage, type ExportSelection } from '@/lib/planner/export';
import { createExportPdf } from '@/lib/planner/export-pdf';

export default function ExportPreview({ itinerary, initialSelection = 'overview', close }: { itinerary: Itinerary; initialSelection?: ExportSelection; close: () => void }) {
  const [selection, setSelection] = useState<ExportSelection>(initialSelection);
  const [costs, setCosts] = useState(true);
  const [images, setImages] = useState<ExportImage[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const pdfUrl = useRef<string | null>(null);
  const pdfController = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => () => {
    pdfController.current?.abort();
    if (pdfUrl.current) URL.revokeObjectURL(pdfUrl.current);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let created: ExportImage[] = [];
    createExport(itinerary, selection, costs, controller.signal).then(result => {
      created = result;
      if (controller.signal.aborted) { result.forEach(image => URL.revokeObjectURL(image.url)); return; }
      setImages(result); setBusy(false);
    }).catch(error => {
      if (!controller.signal.aborted) { setError(error instanceof Error ? error.message : 'Export failed. Please try again.'); setBusy(false); }
    });
    return () => { controller.abort(); created.forEach(image => URL.revokeObjectURL(image.url)); };
  }, [itinerary, selection, costs, attempt]);
  function prepare() {
    pdfController.current?.abort();
    pdfController.current = null;
    if (pdfUrl.current) URL.revokeObjectURL(pdfUrl.current);
    pdfUrl.current = null;
    setPdfBusy(false); setPdfError(''); setBusy(true); setError(''); setPage(0);
  }
  function savePdf(url: string) {
    const name = typeof selection === 'number' ? `day-${selection}` : selection;
    const link = document.createElement('a');
    link.href = url; link.download = `HelloSriLanka-${name}-journey.pdf`;
    document.body.append(link); link.click(); link.remove();
  }
  async function downloadPdf() {
    if (pdfBusy || !images.length) return;
    if (pdfUrl.current) { savePdf(pdfUrl.current); return; }
    const controller = new AbortController();
    pdfController.current = controller;
    setPdfBusy(true); setPdfError('');
    try {
      const pdf = await createExportPdf(images, controller.signal);
      controller.signal.throwIfAborted();
      pdfUrl.current = URL.createObjectURL(pdf);
      savePdf(pdfUrl.current);
    } catch (error) {
      if (!controller.signal.aborted) setPdfError(error instanceof Error ? error.message : 'The PDF could not be prepared. Please try again.');
    } finally {
      if (pdfController.current === controller) {
        pdfController.current = null;
        if (!controller.signal.aborted) setPdfBusy(false);
      }
    }
  }
  function choose(value: ExportSelection) { if (value !== selection) { prepare(); setSelection(value); } }
  const scope = typeof selection === 'number' ? 'day' : selection;
  const current = images[page];
  const choices = [
    { id: 'overview', title: 'The overview', detail: 'Your route and daily highlights.' },
    { id: 'full', title: 'The full journey', detail: 'Every activity, transfer, stay and travel note.' },
    { id: 'day', title: 'Just one day', detail: 'A daily companion for when you’re out exploring.' },
  ] as const;

  return <section className="journal-export">
    <button type="button" className="plan-back" onClick={close}><ArrowLeft size={17} /> Back to itinerary</button>
    <header className="journal-export-heading"><p className="eyebrow">YOUR JOURNEY, READY TO GO.</p><h1 tabIndex={-1} ref={heading}>Take your journey with you.</h1><p>Your HelloSriLanka journal, ready to save and share.</p></header>
    <div className="journal-export-layout">
      <aside className="journal-export-settings">
        <fieldset><legend>What would you like to save?</legend><div className="journal-export-choices">{choices.map(choice => <label key={choice.id} className={scope === choice.id ? 'selected' : ''}><input type="radio" name="export-scope" value={choice.id} checked={scope === choice.id} onChange={() => choose(choice.id === 'day' ? itinerary.days[0].number : choice.id)} /><span><strong>{choice.title}</strong><small>{choice.detail}</small></span><Check size={17} aria-hidden="true" /></label>)}</div></fieldset>
        {typeof selection === 'number' && <label className="journal-export-day">Choose a day<select value={selection} onChange={event => choose(Number(event.target.value))}>{itinerary.days.map(day => <option value={day.number} key={day.number}>Day {day.number} · {day.destination}</option>)}</select></label>}
        <label className="journal-export-costs"><input type="checkbox" checked={costs} onChange={event => { prepare(); setCosts(event.target.checked); }} /><span><strong>Include estimated costs</strong><small>Known prices and costs still to confirm.</small></span></label>
        <div className="journal-export-format"><FileImage size={22} /><div><strong>Portrait PNG pages + one PDF</strong><p>1440 × 1920 px · HelloSriLanka branded</p><small>Save the whole journey as one PDF or choose individual PNG pages below.</small></div></div>
        <button type="button" className="plan-primary journal-export-pdf" onClick={downloadPdf} disabled={busy || pdfBusy || !!error || !images.length}><FileText size={17} /> {pdfBusy ? 'Preparing your PDF…' : busy ? 'Preparing pages…' : `Download ${images.length === 1 ? 'this page' : `all ${images.length} pages`} as PDF`}</button>
        {pdfError && <p className="journal-export-pdf-error" role="alert">{pdfError}</p>}
        <p className="journal-export-tip"><BookOpen size={19} /> Keep your saved pages handy while travelling, even when you’re offline.</p>
      </aside>
      <div className="journal-export-preview" aria-busy={busy}>
        {busy ? <div className="journal-export-state" role="status"><LoaderCircle size={30} /><h2>Preparing your journal…</h2><p>Arranging your itinerary into readable pages.</p></div> : error ? <div className="journal-export-state" role="alert"><h2>We couldn’t prepare your pages.</h2><p>{error}</p><button type="button" className="plan-primary" onClick={() => { prepare(); setAttempt(value => value + 1); }}>Try again</button></div> : current && <>
          <div className="journal-export-toolbar"><span><strong>Your preview</strong><small>{images.length} PNG {images.length === 1 ? 'page' : 'pages'}</small></span><div className="journal-export-pagination"><button type="button" aria-label="Previous preview page" disabled={page === 0} onClick={() => setPage(value => value - 1)}><ChevronLeft size={18} /></button><label><span className="journal-sr-only">Preview page</span><select aria-label="Preview page" value={page} onChange={event => setPage(Number(event.target.value))}>{images.map((image, index) => <option key={image.url} value={index}>{index + 1} / {images.length}</option>)}</select></label><button type="button" aria-label="Next preview page" disabled={page === images.length - 1} onClick={() => setPage(value => value + 1)}><ChevronRight size={18} /></button></div></div>
          <figure className="journal-export-sheet"><img src={current.url} width={current.width} height={current.height} alt={current.label} /><figcaption aria-live="polite">{current.label}</figcaption></figure>
          <div className="journal-export-actions"><a className="plan-text" href={current.url} download={current.filename}><Download size={16} /> Save page {page + 1} as PNG</a><a className="plan-text" href={current.url} target="_blank" rel="noreferrer">Open full size <ArrowUpRight size={16} /></a></div>
          <p className="journal-export-help">The PDF includes every page shown in this preview. You can still save PNG pages individually.</p>
          {images.length > 1 && <details className="journal-export-all"><summary>Download links for all {images.length} pages</summary><ul>{images.map((image, index) => <li key={image.url}><a href={image.url} download={image.filename}><span>{image.label}</span><Download size={16} aria-label={`Download page ${index + 1}`} /></a></li>)}</ul></details>}
        </>}
      </div>
    </div>
  </section>;
}
