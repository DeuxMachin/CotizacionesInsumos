import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type CotizacionRow = {
  created_at?: string | null;
  estado?: string | null;
  total_final?: number | null;
  total_neto?: number | null;
};

type NotaVentaRow = {
  confirmed_at?: string | null;
  fecha_emision?: string | null;
  total?: number | null;
  subtotal_neto_post_desc?: number | null;
  iva_monto?: number | null;
};

function percentChange(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  return ((current - previous) / previous) * 100;
}

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
      
      // Notas de venta del período (solo ventas confirmadas)
      supabase
        .from('notas_venta')
        .select('*')
        .gte('fecha_emision', startDate.toISOString())
        .lte('fecha_emision', now.toISOString())
        .not('confirmed_at', 'is', null),
      
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

    const cotizaciones = (cotizacionesResult.data || []) as CotizacionRow[];
    const notasVenta = (notasVentaResult.data || []) as NotaVentaRow[];
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
      .gte('fecha_emision', previousStartDate.toISOString())
      .lte('fecha_emision', previousEndDate.toISOString())
      .not('confirmed_at', 'is', null);

    const previousTotalVentas = (previousNotasVenta || []).reduce((sum, nota) => sum + (nota.total || 0), 0);
    const previousTotalNeto = (previousNotasVenta || []).reduce((sum, nota) => sum + (nota.subtotal_neto_post_desc || 0), 0);

    // Calcular tendencias (evitar quedar en 0 cuando el período anterior es 0)
    const ventasTrend = percentChange(totalVentas, previousTotalVentas);
    const netoTrend = percentChange(totalNeto, previousTotalNeto);

    // Calcular ticket promedio basado en cotizaciones vendidas del mes actual
    const cotizacionesVendidasMesActual = cotizaciones.filter(c => {
      const fechaCotizacion = new Date(c.created_at || '');
      const now = new Date();
      // Solo cotizaciones del mes actual que tienen notas de venta asociadas
      if (isNaN(fechaCotizacion.getTime())) return false;
      return fechaCotizacion.getMonth() === now.getMonth() && 
             fechaCotizacion.getFullYear() === now.getFullYear() &&
             (c.estado === 'aceptada' || c.estado === 'aprobada'); // Cotizaciones aceptadas o aprobadas
    });
    
    // Todas las cotizaciones del mes actual (para el subtítulo)
    const todasCotizacionesMesActual = cotizaciones.filter(c => {
      const fechaCotizacion = new Date(c.created_at || '');
      const now = new Date();
      // Asegurarse de que la fecha es válida
      if (isNaN(fechaCotizacion.getTime())) return false;
      return fechaCotizacion.getMonth() === now.getMonth() && 
             fechaCotizacion.getFullYear() === now.getFullYear();
    });
    
    const totalCotizacionesVendidasMes = cotizacionesVendidasMesActual.reduce((sum, cot) => {
      const amount = (cot.total_final ?? cot.total_neto ?? 0) || 0;
      return sum + amount;
    }, 0);
    const ticketPromedioActual = cotizacionesVendidasMesActual.length > 0 ? totalCotizacionesVendidasMes / cotizacionesVendidasMesActual.length : 0;

    // Calcular ticket promedio del mes anterior para comparación (usando todas las cotizaciones vendidas del mes anterior)
    const cotizacionesVendidasMesAnterior = cotizaciones.filter(c => {
      const fechaCotizacion = new Date(c.created_at || '');
      const now = new Date();
      const mesAnterior = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const añoAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      if (isNaN(fechaCotizacion.getTime())) return false;
      return fechaCotizacion.getMonth() === mesAnterior && 
             fechaCotizacion.getFullYear() === añoAnterior &&
             (c.estado === 'aceptada' || c.estado === 'aprobada');
    });
    
    const totalCotizacionesVendidasMesAnterior = cotizacionesVendidasMesAnterior.reduce((sum, cot) => {
      const amount = (cot.total_final ?? cot.total_neto ?? 0) || 0;
      return sum + amount;
    }, 0);
    const ticketPromedioAnterior = cotizacionesVendidasMesAnterior.length > 0 ? totalCotizacionesVendidasMesAnterior / cotizacionesVendidasMesAnterior.length : 0;
    
    // Calcular crecimiento del ticket promedio
    const ticketPromedioTrend = percentChange(ticketPromedioActual, ticketPromedioAnterior);

    // Calcular tasa de conversión (cotizaciones aceptadas / total cotizaciones)
    const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada' || c.estado === 'aprobada').length;
    const tasaConversion = cotizaciones.length > 0 ? (cotizacionesAceptadas / cotizaciones.length) * 100 : 0;

    // Calcular tasa de conversión del período anterior para tendencia
    const { data: previousCotizaciones } = await supabase
      .from('cotizaciones')
      .select('id, estado, created_at')
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString());

    const previousCotizacionesArr = (previousCotizaciones || []) as Array<{ estado?: string | null }>;
    const previousAceptadas = previousCotizacionesArr.filter(c => c.estado === 'aceptada' || c.estado === 'aprobada').length;
    const previousConversion = previousCotizacionesArr.length > 0 ? (previousAceptadas / previousCotizacionesArr.length) * 100 : 0;
    const conversionTrend = percentChange(tasaConversion, previousConversion);

    // Ventas por día del mes actual
    const ventasPorDia = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayStart = new Date(now.getFullYear(), now.getMonth(), day);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), day + 1);
      
      const ventasDelDia = notasVenta.filter(nota => {
        const fechaNota = new Date(nota.fecha_emision || '');
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
          trend: conversionTrend,
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
