import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { AuditService } from '@/services/auditService';

interface ProductoExportRow {
  '🔢 ID': number;
  '🏷️ SKU': string;
  '📦 Nombre': string;
  '📝 Descripción': string;
  '⚖️ Unidad': string;
  '💰 Costo Unitario': number;
  '💵 Precio Neto': number;
  '💲 Precio Venta': number;
  '💱 Moneda': string;
  '🏢 Categoría': string;
  '✅ Afecto IVA': string;
  '📊 Control Stock': string;
  '📄 Ficha Técnica': string;
  '📊 Estado': string;
  '🔄 Activo': string;
  '📅 Fecha Creación': string;
}

interface ProductoData {
  id: number;
  sku: string | null;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  costo_unitario: number | null;
  precio_neto: number | null;
  precio_venta: number | null;
  moneda: string | null;
  afecto_iva: boolean;
  control_stock: boolean;
  ficha_tecnica: string | null;
  estado: string;
  activo: boolean;
  created_at: string;
  producto_tipos?: {
    nombre: string;
  } | null;
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

    // Obtener IP del cliente
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Obtener User Agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Consultar productos con sus tipos
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select(`
        *,
        producto_tipos (
          nombre
        )
      `)
      .eq('activo', true)
      .order('nombre');

    if (productosError) throw productosError;
    if (!productosData || productosData.length === 0) {
      throw new Error('No hay productos para exportar');
    }

    // Crear datos para exportación con headers destacados
    const productosExport: ProductoExportRow[] = productosData.map((item: ProductoData) => ({
      '🔢 ID': item.id,
      '🏷️ SKU': item.sku || '',
      '📦 Nombre': item.nombre,
      '📝 Descripción': item.descripcion || '',
      '⚖️ Unidad': item.unidad,
      '💰 Costo Unitario': item.costo_unitario || 0,
      '💵 Precio Neto': item.precio_neto || 0,
      '💲 Precio Venta': item.precio_venta || 0,
      '💱 Moneda': item.moneda || 'CLP',
      '🏢 Categoría': item.producto_tipos?.nombre || 'Sin Categoría',
      '✅ Afecto IVA': item.afecto_iva ? 'Sí' : 'No',
      '📊 Control Stock': item.control_stock ? 'Sí' : 'No',
      '📄 Ficha Técnica': item.ficha_tecnica || '',
      '📊 Estado': item.estado || 'disponible',
      '🔄 Activo': item.activo ? 'Sí' : 'No',
      '📅 Fecha Creación': new Date(item.created_at).toLocaleDateString('es-CL')
    }));

    // Crear estadísticas
    const estadisticas = [{
      '📊 Métrica': 'Total de Productos',
      '📈 Valor': productosData.length
    }, {
      '📊 Métrica': 'Productos Afectos a IVA',
      '📈 Valor': productosData.filter(p => p.afecto_iva).length
    }, {
      '📊 Métrica': 'Productos con Control de Stock',
      '📈 Valor': productosData.filter(p => p.control_stock).length
    }, {
      '📊 Métrica': 'Valor Total Costo',
      '📈 Valor': productosData.reduce((sum: number, p: ProductoData) => sum + (p.costo_unitario || 0), 0)
    }, {
      '📊 Métrica': 'Valor Total Venta',
      '📈 Valor': productosData.reduce((sum: number, p: ProductoData) => sum + (p.precio_venta || 0), 0)
    }];

    // Crear workbook con múltiples hojas
    const wb = XLSX.utils.book_new();

    // Hoja principal de productos
    const wsProductos = XLSX.utils.json_to_sheet(productosExport);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');

    // Aplicar formato a los headers (primera fila) - Headers muy destacados
    const headersRange = XLSX.utils.decode_range(wsProductos['!ref'] || 'A1');
    for (let col = headersRange.s.c; col <= headersRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (wsProductos[cellAddress]) {
        // Aplicar formato usando colores Excel estándar que definitivamente funcionan
        wsProductos[cellAddress].s = {
          font: {
            bold: true,
            sz: 12,
            color: { rgb: "FFFFFF" } // Blanco
          },
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FF4F81BD" }, // Azul Excel estándar
            bgColor: { rgb: "FF4F81BD" }
          },
          border: {
            top: { style: "thick", color: { rgb: "FF000000" } },
            bottom: { style: "thick", color: { rgb: "FF000000" } },
            left: { style: "thick", color: { rgb: "FF000000" } },
            right: { style: "thick", color: { rgb: "FF000000" } }
          },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Hoja de estadísticas
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticas);
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    // Aplicar formato a los headers de estadísticas - Headers muy destacados
    const statsHeadersRange = XLSX.utils.decode_range(wsEstadisticas['!ref'] || 'A1');
    for (let col = statsHeadersRange.s.c; col <= statsHeadersRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (wsEstadisticas[cellAddress]) {
        wsEstadisticas[cellAddress].s = {
          font: {
            bold: true,
            sz: 12,
            color: { rgb: "FFFFFF" } // Blanco
          },
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FF4F81BD" }, // Azul Excel estándar
            bgColor: { rgb: "FF4F81BD" }
          },
          border: {
            top: { style: "thick", color: { rgb: "FF000000" } },
            bottom: { style: "thick", color: { rgb: "FF000000" } },
            left: { style: "thick", color: { rgb: "FF000000" } },
            right: { style: "thick", color: { rgb: "FF000000" } }
          },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Configurar anchos de columna
    const colWidthsProductos = [
      { wch: 8 }, // ID
      { wch: 15 }, // SKU
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripción
      { wch: 10 }, // Unidad
      { wch: 15 }, // Costo Unitario
      { wch: 15 }, // Precio Neto
      { wch: 15 }, // Precio Venta
      { wch: 8 }, // Moneda
      { wch: 20 }, // Categoría
      { wch: 10 }, // Afecto IVA
      { wch: 12 }, // Control Stock
      { wch: 30 }, // Ficha Técnica
      { wch: 12 }, // Estado
      { wch: 8 }, // Activo
      { wch: 12 }  // Fecha Creación
    ];
    wsProductos['!cols'] = colWidthsProductos;

    const colWidthsEstadisticas = [
      { wch: 35 }, // Métrica
      { wch: 15 }  // Valor
    ];
    wsEstadisticas['!cols'] = colWidthsEstadisticas;

    // Generar el buffer del archivo con preservación de estilos
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
      Props: {
        Title: 'Catálogo de Productos',
        Subject: 'Exportación de productos',
        Author: 'Sistema de Cotizaciones'
      }
    });

    // Registrar en document_series (serie de descargas)
    const { registerDownloadSeries } = await import('@/services/documentSeriesService');
    await registerDownloadSeries('stock_excel', 'SEX-');

    // Registrar auditoría
    await AuditService.logDownload(
      userId,
      'stock_excel',
      {
        fileName: `productos_${new Date().toISOString().split('T')[0]}.xlsx`,
        recordCount: productosData.length,
        format: 'excel'
      },
      ipAddress,
      userAgent
    );

    // Devolver el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="productos_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error en descarga de productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
