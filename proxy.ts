import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return supabaseConfigured() ? updateSession(request) : NextResponse.next({ request });
}

export const config = { matcher: ['/login', '/signup', '/account/:path*', '/admin/:path*', '/auth/:path*'] };
