import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from '@/lib/i18n/routing';

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

// Protected routes that require authentication
const protectedPaths = ['/admin'];

function isProtectedPath(pathname: string): boolean {
  // Remove locale prefix if present
  const locales = routing.locales;
  let pathWithoutLocale = pathname;

  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      pathWithoutLocale = pathname.slice(locale.length + 1);
      break;
    }
    if (pathname === `/${locale}`) {
      pathWithoutLocale = '/';
      break;
    }
  }

  // Check if path matches protected routes
  return protectedPaths.some(
    route => pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );
}

function getLocaleFromPath(pathname: string): string {
  const locales = routing.locales;
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the route is protected (admin routes)
  if (isProtectedPath(pathname)) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const locale = getLocaleFromPath(pathname);

    // If not authenticated, redirect to login
    if (!user) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // TEMPORARILY DISABLED: Admin role check
    // TODO: Re-enable after fixing profiles table
    // For now, any authenticated user can access admin

    // User is authenticated, continue with intl middleware
    return intlMiddleware(request);
  }

  // Run the i18n middleware for all other routes
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|static|.*\\..*).*)'],
};
