import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Define public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/auth/verify', '/auth/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Get the authentication token from cookies
  const token = request.cookies.get('auth-token');
  
  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing a public auth route with a token, redirect to dashboard
  if (isPublicRoute && token && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};