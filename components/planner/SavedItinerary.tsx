'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import type { Itinerary } from '@/lib/planner/model';
import ItineraryView from './ItineraryView';

export default function SavedItinerary({ itinerary }: { itinerary: Itinerary }) {
  const router = useRouter();
  return <div className="planner-app saved-itinerary-page"><Navbar account /><main id="main"><div className="saved-itinerary-back"><Link href="/account">← Back to your account</Link></div><ItineraryView itinerary={itinerary} newTrip={() => router.push('/plan')} /></main></div>;
}
