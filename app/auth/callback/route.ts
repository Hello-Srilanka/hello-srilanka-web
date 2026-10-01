import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const emailConfirmation = Boolean(tokenHash && type === 'email') || url.searchParams.get('source') === 'email';

  if (supabaseConfigured() && (code || (tokenHash && type === 'email'))) {
    try {
      const supabase = await createClient();
      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as EmailOtpType });
      if (!error) return NextResponse.redirect(new URL('/account', url.origin));
    } catch {
      // A failed token exchange should return to sign-in instead of a 500 page.
    }
  }
  const message = emailConfirmation ? 'confirmation-failed' : 'google-failed';
  return NextResponse.redirect(new URL(`/login?message=${message}`, url.origin));
}
