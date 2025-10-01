import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { AuditLogger } from '@/services/auditLogger'
import { signAccessToken, signRefreshToken } from '@/lib/auth/tokens'
import { getRateKey } from '@/lib/request'
import { loginLimiter } from '@/lib/rateLimiter'
import { isTemporarilyLocked, registerFailedAttempt, resetAttempts, remainingLockDurationMs } from '@/lib/auth/lockout'
import { setAuthCookies } from '@/lib/cookies'

// No validar contraseñas comunes aquí; eso corresponde a creación/cambio de contraseña.

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
    const { email, password } = await request.json() as { email?: string; password?: string }

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    // Rate limit per IP + email to mitigate brute force
    const key = getRateKey(request, email.toLowerCase());
    if (!loginLimiter.allow(key)) {
      return NextResponse.json({ success: false, error: 'Demasiadas solicitudes, intente más tarde.' }, { status: 429 });
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

    // No se valida complejidad/común aquí (solo en creación/reset)

    // Buscar usuario en la base de datos
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo, password_hash')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Log intento de login con email inexistente
      console.log(`🔐 Intento de login con email inexistente: ${email}`);
      // Registrar intento fallido
      const result = await registerFailedAttempt(email);
      if (result.deactivated) {
        return NextResponse.json({ 
          success: false, 
          error: 'Su cuenta ha sido inhabilitada por seguridad. Para reactivarla debe restablecer su contraseña usando el enlace "Olvidé mi contraseña".',
          deactivated: true 
        }, { status: 423 });
      }
      const warning = result.windowCount >= 3 && result.windowCount < 6
        ? 'Advertencia: múltiples intentos fallidos. Si continúa hasta 6 intentos, su cuenta será inhabilitada por seguridad.'
        : undefined;
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas. Verifique su email y contraseña.',
        warning
      }, { status: 401 })
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      console.log(`🔐 Intento de login con cuenta inactiva: ${email}`);
      const result = await registerFailedAttempt(email);
      if (result.deactivated) {
        return NextResponse.json({ 
          success: false, 
          error: 'Su cuenta ha sido inhabilitada por seguridad. Para reactivarla debe restablecer su contraseña usando el enlace "Olvidé mi contraseña".',
          deactivated: true 
        }, { status: 423 });
      }
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas. Verifique su email y contraseña.'
      }, { status: 401 })
    }

    // Lockout: prevenir intentos si está temporalmente bloqueado (aplica después de verificar estado)
    const lockStatus = isTemporarilyLocked(email);
    if (lockStatus.locked) {
      const ms = remainingLockDurationMs(email);
      const minutes = ms ? Math.ceil(ms / 60_000) : 15;
      return NextResponse.json({ success: false, error: `Demasiados intentos. Intente nuevamente en ${minutes} minutos.` }, { status: 429 });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      console.log(` Contraseña incorrecta para: ${email}`);
      const result = await registerFailedAttempt(email);
      if (result.deactivated) {
        return NextResponse.json({ success: false, error: 'Para activar otra vez la cuenta debe comunicarse con un administrador o dueño.' }, { status: 423 });
      }
      const warning = result.windowCount >= 3 && result.windowCount < 6
        ? 'Advertencia: múltiples intentos fallidos. Si continúa hasta 6 intentos, su cuenta será inhabilitada por seguridad.'
        : undefined;
      return NextResponse.json({
        success: false,
        error: 'Credenciales incorrectas. Verifique su email y contraseña.',
        warning
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
    const userName = user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || undefined;
    await AuditLogger.logUserLogin(
      user.id, 
      user.email, 
      userName,
      request.headers.get('user-agent') || undefined
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
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

    // Cookies seguras
    setAuthCookies(response, accessToken, refreshToken, request);

  // Resetear contador de intentos fallidos al éxito
  resetAttempts(email);
  return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({
      success: false,
      error: 'Ocurrió un error interno. Intente nuevamente en unos momentos'
    }, { status: 500 })
  }
}
