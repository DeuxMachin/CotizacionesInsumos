import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { validatePassword } from '@/lib/auth/passwordPolicy'

// Lista de contraseñas comunes filtradas
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'welcome123', 'admin123', 'root', 'user', 'guest'
];

/**
 * API para resetear contraseña usando token de recuperación
 */
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Token y nueva contraseña son requeridos'
      }, { status: 400 })
    }

    // Validar nueva contraseña con política centralizada
    const policy = validatePassword(newPassword);
    if (!policy.valid) {
      return NextResponse.json({ success: false, error: policy.error || 'Contraseña inválida' }, { status: 400 });
    }

    // Generar hash del token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Buscar token válido
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .single()

    if (tokenError || !resetToken) {
      return NextResponse.json({
        success: false,
        error: 'Token inválido o expirado'
      }, { status: 400 })
    }

    // Verificar expiración
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)

    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Token expirado'
      }, { status: 400 })
    }

    // Generar hash de la nueva contraseña
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    // Actualizar contraseña y reactivar cuenta si estaba desactivada
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        password_hash: passwordHash,
        activo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetToken.user_id)

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Error actualizando contraseña'
      }, { status: 500 })
    }

    // Marcar token como usado
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    if (markUsedError) {
      console.error('Error marcando token como usado:', markUsedError)
      // No fallar la operación por esto
    }

    // Limpiar tokens expirados del mismo usuario
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', resetToken.user_id)
      .lt('expires_at', new Date().toISOString())

    console.log(`✅ Contraseña reseteada exitosamente para usuario: ${resetToken.user_id}`)

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error en reset de contraseña:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
