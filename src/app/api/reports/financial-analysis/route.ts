import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

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

    // Crear workbook de Excel
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo
    const resumenEjecutivo = [{
      'Métrica': 'Ingresos Totales (Cotizaciones Aceptadas)',
      'Valor': `$${totalIngresos.toLocaleString('es-CL')}`,
      'Notas': 'Solo incluye cotizaciones aceptadas'
    }, {
      'Métrica': 'Valor Bruto Total',
      'Valor': `$${totalBruto.toLocaleString('es-CL')}`,
      'Notas': 'Valor antes de descuentos'
    }, {
      'Métrica': 'Descuentos Otorgados',
      'Valor': `$${totalDescuentos.toLocaleString('es-CL')}`,
      'Notas': 'Total de descuentos aplicados'
    }, {
      'Métrica': 'IVA Recaudado',
      'Valor': `$${totalIVA.toLocaleString('es-CL')}`,
      'Notas': 'IVA total de cotizaciones'
    }, {
      'Métrica': 'Margen de Descuento',
      'Valor': `${totalBruto > 0 ? ((totalDescuentos / totalBruto) * 100).toFixed(1) : 0}%`,
      'Notas': 'Porcentaje de descuento sobre bruto'
    }, {
      'Métrica': 'Proyección Anual',
      'Valor': `$${projectedAnnual.toLocaleString('es-CL')}`,
      'Notas': 'Basado en promedio últimos 6 meses'
    }, {
      'Métrica': 'Tasa de Crecimiento',
      'Valor': `${growthRate.toFixed(1)}%`,
      'Notas': 'Crecimiento últimos 6 meses'
    }];

    const wsResumen = XLSX.utils.json_to_sheet(resumenEjecutivo);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

    // Hoja 2: Análisis Mensual
    const analisisMensual = Object.entries(monthlyAnalysis)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]: [string, MonthlyAnalysisData]) => ({
        'Mes': month,
        'Ingresos': `$${data.ingresos.toLocaleString('es-CL')}`,
        'Descuentos': `$${data.descuentos.toLocaleString('es-CL')}`,
        'IVA': `$${data.iva.toLocaleString('es-CL')}`,
        'Cotizaciones': data.cotizaciones,
        'Ticket Promedio': `$${data.cotizaciones > 0 ? (data.ingresos / data.cotizaciones).toLocaleString('es-CL') : '0'}`
      }));

    const wsMensual = XLSX.utils.json_to_sheet(analisisMensual);
    XLSX.utils.book_append_sheet(wb, wsMensual, 'Análisis Mensual');

    // Hoja 3: Rendimiento por Vendedor
    const rendimientoVendedores = Object.entries(vendedoresAnalysis)
      .sort(([,a]: [string, VendedorAnalysisData], [,b]: [string, VendedorAnalysisData]) => b.ingresos - a.ingresos)
      .map(([vendedor, data]: [string, VendedorAnalysisData]) => ({
        'Vendedor': vendedor,
        'Ingresos Generados': `$${data.ingresos.toLocaleString('es-CL')}`,
        'Descuentos Otorgados': `$${data.descuentos.toLocaleString('es-CL')}`,
        'IVA Recaudado': `$${data.iva.toLocaleString('es-CL')}`,
        'Cotizaciones Cerradas': data.cotizaciones,
        'Promedio por Cotización': `$${data.cotizaciones > 0 ? (data.ingresos / data.cotizaciones).toLocaleString('es-CL') : '0'}`
      }));

    const wsVendedores = XLSX.utils.json_to_sheet(rendimientoVendedores);
    XLSX.utils.book_append_sheet(wb, wsVendedores, 'Rendimiento Vendedores');

    // Hoja 4: Detalle de Cotizaciones
    const detalleCotizaciones = cotizacionesData?.map(cot => {
      const usuario = Array.isArray(cot.usuarios) ? cot.usuarios[0] : cot.usuarios;
      const vendedorNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Sin asignar';

      return {
        'ID Cotización': cot.id,
        'Estado': cot.estado,
        'Total Final': `$${cot.total_final?.toLocaleString('es-CL') || '0'}`,
        'Total Bruto': `$${cot.total_bruto?.toLocaleString('es-CL') || '0'}`,
        'Descuento': `$${cot.total_descuento?.toLocaleString('es-CL') || '0'}`,
        'IVA': `$${cot.iva_monto?.toLocaleString('es-CL') || '0'}`,
        'Vendedor': vendedorNombre,
        'Fecha Emisión': new Date(cot.fecha_emision || cot.created_at).toLocaleDateString('es-ES'),
        'Fecha Creación': new Date(cot.created_at).toLocaleDateString('es-ES')
      };
    }) || [];

    const wsDetalle = XLSX.utils.json_to_sheet(detalleCotizaciones);
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Cotizaciones');

    // Hoja 5: Métricas de Rentabilidad
    const metricasRentabilidad = [{
      'Métrica': 'ROI Estimado',
      'Valor': `${totalIngresos > 0 ? ((totalIngresos - totalDescuentos) / totalIngresos * 100).toFixed(1) : 0}%`,
      'Fórmula': '(Ingresos - Descuentos) / Ingresos'
    }, {
      'Métrica': 'Eficiencia de Descuentos',
      'Valor': `${totalDescuentos > 0 ? ((totalIngresos / totalDescuentos) * 100).toFixed(1) : 0}%`,
      'Fórmula': 'Ingresos / Descuentos * 100'
    }, {
      'Métrica': 'Productividad Mensual',
      'Valor': `$${Object.keys(monthlyAnalysis).length > 0 ? (totalIngresos / Object.keys(monthlyAnalysis).length).toLocaleString('es-CL') : '0'}`,
      'Fórmula': 'Ingresos Totales / Número de Meses'
    }, {
      'Métrica': 'Margen Neto Estimado',
      'Valor': `${totalIngresos > 0 ? ((totalIngresos - totalDescuentos - totalIVA) / totalIngresos * 100).toFixed(1) : 0}%`,
      'Fórmula': '(Ingresos - Descuentos - IVA) / Ingresos'
    }];

    const wsMetricas = XLSX.utils.json_to_sheet(metricasRentabilidad);
    XLSX.utils.book_append_sheet(wb, wsMetricas, 'Métricas Rentabilidad');

    // Generar buffer del archivo Excel
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

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