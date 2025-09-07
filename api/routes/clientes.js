const express = require('express');
const router = express.Router();
const { supabase, queryHelpers } = require('../config/database');

// GET /api/clientes - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const { search, estado = 'activo', limit = 50, offset = 0 } = req.query;
    
    // Construir el query con Supabase
    let query = supabase
      .from('clientes')
      .select(`
        *,
        cotizaciones!cotizaciones_cliente_principal_id_fkey (
          id,
          total_final
        )
      `)
      .eq('estado', estado)
      .order('nombre_razon_social', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);
    
    // Aplicar búsqueda si existe
    if (search) {
      query = query.or(`nombre_razon_social.ilike.%${search}%,rut.ilike.%${search}%,nombre_fantasia.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Procesar los datos para incluir totales
    const processedData = data.map(cliente => {
      const cotizaciones = cliente.cotizaciones || [];
      const totalCotizaciones = cotizaciones.length;
      const totalVentas = cotizaciones.reduce((sum, cot) => sum + (parseFloat(cot.total_final) || 0), 0);
      
      // Remover el array de cotizaciones del objeto y agregar los totales
      const { cotizaciones: _, ...clienteData } = cliente;
      return {
        ...clienteData,
        total_cotizaciones: totalCotizaciones,
        total_ventas: totalVentas
      };
    });
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los clientes',
      message: error.message
    });
  }
});

// GET /api/clientes/:id - Obtener un cliente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await queryHelpers.getById('clientes', id);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el cliente',
      message: error.message
    });
  }
});

// GET /api/clientes/:id/cotizaciones - Obtener cotizaciones de un cliente
router.get('/:id/cotizaciones', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        obras!obra_id (
          id,
          nombre
        ),
        usuarios!creada_por (
          id,
          nombre,
          apellido
        )
      `)
      .eq('cliente_principal_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Procesar los datos para aplanar la estructura
    const processedData = data.map(cotizacion => ({
      ...cotizacion,
      obra_nombre: cotizacion.obras?.nombre || null,
      creador_nombre: cotizacion.usuarios?.nombre || null,
      creador_apellido: cotizacion.usuarios?.apellido || null,
      // Limpiar los objetos anidados
      obras: undefined,
      usuarios: undefined
    }));
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones del cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las cotizaciones del cliente',
      message: error.message
    });
  }
});

// POST /api/clientes - Crear un nuevo cliente
router.post('/', async (req, res) => {
  try {
    const clienteData = req.body;
    
    const newCliente = await queryHelpers.create('clientes', clienteData);
    
    res.status(201).json({
      success: true,
      data: newCliente,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el cliente',
      message: error.message
    });
  }
});

// PUT /api/clientes/:id - Actualizar un cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedCliente = await queryHelpers.update('clientes', id, updateData);
    
    res.json({
      success: true,
      data: updatedCliente,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el cliente',
      message: error.message
    });
  }
});

// DELETE /api/clientes/:id - Eliminar (desactivar) un cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - cambiar estado a inactivo
    const updatedCliente = await queryHelpers.update('clientes', id, { estado: 'inactivo' });
    
    res.json({
      success: true,
      data: updatedCliente,
      message: 'Cliente desactivado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar el cliente',
      message: error.message
    });
  }
});

module.exports = router;
