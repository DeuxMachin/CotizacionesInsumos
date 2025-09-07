const express = require('express');
const router = express.Router();
const { supabase, queryHelpers } = require('../config/database');

// GET /api/productos - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { search, estado = 'vigente', activo = 'true', limit = 50, offset = 0 } = req.query;
    
    // Convertir string a boolean
    const isActivo = activo === 'true';
    
    // Construir el query con Supabase
    let query = supabase
      .from('productos')
      .select(`
        *,
        producto_categorias!left (
          categorias_productos (
            id,
            nombre
          )
        ),
        producto_stock!left (
          stock_actual,
          bodega_id
        )
      `)
      .eq('estado', estado)
      .eq('activo', isActivo)
      .order('nombre', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);
    
    // Aplicar búsqueda si existe
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,sku.ilike.%${search}%,descripcion.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Procesar los datos para incluir categorias y stock total
    const processedData = data.map(producto => {
      // Concatenar nombres de categorías
      const categorias = producto.producto_categorias
        ?.map(pc => pc.categorias_productos?.nombre)
        .filter(Boolean)
        .join(', ') || '';
      
      // Calcular stock total
      const stockTotal = producto.producto_stock
        ?.reduce((sum, stock) => sum + (parseFloat(stock.stock_actual) || 0), 0) || 0;
      
      // Limpiar el objeto
      const { producto_categorias, producto_stock, ...productoData } = producto;
      
      return {
        ...productoData,
        categorias,
        stock_total: stockTotal
      };
    });
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los productos',
      message: error.message
    });
  }
});

// GET /api/productos/:id - Obtener un producto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_categorias!left (
          categorias_productos (
            id,
            nombre
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado'
        });
      }
      throw error;
    }
    
    // Procesar categorías
    const categorias = data.producto_categorias
      ?.map(pc => pc.categorias_productos?.nombre)
      .filter(Boolean)
      .join(', ') || '';
    
    const { producto_categorias, ...productoData } = data;
    
    res.json({
      success: true,
      data: {
        ...productoData,
        categorias
      }
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el producto',
      message: error.message
    });
  }
});

// GET /api/productos/:id/stock - Obtener stock de un producto por bodega
router.get('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('producto_stock')
      .select(`
        *,
        bodegas!bodega_id (
          id,
          nombre,
          ubicacion
        )
      `)
      .eq('producto_id', id)
      .order('bodega_id', { ascending: true });
    
    if (error) throw error;
    
    // Procesar los datos para aplanar la estructura
    const processedData = data.map(stock => ({
      ...stock,
      bodega_nombre: stock.bodegas?.nombre || null,
      bodega_ubicacion: stock.bodegas?.ubicacion || null,
      bodegas: undefined
    }));
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener stock del producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el stock del producto',
      message: error.message
    });
  }
});

// POST /api/productos - Crear un nuevo producto
router.post('/', async (req, res) => {
  try {
    const productoData = req.body;
    
    const newProducto = await queryHelpers.create('productos', productoData);
    
    res.status(201).json({
      success: true,
      data: newProducto,
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el producto',
      message: error.message
    });
  }
});

// PUT /api/productos/:id - Actualizar un producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedProducto = await queryHelpers.update('productos', id, updateData);
    
    res.json({
      success: true,
      data: updatedProducto,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el producto',
      message: error.message
    });
  }
});

// DELETE /api/productos/:id - Eliminar (desactivar) un producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - cambiar activo a false
    const updatedProducto = await queryHelpers.update('productos', id, { activo: false });
    
    res.json({
      success: true,
      data: updatedProducto,
      message: 'Producto desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el producto',
      message: error.message
    });
  }
});

module.exports = router;
