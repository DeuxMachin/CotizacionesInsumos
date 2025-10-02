import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';
import { AuditService } from '@/services/auditService';
import { Database } from '@/lib/supabase';

type NotasVentaRow = {
  id: number;
  folio: string | null;
  Numero_Serie: string | null;
  cotizacion_id: number | null;
  vendedor_id: string | null;
  cliente_principal_id: number | null;
  obra_id: number | null;
  cliente_rut: string | null;
  cliente_razon_social: string | null;
  cliente_giro: string | null;
  cliente_direccion: string | null;
  cliente_comuna: string | null;
  cliente_ciudad: string | null;
  subtotal: number;
  descuento_lineas_monto: number;
  descuento_global_monto: number;
  descuento_total: number;
  subtotal_neto_post_desc: number;
  iva_pct: number;
  iva_monto: number;
  total: number;
  forma_pago_final: string | null;
  plazo_pago: string | null;
  observaciones_comerciales: string | null;
  direccion_despacho: string | null;
  comuna_despacho: string | null;
  ciudad_despacho: string | null;
  costo_despacho: number | null;
  fecha_estimada_entrega: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
};

type NotasVentaItemRow = {
  id: number;
  nota_venta_id: number;
  producto_id: number | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario_neto: number;
  descuento_pct: number | null;
  descuento_monto: number | null;
  iva_aplicable: boolean;
  subtotal_neto: number;
  total_neto: number;
};

type ProductoRow = Database['public']['Tables']['productos']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];

type NotasVentaWithRelations = NotasVentaRow & {
  clientes?: ClienteRow;
  usuarios?: UsuarioRow;
  notas_venta_items?: (NotasVentaItemRow & { productos?: ProductoRow })[];
};

interface NotasVentaExportRow {
  'ID Nota Venta': string;
  'Folio': string;
  'Número Serie': string;
  'Fecha Emisión': string;
  'Estado': string;
  'Cliente RUT': string;
  'Cliente Razón Social': string;
  'Cliente Giro': string;
  'Cliente Dirección': string;
  'Cliente Ciudad': string;
  'Cliente Comuna': string;
  'Vendedor': string;
  'Producto Descripción': string;
  'Producto Unidad': string;
  'Cantidad': number;
  'Precio Unitario': number;
  'Descuento %': number;
  'Descuento Monto': number;
  'Subtotal Neto': number;
  'IVA Aplicado': string;
  'Subtotal Nota Venta': string | number;
  'Descuento Líneas Nota Venta': string | number;
  'Descuento Global Nota Venta': string | number;
  'Descuento Total Nota Venta': string | number;
  'Subtotal Neto Post Desc Nota Venta': string | number;
  'IVA % Nota Venta': string | number;
  'IVA Monto Nota Venta': string | number;
  'Total Nota Venta': string | number;
  'Forma Pago': string;
  'Plazo Pago': string;
  'Observaciones Comerciales': string;
  'Dirección Despacho': string;
  'Comuna Despacho': string;
  'Ciudad Despacho': string;
  'Costo Despacho': string | number;
  'Fecha Estimada Entrega': string;
  'Fecha Creación': string;
  'Fecha Actualización': string;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener información del usuario
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

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

    // Consultar notas de venta
    let query = supabase
      .from('notas_venta')
      .select(`
        *,
        notas_venta_items(*, productos(*)),
        clientes!notas_venta_cliente_principal_id_fkey(*),
        usuarios!notas_venta_vendedor_id_fkey(*)
      `)
      .order('updated_at', { ascending: false });

    if (!isAdmin && userId) {
      query = query.eq('vendedor_id', userId);
    }

    const { data: notasVentaData, error: notasVentaError } = await query;
    if (notasVentaError) throw notasVentaError;
    if (!notasVentaData || notasVentaData.length === 0) {
      throw new Error('No hay notas de venta para exportar');
    }

    // Preparar datos para Excel
    const exportData: NotasVentaExportRow[] = [];

    notasVentaData.forEach((notaVenta: NotasVentaWithRelations) => {
      const cliente = notaVenta.clientes;
      const vendedor = notaVenta.usuarios;
      const items = notaVenta.notas_venta_items || [];

      // Para cada nota de venta, agregar una fila por cada item
      items.forEach((item: NotasVentaItemRow & { productos?: ProductoRow }, index: number) => {
        exportData.push({
          'ID Nota Venta': notaVenta.id.toString(),
          'Folio': notaVenta.folio || '',
          'Número Serie': notaVenta.Numero_Serie || '',
          'Fecha Emisión': notaVenta.created_at ? new Date(notaVenta.created_at).toLocaleDateString('es-CL') : '',
          'Estado': notaVenta.estado,
          'Cliente RUT': cliente?.rut || '',
          'Cliente Razón Social': cliente?.nombre_razon_social || '',
          'Cliente Giro': cliente?.giro || '',
          'Cliente Dirección': cliente?.direccion || '',
          'Cliente Ciudad': cliente?.ciudad || '',
          'Cliente Comuna': cliente?.comuna || '',
          'Vendedor': vendedor ? `${vendedor.nombre || ''} ${vendedor.apellido || ''}`.trim() || vendedor.email : '',
          'Producto Descripción': item.descripcion,
          'Producto Unidad': item.unidad,
          'Cantidad': item.cantidad,
          'Precio Unitario': item.precio_unitario_neto,
          'Descuento %': item.descuento_pct || 0,
          'Descuento Monto': item.descuento_monto || 0,
          'Subtotal Neto': item.subtotal_neto,
          'IVA Aplicado': item.iva_aplicable ? 'Sí' : 'No',
          'Subtotal Nota Venta': index === 0 ? notaVenta.subtotal : '',
          'Descuento Líneas Nota Venta': index === 0 ? notaVenta.descuento_lineas_monto : '',
          'Descuento Global Nota Venta': index === 0 ? notaVenta.descuento_global_monto : '',
          'Descuento Total Nota Venta': index === 0 ? notaVenta.descuento_total : '',
          'Subtotal Neto Post Desc Nota Venta': index === 0 ? notaVenta.subtotal_neto_post_desc : '',
          'IVA % Nota Venta': index === 0 ? notaVenta.iva_pct : '',
          'IVA Monto Nota Venta': index === 0 ? notaVenta.iva_monto : '',
          'Total Nota Venta': index === 0 ? notaVenta.total : '',
          'Forma Pago': notaVenta.forma_pago_final || '',
          'Plazo Pago': notaVenta.plazo_pago || '',
          'Observaciones Comerciales': notaVenta.observaciones_comerciales || '',
          'Dirección Despacho': notaVenta.direccion_despacho || '',
          'Comuna Despacho': notaVenta.comuna_despacho || '',
          'Ciudad Despacho': notaVenta.ciudad_despacho || '',
          'Costo Despacho': index === 0 ? (notaVenta.costo_despacho || 0) : '',
          'Fecha Estimada Entrega': notaVenta.fecha_estimada_entrega ? new Date(notaVenta.fecha_estimada_entrega).toLocaleDateString('es-CL') : '',
          'Fecha Creación': new Date(notaVenta.created_at).toLocaleDateString('es-CL'),
          'Fecha Actualización': new Date(notaVenta.updated_at).toLocaleDateString('es-CL')
        });
      });

      // Si no hay items, agregar una fila vacía para la nota de venta
      if (items.length === 0) {
        exportData.push({
          'ID Nota Venta': notaVenta.id.toString(),
          'Folio': notaVenta.folio || '',
          'Número Serie': notaVenta.Numero_Serie || '',
          'Fecha Emisión': notaVenta.created_at ? new Date(notaVenta.created_at).toLocaleDateString('es-CL') : '',
          'Estado': notaVenta.estado,
          'Cliente RUT': cliente?.rut || '',
          'Cliente Razón Social': cliente?.nombre_razon_social || '',
          'Cliente Giro': cliente?.giro || '',
          'Cliente Dirección': cliente?.direccion || '',
          'Cliente Ciudad': cliente?.ciudad || '',
          'Cliente Comuna': cliente?.comuna || '',
          'Vendedor': vendedor ? `${vendedor.nombre || ''} ${vendedor.apellido || ''}`.trim() || vendedor.email : '',
          'Producto Descripción': '',
          'Producto Unidad': '',
          'Cantidad': 0,
          'Precio Unitario': 0,
          'Descuento %': 0,
          'Descuento Monto': 0,
          'Subtotal Neto': 0,
          'IVA Aplicado': '',
          'Subtotal Nota Venta': notaVenta.subtotal,
          'Descuento Líneas Nota Venta': notaVenta.descuento_lineas_monto,
          'Descuento Global Nota Venta': notaVenta.descuento_global_monto,
          'Descuento Total Nota Venta': notaVenta.descuento_total,
          'Subtotal Neto Post Desc Nota Venta': notaVenta.subtotal_neto_post_desc,
          'IVA % Nota Venta': notaVenta.iva_pct,
          'IVA Monto Nota Venta': notaVenta.iva_monto,
          'Total Nota Venta': notaVenta.total,
          'Forma Pago': notaVenta.forma_pago_final || '',
          'Plazo Pago': notaVenta.plazo_pago || '',
          'Observaciones Comerciales': notaVenta.observaciones_comerciales || '',
          'Dirección Despacho': notaVenta.direccion_despacho || '',
          'Comuna Despacho': notaVenta.comuna_despacho || '',
          'Ciudad Despacho': notaVenta.ciudad_despacho || '',
          'Costo Despacho': notaVenta.costo_despacho || 0,
          'Fecha Estimada Entrega': notaVenta.fecha_estimada_entrega ? new Date(notaVenta.fecha_estimada_entrega).toLocaleDateString('es-CL') : '',
          'Fecha Creación': new Date(notaVenta.created_at).toLocaleDateString('es-CL'),
          'Fecha Actualización': new Date(notaVenta.updated_at).toLocaleDateString('es-CL')
        });
      }
    });

    // Crear workbook y worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Notas de Venta');

    // Agregar encabezados
    const headers = Object.keys(exportData[0] || {});
    ws.addRow(headers);

    // Agregar datos
    exportData.forEach(row => {
      ws.addRow(Object.values(row));
    });

    // Estilizar encabezados
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };

    // Ajustar ancho de columnas
    ws.columns = [
      { width: 12 }, // ID Nota Venta
      { width: 15 }, // Folio
      { width: 15 }, // Número Serie
      { width: 12 }, // Fecha Emisión
      { width: 10 }, // Estado
      { width: 12 }, // Cliente RUT
      { width: 25 }, // Cliente Razón Social
      { width: 20 }, // Cliente Giro
      { width: 25 }, // Cliente Dirección
      { width: 15 }, // Cliente Ciudad
      { width: 15 }, // Cliente Comuna
      { width: 20 }, // Vendedor
      { width: 30 }, // Producto Descripción
      { width: 10 }, // Producto Unidad
      { width: 10 }, // Cantidad
      { width: 15 }, // Precio Unitario
      { width: 10 }, // Descuento %
      { width: 15 }, // Descuento Monto
      { width: 15 }, // Subtotal Neto
      { width: 10 }, // IVA Aplicado
      { width: 15 }, // Subtotal Nota Venta
      { width: 15 }, // Descuento Líneas Nota Venta
      { width: 15 }, // Descuento Global Nota Venta
      { width: 15 }, // Descuento Total Nota Venta
      { width: 15 }, // Subtotal Neto Post Desc Nota Venta
      { width: 15 }, // IVA % Nota Venta
      { width: 15 }, // IVA Monto Nota Venta
      { width: 15 }, // Total Nota Venta
      { width: 20 }, // Forma Pago
      { width: 15 }, // Plazo Pago
      { width: 30 }, // Observaciones Comerciales
      { width: 25 }, // Dirección Despacho
      { width: 15 }, // Comuna Despacho
      { width: 15 }, // Ciudad Despacho
      { width: 15 }, // Costo Despacho
      { width: 15 }, // Fecha Estimada Entrega
      { width: 12 }, // Fecha Creación
      { width: 12 }  // Fecha Actualización
    ];

    // Generar el buffer del archivo
    const buffer = await wb.xlsx.writeBuffer();

    // Registrar en document_series (serie de descargas)
    const { registerDownloadSeries } = await import('@/services/documentSeriesService');
    await registerDownloadSeries('quotes_excel', 'NVX-');

    // Registrar auditoría
    await AuditService.logDownload(
      userId,
      'quotes_excel',
      {
        fileName: `notas_venta_${new Date().toISOString().split('T')[0]}.xlsx`,
        recordCount: exportData.length,
        format: 'excel'
      },
      ipAddress,
      userAgent
    );

    // Devolver el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="notas_venta_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error en descarga de notas de venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}