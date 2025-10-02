import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';

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

    // Crear workbook de Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Cotizaciones';
    workbook.created = new Date();

    // Hoja 1: Estadísticas Generales
    const wsEstadisticas = workbook.addWorksheet('Estadísticas Generales');
    wsEstadisticas.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
      { header: 'Porcentaje', key: 'porcentaje', width: 15 }
    ];
    
    wsEstadisticas.addRows([
      { metrica: 'Total de Cotizaciones', valor: totalCotizaciones, porcentaje: '100%' },
      { metrica: 'Cotizaciones Aceptadas', valor: cotizacionesAceptadas, porcentaje: `${totalCotizaciones > 0 ? ((cotizacionesAceptadas / totalCotizaciones) * 100).toFixed(1) : 0}%` },
      { metrica: 'Cotizaciones Enviadas', valor: cotizacionesEnviadas, porcentaje: `${totalCotizaciones > 0 ? ((cotizacionesEnviadas / totalCotizaciones) * 100).toFixed(1) : 0}%` },
      { metrica: 'Cotizaciones en Borrador', valor: cotizacionesBorrador, porcentaje: `${totalCotizaciones > 0 ? ((cotizacionesBorrador / totalCotizaciones) * 100).toFixed(1) : 0}%` },
      { metrica: 'Total Vendido', valor: `$${totalVendido.toLocaleString('es-CL')}`, porcentaje: 'N/A' }
    ]);
    
    // Estilo de encabezados
    wsEstadisticas.getRow(1).font = { bold: true };
    wsEstadisticas.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 2: Rendimiento por Vendedor
    const wsVendedores = workbook.addWorksheet('Rendimiento Vendedores');
    wsVendedores.columns = [
      { header: 'Posición', key: 'posicion', width: 12 },
      { header: 'Vendedor', key: 'vendedor', width: 30 },
      { header: 'Total Cotizaciones', key: 'totalCotizaciones', width: 20 },
      { header: 'Cotizaciones Aceptadas', key: 'aceptadas', width: 22 },
      { header: 'Tasa de Éxito', key: 'tasa', width: 15 },
      { header: 'Total Vendido', key: 'totalVendido', width: 20 }
    ];
    
    vendedoresArray.forEach((vendedor: VendedorStats, index: number) => {
      wsVendedores.addRow({
        posicion: index + 1,
        vendedor: vendedor.nombre,
        totalCotizaciones: vendedor.totalCotizaciones,
        aceptadas: vendedor.cotizacionesAceptadas,
        tasa: vendedor.totalCotizaciones > 0 ? `${((vendedor.cotizacionesAceptadas / vendedor.totalCotizaciones) * 100).toFixed(1)}%` : '0%',
        totalVendido: `$${vendedor.totalVendido.toLocaleString('es-CL')}`
      });
    });
    
    wsVendedores.getRow(1).font = { bold: true };
    wsVendedores.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 3: Tendencia Mensual
    const wsTendencia = workbook.addWorksheet('Tendencia Mensual');
    wsTendencia.columns = [
      { header: 'Mes', key: 'mes', width: 15 },
      { header: 'Cantidad Cotizaciones', key: 'cantidad', width: 22 },
      { header: 'Total Vendido', key: 'totalVendido', width: 20 },
      { header: 'Promedio por Cotización', key: 'promedio', width: 25 }
    ];
    
    Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, stats]: [string, { total: number; count: number }]) => {
        wsTendencia.addRow({
          mes: month,
          cantidad: stats.count,
          totalVendido: `$${stats.total.toLocaleString('es-CL')}`,
          promedio: stats.count > 0 ? `$${(stats.total / stats.count).toLocaleString('es-CL')}` : '$0'
        });
      });
    
    wsTendencia.getRow(1).font = { bold: true };
    wsTendencia.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 4: Detalle de Cotizaciones
    const wsDetalle = workbook.addWorksheet('Detalle Cotizaciones');
    wsDetalle.columns = [
      { header: 'ID Cotización', key: 'id', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Total', key: 'total', width: 20 },
      { header: 'Vendedor', key: 'vendedor', width: 30 },
      { header: 'Fecha Creación', key: 'fecha', width: 20 },
      { header: 'Email Vendedor', key: 'email', width: 30 }
    ];
    
    cotizacionesStats?.forEach(cot => {
      const usuario = Array.isArray(cot.usuarios) ? cot.usuarios[0] : cot.usuarios;
      const vendedorNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Sin asignar';
      
      wsDetalle.addRow({
        id: cot.id,
        estado: cot.estado,
        total: `$${cot.total_final?.toLocaleString('es-CL') || '0'}`,
        vendedor: vendedorNombre,
        fecha: new Date(cot.created_at).toLocaleDateString('es-ES'),
        email: usuario?.email || ''
      });
    });
    
    wsDetalle.getRow(1).font = { bold: true };
    wsDetalle.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

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