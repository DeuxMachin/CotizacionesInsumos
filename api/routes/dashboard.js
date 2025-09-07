const express = require('express');
const router = express.Router();
const { supabase, queryHelpers } = require('../config/database');

// GET /api/dashboard/stats - Estadísticas del dashboard
router.get('/stats', async (req, res) => {
  try {
    // Obtener fecha de hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Estadísticas generales
    const statsQueries = await Promise.all([
      // Total de cotizaciones con estado y valor
      supabase
        .from('cotizaciones')
        .select('estado, total_final'),
      
      // Total de clientes activos
      supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'activo'),
      
      // Total de productos activos
      supabase
        .from('productos')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true)
        .eq('estado', 'vigente'),
      
      // Cotizaciones recientes (últimos 30 días)
      supabase
        .from('cotizaciones')
        .select('total_final')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Top 5 clientes con cotizaciones
      supabase
        .from('clientes')
        .select(`
          id,
          nombre_razon_social,
          cotizaciones!cotizaciones_cliente_principal_id_fkey (
            id,
            total_final
          )
        `)
        .order('nombre_razon_social')
    ]);
    
    // Procesar cotizaciones por estado
    const cotizacionesData = statsQueries[0].data || [];
    const cotizacionesPorEstado = {};
    cotizacionesData.forEach(cot => {
      if (!cotizacionesPorEstado[cot.estado]) {
        cotizacionesPorEstado[cot.estado] = {
          estado: cot.estado,
          cantidad: 0,
          valor_total: 0
        };
      }
      cotizacionesPorEstado[cot.estado].cantidad++;
      cotizacionesPorEstado[cot.estado].valor_total += parseFloat(cot.total_final) || 0;
    });
    
    // Procesar cotizaciones del mes
    const cotizacionesMes = statsQueries[3].data || [];
    const estadisticasMes = {
      cotizaciones_mes: cotizacionesMes.length,
      valor_mes: cotizacionesMes.reduce((sum, cot) => sum + (parseFloat(cot.total_final) || 0), 0)
    };
    
    // Procesar top clientes
    const clientesData = statsQueries[4].data || [];
    const topClientes = clientesData
      .map(cliente => {
        const cotizaciones = cliente.cotizaciones || [];
        const valorTotal = cotizaciones.reduce((sum, cot) => sum + (parseFloat(cot.total_final) || 0), 0);
        return {
          nombre_razon_social: cliente.nombre_razon_social,
          total_cotizaciones: cotizaciones.length,
          valor_total: valorTotal
        };
      })
      .filter(cliente => cliente.total_cotizaciones > 0)
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        cotizaciones_por_estado: Object.values(cotizacionesPorEstado),
        total_clientes_activos: statsQueries[1].count || 0,
        total_productos_activos: statsQueries[2].count || 0,
        estadisticas_mes: estadisticasMes,
        top_clientes: topClientes
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
      message: error.message
    });
  }
});

// GET /api/dashboard/actividad-reciente - Actividad reciente
router.get('/actividad-reciente', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        id,
        folio,
        estado,
        total_final,
        created_at,
        clientes!cliente_principal_id (
          id,
          nombre_razon_social
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    // Procesar los datos para el formato esperado
    const processedData = data.map(cot => ({
      tipo: 'cotizacion',
      id: cot.id,
      referencia: cot.folio,
      estado: cot.estado,
      valor: cot.total_final,
      descripcion: cot.clientes?.nombre_razon_social || 'Sin cliente',
      fecha: cot.created_at
    }));
    
    res.json({
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener actividad reciente',
      message: error.message
    });
  }
});

module.exports = router;
