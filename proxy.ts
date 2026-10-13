import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseConfigured } from '@/lib/supabase/config';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.COMING_SOON === 'true') {
    const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

    // Stop API requests and Server Actions before they reach the full app.
    if (pathname === '/api' || pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(request.method)) {
      return NextResponse.json(
        { error: 'HelloSriLanka is coming soon. Please check back later.' },
        { status: 503, headers },
      );
    }

    if (pathname === '/') {
      const destination = request.nextUrl.clone();
      destination.pathname = '/coming-soon';
      destination.search = '';
      return NextResponse.rewrite(destination, { headers });
    }

    if (pathname === '/coming-soon') return NextResponse.next({ request, headers });

    // Temporary redirects let the original routes work again at launch.
    return NextResponse.redirect(new URL('/', request.url), { status: 307, headers });
  }

  const accountRoute = /^\/(login|signup|account|admin|auth)(\/|$)/.test(pathname);
  return accountRoute && supabaseConfigured() ? updateSession(request) : NextResponse.next({ request });
}

export const config = {
  // Keep the page's scripts, styles, fonts, images and film available.
  matcher: ['/((?!_next/static(?:/|$)|_next/image(?:/|$)|images/|media/|public/|icon\\.svg$|favicon\\.ico$).*)'],
};
