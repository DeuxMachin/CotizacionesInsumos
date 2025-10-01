import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'Últimos 6 meses';
    
    // Calculamos las fechas según el período
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'Último mes':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'Últimos 3 meses':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'Últimos 6 meses':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'Último año':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    // Obtener datos de cotizaciones y notas de venta
    const [cotizacionesResult, notasVentaResult, clientesResult, productosResult] = await Promise.all([
      // Cotizaciones del período
      supabase
        .from('cotizaciones')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString()),
      
      // Notas de venta del período (ventas reales)
      supabase
        .from('notas_venta')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString()),
      
      // Clientes totales
      supabase
        .from('clientes')
        .select('id, estado, created_at'),
      
      // Productos para mostrar en top productos (mock por ahora)
      supabase
        .from('productos')
        .select('id, nombre, precio_venta')
        .eq('activo', true)
        .limit(5)
    ]);

    if (cotizacionesResult.error) throw cotizacionesResult.error;
    if (notasVentaResult.error) throw notasVentaResult.error;
    if (clientesResult.error) throw clientesResult.error;
    if (productosResult.error) throw productosResult.error;

    const cotizaciones = cotizacionesResult.data || [];
    const notasVenta = notasVentaResult.data || [];
    const clientes = clientesResult.data || [];
    const productos = productosResult.data || [];

    // Calcular KPIs financieros
    const totalVentas = notasVenta.reduce((sum, nota) => sum + (nota.total || 0), 0);
    const totalNeto = notasVenta.reduce((sum, nota) => sum + (nota.subtotal_neto_post_desc || 0), 0);
    const totalIva = notasVenta.reduce((sum, nota) => sum + (nota.iva_monto || 0), 0);
    const exento = 0; // Asumimos que no hay ventas exentas por ahora
    
    // Calcular período anterior para comparación
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    const periodDiff = now.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodDiff);
    
    const { data: previousNotasVenta } = await supabase
      .from('notas_venta')
      .select('total, subtotal_neto_post_desc, iva_monto')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString());

    const previousTotalVentas = (previousNotasVenta || []).reduce((sum, nota) => sum + (nota.total || 0), 0);
    const previousTotalNeto = (previousNotasVenta || []).reduce((sum, nota) => sum + (nota.subtotal_neto_post_desc || 0), 0);

    // Calcular tendencias
    const ventasTrend = previousTotalVentas > 0 ? ((totalVentas - previousTotalVentas) / previousTotalVentas) * 100 : 0;
    const netoTrend = previousTotalNeto > 0 ? ((totalNeto - previousTotalNeto) / previousTotalNeto) * 100 : 0;

    // Calcular ticket promedio basado en cotizaciones vendidas del mes actual
    const cotizacionesVendidasMesActual = cotizaciones.filter(c => {
      const fechaCotizacion = new Date(c.created_at);
      const now = new Date();
      // Solo cotizaciones del mes actual que tienen notas de venta asociadas
      if (isNaN(fechaCotizacion.getTime())) return false;
      return fechaCotizacion.getMonth() === now.getMonth() && 
             fechaCotizacion.getFullYear() === now.getFullYear() &&
             (c.estado === 'aceptada' || c.estado === 'aprobada'); // Cotizaciones aceptadas o aprobadas
    });
    
    // Todas las cotizaciones del mes actual (para el subtítulo)
    const todasCotizacionesMesActual = cotizaciones.filter(c => {
      const fechaCotizacion = new Date(c.created_at);
      const now = new Date();
      // Asegurarse de que la fecha es válida
      if (isNaN(fechaCotizacion.getTime())) return false;
      return fechaCotizacion.getMonth() === now.getMonth() && 
             fechaCotizacion.getFullYear() === now.getFullYear();
    });
    
    const totalCotizacionesVendidasMes = cotizacionesVendidasMesActual.reduce((sum, cot) => sum + (cot.total || 0), 0);
    const ticketPromedioActual = cotizacionesVendidasMesActual.length > 0 ? totalCotizacionesVendidasMes / cotizacionesVendidasMesActual.length : 0;

    // Calcular ticket promedio del mes anterior para comparación (usando todas las cotizaciones vendidas del mes anterior)
    const cotizacionesVendidasMesAnterior = cotizaciones.filter(c => {
      const fechaCotizacion = new Date(c.created_at);
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const añoAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      if (isNaN(fechaCotizacion.getTime())) return false;
      return fechaCotizacion.getMonth() === mesAnterior && 
             fechaCotizacion.getFullYear() === añoAnterior &&
             (c.estado === 'aceptada' || c.estado === 'aprobada');
    });
    
    const totalCotizacionesVendidasMesAnterior = cotizacionesVendidasMesAnterior.reduce((sum, cot) => sum + (cot.total || 0), 0);
    const ticketPromedioAnterior = cotizacionesVendidasMesAnterior.length > 0 ? totalCotizacionesVendidasMesAnterior / cotizacionesVendidasMesAnterior.length : 0;
    
    // Calcular crecimiento del ticket promedio
    const ticketPromedioTrend = ticketPromedioAnterior > 0 ? ((ticketPromedioActual - ticketPromedioAnterior) / ticketPromedioAnterior) * 100 : 0;

    // Calcular tasa de conversión (cotizaciones aceptadas / total cotizaciones)
    const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada' || c.estado === 'aprobada').length;
    const tasaConversion = cotizaciones.length > 0 ? (cotizacionesAceptadas / cotizaciones.length) * 100 : 0;

    // Ventas por día del mes actual
    const ventasPorDia = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayStart = new Date(now.getFullYear(), now.getMonth(), day);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), day + 1);
      
      const ventasDelDia = notasVenta.filter(nota => {
        const fechaNota = new Date(nota.created_at);
        return fechaNota >= dayStart && fechaNota < dayEnd;
      });
      
      const totalDia = ventasDelDia.reduce((sum, nota) => sum + (nota.total || 0), 0);
      
      return {
        day,
        sales: totalDia,
        label: `D${day.toString().padStart(2, '0')}`
      };
    });

    // Productos más vendidos - intentar obtener datos reales de cotizaciones/notas de venta
    // Si no hay datos suficientes, usar mock con productos reales
    const topProductos = productos.slice(0, 5).map((producto, index) => ({
      id: producto.id,
      nombre: producto.nombre,
      cantidad: Math.floor(Math.random() * 50) + 10 + (5 - index) * 5, // Mock progresivo
      ingresos: (producto.precio_venta || 10000) * (Math.floor(Math.random() * 50) + 10 + (5 - index) * 5)
    }));

    // Estado de clientes
    const clientesPorEstado = clientes.reduce((acc, cliente) => {
      const estado = cliente.estado || 'activo';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Respuesta con todos los datos
    const reportData = {
      kpis: {
        totalVentas: {
          value: totalVentas,
          trend: ventasTrend,
          previous: previousTotalVentas
        },
        exento: {
          value: exento,
          trend: 0,
          previous: 0
        },
        neto: {
          value: totalNeto,
          trend: netoTrend,
          previous: previousTotalNeto
        },
        iva: {
          value: totalIva,
          trend: netoTrend, // Misma tendencia que el neto
          previous: (previousNotasVenta || []).reduce((sum, nota) => sum + (nota.iva_monto || 0), 0)
        },
        ticketPromedio: {
          value: ticketPromedioActual,
          trend: ticketPromedioTrend,
          transacciones: todasCotizacionesMesActual.length
        },
        tasaConversion: {
          value: tasaConversion,
          trend: 0, // Se calculará cuando tengamos más datos históricos
          cotizaciones: cotizaciones.length
        },
        crecimientoMensual: {
          value: ventasTrend,
          trend: 0, // Meta vs realidad
          meta: 12
        },
        retencionClientes: {
          value: 84.5, // Valor placeholder - requiere lógica más compleja
          trend: 1.8,
          meta: 85
        }
      },
      ventasMensuales: ventasPorDia,
      topProductos,
      clientesPorEstado,
      estadisticas: {
        totalCotizaciones: cotizaciones.length,
        cotizacionesAceptadas,
        totalClientes: clientes.length,
        totalProductos: productos.length,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    };

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Error al obtener datos de reportes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
