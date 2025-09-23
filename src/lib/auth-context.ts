import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUserSimple } from '@/lib/auth-simple'

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
    // Obtener usuario desde headers/sesión
    const user = await getCurrentUserSimple(request)
    
    console.log('🔍 getUserContext - User from auth-simple:', user)
    
    if (!user) {
      console.log('❌ No user found in getCurrentUserSimple')
      return null
    }

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
    if (email === 'admin@empresa.com') {
      console.log('✅ Usuario admin por defecto reconocido')
      return true
    }

    // Consultar la tabla usuarios para verificar el rol
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('rol, activo')
      .eq('email', email.toLowerCase())
      .eq('activo', true)
      .single()
    
    if (error || !userData) {
      console.log('⚠️ Usuario no encontrado en BD, verificando email admin por defecto')
      // Fallback: si no se encuentra en BD pero es el email admin por defecto
      return email.toLowerCase() === 'admin@empresa.com'
    }

    console.log('✅ Usuario verificado en BD:', { email, rol: userData.rol })
    return userData.rol === 'admin'
  } catch (error) {
    console.error('❌ Error checking admin status:', error)
    // Fallback: si hay error pero es el email admin por defecto
    return email.toLowerCase() === 'admin@empresa.com'
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
