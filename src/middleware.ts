import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseAuthCookie(raw?: string) {
  let isAuthenticated = false;
  let role: string | undefined;
  if (!raw) return { isAuthenticated, role };
  try {
    // Algunos navegadores codifican el valor de la cookie
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    // Aceptar dos formatos: { state: { isAuthenticated, user } } o { isAuthenticated, user }
    if (parsed?.state) {
      isAuthenticated = !!parsed.state.isAuthenticated;
      role = parsed.state.user?.role;
    } else {
      isAuthenticated = !!parsed.isAuthenticated;
      role = parsed.user?.role;
    }
  } catch {
    // Si no es JSON válido, tratar valores simples como '1' o 'true'
    isAuthenticated = raw === '1' || raw === 'true';
  }
  return { isAuthenticated, role };
}

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth-storage');
  const { isAuthenticated, role } = parseAuthCookie(authCookie?.value);

  const url = request.nextUrl.clone();
  const isLoginPage = url.pathname === '/login';
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');

  if (isProtectedRoute && !isAuthenticated) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isLoginPage && isAuthenticated) {
    url.pathname = role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
