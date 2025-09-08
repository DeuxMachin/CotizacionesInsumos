import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Hook para manejar llamadas a la API de manera consistente
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await queryFn()
        if (mounted) {
          setData(result)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, dependencies)

  const refetch = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await queryFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch }
}

// Hook específico para clientes
export function useClientes() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_razon_social')

    if (error) throw error
    return data
  })
}

// Hook específico para cotizaciones
export function useCotizaciones() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(id, nombre_razon_social, rut),
        obra:obras(id, nombre),
        creador:usuarios!creada_por(id, nombre, apellido)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  })
}

// Hook específico para productos
export function useProductos() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    return data
  })
}

// Hook específico para obras
export function useObras() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('obras')
      .select(`
        *,
        cliente:clientes(id, nombre_razon_social, rut),
        vendedor:usuarios(id, nombre, apellido),
        tipo_obra:obra_tipos(id, nombre),
        tamano_obra:obra_tamanos(id, nombre)
      `)
      .order('nombre')

    if (error) throw error
    return data
  })
}

// Hook específico para usuarios
export function useUsuarios() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo, created_at, last_login_at')
      .order('nombre')

    if (error) throw error
    return data
  })
}

// Hook específico para targets
export function useTargets() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('targets')
      .select(`
        *,
        tipo:target_tipos(id, nombre),
        creador:usuarios!creado_por(id, nombre, apellido),
        asignado:usuarios!asignado_a(id, nombre, apellido)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  })
}

// Hook específico para estadísticas generales
export function useEstadisticas() {
  return useSupabaseQuery(async () => {
    const [clientes, cotizaciones, productos, obras, usuarios] = await Promise.all([
      supabase.from('clientes').select('id, estado'),
      supabase.from('cotizaciones').select('id, estado, total_final'),
      supabase.from('productos').select('id, activo'),
      supabase.from('obras').select('id'),
      supabase.from('usuarios').select('id, activo')
    ])

    if (clientes.error) throw clientes.error
    if (cotizaciones.error) throw cotizaciones.error
    if (productos.error) throw productos.error
    if (obras.error) throw obras.error
    if (usuarios.error) throw usuarios.error

    return {
      clientes: {
        total: clientes.data?.length || 0,
        activos: clientes.data?.filter(c => c.estado === 'activo').length || 0
      },
      cotizaciones: {
        total: cotizaciones.data?.length || 0,
        borradores: cotizaciones.data?.filter(c => c.estado === 'borrador').length || 0,
        enviadas: cotizaciones.data?.filter(c => c.estado === 'enviada').length || 0,
        aprobadas: cotizaciones.data?.filter(c => c.estado === 'aprobada').length || 0,
        valor_total: cotizaciones.data?.reduce((sum, c) => sum + (c.total_final || 0), 0) || 0
      },
      productos: {
        total: productos.data?.length || 0,
        activos: productos.data?.filter(p => p.activo).length || 0
      },
      obras: {
        total: obras.data?.length || 0
      },
      usuarios: {
        total: usuarios.data?.length || 0,
        activos: usuarios.data?.filter(u => u.activo).length || 0
      }
    }
  })
}

// Hook para suscribirse a cambios en tiempo real
export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  useEffect(() => {
    let subscription: any

    const setupSubscription = () => {
      subscription = supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        }, (payload) => {
          console.log(`Cambio en ${table}:`, payload)
          if (callback) {
            callback(payload)
          }
        })
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [table, filter, callback])
}
