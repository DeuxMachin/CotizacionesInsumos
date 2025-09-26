import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signAccessToken, signRefreshToken, isExpired } from '@/lib/auth/tokens'

export async function POST(request: NextRequest) {
  try {
    const refreshCookie = request.cookies.get('refresh-token')?.value;
    if (!refreshCookie) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(refreshCookie);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }

    if (payload.type !== 'refresh' || isExpired(payload.exp)) {
      return NextResponse.json({ success: false, error: 'Expired refresh token' }, { status: 401 });
    }

    const accessToken = await signAccessToken({ id: payload.sub, email: payload.email, rol: payload.rol });
    const newRefreshToken = await signRefreshToken({ id: payload.sub, email: payload.email, rol: payload.rol });

    const response = NextResponse.json({ success: true });
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 horas (en lugar de 10 minutos)
      path: '/'
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error en refresh:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
