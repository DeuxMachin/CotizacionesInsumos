import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Producto = Database['public']['Tables']['productos']['Row']
type ProductoStock = Database['public']['Tables']['producto_stock']['Row']
type Bodega = Database['public']['Tables']['bodegas']['Row']
type CategoriaProducto = Database['public']['Tables']['categorias_productos']['Row']

type ProductoStockJoined = ProductoStock & { bodegas: Bodega }
type StockItem = {
  bodega_id: number
  bodega_nombre: string
  ubicacion: string | null
  stock_actual: number
  total_valorizado: number
}
type PCJoined = { categorias_productos: CategoriaProducto }

export interface InventoryItem {
  id: number
  sku: string | null
  nombre: string
  descripcion: string | null
  unidad: string
  codigo_barra: string | null
  precio_compra: number | null
  precio_venta_neto: number | null
  estado: string
  activo: boolean
  created_at: string
  categorias: CategoriaProducto[]
  stock: {
    bodega_id: number
    bodega_nombre: string
    ubicacion: string | null
    stock_actual: number
    total_valorizado: number
  }[]
  total_stock: number
  status: 'in-stock' | 'low' | 'out'
}

export class StockService {
  // Obtener todos los productos con stock
  static async getAllInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categorias(
          categorias_productos(*)
        ),
        producto_stock(
          bodega_id,
          ubicacion,
          stock_actual,
          total_valorizado,
          bodegas(*)
        )
      `)
      .eq('activo', true)
      .order('nombre')

    if (error) throw error

    return data.map(producto => {
      const stock = producto.producto_stock?.map((ps: ProductoStockJoined): StockItem => ({
        bodega_id: ps.bodega_id,
        bodega_nombre: ps.bodegas?.nombre || 'Sin bodega',
        ubicacion: ps.ubicacion,
        stock_actual: ps.stock_actual,
        total_valorizado: ps.total_valorizado
      })) || []

      const total_stock = stock.reduce((sum: number, s: StockItem) => sum + s.stock_actual, 0)

      return {
        id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        unidad: producto.unidad,
        codigo_barra: producto.codigo_barra,
        precio_compra: producto.precio_compra,
        precio_venta_neto: producto.precio_venta_neto,
        estado: producto.estado,
        activo: producto.activo,
        created_at: producto.created_at,
        categorias: producto.producto_categorias?.map((pc: PCJoined) => pc.categorias_productos) || [],
        stock,
        total_stock,
        status: this.inferStatus(total_stock)
      }
    })
  }

  // Buscar productos con stock
  static async searchInventory(searchTerm: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categorias(
          categorias_productos(*)
        ),
        producto_stock(
          bodega_id,
          ubicacion,
          stock_actual,
          total_valorizado,
          bodegas(*)
        )
      `)
      .eq('activo', true)
      .or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .order('nombre')

    if (error) throw error

    return data.map(producto => {
      const stock = producto.producto_stock?.map((ps: ProductoStockJoined): StockItem => ({
        bodega_id: ps.bodega_id,
        bodega_nombre: ps.bodegas?.nombre || 'Sin bodega',
        ubicacion: ps.ubicacion,
        stock_actual: ps.stock_actual,
        total_valorizado: ps.total_valorizado
      })) || []

      const total_stock = stock.reduce((sum: number, s: StockItem) => sum + s.stock_actual, 0)

      return {
        id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        unidad: producto.unidad,
        codigo_barra: producto.codigo_barra,
        precio_compra: producto.precio_compra,
        precio_venta_neto: producto.precio_venta_neto,
        estado: producto.estado,
        activo: producto.activo,
        created_at: producto.created_at,
        categorias: producto.producto_categorias?.map((pc: PCJoined) => pc.categorias_productos) || [],
        stock,
        total_stock,
        status: this.inferStatus(total_stock)
      }
    })
  }

  // Obtener productos por categoría
  static async getInventoryByCategory(categoryId: number): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categorias!inner(
          categorias_productos(*)
        ),
        producto_stock(
          bodega_id,
          ubicacion,
          stock_actual,
          total_valorizado,
          bodegas(*)
        )
      `)
      .eq('activo', true)
      .eq('producto_categorias.categoria_id', categoryId)
      .order('nombre')

    if (error) throw error

    return data.map(producto => {
      const stock = producto.producto_stock?.map((ps: ProductoStockJoined): StockItem => ({
        bodega_id: ps.bodega_id,
        bodega_nombre: ps.bodegas?.nombre || 'Sin bodega',
        ubicacion: ps.ubicacion,
        stock_actual: ps.stock_actual,
        total_valorizado: ps.total_valorizado
      })) || []

      const total_stock = stock.reduce((sum: number, s: StockItem) => sum + s.stock_actual, 0)

      return {
        id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        unidad: producto.unidad,
        codigo_barra: producto.codigo_barra,
        precio_compra: producto.precio_compra,
        precio_venta_neto: producto.precio_venta_neto,
        estado: producto.estado,
        activo: producto.activo,
        created_at: producto.created_at,
        categorias: producto.producto_categorias?.map((pc: PCJoined) => pc.categorias_productos) || [],
        stock,
        total_stock,
        status: this.inferStatus(total_stock)
      }
    })
  }

  // Obtener todas las categorías
  static async getCategories(): Promise<CategoriaProducto[]> {
    const { data, error } = await supabase
      .from('categorias_productos')
      .select('*')
      .order('nombre')

    if (error) throw error
    return data
  }

  // Inferir status basado en stock total
  static inferStatus(totalStock: number): 'in-stock' | 'low' | 'out' {
    if (totalStock === 0) return 'out'
    if (totalStock < 10) return 'low' // Puedes ajustar este umbral
    return 'in-stock'
  }
}