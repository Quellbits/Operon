import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;

  // Let local development environment (localhost/127.0.0.1) access everything
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal) {
    return NextResponse.next();
  }

  // Always allow admin portal, API routes, and static assets
  const isAdmin = pathname.startsWith('/admin');
  const isApi = pathname.startsWith('/api') || pathname.startsWith('/_next/data');
  const isAsset = pathname.startsWith('/_next') || 
                  pathname.startsWith('/static') || 
                  pathname.endsWith('.ico') || 
                  pathname.endsWith('.png') || 
                  pathname.endsWith('.svg') || 
                  pathname.endsWith('.jpg');
 
  if (isAdmin || isApi || isAsset) {
    return NextResponse.next();
  }

  // Fetch app stage from backend settings to determine access control
  try {
    const backendUrl = process.env.NODE_ENV === "production" 
      ? "https://operon-vk6e.onrender.com" 
      : "http://127.0.0.1:8000";
      
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s strict timeout
    
    const res = await fetch(`${backendUrl}/admin/settings`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data.app_stage === 'production') {
        // App is in production mode. Allow all routes (dashboard, upload, signup, etc.)
        return NextResponse.next();
      }
    }
  } catch (err) {
    console.error("Middleware settings fetch failed, allowing route to load:", err);
    return NextResponse.next(); // Fallback to allowing access so we don't break page loading on spin-downs or slow backends
  }

  // App is in development mode. Allow root page (which will display waitlist)
  const isRoot = pathname === '/';
  if (isRoot) {
    return NextResponse.next();
  }

  // Redirect all other public page requests to the root page
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  // Run middleware on all paths except static resources
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
