import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export interface AuthUser {
  id: string
  email: string
  nombre?: string
  apellido?: string
  rol: string
}

/**
 * Extrae la información del usuario autenticado desde los headers o cookies de la request
 * En una implementación real, esto debería validar el JWT token
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Por ahora, intentamos obtener el usuario desde un header personalizado
    // En producción, esto debería validar un JWT token
    const userHeader = request.headers.get('x-user-info')
    const userEmail = request.headers.get('x-user-email')
    const userId = request.headers.get('x-user-id')

    if (userHeader) {
      try {
        return JSON.parse(userHeader) as AuthUser
      } catch {
        // Fallback si no se puede parsear
      }
    }

    if (userEmail && userId) {
      // Buscar el usuario en la base de datos
      const { data: user } = await supabase
        .from('usuarios')
        .select('id, email, nombre, apellido, rol')
        .eq('email', userEmail)
        .eq('id', userId)
        .single()

      if (user) {
        return {
          id: user.id,
          email: user.email,
          nombre: user.nombre || undefined,
          apellido: user.apellido || undefined,
          rol: user.rol
        }
      }
    }

    // Fallback: intentar obtener desde cookies (implementación simplificada)
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      if (cookies['auth-storage']) {
        try {
          const authData = JSON.parse(decodeURIComponent(cookies['auth-storage']))
          if (authData.state?.user) {
            return authData.state.user as AuthUser
          }
        } catch {
          // Error al parsear la cookie
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

/**
 * Obtiene información básica del usuario para el audit log
 */
export function getUserInfoForAudit(user: AuthUser | null): { id: string; email: string; name?: string } | undefined {
  if (!user) return undefined

  return {
    id: user.id,
    email: user.email,
    name: user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || undefined
  }
}
