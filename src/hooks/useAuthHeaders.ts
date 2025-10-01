import { useAuth } from '@/contexts/AuthContext'
import type { User as AuthUser } from '@/contexts/AuthContext'

/**
 * Hook para crear headers de autenticación para requests de API
 */
export function useAuthHeaders() {
  const { user } = useAuth()

  const createHeaders = (additionalHeaders: HeadersInit = {}): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Agregar headers adicionales
    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders)
    }

    if (user) {
      headers['x-user-id'] = user.id
      headers['x-user-email'] = user.email
      
      // Usar el nombre completo del usuario si está disponible
      if (user.name) {
        headers['x-user-name'] = user.name;
      } else {
        // Fallback al email sin dominio si no hay nombre
        headers['x-user-name'] = user.email.split('@')[0];
      }
    }

    return headers
  }

  return { createHeaders, user }
}

/**
 * Función utilitaria para crear headers sin hook (para uso en funciones)
 */
export function createAuthHeadersFromUser(user: AuthUser | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (user) {
    headers['x-user-id'] = user.id
    headers['x-user-email'] = user.email
    if (user.name) {
      headers['x-user-name'] = user.name
    }
  }

  return headers
}
