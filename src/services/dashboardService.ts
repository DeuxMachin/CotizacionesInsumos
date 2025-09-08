import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

// Servicio para Obras
export class ObrasService {
  static async getAll() {
    const { data, error } = await supabase
      .from('obras')
      .select(`
        *,
        cliente:clientes(id, nombre_razon_social, rut),
        vendedor:usuarios(id, nombre, apellido),
        tipo_obra:obra_tipos(id, nombre),
        tamano_obra:obra_tamanos(id, nombre)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getByCliente(clienteId: number) {
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('nombre')

    if (error) throw error
    return data
  }
}

// Servicio para Usuarios
export class UsuariosService {
  static async getAll() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo, created_at, last_login_at')
      .order('nombre')

    if (error) throw error
    return data
  }

  static async getVendedores() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, apellido, rol, activo')
      .eq('rol', 'vendedor')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    return data
  }
}

// Servicio para Targets
export class TargetsService {
  static async getAll() {
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
  }

  static async getByEstado(estado: string) {
    const { data, error } = await supabase
      .from('targets')
      .select(`
        *,
        tipo:target_tipos(id, nombre),
        creador:usuarios!creado_por(id, nombre, apellido),
        asignado:usuarios!asignado_a(id, nombre, apellido)
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

// Servicio para Bodegas
export class BodegasService {
  static async getAll() {
    const { data, error } = await supabase
      .from('bodegas')
      .select('*')
      .order('nombre')

    if (error) throw error
    return data
  }

  static async getWithStock() {
    const { data, error } = await supabase
      .from('bodegas')
      .select(`
        *,
        productos_stock:producto_stock(
          stock_actual,
          total_valorizado,
          producto:productos(id, nombre, sku)
        )
      `)
      .order('nombre')

    if (error) throw error
    return data
  }
}

// Servicio para estadísticas generales
export class EstadisticasService {
  static async getResumenGeneral() {
    const [clientes, cotizaciones, productos, obras, usuarios] = await Promise.all([
      supabase.from('clientes').select('id, estado').eq('estado', 'activo'),
      supabase.from('cotizaciones').select('id, estado, total_final'),
      supabase.from('productos').select('id, activo').eq('activo', true),
      supabase.from('obras').select('id'),
      supabase.from('usuarios').select('id, activo').eq('activo', true)
    ])

    const stats = {
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

    return stats
  }
}
