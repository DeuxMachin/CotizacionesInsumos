import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Producto = Database['public']['Tables']['productos']['Row']
type ProductoInsert = Database['public']['Tables']['productos']['Insert']
type ProductoUpdate = Database['public']['Tables']['productos']['Update']

export class ProductosService {
  // Obtener todos los productos activos
  static async getAll() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    return data
  }

  // Obtener producto por ID
  static async getById(id: number) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Buscar productos
  static async search(searchTerm: string) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .order('nombre')

    if (error) throw error
    return data
  }

  // Crear nuevo producto
  static async create(producto: ProductoInsert) {
    const { data, error } = await supabase
      .from('productos')
      .insert(producto)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Actualizar producto
  static async update(id: number, producto: ProductoUpdate) {
    const { data, error } = await supabase
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Eliminar producto (cambiar a inactivo)
  static async delete(id: number) {
    const { data, error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Verificar si SKU ya existe
  static async checkSkuExists(sku: string, excludeId?: number) {
    let query = supabase
      .from('productos')
      .select('id')
      .eq('sku', sku)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data.length > 0
  }

  // Obtener productos con stock
  static async getWithStock() {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        stock:producto_stock(
          stock_actual,
          bodega:bodegas(nombre)
        )
      `)
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    return data
  }
}
