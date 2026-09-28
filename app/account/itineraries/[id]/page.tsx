import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import type { Itinerary } from '@/lib/planner/model';
import SavedItinerary from '@/components/planner/SavedItinerary';
import '../../../plan/planner.css';
import '../../../plan/journal.css';
import '../saved.css';

export const metadata: Metadata = { title: 'Saved journey | HelloSriLanka', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SavedItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigured()) redirect('/login');
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims) redirect('/login');
  const { data } = await supabase.from('itinerary_history').select('itinerary').eq('user_id', claims.sub).eq('id', id).maybeSingle();
  const itinerary = data?.itinerary as Itinerary | undefined;
  if (!itinerary || itinerary.version !== 1 || itinerary.id !== id || !Array.isArray(itinerary.days) || !Array.isArray(itinerary.sources) || !itinerary.preferences) notFound();
  return <SavedItinerary itinerary={itinerary} />;
}
