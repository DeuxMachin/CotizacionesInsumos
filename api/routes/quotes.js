const express = require('express');
const router = express.Router();
const { supabase, queryHelpers } = require('../config/database');

// GET /api/quotes - Obtener todas las cotizaciones
router.get('/', async (req, res) => {
  try {
    const { estado, cliente_id, limit = 50, offset = 0 } = req.query;
    
    // Construir el query con Supabase
    let query = supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes!cliente_principal_id (
          id,
          nombre_razon_social
        ),
        usuarios!creada_por (
          id,
          nombre,
          apellido
        ),
        obras!obra_id (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
    
    // Aplicar filtros opcionales
    if (estado) {
      query = query.eq('estado', estado);
    }
    if (cliente_id) {
      query = query.eq('cliente_principal_id', cliente_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Procesar los datos para aplanar la estructura
    const processedData = data.map(cotizacion => ({
      ...cotizacion,
      cliente_nombre: cotizacion.clientes?.nombre_razon_social || null,
      creador_nombre: cotizacion.usuarios?.nombre || null,
      creador_apellido: cotizacion.usuarios?.apellido || null,
      obra_nombre: cotizacion.obras?.nombre || null,
      // Limpiar objetos anidados
      clientes: undefined,
      usuarios: undefined,
      obras: undefined
    }));
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las cotizaciones',
      message: error.message
    });
  }
});

// GET /api/quotes/:id - Obtener una cotización específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes!cliente_principal_id (
          id,
          nombre_razon_social,
          rut
        ),
        usuarios!creada_por (
          id,
          nombre,
          apellido
        ),
        obras!obra_id (
          id,
          nombre,
          direccion
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Cotización no encontrada'
        });
      }
      throw error;
    }
    
    // Procesar los datos para aplanar la estructura
    const processedData = {
      ...data,
      cliente_nombre: data.clientes?.nombre_razon_social || null,
      cliente_rut: data.clientes?.rut || null,
      creador_nombre: data.usuarios?.nombre || null,
      creador_apellido: data.usuarios?.apellido || null,
      obra_nombre: data.obras?.nombre || null,
      obra_direccion: data.obras?.direccion || null,
      // Limpiar objetos anidados
      clientes: undefined,
      usuarios: undefined,
      obras: undefined
    };
    
    res.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la cotización',
      message: error.message
    });
  }
});

// GET /api/quotes/stats/general - Estadísticas básicas
router.get('/stats/general', async (req, res) => {
  try {
    // Obtener fecha de hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Obtener todas las cotizaciones de los últimos 30 días
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('estado, total_final')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    
    // Calcular estadísticas
    const stats = {
      total_cotizaciones: data.length,
      borradores: data.filter(c => c.estado === 'borrador').length,
      enviadas: data.filter(c => c.estado === 'enviada').length,
      aceptadas: data.filter(c => c.estado === 'aceptada').length,
      rechazadas: data.filter(c => c.estado === 'rechazada').length,
      valor_total: data.reduce((sum, c) => sum + (parseFloat(c.total_final) || 0), 0),
      valor_promedio: data.length > 0 
        ? data.reduce((sum, c) => sum + (parseFloat(c.total_final) || 0), 0) / data.length 
        : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

// POST /api/quotes - Crear una nueva cotización
router.post('/', async (req, res) => {
  try {
    const cotizacionData = req.body;
    
    // Generar folio automático si no viene
    if (!cotizacionData.folio) {
      const timestamp = Date.now().toString(36).toUpperCase();
      cotizacionData.folio = `COT-${timestamp}`;
    }
    
    // Calcular fecha de vencimiento si no viene
    if (!cotizacionData.fecha_vencimiento && cotizacionData.fecha_emision) {
      const fechaEmision = new Date(cotizacionData.fecha_emision);
      const validezDias = cotizacionData.validez_dias || 30;
      fechaEmision.setDate(fechaEmision.getDate() + validezDias);
      cotizacionData.fecha_vencimiento = fechaEmision.toISOString().split('T')[0];
    }
    
    const newCotizacion = await queryHelpers.create('cotizaciones', cotizacionData);
    
    res.status(201).json({
      success: true,
      data: newCotizacion,
      message: 'Cotización creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la cotización',
      message: error.message
    });
  }
});

// PUT /api/quotes/:id - Actualizar una cotización
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedCotizacion = await queryHelpers.update('cotizaciones', id, updateData);
    
    res.json({
      success: true,
      data: updatedCotizacion,
      message: 'Cotización actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la cotización',
      message: error.message
    });
  }
});

// DELETE /api/quotes/:id - Eliminar una cotización
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await queryHelpers.delete('cotizaciones', id);
    
    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la cotización',
      message: error.message
    });
  }
});

module.exports = router;
