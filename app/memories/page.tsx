import type { Metadata } from 'next';
import Community from '@/components/community/Community';
import '../community/community.css';

export const metadata: Metadata = {
  title: 'Island Memories | HelloSriLanka',
  description: 'Little moments. Lasting memories. Find inspiration in photographs, stories and shared experiences from Sri Lanka.',
  alternates: { canonical: '/memories' },
  openGraph: { title: 'Island Memories | HelloSriLanka', description: 'The journey ends. The feeling stays. A collection of moments from Sri Lanka.', url: '/memories' },
  robots: { index: false, follow: true },
};

export default function MemoriesPage() { return <Community />; }
