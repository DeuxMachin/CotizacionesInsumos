import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';

interface MonthlyAnalysisData {
  ingresos: number;
  descuentos: number;
  iva: number;
  cotizaciones: number;
}

interface VendedorAnalysisData {
  ingresos: number;
  descuentos: number;
  iva: number;
  cotizaciones: number;
}

interface MonthlyAnalysis {
  [monthKey: string]: MonthlyAnalysisData;
}

interface VendedorAnalysis {
  [vendedorNombre: string]: VendedorAnalysisData;
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

    // Obtener datos de cotizaciones para análisis financiero
    const { data: cotizacionesData, error: cotizacionesError } = await supabase
      .from('cotizaciones')
      .select(`
        id,
        estado,
        total_final,
        total_bruto,
        total_descuento,
        iva_monto,
        created_at,
        fecha_emision,
        usuarios:vendedor_id (
          nombre,
          apellido
        )
      `)
      .eq('estado', 'aceptada'); // Solo cotizaciones aceptadas para análisis financiero

    if (cotizacionesError) throw cotizacionesError;

    // Calcular métricas financieras
    const totalIngresos = cotizacionesData?.reduce((sum, c) => sum + (c.total_final || 0), 0) || 0;
    const totalBruto = cotizacionesData?.reduce((sum, c) => sum + (c.total_bruto || 0), 0) || 0;
    const totalDescuentos = cotizacionesData?.reduce((sum, c) => sum + (c.total_descuento || 0), 0) || 0;
    const totalIVA = cotizacionesData?.reduce((sum, c) => sum + (c.iva_monto || 0), 0) || 0;

    // Análisis por mes (últimos 12 meses)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyAnalysis = cotizacionesData?.reduce((acc: MonthlyAnalysis, cot) => {
      const date = new Date(cot.fecha_emision || cot.created_at);
      if (date >= twelveMonthsAgo) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) {
          acc[monthKey] = {
            ingresos: 0,
            descuentos: 0,
            iva: 0,
            cotizaciones: 0
          };
        }
        acc[monthKey].ingresos += cot.total_final || 0;
        acc[monthKey].descuentos += cot.total_descuento || 0;
        acc[monthKey].iva += cot.iva_monto || 0;
        acc[monthKey].cotizaciones++;
      }
      return acc;
    }, {} as MonthlyAnalysis) || {};

    // Análisis por vendedor
    const vendedoresAnalysis = cotizacionesData?.reduce((acc: VendedorAnalysis, cot) => {
      const usuario = Array.isArray(cot.usuarios) ? cot.usuarios[0] : cot.usuarios;
      const vendedorNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Sin asignar';

      if (!acc[vendedorNombre]) {
        acc[vendedorNombre] = {
          ingresos: 0,
          descuentos: 0,
          iva: 0,
          cotizaciones: 0
        };
      }

      acc[vendedorNombre].ingresos += cot.total_final || 0;
      acc[vendedorNombre].descuentos += cot.total_descuento || 0;
      acc[vendedorNombre].iva += cot.iva_monto || 0;
      acc[vendedorNombre].cotizaciones++;

      return acc;
    }, {} as VendedorAnalysis) || {};

    // Calcular proyecciones (basado en tendencia de los últimos 6 meses)
    const sixMonthsData = Object.values(monthlyAnalysis).slice(-6) as MonthlyAnalysisData[];
    const avgMonthlyRevenue = sixMonthsData.length > 0
      ? sixMonthsData.reduce((sum, month) => sum + month.ingresos, 0) / sixMonthsData.length
      : 0;

    const projectedAnnual = avgMonthlyRevenue * 12;
    const growthRate = sixMonthsData.length >= 2
      ? ((sixMonthsData[sixMonthsData.length - 1].ingresos - sixMonthsData[0].ingresos) / sixMonthsData[0].ingresos) * 100
      : 0;

    // Crear workbook de Excel con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Cotizaciones';
    workbook.created = new Date();

    // Hoja 1: Resumen Ejecutivo
    const wsResumen = workbook.addWorksheet('Resumen Ejecutivo');
    wsResumen.columns = [
      { header: 'Métrica', key: 'metrica', width: 40 },
      { header: 'Valor', key: 'valor', width: 25 },
      { header: 'Notas', key: 'notas', width: 40 }
    ];
    
    wsResumen.addRows([
      { metrica: 'Ingresos Totales (Cotizaciones Aceptadas)', valor: `$${totalIngresos.toLocaleString('es-CL')}`, notas: 'Solo incluye cotizaciones aceptadas' },
      { metrica: 'Valor Bruto Total', valor: `$${totalBruto.toLocaleString('es-CL')}`, notas: 'Valor antes de descuentos' },
      { metrica: 'Descuentos Otorgados', valor: `$${totalDescuentos.toLocaleString('es-CL')}`, notas: 'Total de descuentos aplicados' },
      { metrica: 'IVA Recaudado', valor: `$${totalIVA.toLocaleString('es-CL')}`, notas: 'IVA total de cotizaciones' },
      { metrica: 'Margen de Descuento', valor: `${totalBruto > 0 ? ((totalDescuentos / totalBruto) * 100).toFixed(1) : 0}%`, notas: 'Porcentaje de descuento sobre bruto' },
      { metrica: 'Proyección Anual', valor: `$${projectedAnnual.toLocaleString('es-CL')}`, notas: 'Basado en promedio últimos 6 meses' },
      { metrica: 'Tasa de Crecimiento', valor: `${growthRate.toFixed(1)}%`, notas: 'Crecimiento últimos 6 meses' }
    ]);
    
    wsResumen.getRow(1).font = { bold: true };
    wsResumen.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 2: Análisis Mensual
    const wsMensual = workbook.addWorksheet('Análisis Mensual');
    wsMensual.columns = [
      { header: 'Mes', key: 'mes', width: 15 },
      { header: 'Ingresos', key: 'ingresos', width: 20 },
      { header: 'Descuentos', key: 'descuentos', width: 20 },
      { header: 'IVA', key: 'iva', width: 20 },
      { header: 'Cotizaciones', key: 'cotizaciones', width: 15 },
      { header: 'Ticket Promedio', key: 'ticketPromedio', width: 20 }
    ];
    
    Object.entries(monthlyAnalysis)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, data]: [string, MonthlyAnalysisData]) => {
        wsMensual.addRow({
          mes: month,
          ingresos: `$${data.ingresos.toLocaleString('es-CL')}`,
          descuentos: `$${data.descuentos.toLocaleString('es-CL')}`,
          iva: `$${data.iva.toLocaleString('es-CL')}`,
          cotizaciones: data.cotizaciones,
          ticketPromedio: `$${data.cotizaciones > 0 ? (data.ingresos / data.cotizaciones).toLocaleString('es-CL') : '0'}`
        });
      });
    
    wsMensual.getRow(1).font = { bold: true };
    wsMensual.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 3: Rendimiento por Vendedor
    const wsVendedores = workbook.addWorksheet('Rendimiento Vendedores');
    wsVendedores.columns = [
      { header: 'Vendedor', key: 'vendedor', width: 30 },
      { header: 'Ingresos Generados', key: 'ingresos', width: 22 },
      { header: 'Descuentos Otorgados', key: 'descuentos', width: 22 },
      { header: 'IVA Recaudado', key: 'iva', width: 18 },
      { header: 'Cotizaciones Cerradas', key: 'cotizaciones', width: 22 },
      { header: 'Promedio por Cotización', key: 'promedio', width: 25 }
    ];
    
    Object.entries(vendedoresAnalysis)
      .sort(([,a]: [string, VendedorAnalysisData], [,b]: [string, VendedorAnalysisData]) => b.ingresos - a.ingresos)
      .forEach(([vendedor, data]: [string, VendedorAnalysisData]) => {
        wsVendedores.addRow({
          vendedor,
          ingresos: `$${data.ingresos.toLocaleString('es-CL')}`,
          descuentos: `$${data.descuentos.toLocaleString('es-CL')}`,
          iva: `$${data.iva.toLocaleString('es-CL')}`,
          cotizaciones: data.cotizaciones,
          promedio: `$${data.cotizaciones > 0 ? (data.ingresos / data.cotizaciones).toLocaleString('es-CL') : '0'}`
        });
      });
    
    wsVendedores.getRow(1).font = { bold: true };
    wsVendedores.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 4: Detalle de Cotizaciones
    const wsDetalle = workbook.addWorksheet('Detalle Cotizaciones');
    wsDetalle.columns = [
      { header: 'ID Cotización', key: 'id', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Total Final', key: 'totalFinal', width: 20 },
      { header: 'Total Bruto', key: 'totalBruto', width: 20 },
      { header: 'Descuento', key: 'descuento', width: 20 },
      { header: 'IVA', key: 'iva', width: 20 },
      { header: 'Vendedor', key: 'vendedor', width: 30 },
      { header: 'Fecha Emisión', key: 'fechaEmision', width: 20 },
      { header: 'Fecha Creación', key: 'fechaCreacion', width: 20 }
    ];
    
    cotizacionesData?.forEach(cot => {
      const usuario = Array.isArray(cot.usuarios) ? cot.usuarios[0] : cot.usuarios;
      const vendedorNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Sin asignar';
      
      wsDetalle.addRow({
        id: cot.id,
        estado: cot.estado,
        totalFinal: `$${cot.total_final?.toLocaleString('es-CL') || '0'}`,
        totalBruto: `$${cot.total_bruto?.toLocaleString('es-CL') || '0'}`,
        descuento: `$${cot.total_descuento?.toLocaleString('es-CL') || '0'}`,
        iva: `$${cot.iva_monto?.toLocaleString('es-CL') || '0'}`,
        vendedor: vendedorNombre,
        fechaEmision: new Date(cot.fecha_emision || cot.created_at).toLocaleDateString('es-ES'),
        fechaCreacion: new Date(cot.created_at).toLocaleDateString('es-ES')
      });
    });
    
    wsDetalle.getRow(1).font = { bold: true };
    wsDetalle.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Hoja 5: Métricas de Rentabilidad
    const wsMetricas = workbook.addWorksheet('Métricas Rentabilidad');
    wsMetricas.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
      { header: 'Fórmula', key: 'formula', width: 45 }
    ];
    
    wsMetricas.addRows([
      { metrica: 'ROI Estimado', valor: `${totalIngresos > 0 ? ((totalIngresos - totalDescuentos) / totalIngresos * 100).toFixed(1) : 0}%`, formula: '(Ingresos - Descuentos) / Ingresos' },
      { metrica: 'Eficiencia de Descuentos', valor: `${totalDescuentos > 0 ? ((totalIngresos / totalDescuentos) * 100).toFixed(1) : 0}%`, formula: 'Ingresos / Descuentos * 100' },
      { metrica: 'Productividad Mensual', valor: `$${Object.keys(monthlyAnalysis).length > 0 ? (totalIngresos / Object.keys(monthlyAnalysis).length).toLocaleString('es-CL') : '0'}`, formula: 'Ingresos Totales / Número de Meses' },
      { metrica: 'Margen Neto Estimado', valor: `${totalIngresos > 0 ? ((totalIngresos - totalDescuentos - totalIVA) / totalIngresos * 100).toFixed(1) : 0}%`, formula: '(Ingresos - Descuentos - IVA) / Ingresos' }
    ]);
    
    wsMetricas.getRow(1).font = { bold: true };
    wsMetricas.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Generar buffer del archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Nombre del archivo con timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analisis-financiero-${timestamp}.xlsx`;

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
    console.error('Error en análisis financiero:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}