import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken, signAccessToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
  try {
  const token = request.cookies.get('auth-token')?.value

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