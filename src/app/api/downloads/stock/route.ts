import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';
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
    const wb = new ExcelJS.Workbook();

    // Hoja principal de productos
    const wsProductos = wb.addWorksheet('Productos');
    const productosHeaders = Object.keys(productosExport[0] || {});
    wsProductos.addRow(productosHeaders);
    productosExport.forEach(row => {
      wsProductos.addRow(Object.values(row));
    });

    // Estilizar encabezados de la hoja de productos
    wsProductos.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    wsProductos.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    wsProductos.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Hoja de estadísticas
    const wsEstadisticas = wb.addWorksheet('Estadísticas');
    const estadisticasHeaders = Object.keys(estadisticas[0] || {});
    wsEstadisticas.addRow(estadisticasHeaders);
    estadisticas.forEach(row => {
      wsEstadisticas.addRow(Object.values(row));
    });

    // Estilizar encabezados de la hoja de estadísticas
    wsEstadisticas.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    wsEstadisticas.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    wsEstadisticas.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Configurar anchos de columna
    wsProductos.columns = [
      { width: 8 }, // ID
      { width: 15 }, // SKU
      { width: 30 }, // Nombre
      { width: 40 }, // Descripción
      { width: 10 }, // Unidad
      { width: 15 }, // Costo Unitario
      { width: 15 }, // Precio Neto
      { width: 15 }, // Precio Venta
      { width: 8 }, // Moneda
      { width: 20 }, // Categoría
      { width: 10 }, // Afecto IVA
      { width: 12 }, // Control Stock
      { width: 30 }, // Ficha Técnica
      { width: 12 }, // Estado
      { width: 8 }, // Activo
      { width: 12 }  // Fecha Creación
    ];

    wsEstadisticas.columns = [
      { width: 35 }, // Métrica
      { width: 15 }  // Valor
    ];

    // Generar el buffer del archivo con preservación de estilos
    const buffer = await wb.xlsx.writeBuffer();

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
