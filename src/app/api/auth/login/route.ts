import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

/**
 * API de Login con manejo mejorado de errores
 * 
 * Tipos de errores específicos que se devuelven:
 * - "Email y contraseña son requeridos" (400)
 * - "No existe una cuenta asociada a este correo electrónico" (401)
 * - "Su cuenta se encuentra deshabilitada. Contacte al administrador" (401)
 * - "La contraseña ingresada es incorrecta" (401)
 * - "Ocurrió un error interno. Intente nuevamente en unos momentos" (500)
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

    // Buscar usuario en la base de datos
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo, password_hash')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'No existe una cuenta asociada a este correo electrónico'
      }, { status: 401 })
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return NextResponse.json({
        success: false,
        error: 'Su cuenta se encuentra deshabilitada. Contacte al administrador'
      }, { status: 401 })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    
    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña ingresada es incorrecta'
      }, { status: 401 })
    }

    // Actualizar último login
    await supabase
      .from('usuarios')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Remover password_hash de la respuesta
    const {  ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({
      success: false,
      error: 'Ocurrió un error interno. Intente nuevamente en unos momentos'
    }, { status: 500 })
  }
}
