"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function RouteGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Public entry pages that initialize the flow
    const publicEntries = ['/', '/signup', '/pricing', '/checkout', '/admin'];
    
    // Protected routes that cannot be accessed directly without starting flow
    const protectedRoutes = ['/dashboard', '/insights', '/metrics', '/reports', '/settings', '/upload', '/process'];

    // Check if the current route is a public entry point
    if (publicEntries.includes(pathname)) {
      sessionStorage.setItem("flow_active", "true");
      return;
    }

    // Check if the current route is a protected page
    const isProtected = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
    if (isProtected) {
      const isFlowActive = sessionStorage.getItem("flow_active");
      if (isFlowActive !== "true") {
        console.warn(`[RouteGuard] Direct page access blocked for ${pathname}. Redirecting to landing flow.`);
        router.replace('/');
      }
    }
  }, [pathname, router]);

  return null;
}
