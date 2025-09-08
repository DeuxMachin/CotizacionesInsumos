import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// API para crear usuarios de prueba
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { createTestUsers } = body

    if (!createTestUsers) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere el parámetro createTestUsers'
      }, { status: 400 })
    }

    // Usuarios de prueba
    const testUsers = [
      {
        email: 'admin@empresa.com',
        password: 'admin123',
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'admin'
      },
      {
        email: 'vendedor@empresa.com',
        password: 'vendedor123',
        nombre: 'Juan',
        apellido: 'Pérez',
        rol: 'vendedor'
      },
      {
        email: 'cliente@empresa.com',
        password: 'cliente123',
        nombre: 'María',
        apellido: 'González',
        rol: 'cliente'
      }
    ]

    const results = []

    for (const user of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('email')
          .eq('email', user.email)
          .single()

        if (existingUser) {
          results.push({
            email: user.email,
            status: 'skipped',
            message: 'Usuario ya existe'
          })
          continue
        }

        // Hashear contraseña
        const passwordHash = await bcrypt.hash(user.password, 10)

        // Crear usuario en la tabla usuarios (sin crear en Supabase Auth por ahora)
        const { data: dbUser, error: dbError } = await supabase
          .from('usuarios')
          .insert({
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol as 'admin' | 'vendedor' | 'cliente',
            password_hash: passwordHash,
            activo: true
          })
          .select()
          .single()

        if (dbError) {
          results.push({
            email: user.email,
            status: 'error',
            message: dbError.message
          })
          continue
        }

        results.push({
          email: user.email,
          status: 'created',
          message: 'Usuario creado exitosamente'
        })

      } catch (error) {
        results.push({
          email: user.email,
          status: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Proceso de creación de usuarios completado'
    })

  } catch (error) {
    console.error('Error creando usuarios de prueba:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
