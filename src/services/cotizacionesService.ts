import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'


type CotizacionInsert = Database['public']['Tables']['cotizaciones']['Insert']
type CotizacionUpdate = Database['public']['Tables']['cotizaciones']['Update']

export class CotizacionesService {
  // Obtener todas las cotizaciones con datos relacionados
  static async getAll() {
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
  }

  // Obtener cotización por ID
  static async getById(id: number) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(*),
        obra:obras(*),
        creador:usuarios!creada_por(id, nombre, apellido)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Crear nueva cotización
  static async create(cotizacion: CotizacionInsert) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert(cotizacion)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Actualizar cotización
  static async update(id: number, cotizacion: CotizacionUpdate) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .update(cotizacion)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Cambiar estado de cotización
  static async updateStatus(id: number, estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida') {
    const { data, error } = await supabase
      .from('cotizaciones')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Obtener cotizaciones por cliente
  static async getByCliente(clienteId: number) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        obra:obras(id, nombre),
        creador:usuarios!creada_por(id, nombre, apellido)
      `)
      .eq('cliente_principal_id', clienteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Obtener cotizaciones por estado
  static async getByEstado(estado: string) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(id, nombre_razon_social, rut),
        obra:obras(id, nombre),
        creador:usuarios!creada_por(id, nombre, apellido)
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Generar próximo folio
  static async generateFolio() {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('folio')
      .not('folio', 'is', null)
      .order('id', { ascending: false })
      .limit(1)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'COT-0001'
    }

    const lastFolio = data[0].folio
    if (!lastFolio) {
      return 'COT-0001'
    }

    // Extraer número del folio (formato: COT-XXXX)
    const match = lastFolio.match(/COT-(\d+)/)
    if (match) {
      const nextNumber = parseInt(match[1]) + 1
      return `COT-${nextNumber.toString().padStart(4, '0')}`
    }

    return 'COT-0001'
  }
}
