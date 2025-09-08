import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Cliente = Database['public']['Tables']['clientes']['Row']
type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export class ClientesService {
  // Obtener todos los clientes
  static async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_razon_social')

    if (error) throw error
    return data
  }

  // Obtener cliente por ID
  static async getById(id: number) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Buscar clientes por término
  static async search(searchTerm: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre_razon_social.ilike.%${searchTerm}%,nombre_fantasia.ilike.%${searchTerm}%,rut.ilike.%${searchTerm}%`)
      .order('nombre_razon_social')

    if (error) throw error
    return data
  }

  // Crear nuevo cliente
  static async create(cliente: ClienteInsert) {
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Actualizar cliente
  static async update(id: number, cliente: ClienteUpdate) {
    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select()
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
}
