import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Temporary bypass flag for development
const BYPASS_AUTH = true; // Set to true to bypass authentication checks

// Define public routes that don't require authentication
const publicRoutes = ['/', '/signin', '/signup', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  // If bypassing auth for development, just proceed
  if (BYPASS_AUTH) {
    return NextResponse.next();
  }
  
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for the Firebase auth cookie (session)
  // Note: Firebase stores auth state in localStorage by default, but we're checking for
  // a potential Firebase session cookie if you've implemented server-side auth
  const session = request.cookies.get('__session');
  
  // If not authenticated and trying to access a protected route, redirect to signin
  if (!session) {
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // User is authenticated, allow access to the protected route
  return NextResponse.next();
}

// Configure the middleware to run on specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/* (image files in public directory)
     * - public/* (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ],
}; 