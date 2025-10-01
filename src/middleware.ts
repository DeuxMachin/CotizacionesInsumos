import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/auth/tokens';

export async function middleware(request: NextRequest) {
  const jwtCookie = request.cookies.get('auth-token');
  let payload: { sub: string; email?: string; nombre?: string; apellido?: string; rol?: string; exp?: number; type?: string } | null = null;
  let isAuthenticated = false;
  let role: string | undefined;
  if (jwtCookie?.value) {
    try {
      payload = await verifyToken(jwtCookie.value);
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp > now) {
        isAuthenticated = true;
        role = payload.rol;
      }
    } catch (e) {
      // token inválido -> permanece no autenticado
    }
  }

  // Logs diagnósticos (se pueden quitar en producción)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[middleware] path=', request.nextUrl.pathname, 'auth=', isAuthenticated, 'role=', role);
  }

  const url = request.nextUrl.clone();
  const isLoginPage = url.pathname === '/login';
  const isRootPage = url.pathname === '/';
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/pagina/dashboard');

  // Redirect root path to login if not authenticated
  if (isRootPage && !isAuthenticated) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect root to appropriate dashboard if authenticated
  if (isRootPage && isAuthenticated) {
    url.pathname = role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isProtectedRoute && !isAuthenticated) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isLoginPage && isAuthenticated) {
    url.pathname = role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  // Prevent caching on login page to avoid back-button cached views
  if (isLoginPage) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }
  return res;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/admin/:path*', '/login'],
};
