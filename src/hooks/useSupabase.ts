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

// Hook específico para targets (usando datos simulados hasta que se implemente la tabla)
export function useTargets() {
  return useSupabaseQuery(async () => {
    // Por ahora devolvemos datos simulados
    const mockTargets = [
      {
        id: 1,
        titulo: 'Construcción de Condominio Las Flores',
        descripcion: 'Proyecto habitacional de 120 unidades',
        estado: 'pendiente',
        prioridad: 'alta',
        ciudad: 'Santiago',
        comuna: 'Las Condes',
        valor_estimado: 85000000,
        fecha_limite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        titulo: 'Remodelación Mall Plaza',
        descripcion: 'Expansión del área de restaurantes',
        estado: 'en_progreso',
        prioridad: 'media',
        ciudad: 'Valparaíso',
        comuna: 'Viña del Mar',
        valor_estimado: 45000000,
        fecha_limite: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        titulo: 'Oficinas Corporativas Tech',
        descripcion: 'Edificio de oficinas de 15 pisos',
        estado: 'completado',
        prioridad: 'baja',
        ciudad: 'Santiago',
        comuna: 'Providencia',
        valor_estimado: 120000000,
        fecha_limite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    ];
    
    return mockTargets;
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

// Hook específico para estadísticas del panel de administración
export function useAdminStats() {
  return useSupabaseQuery(async () => {
    const [clientes, cotizaciones, productos, obras, usuarios] = await Promise.all([
      supabase.from('clientes').select('id, estado, created_at, linea_credito'),
      supabase.from('cotizaciones').select('id, estado, total_final, created_at, fecha_emision'),
      supabase.from('productos').select('id, activo, precio_venta_neto, created_at'),
      supabase.from('obras').select('id, created_at'),
      supabase.from('usuarios').select('id, activo, created_at, last_login_at, rol')
    ])

    if (clientes.error) throw clientes.error
    if (cotizaciones.error) throw cotizaciones.error
    if (productos.error) throw productos.error
    if (obras.error) throw obras.error
    if (usuarios.error) throw usuarios.error

    // Calcular estadísticas avanzadas
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const nuevosClientesUltimoMes = clientes.data?.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ).length || 0
    
    const nuevasCotizacionesUltimoMes = cotizaciones.data?.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ).length || 0
    
    const usuariosActivosRecientes = usuarios.data?.filter(u => 
      u.activo && u.last_login_at && new Date(u.last_login_at) >= thirtyDaysAgo
    ).length || 0

    return {
      usuarios: {
        total: usuarios.data?.length || 0,
        activos: usuarios.data?.filter(u => u.activo).length || 0,
        inactivos: usuarios.data?.filter(u => !u.activo).length || 0,
        activosRecientes: usuariosActivosRecientes,
        porRol: {
          admin: usuarios.data?.filter(u => u.rol === 'admin').length || 0,
          vendedor: usuarios.data?.filter(u => u.rol === 'vendedor').length || 0,
          cliente: usuarios.data?.filter(u => u.rol === 'cliente').length || 0
        }
      },
      clientes: {
        total: clientes.data?.length || 0,
        activos: clientes.data?.filter(c => c.estado === 'activo').length || 0,
        nuevosUltimoMes: nuevosClientesUltimoMes,
        lineaCreditoTotal: clientes.data?.reduce((sum, c) => sum + (c.linea_credito || 0), 0) || 0
      },
      cotizaciones: {
        total: cotizaciones.data?.length || 0,
        borradores: cotizaciones.data?.filter(c => c.estado === 'borrador').length || 0,
        enviadas: cotizaciones.data?.filter(c => c.estado === 'enviada').length || 0,
        aprobadas: cotizaciones.data?.filter(c => c.estado === 'aprobada').length || 0,
        rechazadas: cotizaciones.data?.filter(c => c.estado === 'rechazada').length || 0,
        vencidas: cotizaciones.data?.filter(c => c.estado === 'vencida').length || 0,
        valorTotal: cotizaciones.data?.reduce((sum, c) => sum + (c.total_final || 0), 0) || 0,
        nuevasUltimoMes: nuevasCotizacionesUltimoMes,
        promedioValor: cotizaciones.data?.length ? 
          (cotizaciones.data.reduce((sum, c) => sum + (c.total_final || 0), 0) / cotizaciones.data.length) : 0
      },
      productos: {
        total: productos.data?.length || 0,
        activos: productos.data?.filter(p => p.activo).length || 0,
        inactivos: productos.data?.filter(p => !p.activo).length || 0,
        valorInventario: productos.data?.reduce((sum, p) => sum + (p.precio_venta_neto || 0), 0) || 0
      },
      obras: {
        total: obras.data?.length || 0
      },
      sistema: {
        uptimePercentage: 99.8, // Esto podría venir de un servicio de monitoreo
        baseDatosSize: '2.3GB', // Esto podría calcularse con una query específica
        ultimaActualizacion: new Date().toISOString()
      }
    }
  })
}

// Hook simple para contar usuarios (backup)
export function useSimpleUserCount() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*');

    if (error) throw error;

    return {
      total: data?.length || 0,
      activos: data?.filter(u => u.activo === true).length || 0,
      usuarios: data || []
    };
  });
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
