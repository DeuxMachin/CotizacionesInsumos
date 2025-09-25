import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    })

    // Borrar cookies (access + refresh)
    const base = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 0,
      path: '/'
    }
    response.cookies.set('auth-token', '', base)
    response.cookies.set('refresh-token', '', base)

    return response
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    }, { status: 500 })
  }
}