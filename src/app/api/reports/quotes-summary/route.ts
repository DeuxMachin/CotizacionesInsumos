import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface VendedorStats {
  nombre: string;
  totalCotizaciones: number;
  totalVendido: number;
  cotizacionesAceptadas: number;
}

interface MonthlyStats {
  [monthKey: string]: {
    total: number;
    count: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Obtener información del usuario
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requerido' },
        { status: 400 }
      );
    }

    // Estadísticas generales de cotizaciones
    const { data: cotizacionesStats, error: statsError } = await supabase
      .from('cotizaciones')
      .select(`
        id,
        estado,
        total_final,
        created_at,
        vendedor_id,
        usuarios:vendedor_id (
          nombre,
          apellido,
          email
        )
      `);

    if (statsError) throw statsError;

    // Calcular estadísticas
    const totalCotizaciones = cotizacionesStats?.length || 0;
    const cotizacionesAceptadas = cotizacionesStats?.filter(c => c.estado === 'aceptada').length || 0;
    const cotizacionesEnviadas = cotizacionesStats?.filter(c => c.estado === 'enviada').length || 0;
    const cotizacionesBorrador = cotizacionesStats?.filter(c => c.estado === 'borrador').length || 0;

    const totalVendido = cotizacionesStats?.reduce((sum, c) => sum + (c.total_final || 0), 0) || 0;

    // Estadísticas por vendedor
    const vendedoresStats = cotizacionesStats?.reduce((acc: Record<string, VendedorStats>, cot) => {
      const vendedorId = cot.vendedor_id;
      const usuario = Array.isArray(cot.usuarios) ? cot.usuarios[0] : cot.usuarios;
      const vendedorNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Sin asignar';

      if (!acc[vendedorId]) {
        acc[vendedorId] = {
          nombre: vendedorNombre,
          totalCotizaciones: 0,
          totalVendido: 0,
          cotizacionesAceptadas: 0
        };
      }

      acc[vendedorId].totalCotizaciones++;
      acc[vendedorId].totalVendido += cot.total_final || 0;
      if (cot.estado === 'aceptada') {
        acc[vendedorId].cotizacionesAceptadas++;
      }

      return acc;
    }, {} as Record<string, VendedorStats>) || {};

    // Convertir a array y ordenar por total vendido
    const vendedoresArray = Object.values(vendedoresStats).sort((a: VendedorStats, b: VendedorStats) => b.totalVendido - a.totalVendido);

    // Estadísticas mensuales (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = cotizacionesStats?.reduce((acc: MonthlyStats, cot) => {
      const date = new Date(cot.created_at);
      if (date >= sixMonthsAgo) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, count: 0 };
        }
        acc[monthKey].total += cot.total_final || 0;
        acc[monthKey].count++;
      }
      return acc;
    }, {} as MonthlyStats) || {};

    // Crear workbook de Excel
    const wb = XLSX.utils.book_new();

    // Hoja 1: Estadísticas Generales
    const estadisticasGenerales = [{
      'Métrica': 'Total de Cotizaciones',
      'Valor': totalCotizaciones,
      'Porcentaje': '100%'
    }, {
      'Métrica': 'Cotizaciones Aceptadas',
      'Valor': cotizacionesAceptadas,
      'Porcentaje': `${totalCotizaciones > 0 ? ((cotizacionesAceptadas / totalCotizaciones) * 100).toFixed(1) : 0}%`
    }, {
      'Métrica': 'Cotizaciones Enviadas',
      'Valor': cotizacionesEnviadas,
      'Porcentaje': `${totalCotizaciones > 0 ? ((cotizacionesEnviadas / totalCotizaciones) * 100).toFixed(1) : 0}%`
    }, {
      'Métrica': 'Cotizaciones en Borrador',
      'Valor': cotizacionesBorrador,
      'Porcentaje': `${totalCotizaciones > 0 ? ((cotizacionesBorrador / totalCotizaciones) * 100).toFixed(1) : 0}%`
    }, {
      'Métrica': 'Total Vendido',
      'Valor': `$${totalVendido.toLocaleString('es-CL')}`,
      'Porcentaje': 'N/A'
    }];

    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasGenerales);
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas Generales');

    // Hoja 2: Rendimiento por Vendedor
    const vendedoresData = vendedoresArray.map((vendedor: VendedorStats, index: number) => ({
      'Posición': index + 1,
      'Vendedor': vendedor.nombre,
      'Total Cotizaciones': vendedor.totalCotizaciones,
      'Cotizaciones Aceptadas': vendedor.cotizacionesAceptadas,
      'Tasa de Éxito': vendedor.totalCotizaciones > 0 ?
        `${((vendedor.cotizacionesAceptadas / vendedor.totalCotizaciones) * 100).toFixed(1)}%` : '0%',
      'Total Vendido': `$${vendedor.totalVendido.toLocaleString('es-CL')}`
    }));

    const wsVendedores = XLSX.utils.json_to_sheet(vendedoresData);
    XLSX.utils.book_append_sheet(wb, wsVendedores, 'Rendimiento Vendedores');

    // Hoja 3: Tendencia Mensual
    const tendenciaMensual = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]: [string, { total: number; count: number }]) => ({
        'Mes': month,
        'Cantidad Cotizaciones': stats.count,
        'Total Vendido': `$${stats.total.toLocaleString('es-CL')}`,
        'Promedio por Cotización': stats.count > 0 ?
          `$${(stats.total / stats.count).toLocaleString('es-CL')}` : '$0'
      }));

    const wsTendencia = XLSX.utils.json_to_sheet(tendenciaMensual);
    XLSX.utils.book_append_sheet(wb, wsTendencia, 'Tendencia Mensual');

    // Hoja 4: Detalle de Cotizaciones
    const detalleCotizaciones = cotizacionesStats?.map(cot => {
      const usuario = Array.isArray(cot.usuarios) ? cot.usuarios[0] : cot.usuarios;
      const vendedorNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Sin asignar';

      return {
        'ID Cotización': cot.id,
        'Estado': cot.estado,
        'Total': `$${cot.total_final?.toLocaleString('es-CL') || '0'}`,
        'Vendedor': vendedorNombre,
        'Fecha Creación': new Date(cot.created_at).toLocaleDateString('es-ES'),
        'Email Vendedor': usuario?.email || ''
      };
    }) || [];

    const wsDetalle = XLSX.utils.json_to_sheet(detalleCotizaciones);
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Cotizaciones');

    // Generar buffer del archivo Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Nombre del archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `resumen-cotizaciones-${timestamp}.xlsx`;

    // Headers para la descarga
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error en resumen de cotizaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}