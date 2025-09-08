import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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
      .eq('activo', true)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado o inactivo'
      }, { status: 401 })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    
    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas'
      }, { status: 401 })
    }

    // Actualizar último login
    await supabase
      .from('usuarios')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Remover password_hash de la respuesta
    const { password_hash, ...userWithoutPassword } = user

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
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
