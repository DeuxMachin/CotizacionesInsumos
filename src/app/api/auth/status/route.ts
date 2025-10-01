import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JWTPayload } from '@/lib/auth/tokens';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    let decoded: { sub: string; [key: string]: unknown };
    try {
      decoded = await verifyToken(token);
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    const { data: user } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo')
      .eq('id', decoded.sub)
      .single();
    if (!user || !user.activo) return NextResponse.json({ authenticated: false }, { status: 200 });
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.rol,
        name: user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || undefined,
        isAdmin: ['admin', 'dueño', 'dueno'].includes(user.rol?.toLowerCase() || '')
      }
    });
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}