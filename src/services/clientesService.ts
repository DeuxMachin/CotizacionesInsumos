import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { AuditLogger } from './auditLogger'


type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export class ClientesService {
  // Obtener todos los clientes
  static async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        ),
        cliente_saldos:cliente_saldos!cliente_saldos_cliente_id_fkey (
          id, snapshot_date, pagado, pendiente, vencido, dinero_cotizado
        ).order(snapshot_date.desc)
      `)
      .order('nombre_razon_social')

    if (error) throw error
    return data
  }

  // Obtener cliente por ID
  static async getById(id: number) {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        ),
        cliente_saldos:cliente_saldos!cliente_saldos_cliente_id_fkey (
          id, snapshot_date, pagado, pendiente, vencido, dinero_cotizado
        ).order(snapshot_date.desc)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Buscar clientes por término
  static async search(searchTerm: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        ),
        cliente_saldos:cliente_saldos!cliente_saldos_cliente_id_fkey (
          id, snapshot_date, pagado, pendiente, vencido, dinero_cotizado
        )
      `)
      .or(`nombre_razon_social.ilike.%${searchTerm}%,nombre_fantasia.ilike.%${searchTerm}%,rut.ilike.%${searchTerm}%`)
      .order('nombre_razon_social')

    if (error) throw error
    return data
  }

  // Crear nuevo cliente
  static async create(cliente: ClienteInsert, userInfo?: { id: string; email: string; name?: string }) {
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single()

    if (error) throw error

    // Registrar en audit log si se proporciona información del usuario
    if (userInfo && data) {
      await AuditLogger.logClienteCreated(
        userInfo.id,
        userInfo.email,
        data.id,
        data.nombre_razon_social,
        data.rut
      )
    }

    return data
  }

  // Actualizar cliente
  static async update(id: number, cliente: ClienteUpdate) {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  // Eliminar cliente (cambiar estado)
  static async delete(id: number) {
    const { data, error } = await supabase
      .from('clientes')
      .update({ estado: 'inactivo' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Verificar si RUT ya existe
  static async checkRutExists(rut: string, excludeId?: number) {
    let query = supabase
      .from('clientes')
      .select('id')
      .eq('rut', rut)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data.length > 0
  }

  // Obtener todos los tipos de cliente
  static async getClientTypes() {
    const { data, error } = await supabase
      .from('cliente_tipos')
      .select('*')
      .order('nombre')

    if (error) throw error
    return data
  }
}
