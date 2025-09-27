import type {  Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  rol: 'dueño' | 'dueno' | 'admin' | 'vendedor' | 'cliente'
  activo: boolean
}

export class AuthService {
  // Iniciar sesión usando nuestra API
  static async signIn(email: string, password: string) {
    try {
      console.log('🔵 AuthService.signIn iniciado');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('📡 Respuesta recibida, status:', response.status);
      const result = await response.json()
      console.log('📋 Datos de respuesta:', result);

      if (!result.success) {
        console.log('❌ Login fallido desde API:', result.error);
        // Devolver el error específico de la API
        throw new Error(result.error || 'Error de autenticación')
      }

      // Simular una sesión para mantener compatibilidad
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        user: { id: result.data.user.id, email: result.data.user.email }
      }

      console.log('✅ Login exitoso, devolviendo datos del usuario');
      return {
        session: mockSession as unknown as Session,
        user: result.data.user as AuthUser
      }
    } catch (error) {
      console.error('❌ Error en AuthService.signIn:', error)
      
      // Si es un error de red o fetch, proporcionar mensaje específico
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifique su conexión a internet.')
      }
      
      // Si ya es un error con mensaje específico, mantenerlo
      if (error instanceof Error) {
        console.log('❌ Propagando error específico:', error.message);
        throw error
      }
      
      // Error genérico para casos no manejados
      throw new Error('Error de autenticación')
    }
  }

  // Cerrar sesión
  static async signOut() {
    // Solo limpiar datos locales
    return Promise.resolve()
  }

  // Obtener sesión actual (simulada)
  static async getCurrentSession() {
    // En una implementación real, aquí verificarías el token almacenado
    // Por ahora, retornamos null para forzar un nuevo login
    return null
  }

  // Obtener usuario actual
  static async getCurrentUser() {
    // En la implementación actual, no mantenemos sesión persistente
    // Retornamos null para forzar nuevo login
    return null
  }

  // Verificar si el usuario tiene un rol específico
  static hasRole(user: AuthUser | null, role: string | string[]): boolean {
    if (!user) return false
    
    if (Array.isArray(role)) {
      return role.includes(user.rol)
    }
    
    return user.rol === role
  }

  // Verificar si el usuario es admin
  static isAdmin(user: AuthUser | null): boolean {
    return this.hasRole(user, 'admin')
  }

  // Verificar si el usuario es vendedor o admin
  static canManageClients(user: AuthUser | null): boolean {
    return this.hasRole(user, ['admin', 'vendedor'])
  }

  // Simular suscripción a cambios de autenticación
  static onAuthStateChange(callback: (session: Session | null, user: AuthUser | null) => void) {
    // Retornar un objeto que simule la suscripción de Supabase
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // No hacer nada en la implementación simulada
          }
        }
      }
    }
  }


}
