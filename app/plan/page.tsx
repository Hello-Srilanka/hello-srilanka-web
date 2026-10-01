import type { Metadata } from 'next';
import Planner from '@/components/planner/Planner';
import './planner.css';
import './generation.css';
import './journal.css';
export const metadata: Metadata = { title: 'Plan your journey | HelloSriLanka', description: 'Your Sri Lanka. Your way. Create a personalised journey around the things you love.', alternates: { canonical: '/plan' }, robots: { index: false, follow: true } };
export default function PlanPage() { return <Planner />; }
