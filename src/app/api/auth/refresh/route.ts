import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signAccessToken, signRefreshToken, isExpired } from '@/lib/auth/tokens'
import { getRateKey, getUserAgent } from '@/lib/request'
import { refreshLimiter } from '@/lib/rateLimiter'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const refreshCookie = request.cookies.get('refresh-token')?.value;
    if (!refreshCookie) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 });
    }

    // Rate limit por IP/UA
    const rateKey = getRateKey(request);
    if (!refreshLimiter.allow(rateKey)) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    let payload: { sub: string; email?: string; nombre?: string; apellido?: string; rol?: string; exp?: number; type?: string };
    try {
      payload = await verifyToken(refreshCookie);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }

    if (payload.type !== 'refresh' || isExpired(payload.exp)) {
      return NextResponse.json({ success: false, error: 'Expired refresh token' }, { status: 401 });
    }

    // Verify UA binding against non-HttpOnly rf-ua cookie
    const clientUaHash = request.cookies.get('rf-ua')?.value;
    const currentUa = getUserAgent(request);
    const currentUaHash = Buffer.from(currentUa).toString('base64').slice(0, 24);
    if (!clientUaHash || clientUaHash !== currentUaHash) {
      return NextResponse.json({ success: false, error: 'Refresh context mismatch' }, { status: 401 });
    }

    // Actualizar last_activity en user_sessions
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_id', refreshCookie);

    if (updateError) {
      console.error('Error actualizando actividad de sesión:', updateError);
      // No fallar el refresh por esto
    }

    const accessToken = await signAccessToken({ id: payload.sub, email: payload.email || '', rol: payload.rol || 'vendedor' });
    const newRefreshToken = await signRefreshToken({ id: payload.sub, email: payload.email || '', rol: payload.rol || 'vendedor' });

    // Actualizar session_id y last_activity
    const { error: updateSessionError } = await supabase
      .from('user_sessions')
      .update({ 
        session_id: newRefreshToken,
        last_activity: new Date().toISOString() 
      })
      .eq('session_id', refreshCookie);

    if (updateSessionError) {
      console.error('Error actualizando sesión:', updateSessionError);
    }

    const response = NextResponse.json({ success: true });
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas (en lugar de 10 minutos)
      path: '/'
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error en refresh:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
