import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the token redemption route and locked page through unconditionally
  if (pathname.startsWith('/t/') || pathname.startsWith('/locked')) {
    return NextResponse.next();
  }

  // Check for access cookie
  const hasAccess = request.cookies.get('rail_access')?.value === '1';
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/locked', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
