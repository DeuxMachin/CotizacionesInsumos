import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Producto = Database['public']['Tables']['productos']['Row']
type ProductoTipo = Database['public']['Tables']['producto_tipos']['Row']

type StockItem = {
  bodega_id: number
  bodega_nombre: string
  ubicacion: string | null
  stock_actual: number
  total_valorizado: number
}

export interface InventoryItem {
  id: number
  sku: string | null
  nombre: string
  descripcion: string | null
  unidad: string
  costo_unitario: number | null
  precio_neto: number | null
  precio_venta: number | null
  moneda: string | null
  tipo_id: number | null
  afecto_iva: boolean | null
  control_stock: boolean | null
  ficha_tecnica: string | null
  estado: string | null
  activo: boolean | null
  created_at: string | null
  tipo: ProductoTipo | null
}

export class StockService {
  // Obtener todos los productos con stock (sin joins frágiles)
  static async getAllInventory(): Promise<InventoryItem[]> {
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (productosError) {
      console.error('Supabase getAllInventory error:', productosError)
      throw new Error(productosError.message || 'Error cargando inventario')
    }

    if (!productos || productos.length === 0) return []

    // Cargar tipos de producto
    const { data: tipos, error: tiposError } = await supabase
      .from('producto_tipos')
      .select('*')

    if (tiposError) {
      console.error('Supabase producto_tipos error:', tiposError)
      throw new Error(tiposError.message || 'Error cargando tipos de producto')
    }

    const tiposMap = new Map<number, ProductoTipo>((tipos || []).map(t => [t.id, t]))

    return productos.map(producto => this.mapToInventoryItem(producto, tiposMap))
  }

  // Buscar productos con stock
  static async searchInventory(searchTerm: string): Promise<InventoryItem[]> {
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .order('nombre')

    if (productosError) {
      console.error('Supabase searchInventory error:', productosError)
      throw new Error(productosError.message || 'Error buscando inventario')
    }

    if (!productos || productos.length === 0) return []

    const { data: tipos, error: tiposError } = await supabase
      .from('producto_tipos')
      .select('*')

    if (tiposError) {
      console.error('Supabase producto_tipos error:', tiposError)
      throw new Error(tiposError.message || 'Error cargando tipos de producto')
    }

    const tiposMap = new Map<number, ProductoTipo>((tipos || []).map(t => [t.id, t]))

    return productos.map(producto => this.mapToInventoryItem(producto, tiposMap))
  }

  // Obtener productos por categoría
  static async getInventoryByCategory(categoryId: number): Promise<InventoryItem[]> {
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .eq('tipo_id', categoryId)
      .order('nombre')

    if (productosError) {
      console.error('Supabase getInventoryByCategory error:', productosError)
      throw new Error(productosError.message || 'Error cargando inventario por categoría')
    }

    if (!productos || productos.length === 0) return []

    const { data: tipos, error: tiposError } = await supabase
      .from('producto_tipos')
      .select('*')

    if (tiposError) {
      console.error('Supabase producto_tipos error:', tiposError)
      throw new Error(tiposError.message || 'Error cargando tipos de producto')
    }

    const tiposMap = new Map<number, ProductoTipo>((tipos || []).map(t => [t.id, t]))

    return productos.map(producto => this.mapToInventoryItem(producto, tiposMap))
  }

  // Obtener todas las categorías
  static async getCategories(): Promise<ProductoTipo[]> {
    const { data, error } = await supabase
      .from('producto_tipos')
      .select('*')
      .order('nombre')

    if (error) {
      console.error('Supabase getCategories error:', error)
      throw new Error(error.message || 'Error cargando tipos de producto')
    }
    return data || []
  }

  // Map helpers
  private static mapToInventoryItem(
    producto: Producto,
    tiposMap: Map<number, ProductoTipo>
  ): InventoryItem {
    return {
      id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      unidad: producto.unidad,
      costo_unitario: producto.costo_unitario,
      precio_neto: producto.precio_neto,
      precio_venta: producto.precio_venta,
      moneda: producto.moneda,
      tipo_id: producto.tipo_id,
      afecto_iva: producto.afecto_iva,
      control_stock: producto.control_stock,
      ficha_tecnica: producto.ficha_tecnica,
      tipo: producto.tipo_id ? tiposMap.get(producto.tipo_id) || null : null,
      estado: producto.estado,
      activo: producto.activo,
      created_at: producto.created_at
    }
  }
}