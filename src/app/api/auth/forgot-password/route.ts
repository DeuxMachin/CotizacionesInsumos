import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

/**
 * API para solicitar recuperación de contraseña
 * Genera un token de un solo uso con caducidad corta (15 minutos)
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email es requerido'
      }, { status: 400 })
    }

    // Verificar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de email inválido'
      }, { status: 400 })
    }

    // Buscar usuario
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, activo')
      .eq('email', email)
      .single()

    // No revelar si el usuario existe o no por seguridad
    if (userError || !user) {
      console.log(`🔐 Solicitud de recuperación para email inexistente: ${email}`)
      // Retornar éxito para no revelar información
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.'
      })
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      console.log(`🔐 Solicitud de recuperación para cuenta inactiva: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.'
      })
    }

    // Generar token de recuperación único
    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos

    // Guardar token en base de datos
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used: false,
        created_at: new Date().toISOString()
      })

    if (tokenError) {
      console.error('Error guardando token de recuperación:', tokenError)
      return NextResponse.json({
        success: false,
        error: 'Error interno del servidor'
      }, { status: 500 })
    }

    // Enviar email con instrucciones (simulado)
    console.log(`📧 Enviando email de recuperación a: ${email}`)
    console.log(`🔑 Token de recuperación: ${resetToken}`)
    console.log(`⏰ Expira en: ${expiresAt}`)

    // TODO: Integrar con servicio de email real
    // await sendPasswordResetEmail(email, resetToken, user.nombre)

    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña.'
    })

  } catch (error) {
    console.error('Error en solicitud de recuperación:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
