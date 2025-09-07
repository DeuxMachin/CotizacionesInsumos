const express = require('express');
const router = express.Router();
const { supabase, queryHelpers } = require('../config/database');

// GET /api/obras - Obtener todas las obras
router.get('/', async (req, res) => {
  try {
    const { search, cliente_id, limit = 50, offset = 0 } = req.query;
    
    // Construir el query con Supabase
    let query = supabase
      .from('obras')
      .select(`
        *,
        clientes!cliente_id (
          id,
          nombre_razon_social,
          rut
        ),
        usuarios!vendedor_id (
          id,
          nombre,
          apellido
        ),
        obra_tipos!tipo_obra_id (
          id,
          nombre
        ),
        obra_tamanos!tamano_obra_id (
          id,
          nombre
        ),
        cotizaciones!obra_id (
          id
        )
      `)
      .order('nombre', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);
    
    // Aplicar filtro de cliente si existe
    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id);
    }
    
    // Aplicar búsqueda si existe
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,direccion.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Procesar los datos para aplanar la estructura y agregar conteo
    const processedData = data.map(obra => {
      const totalCotizaciones = obra.cotizaciones?.length || 0;
      
      return {
        ...obra,
        cliente_nombre: obra.clientes?.nombre_razon_social || null,
        cliente_rut: obra.clientes?.rut || null,
        vendedor_nombre: obra.usuarios?.nombre || null,
        vendedor_apellido: obra.usuarios?.apellido || null,
        tipo_obra: obra.obra_tipos?.nombre || null,
        tamano_obra: obra.obra_tamanos?.nombre || null,
        total_cotizaciones: totalCotizaciones,
        // Limpiar objetos anidados
        clientes: undefined,
        usuarios: undefined,
        obra_tipos: undefined,
        obra_tamanos: undefined,
        cotizaciones: undefined
      };
    });
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener obras:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las obras',
      message: error.message
    });
  }
});

// GET /api/obras/:id - Obtener una obra específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('obras')
      .select(`
        *,
        clientes!cliente_id (
          id,
          nombre_razon_social,
          rut
        ),
        usuarios!vendedor_id (
          id,
          nombre,
          apellido
        ),
        obra_tipos!tipo_obra_id (
          id,
          nombre
        ),
        obra_tamanos!tamano_obra_id (
          id,
          nombre
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Obra no encontrada'
        });
      }
      throw error;
    }
    
    // Procesar los datos para aplanar la estructura
    const processedData = {
      ...data,
      cliente_nombre: data.clientes?.nombre_razon_social || null,
      cliente_rut: data.clientes?.rut || null,
      vendedor_nombre: data.usuarios?.nombre || null,
      vendedor_apellido: data.usuarios?.apellido || null,
      tipo_obra: data.obra_tipos?.nombre || null,
      tamano_obra: data.obra_tamanos?.nombre || null,
      // Limpiar objetos anidados
      clientes: undefined,
      usuarios: undefined,
      obra_tipos: undefined,
      obra_tamanos: undefined
    };
    
    res.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Error al obtener obra:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la obra',
      message: error.message
    });
  }
});

// GET /api/obras/:id/cotizaciones - Obtener cotizaciones de una obra
router.get('/:id/cotizaciones', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
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
        )
      `)
      .eq('obra_id', id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Procesar los datos para aplanar la estructura
    const processedData = data.map(cotizacion => ({
      ...cotizacion,
      cliente_nombre: cotizacion.clientes?.nombre_razon_social || null,
      creador_nombre: cotizacion.usuarios?.nombre || null,
      creador_apellido: cotizacion.usuarios?.apellido || null,
      // Limpiar objetos anidados
      clientes: undefined,
      usuarios: undefined
    }));
    
    res.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
  } catch (error) {
    console.error('Error al obtener cotizaciones de la obra:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las cotizaciones de la obra',
      message: error.message
    });
  }
});

// POST /api/obras - Crear una nueva obra
router.post('/', async (req, res) => {
  try {
    const obraData = req.body;
    
    const newObra = await queryHelpers.create('obras', obraData);
    
    res.status(201).json({
      success: true,
      data: newObra,
      message: 'Obra creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear obra:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la obra',
      message: error.message
    });
  }
});

// PUT /api/obras/:id - Actualizar una obra
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedObra = await queryHelpers.update('obras', id, updateData);
    
    res.json({
      success: true,
      data: updatedObra,
      message: 'Obra actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar obra:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la obra',
      message: error.message
    });
  }
});

// DELETE /api/obras/:id - Eliminar una obra
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await queryHelpers.delete('obras', id);
    
    res.json({
      success: true,
      message: 'Obra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar obra:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la obra',
      message: error.message
    });
  }
});

module.exports = router;
