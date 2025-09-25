import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
// Eliminamos dependencia del fallback antiguo basado en headers para evitar
// la suplantación automática de un usuario admin por defecto.
import { verifyToken } from '@/lib/auth/tokens'

export interface UserContext {
  id: string
  email: string
  isAdmin: boolean
  isAuthenticated: boolean
}

/**
 * Obtiene el contexto del usuario actual desde la request
 * Incluye información sobre si es administrador
 */
export async function getUserContext(request: NextRequest): Promise<UserContext | null> {
  try {
    // Extraer JWT desde cookie HttpOnly
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return null
    }
    let decoded: any
    try {
      decoded = await verifyToken(token)
    } catch {
      return null
    }

    const user = {
      id: decoded.sub as string,
      email: decoded.email as string,
      nombre: decoded.nombre as string | undefined,
      apellido: decoded.apellido as string | undefined,
      rol: (decoded.rol as string | undefined)
    }
    console.log('🔍 getUserContext - User from JWT:', user)

    // Verificar si el usuario es administrador
  const isAdmin = await checkIfUserIsAdmin(user.email, user.id)
    
    console.log('🔍 getUserContext - Admin check result:', { email: user.email, isAdmin })

    const context = {
      id: user.id,
      email: user.email,
      isAdmin,
      isAuthenticated: true
    }
    
    console.log('✅ getUserContext - Final context:', context)
    return context
  } catch (error) {
    console.error('❌ Error getting user context:', error)
    return null
  }
}

/**
 * Verifica si un usuario es administrador consultando la base de datos
 */
export async function checkIfUserIsAdmin(email: string, userId?: string): Promise<boolean> {
  try {
    // Para el usuario por defecto del sistema, verificar email específico
    // Ya no forzamos admin por email estático; validamos siempre contra BD.
    // (Podríamos mantener un super-admin config, pero se elimina fallback inseguro.)

    // Consultar la tabla usuarios para verificar el rol
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('rol, activo')
      .eq('email', email.toLowerCase())
      .eq('activo', true)
      .single()
    
    if (error || !userData) {
  console.log('⚠️ Usuario no encontrado o inactivo en BD')
  return false
    }

    console.log('✅ Usuario verificado en BD:', { email, rol: userData.rol })
  return userData.rol === 'admin'
  } catch (error) {
    console.error('❌ Error checking admin status:', error)
    // Fallback: si hay error pero es el email admin por defecto
  return false
  }
}

/**
 * Verifica si el usuario actual puede ver todos los logs de auditoría
 */
export async function canViewAllAuditLogs(request: NextRequest): Promise<boolean> {
  const userContext = await getUserContext(request)
  return userContext?.isAdmin || false
}

/**
 * Obtiene el ID del usuario para filtrar logs (null si es admin y puede ver todo)
 */
export async function getUserIdForAuditFilter(request: NextRequest): Promise<string | null> {
  const userContext = await getUserContext(request)
  
  if (!userContext) {
    return null // Sin usuario, no mostrar nada
  }
  
  if (userContext.isAdmin) {
    // Los admins pueden ver todos los logs
    return null
  }
  
  // Usuarios normales solo ven sus propios logs
  return userContext.id
}

export default {
  getUserContext,
  checkIfUserIsAdmin,
  canViewAllAuditLogs,
  getUserIdForAuditFilter
}
