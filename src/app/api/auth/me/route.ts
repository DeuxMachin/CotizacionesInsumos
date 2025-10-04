import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, signAccessToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
  try {
  const token = request.cookies.get('auth-token')?.value
  const refreshToken = request.cookies.get('refresh-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    try {
      const decoded = await verifyToken(token)

      // Verificar que el usuario aún existe y está activo
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, rol, activo')
        .eq('id', decoded.sub)
        .single()

      if (error || !user || !user.activo) {
        return NextResponse.json({
          success: false,
          error: 'Usuario no encontrado o inactivo'
        }, { status: 401 })
      }

      // Verificar inactividad: si han pasado más de 20 minutos desde la última actividad
      if (refreshToken) {
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .select('last_activity')
          .eq('session_id', refreshToken)
          .single();

        if (sessionError || !session) {
          return NextResponse.json({
            success: false,
            error: 'Sesión expirada'
          }, { status: 401 })
        }

        const lastActivity = new Date(session.last_activity).getTime();
        const now = Date.now();
        const inactivityLimit = 20 * 60 * 1000; // 20 minutos

        if (now - lastActivity > inactivityLimit) {
          // Eliminar sesión expirada
          await supabase
            .from('user_sessions')
            .delete()
            .eq('session_id', refreshToken);

          return NextResponse.json({
            success: false,
            error: 'Sesión expirada por inactividad'
          }, { status: 401 })
        }
      }

      // Actualizar last_activity en user_sessions
      if (refreshToken) {
        await supabase
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('session_id', refreshToken);
      }

      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol,
            role: user.rol,
            name: user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || undefined,
            activo: user.activo
          }
        }
  })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

      // Renovar access token si le quedan menos de 2 minutos
      const exp = decoded.exp as number | undefined;
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp - now < 120) {
        const newAccess = await signAccessToken({ id: user.id, email: user.email, rol: user.rol });
        response.cookies.set('auth-token', newAccess, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 10 * 60,
          path: '/'
        });
      }

      return response
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido'
      }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }
  } catch (error) {
    console.error('Error en /api/auth/me:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    }, { status: 500 })
  }
}