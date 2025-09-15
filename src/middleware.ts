import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseAuthCookie(raw?: string) {
  let isAuthenticated = false;
  let role: string | undefined;
  let sessionId: string | undefined;
  let createdAt: number | undefined;
  
  if (!raw) return { isAuthenticated, role, sessionId, createdAt };
  
  try {
    // Algunos navegadores codifican el valor de la cookie
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    
    // Aceptar dos formatos: { state: { isAuthenticated, user } } o { isAuthenticated, user }
    if (parsed?.state) {
      isAuthenticated = !!parsed.state.isAuthenticated;
      role = parsed.state.user?.role;
      sessionId = parsed.state.sessionId;
      createdAt = parsed.state.createdAt;
    } else {
      isAuthenticated = !!parsed.isAuthenticated;
      role = parsed.user?.role;
      sessionId = parsed.sessionId;
      createdAt = parsed.createdAt;
    }
    
    // Verificar expiración de sesión (24 horas)
    if (createdAt && Date.now() - createdAt > 24 * 60 * 60 * 1000) {
      isAuthenticated = false;
      role = undefined;
      sessionId = undefined;
    }
    
  } catch {
    // Si no es JSON válido, tratar valores simples como '1' o 'true'
    isAuthenticated = raw === '1' || raw === 'true';
  }
  
  return { isAuthenticated, role, sessionId, createdAt };
}

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth-storage');
  const { isAuthenticated, role } = parseAuthCookie(authCookie?.value);

  const url = request.nextUrl.clone();
  const isLoginPage = url.pathname === '/login';
  const isRootPage = url.pathname === '/';
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin');

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/admin/:path*', '/login'],
};
