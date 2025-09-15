import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { AuditService } from '@/services/auditService';
import { Database } from '@/lib/supabase';

type CotizacionRow = Database['public']['Tables']['cotizaciones']['Row'];
type CotizacionItemRow = Database['public']['Tables']['cotizacion_items']['Row'];
type ProductoRow = Database['public']['Tables']['productos']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];

type CotizacionWithRelations = CotizacionRow & {
  clientes?: ClienteRow;
  usuarios?: UsuarioRow;
  cotizacion_items?: (CotizacionItemRow & { productos?: ProductoRow })[];
};

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

    // Consultar cotizaciones
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

    const { data: cotizacionesData, error: cotizacionesError } = await query;
    if (cotizacionesError) throw cotizacionesError;
    if (!cotizacionesData || cotizacionesData.length === 0) {
      throw new Error('No hay cotizaciones para exportar');
    }

    // Preparar datos para Excel
    const exportData: CotizacionExportRow[] = [];

    cotizacionesData.forEach((cotizacion: CotizacionWithRelations) => {
      const cliente = cotizacion.clientes;
      const vendedor = cotizacion.usuarios;
      const items = cotizacion.cotizacion_items || [];

      // Para cada cotización, agregar una fila por cada item
      items.forEach((item: CotizacionItemRow & { productos?: ProductoRow }, index: number) => {
        const producto = item.productos;

        exportData.push({
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
        });
      });

      // Si no hay items, agregar una fila vacía para la cotización
      if (items.length === 0) {
        exportData.push({
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
        });
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

  // Generar el buffer del archivo
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Registrar en document_series (serie de descargas)
  const { registerDownloadSeries } = await import('@/services/documentSeriesService');
  await registerDownloadSeries('quotes_excel', 'QEX-');

    // Registrar auditoría
    await AuditService.logDownload(
      userId,
      'quotes_excel',
      {
        fileName: `cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`,
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
  'Content-Disposition': `attachment; filename="cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error en descarga de cotizaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
