import type { Metadata } from 'next';
import AuthForm from '@/components/auth/AuthForm';
import { supabaseConfigured } from '@/lib/supabase/config';
import '../auth/auth.css';

export const metadata: Metadata = { title: 'Create account | HelloSriLanka', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function SignupPage() { return <AuthForm mode="signup" configured={supabaseConfigured()} />; }
