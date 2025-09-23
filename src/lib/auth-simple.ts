import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  nombre?: string
  apellido?: string
  rol?: string
}

/**
 * Versión simplificada para obtener usuario desde headers de la request
 * Como fallback temporal, usa un usuario por defecto hasta implementar autenticación completa
 */
export async function getCurrentUserSimple(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Intentar obtener desde headers personalizados que se pueden establecer en el frontend
    const userEmail = request.headers.get('x-user-email')
    const userId = request.headers.get('x-user-id')
    const userName = request.headers.get('x-user-name')
    
    if (userId && userEmail) {
      return {
        id: userId,
        email: userEmail,
        nombre: userName || undefined,
        apellido: undefined,
        rol: undefined
      }
    }

    // Temporalmente, usar un usuario activo del sistema para audit log
    // Esto permite que el audit log funcione mientras implementamos autenticación completa
    console.log('📝 Using default active user for audit log')
    
    // Generar un UUID válido para el usuario fallback
    // Este UUID es consistente para que siempre represente al mismo usuario "sistema"
    const defaultUserId = 'b8f4a8d2-7e92-4e1a-9f5c-3d2a8b7e1234'  // UUID fijo para usuario sistema
    
    return {
      id: defaultUserId,
      email: 'admin@empresa.com',
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'admin'
    }
  } catch (error) {
    console.error('❌ Error getting user:', error)
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
    name: user.nombre && user.apellido ? `${user.nombre} ${user.apellido}` : user.nombre || 'Usuario'
  }
}

/**
 * Middleware helper para establecer headers de usuario en el frontend
 * Usar en componentes React antes de hacer requests a la API
 */
export function addUserHeadersToRequest(headers: HeadersInit, user: AuthUser): HeadersInit {
  return {
    ...headers,
    'x-user-id': user.id,
    'x-user-email': user.email,
    'x-user-name': user.nombre || 'Usuario'
  }
}
