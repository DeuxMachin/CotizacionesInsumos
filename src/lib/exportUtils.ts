import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import { Database } from './supabase';

type CotizacionRow = Database['public']['Tables']['cotizaciones']['Row'];
type ItemRow = Database['public']['Tables']['cotizacion_items']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];
type ProductoRow = Database['public']['Tables']['productos']['Row'];

// Tipo para los datos de cotización con relaciones desde Supabase
interface CotizacionWithRelations {
  id: string;
  folio?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  estado: string;
  total_bruto: number;
  total_descuento: number;
  total_neto: number;
  iva_monto: number;
  total_final: number;
  condicion_pago_texto?: string;
  forma_pago_texto?: string;
  plazo_entrega_texto?: string;
  observaciones_pago?: string;
  created_at: string;
  updated_at: string;
  cotizacion_items: (ItemRow & { productos?: ProductoRow })[];
  clientes: ClienteRow;
  usuarios: UsuarioRow;
}

// Tipo para las filas de exportación de cotizaciones
interface CotizacionExportRow {
  'ID Cotización': string;
  'Fecha Emisión': string;
  'Fecha Vencimiento': string;
  'Estado': string;
  'Cliente RUT': string;
  'Cliente Razón Social': string;
  'Cliente Nombre Fantasía': string;
  'Cliente Giro': string;
  'Cliente Dirección': string;
  'Cliente Ciudad': string;
  'Cliente Comuna': string;
  'Cliente Teléfono': string;
  'Cliente Email': string;
  'Vendedor': string;
  'Producto SKU': string;
  'Producto Nombre': string;
  'Producto Unidad': string;
  'Cantidad': number;
  'Precio Unitario': number;
  'Descuento %': number;
  'Descuento Monto': number;
  'Subtotal': number;
  'IVA Aplicado': string;
  'Total Bruto Cotización': string | number;
  'Total Descuento Cotización': string | number;
  'Total Neto Cotización': string | number;
  'IVA Cotización': string | number;
  'Total Final Cotización': string | number;
  'Condición Pago': string;
  'Plazo Entrega': string;
  'Observaciones': string;
  'Fecha Creación': string;
  'Fecha Actualización': string;
}

// Tipo para las filas de stock por bodega
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

// Tipo para las filas de productos por categoría
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

export async function exportCotizacionesToExcel(userId?: string, isAdmin: boolean = false): Promise<void> {
  try {
    let query = supabase
      .from('cotizaciones')
      .select(`*,
        cotizacion_items(*, productos(*)),
        clientes!cotizaciones_cliente_principal_id_fkey(*),
        usuarios!cotizaciones_vendedor_id_fkey(*)
      `)
      .order('updated_at', { ascending: false });

    if (!isAdmin && userId) {
      query = query.eq('vendedor_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) {
      alert('No hay cotizaciones para exportar');
      return;
    }

    // Preparar datos para Excel
    const exportData: CotizacionExportRow[] = [];

    data.forEach((row: CotizacionWithRelations) => {
      const cotizacion = row;
      const cliente = row.clientes;
      const vendedor = row.usuarios;
      const items = row.cotizacion_items || [];

      // Para cada cotización, agregar una fila por cada item
      items.forEach((item: ItemRow & { productos?: ProductoRow }, index: number) => {
        const producto = item.productos;

        const rowData = {
          'ID Cotización': cotizacion.folio || `COT-${cotizacion.id}`,
          'Fecha Emisión': cotizacion.fecha_emision ? new Date(cotizacion.fecha_emision).toLocaleDateString('es-CL') : '',
          'Fecha Vencimiento': cotizacion.fecha_vencimiento ? new Date(cotizacion.fecha_vencimiento).toLocaleDateString('es-CL') : '',
          'Estado': cotizacion.estado,
          'Cliente RUT': cliente?.rut || '',
          'Cliente Razón Social': cliente?.nombre_razon_social || '',
          'Cliente Nombre Fantasía': cliente?.nombre_fantasia || '',
          'Cliente Giro': cliente?.giro || '',
          'Cliente Dirección': cliente?.direccion || '',
          'Cliente Ciudad': cliente?.ciudad || '',
          'Cliente Comuna': cliente?.comuna || '',
          'Cliente Teléfono': cliente?.telefono || '',
          'Cliente Email': cliente?.email_pago || '',
          'Vendedor': vendedor ? `${vendedor.nombre || ''} ${vendedor.apellido || ''}`.trim() || vendedor.email : '',
          'Producto SKU': producto?.sku || '',
          'Producto Nombre': producto?.nombre || item.descripcion || '',
          'Producto Unidad': item.unidad || producto?.unidad || '',
          'Cantidad': item.cantidad,
          'Precio Unitario': item.precio_unitario_neto,
          'Descuento %': item.descuento_pct || 0,
          'Descuento Monto': item.descuento_monto,
          'Subtotal': item.total_neto,
          'IVA Aplicado': item.iva_aplicable ? 'Sí' : 'No',
          'Total Bruto Cotización': index === 0 ? cotizacion.total_bruto : '',
          'Total Descuento Cotización': index === 0 ? cotizacion.total_descuento : '',
          'Total Neto Cotización': index === 0 ? cotizacion.total_neto : '',
          'IVA Cotización': index === 0 ? cotizacion.iva_monto : '',
          'Total Final Cotización': index === 0 ? cotizacion.total_final : '',
          'Condición Pago': cotizacion.condicion_pago_texto || cotizacion.forma_pago_texto || '',
          'Plazo Entrega': cotizacion.plazo_entrega_texto || '',
          'Observaciones': cotizacion.observaciones_pago || '',
          'Fecha Creación': new Date(cotizacion.created_at).toLocaleDateString('es-CL'),
          'Fecha Actualización': new Date(cotizacion.updated_at).toLocaleDateString('es-CL')
        };

        exportData.push(rowData);
      });

      // Si no hay items, agregar una fila vacía para la cotización
      if (items.length === 0) {
        const rowData = {
          'ID Cotización': cotizacion.folio || `COT-${cotizacion.id}`,
          'Fecha Emisión': cotizacion.fecha_emision ? new Date(cotizacion.fecha_emision).toLocaleDateString('es-CL') : '',
          'Fecha Vencimiento': cotizacion.fecha_vencimiento ? new Date(cotizacion.fecha_vencimiento).toLocaleDateString('es-CL') : '',
          'Estado': cotizacion.estado,
          'Cliente RUT': cliente?.rut || '',
          'Cliente Razón Social': cliente?.nombre_razon_social || '',
          'Cliente Nombre Fantasía': cliente?.nombre_fantasia || '',
          'Cliente Giro': cliente?.giro || '',
          'Cliente Dirección': cliente?.direccion || '',
          'Cliente Ciudad': cliente?.ciudad || '',
          'Cliente Comuna': cliente?.comuna || '',
          'Cliente Teléfono': cliente?.telefono || '',
          'Cliente Email': cliente?.email_pago || '',
          'Vendedor': vendedor ? `${vendedor.nombre || ''} ${vendedor.apellido || ''}`.trim() || vendedor.email : '',
          'Producto SKU': '',
          'Producto Nombre': '',
          'Producto Unidad': '',
          'Cantidad': 0,
          'Precio Unitario': 0,
          'Descuento %': 0,
          'Descuento Monto': 0,
          'Subtotal': 0,
          'IVA Aplicado': '',
          'Total Bruto Cotización': cotizacion.total_bruto,
          'Total Descuento Cotización': cotizacion.total_descuento,
          'Total Neto Cotización': cotizacion.total_neto,
          'IVA Cotización': cotizacion.iva_monto,
          'Total Final Cotización': cotizacion.total_final,
          'Condición Pago': cotizacion.condicion_pago_texto || cotizacion.forma_pago_texto || '',
          'Plazo Entrega': cotizacion.plazo_entrega_texto || '',
          'Observaciones': cotizacion.observaciones_pago || '',
          'Fecha Creación': new Date(cotizacion.created_at).toLocaleDateString('es-CL'),
          'Fecha Actualización': new Date(cotizacion.updated_at).toLocaleDateString('es-CL')
        };

        exportData.push(rowData);
      }
    });

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // ID Cotización
      { wch: 12 }, // Fecha Emisión
      { wch: 12 }, // Fecha Vencimiento
      { wch: 10 }, // Estado
      { wch: 12 }, // Cliente RUT
      { wch: 25 }, // Cliente Razón Social
      { wch: 20 }, // Cliente Nombre Fantasía
      { wch: 20 }, // Cliente Giro
      { wch: 25 }, // Cliente Dirección
      { wch: 15 }, // Cliente Ciudad
      { wch: 15 }, // Cliente Comuna
      { wch: 15 }, // Cliente Teléfono
      { wch: 25 }, // Cliente Email
      { wch: 20 }, // Vendedor
      { wch: 15 }, // Producto SKU
      { wch: 30 }, // Producto Nombre
      { wch: 10 }, // Producto Unidad
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Precio Unitario
      { wch: 10 }, // Descuento %
      { wch: 15 }, // Descuento Monto
      { wch: 15 }, // Subtotal
      { wch: 10 }, // IVA Aplicado
      { wch: 15 }, // Total Bruto Cotización
      { wch: 15 }, // Total Descuento Cotización
      { wch: 15 }, // Total Neto Cotización
      { wch: 15 }, // IVA Cotización
      { wch: 15 }, // Total Final Cotización
      { wch: 20 }, // Condición Pago
      { wch: 15 }, // Plazo Entrega
      { wch: 30 }, // Observaciones
      { wch: 12 }, // Fecha Creación
      { wch: 12 }  // Fecha Actualización
    ];
    ws['!cols'] = colWidths;

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Cotizaciones');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `cotizaciones_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error('Error exportando cotizaciones:', error);
    alert('Error al exportar las cotizaciones. Por favor, inténtalo de nuevo.');
  }
}

export async function exportStockToExcel(): Promise<void> {
  try {
    // Importar el servicio de stock
    const { StockService } = await import('@/services/stockService');

    // Consultar todos los productos con stock
    const inventoryData = await StockService.getAllInventory();
    if (!inventoryData || inventoryData.length === 0) {
      alert('No hay productos en stock para exportar');
      return;
    }

    // Crear workbook con múltiples hojas
    const wb = XLSX.utils.book_new();

    // === HOJA 1: INVENTARIO GENERAL ===
    const inventarioGeneral = inventoryData.map(item => {
      const categoriaPrincipal = item.categorias?.[0]?.nombre || 'Sin Categoría';
      const totalValorizado = item.stock.reduce((sum, s) => sum + s.total_valorizado, 0);
      const precioPromedio = item.total_stock > 0 ? totalValorizado / item.total_stock : 0;

      return {
        'ID': item.id,
        'SKU': item.sku || '',
        'Nombre': item.nombre,
        'Descripción': item.descripcion || '',
        'Categoría': categoriaPrincipal,
        'Unidad': item.unidad,
        'Código Barra': item.codigo_barra || '',
        'Stock Total': item.total_stock,
        'Precio Compra': item.precio_compra || 0,
        'Precio Venta': item.precio_venta_neto || 0,
        'Valorización Total': totalValorizado,
        'Precio Promedio': precioPromedio,
        'Estado': item.status,
        'Estado Producto': item.estado,
        'Activo': item.activo ? 'Sí' : 'No',
        'Fecha Creación': new Date(item.created_at).toLocaleDateString('es-CL')
      };
    });

    const wsGeneral = XLSX.utils.json_to_sheet(inventarioGeneral);

    // === HOJA 2: STOCK POR BODEGA ===
    const stockPorBodega: StockPorBodegaRow[] = [];
    inventoryData.forEach(item => {
      item.stock.forEach(stockItem => {
        stockPorBodega.push({
          'ID Producto': item.id.toString(),
          'SKU': item.sku || '',
          'Nombre Producto': item.nombre,
          'Categoría': item.categorias?.[0]?.nombre || 'Sin Categoría',
          'Bodega': stockItem.bodega_nombre,
          'Ubicación': stockItem.ubicacion || '',
          'Stock Actual': stockItem.stock_actual,
          'Valorización': stockItem.total_valorizado,
          'Precio Unitario': stockItem.stock_actual > 0 ? stockItem.total_valorizado / stockItem.stock_actual : 0
        });
      });
    });

    const wsBodegas = XLSX.utils.json_to_sheet(stockPorBodega);

    // === HOJAS POR CATEGORÍA ===
    const categoriasMap = new Map<string, ProductoCategoriaRow[]>();

    inventoryData.forEach(item => {
      const categoriaNombre = item.categorias?.[0]?.nombre || 'Sin Categoría';

      if (!categoriasMap.has(categoriaNombre)) {
        categoriasMap.set(categoriaNombre, []);
      }

      const totalValorizado = item.stock.reduce((sum, s) => sum + s.total_valorizado, 0);
      const precioPromedio = item.total_stock > 0 ? totalValorizado / item.total_stock : 0;

      categoriasMap.get(categoriaNombre)!.push({
        'ID': item.id.toString(),
        'SKU': item.sku || '',
        'Nombre': item.nombre,
        'Descripción': item.descripcion || '',
        'Unidad': item.unidad,
        'Stock Total': item.total_stock,
        'Precio Compra': item.precio_compra || 0,
        'Precio Venta': item.precio_venta_neto || 0,
        'Valorización Total': totalValorizado,
        'Precio Promedio': precioPromedio,
        'Estado Stock': item.status,
        'Estado Producto': item.estado
      });
    });

    // === HOJA DE ESTADÍSTICAS ===
    const estadisticas = [{
      'Métrica': 'Total de Productos',
      'Valor': inventoryData.length
    }, {
      'Métrica': 'Productos con Stock',
      'Valor': inventoryData.filter(p => p.total_stock > 0).length
    }, {
      'Métrica': 'Productos sin Stock',
      'Valor': inventoryData.filter(p => p.total_stock === 0).length
    }, {
      'Métrica': 'Valorización Total del Inventario',
      'Valor': inventoryData.reduce((sum, p) => sum + p.stock.reduce((s, stock) => s + stock.total_valorizado, 0), 0)
    }, {
      'Métrica': 'Total Unidades en Stock',
      'Valor': inventoryData.reduce((sum, p) => sum + p.total_stock, 0)
    }, {
      'Métrica': 'Categorías',
      'Valor': categoriasMap.size
    }];

    // Agregar estadísticas por estado de stock
    const productosPorEstado = inventoryData.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
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

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `inventario_stock_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error('Error exportando stock:', error);
    alert('Error al exportar el inventario. Por favor, inténtalo de nuevo.');
  }
}

export async function exportClientesToExcel(): Promise<void> {
  try {
    // Consultar todos los clientes
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientesError) throw clientesError;
    if (!clientesData || clientesData.length === 0) {
      alert('No hay clientes para exportar');
      return;
    }

    // Consultar todas las cotizaciones con información necesaria
    const { data: cotizacionesData, error: cotizacionesError } = await supabase
      .from('cotizaciones')
      .select(`
        id,
        folio,
        estado,
        cliente_principal_id,
        fecha_emision,
        total_final,
        total_neto,
        created_at,
        usuarios!cotizaciones_vendedor_id_fkey(nombre, apellido, email)
      `)
      .order('created_at', { ascending: false });

    if (cotizacionesError) throw cotizacionesError;

    // Crear workbook con múltiples hojas
    const wb = XLSX.utils.book_new();

    // === HOJA 1: CLIENTES CON RESUMEN ===
    const clientesResumen = clientesData.map(cliente => {
      // Calcular estadísticas de cotizaciones para este cliente
      const cotizacionesCliente = cotizacionesData?.filter(c => c.cliente_principal_id === cliente.id) || [];
      const totalCotizaciones = cotizacionesCliente.length;
      const totalMonto = cotizacionesCliente.reduce((sum, c) => sum + (c.total_final || c.total_neto || 0), 0);
      const cotizacionesPorEstado = cotizacionesCliente.reduce((acc, c) => {
        const estado = c.estado || 'borrador';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        'ID': cliente.id,
        'RUT': cliente.rut,
        'Tipo': cliente.tipo === 'empresa' ? 'Empresa' : 'Persona',
        'Razón Social': cliente.nombre_razon_social,
        'Nombre Fantasía': cliente.nombre_fantasia || '',
        'Giro': cliente.giro || '',
        'Dirección': cliente.direccion || '',
        'Ciudad': cliente.ciudad || '',
        'Comuna': cliente.comuna || '',
        'Teléfono': cliente.telefono || '',
        'Celular': cliente.celular || '',
        'Email Pago': cliente.email_pago || '',
        'Contacto Pago': cliente.contacto_pago || '',
        'Teléfono Pago': cliente.telefono_pago || '',
        'Forma Pago': cliente.forma_pago || '',
        'Línea Crédito': cliente.linea_credito || 0,
        'Descuento %': cliente.descuento_cliente_pct || 0,
        'Estado': cliente.estado || 'vigente',
        'Total Cotizaciones': totalCotizaciones,
        'Monto Total Cotizado': totalMonto,
        'Cotizaciones Borrador': cotizacionesPorEstado.borrador || 0,
        'Cotizaciones Enviadas': cotizacionesPorEstado.enviada || 0,
        'Cotizaciones Aceptadas': cotizacionesPorEstado.aceptada || 0,
        'Cotizaciones Rechazadas': cotizacionesPorEstado.rechazada || 0,
        'Cotizaciones Expiradas': cotizacionesPorEstado.expirada || 0,
        'Fecha Creación': new Date(cliente.created_at).toLocaleDateString('es-CL')
      };
    });

    const wsClientes = XLSX.utils.json_to_sheet(clientesResumen);

        // === HOJA 2: RESUMEN DE COTIZACIONES POR CLIENTE ===
    const cotizacionesPorCliente = clientesData.map(cliente => {
      const cotizacionesCliente = cotizacionesData?.filter(c => c.cliente_principal_id === cliente.id) || [];

      if (cotizacionesCliente.length === 0) {
        return {
          'ID Cliente': cliente.id,
          'RUT': cliente.rut,
          'Razón Social': cliente.nombre_razon_social,
          'Nombre Fantasía': cliente.nombre_fantasia || '',
          'Total Cotizaciones': 0,
          'Monto Total Cotizado': 0,
          'Promedio por Cotización': 0,
          'Cotizaciones Borrador': 0,
          'Cotizaciones Enviadas': 0,
          'Cotizaciones Aceptadas': 0,
          'Cotizaciones Rechazadas': 0,
          'Cotizaciones Expiradas': 0,
          'Fecha Primera Cotización': '',
          'Fecha Última Cotización': '',
          'Vendedores Involucrados': '',
          'Estado Cliente': cliente.estado || 'vigente'
        };
      }

      const totalMonto = cotizacionesCliente.reduce((sum, c) => sum + (c.total_final || c.total_neto || 0), 0);
      const promedioPorCotizacion = totalMonto / cotizacionesCliente.length;

      const cotizacionesPorEstado = cotizacionesCliente.reduce((acc, c) => {
        const estado = c.estado || 'borrador';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Fechas
      const fechas = cotizacionesCliente
        .map(c => new Date(c.created_at))
        .sort((a, b) => a.getTime() - b.getTime());

      const fechaPrimera = fechas.length > 0 ? fechas[0].toLocaleDateString('es-CL') : '';
      const fechaUltima = fechas.length > 0 ? fechas[fechas.length - 1].toLocaleDateString('es-CL') : '';

      // Vendedores únicos
      const vendedoresUnicos = [...new Set(
        cotizacionesCliente
          .map(c => {
            const vendedor = c.usuarios as { nombre?: string; apellido?: string; email?: string };
            return vendedor ? `${vendedor.nombre || ''} ${vendedor.apellido || ''}`.trim() || vendedor.email : '';
          })
          .filter(v => v)
      )].join(', ');

      return {
        'ID Cliente': cliente.id,
        'RUT': cliente.rut,
        'Razón Social': cliente.nombre_razon_social,
        'Nombre Fantasía': cliente.nombre_fantasia || '',
        'Total Cotizaciones': cotizacionesCliente.length,
        'Monto Total Cotizado': totalMonto,
        'Promedio por Cotización': promedioPorCotizacion,
        'Cotizaciones Borrador': cotizacionesPorEstado.borrador || 0,
        'Cotizaciones Enviadas': cotizacionesPorEstado.enviada || 0,
        'Cotizaciones Aceptadas': cotizacionesPorEstado.aceptada || 0,
        'Cotizaciones Rechazadas': cotizacionesPorEstado.rechazada || 0,
        'Cotizaciones Expiradas': cotizacionesPorEstado.expirada || 0,
        'Fecha Primera Cotización': fechaPrimera,
        'Fecha Última Cotización': fechaUltima,
        'Vendedores Involucrados': vendedoresUnicos,
        'Estado Cliente': cliente.estado || 'vigente'
      };
    }).filter(cliente => cliente['Total Cotizaciones'] > 0); // Solo mostrar clientes con cotizaciones

    const wsCotizaciones = XLSX.utils.json_to_sheet(cotizacionesPorCliente);

    // === HOJA 3: ESTADÍSTICAS GENERALES ===
    const estadisticas = [{
      'Métrica': 'Total de Clientes',
      'Valor': clientesData.length
    }, {
      'Métrica': 'Total de Cotizaciones',
      'Valor': cotizacionesData?.length || 0
    }, {
      'Métrica': 'Monto Total Cotizado',
      'Valor': (cotizacionesData || []).reduce((sum, c) => sum + (c.total_final || c.total_neto || 0), 0)
    }, {
      'Métrica': 'Clientes con Cotizaciones',
      'Valor': new Set((cotizacionesData || []).map(c => c.cliente_principal_id).filter(Boolean)).size
    }, {
      'Métrica': 'Clientes sin Cotizaciones',
      'Valor': clientesData.length - new Set((cotizacionesData || []).map(c => c.cliente_principal_id).filter(Boolean)).size
    }];

    // Agregar estadísticas por estado de cotización
    const estadosCotizaciones = (cotizacionesData || []).reduce((acc, c) => {
      const estado = c.estado || 'borrador';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(estadosCotizaciones).forEach(([estado, cantidad]) => {
      estadisticas.push({
        'Métrica': `Cotizaciones ${estado.charAt(0).toUpperCase() + estado.slice(1)}`,
        'Valor': cantidad
      });
    });

    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticas);

    // Configurar anchos de columna para cada hoja
    const colWidthsClientes = [
      { wch: 8 }, // ID
      { wch: 12 }, // RUT
      { wch: 8 }, // Tipo
      { wch: 25 }, // Razón Social
      { wch: 20 }, // Nombre Fantasía
      { wch: 20 }, // Giro
      { wch: 25 }, // Dirección
      { wch: 15 }, // Ciudad
      { wch: 15 }, // Comuna
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Celular
      { wch: 25 }, // Email Pago
      { wch: 20 }, // Contacto Pago
      { wch: 15 }, // Teléfono Pago
      { wch: 20 }, // Forma Pago
      { wch: 12 }, // Línea Crédito
      { wch: 10 }, // Descuento %
      { wch: 10 }, // Estado
      { wch: 12 }, // Total Cotizaciones
      { wch: 15 }, // Monto Total
      { wch: 12 }, // Borrador
      { wch: 12 }, // Enviadas
      { wch: 12 }, // Aceptadas
      { wch: 12 }, // Rechazadas
      { wch: 12 }, // Expiradas
      { wch: 12 }  // Fecha Creación
    ];
    wsClientes['!cols'] = colWidthsClientes;

    const colWidthsCotizaciones = [
      { wch: 8 }, // ID Cliente
      { wch: 12 }, // RUT
      { wch: 25 }, // Razón Social
      { wch: 20 }, // Nombre Fantasía
      { wch: 12 }, // Total Cotizaciones
      { wch: 15 }, // Monto Total Cotizado
      { wch: 15 }, // Promedio por Cotización
      { wch: 12 }, // Cotizaciones Borrador
      { wch: 12 }, // Cotizaciones Enviadas
      { wch: 12 }, // Cotizaciones Aceptadas
      { wch: 12 }, // Cotizaciones Rechazadas
      { wch: 12 }, // Cotizaciones Expiradas
      { wch: 12 }, // Fecha Primera Cotización
      { wch: 12 }, // Fecha Última Cotización
      { wch: 30 }, // Vendedores Involucrados
      { wch: 10 }  // Estado Cliente
    ];
    wsCotizaciones['!cols'] = colWidthsCotizaciones;

    const colWidthsEstadisticas = [
      { wch: 25 }, // Métrica
      { wch: 15 }  // Valor
    ];
    wsEstadisticas['!cols'] = colWidthsEstadisticas;

    // Agregar hojas al workbook
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');
    XLSX.utils.book_append_sheet(wb, wsCotizaciones, 'Resumen por Cliente');
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `clientes_cotizaciones_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error('Error exportando clientes:', error);
    alert('Error al exportar los clientes. Por favor, inténtalo de nuevo.');
  }
}