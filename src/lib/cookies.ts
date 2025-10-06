import { NextResponse, type NextRequest } from 'next/server';

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  path?: string;
};

const isProd = process.env.NODE_ENV === 'production';

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string, req: NextRequest): void {
  res.cookies.set('auth-token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hora
    path: '/',
  });

  const ua = req.headers.get('user-agent') || '';
  const uaHash = Buffer.from(ua).toString('base64').slice(0, 24);
  res.cookies.set('rf-ua', uaHash, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 2, // 2 días
    path: '/',
  });

  res.cookies.set('refresh-token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 2, // 2 días
    path: '/',
  });
}

export function clearAuthCookies(res: NextResponse): void {
  const base: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };
  res.cookies.set('auth-token', '', base);
  res.cookies.set('refresh-token', '', base);
  res.cookies.set('rf-ua', '', { ...base, httpOnly: false });
}
