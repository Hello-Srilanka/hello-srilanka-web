import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, readdir, unlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPreferences, validatePreferences, type Itinerary } from '@/lib/planner/model';
import { finalize } from '@/lib/planner/validation';
import { sampleDraft } from '@/lib/planner/sample';
import { type AiCallMetrics } from '@/lib/planner/provider';
import { generateLiveItinerary } from '@/lib/planner/generate';

export const runtime = 'nodejs';
export const maxDuration = 240;
export const dynamic = 'force-dynamic';
const directory = process.env.ITINERARY_CACHE_DIR || join(tmpdir(), 'hellosrilanka-itineraries-v1');
const ttl = 24 * 60 * 60 * 1000;
type Job = { hash: string; started: number; stage: string; result?: Itinerary; error?: string };
const sampleMode = () => process.env.ITINERARY_MODE === 'sample' || !process.env.OPENAI_API_KEY;
const idPattern = /^[a-f0-9-]{36}$/;
const rates = new Map<string, { count: number; reset: number }>();
async function save(id: string, job: Job) {
  const temp = join(directory, `${id}.tmp`);
  await writeFile(temp, JSON.stringify(job), { mode: 0o600 });
  await rename(temp, join(directory, `${id}.json`));
}
async function getJob(id: string): Promise<Job | null> {
  try { return JSON.parse(await readFile(join(directory, `${id}.json`), 'utf8')); } catch { return null; }
}
export async function GET() { return Response.json({ mode: sampleMode() ? 'sample' : 'live' }, { headers: { 'Cache-Control': 'no-store' } }); }
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  // Next may internally normalize request.url to localhost; compare the public Host.
  if (origin) {
    try { if (new URL(origin).host !== request.headers.get('host')) throw new Error(); }
    catch { return Response.json({ error: 'Please generate from the HelloSriLanka planner.' }, { status: 403 }); }
  }
  let id: string, p: ReturnType<typeof readPreferences>;
  try {
    if (Number(request.headers.get('content-length')) > 14000) throw new Error('The request is too large.');
    const text = await request.text();
    if (text.length > 14000) throw new Error('The request is too large.');
    const body = JSON.parse(text);
    id = body.id;
    if (typeof id !== 'string' || !idPattern.test(id)) throw new Error('Invalid request ID. Start again from review.');
    p = readPreferences(body.preferences);
    const errors = validatePreferences(p);
    if (Object.keys(errors).length) return Response.json({ error: Object.values(errors).join(' '), fields: errors }, { status: 400 });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : 'Invalid request.' }, { status: 400 }); }
  const mode = sampleMode() ? 'sample' : 'live';
  const hash = createHash('sha256').update(JSON.stringify(p) + mode).digest('hex');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  // Completed responses and leases survive process restarts. Remove expired records.
  for (const name of await readdir(directory)) {
    if (!/^[a-f0-9-]{36}\.(json|tmp)$/.test(name)) continue;
    const file = join(directory, name);
    try { if (Date.now() - (await stat(file)).mtimeMs > ttl) await unlink(file); } catch { /* Another request may have removed it. */ }
  }
  let owner = false;
  let job: Job = { hash, started: Date.now(), stage: 'Checking your preferences' };
  try {
    await writeFile(join(directory, `${id}.json`), JSON.stringify(job), { flag: 'wx', mode: 0o600 });
    owner = true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') return Response.json({ error: 'Trip storage is temporarily unavailable. Your answers are safe on this device.' }, { status: 503 });
    const existing = await getJob(id);
    if (!existing) return Response.json({ error: 'Your request is being saved. Please retry.' }, { status: 503 });
    if (existing.hash !== hash) return Response.json({ error: 'Preferences changed. Return to review before generating again.' }, { status: 409 });
    job = existing;
  }
  if (owner && mode === 'live') {
    // A deployment-level rate limiter should supplement this single-process limit.
    const client = createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0] || 'local').digest('hex');
    const now = Date.now();
    for (const [key, value] of rates) if (value.reset < now) rates.delete(key);
    const rate = rates.get(client) || { count: 0, reset: now + 3600000 };
    rate.count++; rates.set(client, rate);
    if (rate.count > 10) { job.error = 'You have reached the hourly planning limit. Please try again later.'; await save(id, job); }
  }
  const encoder = new TextEncoder();
  let connected = true;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => { if (connected) { try { controller.enqueue(encoder.encode(JSON.stringify(data) + '\n')); } catch { connected = false; } } };
      const stage = async (value: string) => { job.stage = value; await save(id, job); send({ stage: value }); };
      send({ stage: job.stage, mode });
      if (owner && !job.error) {
        const generationStarted = Date.now();
        const aiMetrics: AiCallMetrics[] = [];
        const telemetry = { requestId: id, record: (value: AiCallMetrics) => aiMetrics.push(value) };
        const logTotal = () => {
          if (!aiMetrics.length) return;
          const total = (key: 'inputTokens' | 'cachedInputTokens' | 'cacheWriteTokens' | 'outputTokens' | 'webSearchCalls') => aiMetrics.reduce((sum, value) => sum + value[key], 0);
          const knownCost = aiMetrics.every(value => value.estimatedCostUsd !== null);
          const cost = aiMetrics.reduce((sum, value) => sum + (value.estimatedCostUsd || 0), 0);
          const models = [...new Set(aiMetrics.map(value => value.model))].join('+');
          const durationMs = Date.now() - generationStarted;
          console.info(`[AI usage] request_id=${id} stage=total model=${models} input_tokens=${total('inputTokens')} cached_input_tokens=${total('cachedInputTokens')} cache_write_tokens=${total('cacheWriteTokens')} output_tokens=${total('outputTokens')} web_search_calls=${total('webSearchCalls')} estimated_cost_usd=${knownCost ? cost.toFixed(6) : 'unavailable'} time_ms=${durationMs} time_seconds=${(durationMs / 1000).toFixed(2)}`);
        };
        try {
          const signal = AbortSignal.timeout(200000);
          if (mode === 'sample') {
            await stage('Preparing your sample itinerary');
            await stage('Checking days, connections and cost estimates');
            job.result = finalize(sampleDraft(p), p, [], id, mode);
          } else job.result = (await generateLiveItinerary(p, id, signal, telemetry, stage)).itinerary;
          job.stage = 'Your itinerary is ready';
          await save(id, job);
          logTotal();
        } catch (e) {
          job.error = e instanceof Error && /timeout|abort/i.test(e.name + e.message) ? 'Research took too long. Please retry; your preferences are kept temporarily in this tab.' : e instanceof Error ? e.message : 'We could not complete your itinerary. Please retry.';
          await save(id, job);
          logTotal();
        }
      } else if (!job.result && !job.error) {
        // A retry joins the original lease instead of starting another paid request.
        while (!job.result && !job.error && Date.now() - job.started < 220000) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const latest = await getJob(id);
          if (latest) { if (latest.stage !== job.stage) send({ stage: latest.stage }); job = latest; }
        }
      }
      if (job.result) send({ result: job.result });
      else send({ error: job.error || 'This request stopped before it finished. You can safely retry now.', terminal: true });
      if (connected) { try { controller.close(); } catch { /* Client disconnected. */ } }
    },
    cancel() { connected = false; },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
}
