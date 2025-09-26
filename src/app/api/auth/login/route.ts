import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { AuditLogger } from '@/services/auditLogger'
import { signAccessToken, signRefreshToken } from '@/lib/auth/tokens'

// Lista de contraseñas comunes filtradas (simplificada)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'welcome123', 'admin123', 'root', 'user', 'guest'
];

/**
 * API de Login con políticas de contraseña mejoradas según ISO 27001
 *
 * Políticas implementadas:
 * - Permitir contraseñas largas (hasta 128 caracteres)
 * - Rechazar contraseñas filtradas comunes
 * - No imponer reglas arbitrarias de complejidad
 * - Logging de intentos de login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      }, { status: 400 })
    }

    if (password.length > 128) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña no puede exceder los 128 caracteres'
      }, { status: 400 })
    }

    // Verificar si es una contraseña filtrada común
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      return NextResponse.json({
        success: false,
        error: 'Esta contraseña es muy común. Por favor elija una más segura.'
      }, { status: 400 })
    }

    // Buscar usuario en la base de datos
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo, password_hash')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Log intento de login con email inexistente
      console.log(`🔐 Intento de login con email inexistente: ${email}`);
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas. Verifique su email y contraseña.'
      }, { status: 401 })
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      console.log(`🔐 Intento de login con cuenta inactiva: ${email}`);
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas. Verifique su email y contraseña.'
      }, { status: 401 })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      console.log(`🔐 Contraseña incorrecta para: ${email}`);
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas. Verifique su email y contraseña.'
      }, { status: 401 })
    }

    // Actualizar último login
    await supabase
      .from('usuarios')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Log login exitoso
    console.log(`✅ Login exitoso para: ${email}`);

    // Registrar en audit log
    await AuditLogger.logUserLogin(
      user.id, 
      user.email, 
      user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || undefined
    )

    // Generar tokens (access + refresh)
    const accessToken = await signAccessToken({ id: user.id, email: user.email, rol: user.rol });
    const refreshToken = await signRefreshToken({ id: user.id, email: user.email, rol: user.rol });

    // Remover password_hash de la respuesta
    const { password_hash, ...userWithoutPassword } = user

    // Crear respuesta con cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          name: user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || undefined,
          role: user.rol
        }
      }
    })

    // Cookies seguras
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 horas (en lugar de 10 minutos)
      path: '/'
    });
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({
      success: false,
      error: 'Ocurrió un error interno. Intente nuevamente en unos momentos'
    }, { status: 500 })
  }
}
