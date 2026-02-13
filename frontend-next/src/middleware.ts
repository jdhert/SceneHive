import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/workspaces', '/profile', '/settings', '/users'];
const publicOnlyPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get('has_session')?.value;
  const hasRefreshToken = request.cookies.get('refresh_token')?.value;
  const isAuthenticated = Boolean(hasSession || hasRefreshToken);

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isPublicOnly = publicOnlyPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicOnly && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workspaces/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/users/:path*',
    '/login',
    '/register',
  ],
};
