import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  nombre?: string
  apellido?: string
  rol?: string
}

/**
 * Obtiene el usuario autenticado desde Supabase
 */
export async function getCurrentUser(request?: NextRequest): Promise<AuthUser | null> {
  try {
    // Obtener el token de autenticación de las cookies
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get('supabase-auth-token')?.value ||
                       cookiesStore.get('sb-auth-token')?.value ||
                       cookiesStore.get('sb-access-token')?.value

    if (!accessToken && request) {
      // Intentar obtener desde headers de autorización
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        return await getUserFromToken(token)
      }
    }

    if (!accessToken) {
      console.log('No access token found in cookies')
      return null
    }

    return await getUserFromToken(accessToken)
    
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    // Crear cliente directo de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No user found or error:', error?.message)
      return null
    }

    // Buscar información adicional del usuario en la tabla usuarios
    const { data: userData, error: userDataError } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, rol')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.warn('Error fetching user data from usuarios table:', userDataError.message)
    }

    const authUser = {
      id: user.id,
      email: user.email || '',
      nombre: userData?.nombre || undefined,
      apellido: userData?.apellido || undefined,
      rol: userData?.rol || undefined
    }

    console.log('🔍 Current user found:', { id: authUser.id, email: authUser.email })
    return authUser
    
  } catch (error) {
    console.error('Error getting user from token:', error)
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
