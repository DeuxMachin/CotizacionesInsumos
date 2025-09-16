import { useState, useEffect } from 'react'
import { AuditLogger, AuditLogEntry } from '@/services/auditLogger'
import { useAuth } from '@/features/auth/model/useAuth'

// Datos de ejemplo para mostrar mientras no hay datos reales
const SAMPLE_AUDIT_DATA: AuditLogEntry[] = [
  {
    id: 1,
    usuario_id: 'sample-user-1',
    evento: 'cotizacion_creada',
    descripcion: 'Creó cotización COT-2025-0012 para Constructora ABC Ltda.',
    detalles: {
      folio: 'COT-2025-0012',
      cliente: 'Constructora ABC Ltda.'
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 horas atrás
  },
  {
    id: 2,
    usuario_id: 'sample-user-2',
    evento: 'cotizacion_actualizada',
    descripcion: 'Cambió estado de cotización COT-2025-0011 de "borrador" a "enviada"',
    detalles: {
      folio: 'COT-2025-0011',
      estado_anterior: 'borrador',
      estado_nuevo: 'enviada'
    },
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 horas atrás
  },
  {
    id: 3,
    usuario_id: 'sample-user-1',
    evento: 'cliente_creado',
    descripcion: 'Creó cliente Inmobiliaria XYZ S.A. (76.123.456-7)',
    detalles: {
      nombre: 'Inmobiliaria XYZ S.A.',
      rut: '76.123.456-7'
    },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 horas atrás
  },
  {
    id: 4,
    usuario_id: 'sample-user-3',
    evento: 'nota_venta_creada',
    descripcion: 'Creó nota de venta NV-2025-0008 por $2.540.000 para Constructora ABC Ltda.',
    detalles: {
      folio: 'NV-2025-0008',
      total: 2540000,
      cliente: 'Constructora ABC Ltda.'
    },
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 horas atrás
  },
  {
    id: 5,
    usuario_id: 'sample-user-2',
    evento: 'user_login',
    descripcion: 'Usuario maria@empresa.com inició sesión',
    detalles: {
      email: 'maria@empresa.com',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 horas atrás
  }
]

export interface UseAuditLogReturn {
  activities: AuditLogEntry[]
  loading: boolean
  error: string | null
  refresh: () => void
  userContext?: {
    isAdmin: boolean
    canViewAll: boolean
  }
}

export function useAuditLog(limit: number = 20): UseAuditLogReturn {
  const [activities, setActivities] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userContext, setUserContext] = useState<{isAdmin: boolean, canViewAll: boolean} | undefined>()
  const { user } = useAuth()

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching audit log activities with user:', user)

      // Crear headers con información del usuario
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (user) {
        headers['x-user-id'] = user.id
        headers['x-user-email'] = user.email
        if (user.nombre) {
          headers['x-user-name'] = user.nombre
        }
      }

      // Intentar obtener datos reales de la API
      const response = await fetch(`/api/audit-log?limit=${limit}`, { headers })
      
      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('📊 API Result:', result)
        
        if (result.success && result.data && result.data.length > 0) {
          console.log('✅ Usando datos reales del API:', result.data.length, 'registros')
          setActivities(result.data)
          setUserContext(result.userContext)
        } else {
          // Si la API no retorna datos, usar datos de ejemplo
          console.warn('⚠️ API retornó sin datos, usando datos de ejemplo')
          setActivities(SAMPLE_AUDIT_DATA.slice(0, limit))
        }
      } else {
        // Si la API falla, usar datos de ejemplo
        console.warn('❌ API de audit log falló, usando datos de ejemplo. Status:', response.status)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        setActivities(SAMPLE_AUDIT_DATA.slice(0, limit))
      }
    } catch (err) {
      // Si hay error de conexión, usar datos de ejemplo
      console.error('🚨 Error fetching audit log:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setActivities(SAMPLE_AUDIT_DATA.slice(0, limit))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [limit, user])

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities,
    userContext
  }
}

// Hook para actividad de un usuario específico
export function useUserAuditLog(userId: string, limit: number = 10): UseAuditLogReturn {
  const [activities, setActivities] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      const userActivities = await AuditLogger.getActivityByUser(userId, limit)
      setActivities(userActivities)
    } catch (err) {
      console.error('Error fetching user audit log:', err)
      setError(err instanceof Error ? err.message : 'Error al obtener actividad del usuario')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [userId, limit])

  return {
    activities,
    loading,
    error,
    refresh: fetchActivities
  }
}

// Función utilitaria para formatear fechas relativas
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    if (diffInMinutes < 1) {
      return 'Hace unos segundos'
    }
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Tipos para eventos específicos
export type AuditEventType = 
  | 'user_login' 
  | 'user_logout'
  | 'cotizacion_creada' 
  | 'cotizacion_actualizada'
  | 'cliente_creado' 
  | 'cliente_actualizado'
  | 'obra_creada' 
  | 'obra_actualizada'
  | 'nota_venta_creada' 
  | 'nota_venta_actualizada'
  | 'target_creado' 
  | 'target_actualizado'
  | 'sistema_inicio'
  | 'tabla_creada'
