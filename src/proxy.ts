import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLoginPage = nextUrl.pathname === '/login';
  const isAuthApi = nextUrl.pathname.startsWith('/api/auth');
  const isHealthCheck = nextUrl.pathname === '/api/health';

  if (isAuthApi || isHealthCheck) return NextResponse.next();
  if (!isLoggedIn && !isLoginPage) return NextResponse.redirect(new URL('/login', nextUrl));
  if (isLoggedIn && isLoginPage) return NextResponse.redirect(new URL('/visao-geral', nextUrl));
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
