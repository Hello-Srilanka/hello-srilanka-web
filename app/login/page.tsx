import type { Metadata } from 'next';
import AuthForm from '@/components/auth/AuthForm';
import { supabaseConfigured } from '@/lib/supabase/config';
import '../auth/auth.css';

export const metadata: Metadata = { title: 'Sign in | HelloSriLanka', robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <AuthForm mode="login" configured={supabaseConfigured()} googleClientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} message={message} />;
}
