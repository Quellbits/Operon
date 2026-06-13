import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;

  // Let local development environment (localhost/127.0.0.1) access everything
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    return NextResponse.next();
  }

  // On public deployed server, allow root page, API routes, and static assets
  const isRoot = pathname === '/';
  const isApi = pathname.startsWith('/api') || pathname.startsWith('/_next/data');
  const isAsset = pathname.startsWith('/_next') || 
                  pathname.startsWith('/static') || 
                  pathname.endsWith('.ico') || 
                  pathname.endsWith('.png') || 
                  pathname.endsWith('.svg') || 
                  pathname.endsWith('.jpg');

  if (isRoot || isApi || isAsset) {
    return NextResponse.next();
  }

  // Redirect all other public page requests to the root waiting list page
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  // Run middleware on all paths except static resources
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
