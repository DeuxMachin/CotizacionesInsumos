import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { AuditService } from '@/services/auditService';

interface StockPorBodegaRow {
  'ID Producto': string;
  'SKU': string;
  'Nombre Producto': string;
  'Categoría': string;
  'Bodega': string;
  'Ubicación': string;
  'Stock Actual': number;
  'Valorización': number;
  'Precio Unitario': number;
}

interface ProductoCategoriaRow {
  'ID': string;
  'SKU': string;
  'Nombre': string;
  'Descripción': string;
  'Unidad': string;
  'Stock Total': number;
  'Precio Compra': number;
  'Precio Venta': number;
  'Valorización Total': number;
  'Precio Promedio': number;
  'Estado Stock': string;
  'Estado Producto': string;
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

    // Consultas a tablas reales según esquema (ver supabase.ts)
    // 1) Productos base
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (productosError) throw productosError;
    if (!productosData || productosData.length === 0) {
      throw new Error('No hay productos para exportar');
    }

    // 2) Stock por bodega de todos los productos
    const { data: stockData, error: stockError } = await supabase
      .from('producto_stock')
      .select('*');
    if (stockError) throw stockError;

    // 3) Bodegas para enriquecer nombres
    const { data: bodegasData, error: bodegasError } = await supabase
      .from('bodegas')
      .select('*');
    if (bodegasError) throw bodegasError;

    // 4) Links producto-categoría
    const { data: prodCats, error: prodCatsError } = await supabase
      .from('producto_categorias')
      .select('*');
    if (prodCatsError) throw prodCatsError;

    // 5) Tabla de categorías
    const { data: categoriasData, error: categoriasError } = await supabase
      .from('categorias_productos')
      .select('*');
    if (categoriasError) throw categoriasError;

    // Mapas auxiliares
    const bodegaById = new Map<number, { id: number; nombre: string; ubicacion: string | null }>();
    bodegasData?.forEach(b => bodegaById.set(b.id, b as any));

    const categoriaNombreById = new Map<number, string>();
    categoriasData?.forEach(c => categoriaNombreById.set(c.id as number, (c as any).nombre));

    // Mapear categorías por producto
    const categoriasPorProducto = new Map<number, string[]>();
    prodCats?.forEach((pc: any) => {
      const nombre = categoriaNombreById.get(pc.categoria_id);
      if (!nombre) return;
      const arr = categoriasPorProducto.get(pc.producto_id) || [];
      arr.push(nombre);
      categoriasPorProducto.set(pc.producto_id, arr);
    });

    // Agrupar stock por producto
    const stockPorProducto = new Map<number, Array<any>>();
    stockData?.forEach((s: any) => {
      const arr = stockPorProducto.get(s.producto_id) || [];
      arr.push(s);
      stockPorProducto.set(s.producto_id, arr);
    });

    // Crear workbook con múltiples hojas
    const wb = XLSX.utils.book_new();

    // === HOJA 1: INVENTARIO GENERAL ===
    const inventarioGeneral = productosData.map((item: any) => {
      const categorias = categoriasPorProducto.get(item.id) || [];
      const categoriaPrincipal = categorias[0] || 'Sin Categoría';
      const stockList = stockPorProducto.get(item.id) || [];
      const stockTotal = stockList.reduce((sum, s) => sum + (s.stock_actual || 0), 0);
      const totalValorizado = stockList.reduce((sum, s) => sum + (s.total_valorizado || 0), 0);
      const precioPromedio = stockTotal > 0 ? totalValorizado / stockTotal : 0;

      return {
        'ID': item.id,
        'SKU': item.sku || '',
        'Nombre': item.nombre,
        'Descripción': item.descripcion || '',
        'Categoría': categoriaPrincipal,
        'Unidad': item.unidad,
        'Código Barra': item.codigo_barra || '',
        'Stock Total': stockTotal,
        'Precio Compra': item.precio_compra || 0,
        'Precio Venta': item.precio_venta_neto || 0,
        'Valorización Total': totalValorizado,
        'Precio Promedio': precioPromedio,
        'Estado': item.estado || 'disponible',
        'Estado Producto': item.estado || 'vigente',
        'Activo': item.activo ? 'Sí' : 'No',
        'Fecha Creación': new Date(item.created_at).toLocaleDateString('es-CL')
      };
    });

    const wsGeneral = XLSX.utils.json_to_sheet(inventarioGeneral);

    // === HOJA 2: STOCK POR BODEGA ===
    const stockPorBodega: StockPorBodegaRow[] = [];
    productosData.forEach((item: any) => {
      const categorias = categoriasPorProducto.get(item.id) || [];
      const categoriaPrincipal = categorias[0] || 'Sin Categoría';
      const stockList = stockPorProducto.get(item.id) || [];
      stockList.forEach((stockItem: any) => {
        const bodega = bodegaById.get(stockItem.bodega_id);
        stockPorBodega.push({
          'ID Producto': String(item.id),
          'SKU': item.sku || '',
          'Nombre Producto': item.nombre,
          'Categoría': categoriaPrincipal,
          'Bodega': bodega?.nombre || 'Sin Bodega',
          'Ubicación': stockItem.ubicacion || '',
          'Stock Actual': stockItem.stock_actual || 0,
          'Valorización': stockItem.total_valorizado || 0,
          'Precio Unitario': stockItem.stock_actual > 0 ? (stockItem.total_valorizado || 0) / stockItem.stock_actual : 0
        });
      });
    });

    const wsBodegas = XLSX.utils.json_to_sheet(stockPorBodega);

    // === HOJAS POR CATEGORÍA ===
    const categoriasMap = new Map<string, ProductoCategoriaRow[]>();

    productosData.forEach((item: any) => {
      const categorias = categoriasPorProducto.get(item.id) || ['Sin Categoría'];
      const stockList = stockPorProducto.get(item.id) || [];
      const stockTotal = stockList.reduce((sum, s) => sum + (s.stock_actual || 0), 0);
      const totalValorizado = stockList.reduce((sum, s) => sum + (s.total_valorizado || 0), 0);
      const precioPromedio = stockTotal > 0 ? totalValorizado / stockTotal : 0;

      categorias.forEach((categoriaNombre) => {
        if (!categoriasMap.has(categoriaNombre)) {
          categoriasMap.set(categoriaNombre, []);
        }
        categoriasMap.get(categoriaNombre)!.push({
          'ID': String(item.id),
          'SKU': item.sku || '',
          'Nombre': item.nombre,
          'Descripción': item.descripcion || '',
          'Unidad': item.unidad,
          'Stock Total': stockTotal,
          'Precio Compra': item.precio_compra || 0,
          'Precio Venta': item.precio_venta_neto || 0,
          'Valorización Total': totalValorizado,
          'Precio Promedio': precioPromedio,
          'Estado Stock': stockTotal > 0 ? 'con stock' : 'sin stock',
          'Estado Producto': item.estado || 'vigente'
        });
      });
    });

    // === HOJA DE ESTADÍSTICAS ===
    const estadisticas = [{
      'Métrica': 'Total de Productos',
      'Valor': productosData.length
    }, {
      'Métrica': 'Productos con Stock',
      'Valor': productosData.filter(p => (p.stock_total || 0) > 0).length
    }, {
      'Métrica': 'Productos sin Stock',
      'Valor': productosData.filter(p => (p.stock_total || 0) === 0).length
    }, {
      'Métrica': 'Valorización Total del Inventario',
      'Valor': productosData.reduce((sum: number, p: any) => {
        const stockList = stockPorProducto.get(p.id) || [];
        const val = stockList.reduce((s, st) => s + (st.total_valorizado || 0), 0);
        return sum + val;
      }, 0)
    }, {
      'Métrica': 'Total Unidades en Stock',
      'Valor': productosData.reduce((sum: number, p: any) => {
        const stockList = stockPorProducto.get(p.id) || [];
        const unidades = stockList.reduce((s, st) => s + (st.stock_actual || 0), 0);
        return sum + unidades;
      }, 0)
    }, {
      'Métrica': 'Categorías',
      'Valor': categoriasMap.size
    }];

    // Agregar estadísticas por estado de stock
    const productosPorEstado = productosData.reduce((acc: Record<string, number>, p: any) => {
      const estado = p.estado || 'disponible';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(productosPorEstado).forEach(([estado, cantidad]) => {
      estadisticas.push({
        'Métrica': `Productos ${estado.charAt(0).toUpperCase() + estado.slice(1)}`,
        'Valor': cantidad
      });
    });

    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticas);

    // Configurar anchos de columna
    const colWidthsGeneral = [
      { wch: 8 }, // ID
      { wch: 15 }, // SKU
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripción
      { wch: 20 }, // Categoría
      { wch: 10 }, // Unidad
      { wch: 15 }, // Código Barra
      { wch: 12 }, // Stock Total
      { wch: 15 }, // Precio Compra
      { wch: 15 }, // Precio Venta
      { wch: 15 }, // Valorización Total
      { wch: 15 }, // Precio Promedio
      { wch: 10 }, // Estado
      { wch: 12 }, // Estado Producto
      { wch: 8 }, // Activo
      { wch: 12 }  // Fecha Creación
    ];
    wsGeneral['!cols'] = colWidthsGeneral;

    const colWidthsBodegas = [
      { wch: 8 }, // ID Producto
      { wch: 15 }, // SKU
      { wch: 30 }, // Nombre Producto
      { wch: 20 }, // Categoría
      { wch: 20 }, // Bodega
      { wch: 15 }, // Ubicación
      { wch: 12 }, // Stock Actual
      { wch: 15 }, // Valorización
      { wch: 15 }  // Precio Unitario
    ];
    wsBodegas['!cols'] = colWidthsBodegas;

    const colWidthsCategoria = [
      { wch: 8 }, // ID
      { wch: 15 }, // SKU
      { wch: 30 }, // Nombre
      { wch: 40 }, // Descripción
      { wch: 10 }, // Unidad
      { wch: 12 }, // Stock Total
      { wch: 15 }, // Precio Compra
      { wch: 15 }, // Precio Venta
      { wch: 15 }, // Valorización Total
      { wch: 15 }, // Precio Promedio
      { wch: 10 }, // Estado Stock
      { wch: 12 }  // Estado Producto
    ];

    const colWidthsEstadisticas = [
      { wch: 35 }, // Métrica
      { wch: 15 }  // Valor
    ];
    wsEstadisticas['!cols'] = colWidthsEstadisticas;

    // Agregar hojas al workbook
    XLSX.utils.book_append_sheet(wb, wsGeneral, 'Inventario General');
    XLSX.utils.book_append_sheet(wb, wsBodegas, 'Stock por Bodega');

    // Agregar hojas por categoría
    categoriasMap.forEach((productos, categoriaNombre) => {
      const wsCategoria = XLSX.utils.json_to_sheet(productos);
      wsCategoria['!cols'] = colWidthsCategoria;

      // Sanitizar nombre de hoja (Excel tiene límites en nombres de hojas)
      const nombreHoja = categoriaNombre.length > 31 ?
        categoriaNombre.substring(0, 28) + '...' :
        categoriaNombre;

      XLSX.utils.book_append_sheet(wb, wsCategoria, nombreHoja);
    });

    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    // Generar el buffer del archivo
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

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
    console.error('Error en descarga de stock:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
