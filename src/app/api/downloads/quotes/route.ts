import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';
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
  'Producto Tipo': string;
  'Producto Moneda': string;
  'Producto Afecto IVA': string;
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
        const producto = item.productos as ProductoRow | undefined;

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
          'Producto Tipo': producto?.tipo_id ? String(producto.tipo_id) : '',
          'Producto Moneda': producto?.moneda || '',
          'Producto Afecto IVA': producto?.afecto_iva ? 'Sí' : 'No',
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
          'Producto Tipo': '',
          'Producto Moneda': '',
          'Producto Afecto IVA': '',
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

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Cotizaciones';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Cotizaciones');
    
    // Definir columnas con headers y anchos
    worksheet.columns = [
      { header: 'ID Cotización', key: 'idCotizacion', width: 15 },
      { header: 'Fecha Emisión', key: 'fechaEmision', width: 12 },
      { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 12 },
      { header: 'Estado', key: 'estado', width: 10 },
      { header: 'Cliente RUT', key: 'clienteRut', width: 12 },
      { header: 'Cliente Razón Social', key: 'clienteRazonSocial', width: 25 },
      { header: 'Cliente Nombre Fantasía', key: 'clienteNombreFantasia', width: 20 },
      { header: 'Cliente Giro', key: 'clienteGiro', width: 20 },
      { header: 'Cliente Dirección', key: 'clienteDireccion', width: 25 },
      { header: 'Cliente Ciudad', key: 'clienteCiudad', width: 15 },
      { header: 'Cliente Comuna', key: 'clienteComuna', width: 15 },
      { header: 'Cliente Teléfono', key: 'clienteTelefono', width: 15 },
      { header: 'Cliente Email', key: 'clienteEmail', width: 25 },
      { header: 'Vendedor', key: 'vendedor', width: 20 },
      { header: 'Producto SKU', key: 'productoSku', width: 15 },
      { header: 'Producto Nombre', key: 'productoNombre', width: 30 },
      { header: 'Producto Unidad', key: 'productoUnidad', width: 10 },
      { header: 'Producto Tipo', key: 'productoTipo', width: 12 },
      { header: 'Producto Moneda', key: 'productoMoneda', width: 10 },
      { header: 'Producto Afecto IVA', key: 'productoAfectoIva', width: 14 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Precio Unitario', key: 'precioUnitario', width: 15 },
      { header: 'Descuento %', key: 'descuentoPct', width: 10 },
      { header: 'Descuento Monto', key: 'descuentoMonto', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 15 },
      { header: 'IVA Aplicado', key: 'ivaAplicado', width: 10 },
      { header: 'Total Bruto Cotización', key: 'totalBruto', width: 15 },
      { header: 'Total Descuento Cotización', key: 'totalDescuento', width: 15 },
      { header: 'Total Neto Cotización', key: 'totalNeto', width: 15 },
      { header: 'IVA Cotización', key: 'ivaCotizacion', width: 15 },
      { header: 'Total Final Cotización', key: 'totalFinal', width: 15 },
      { header: 'Condición Pago', key: 'condicionPago', width: 20 },
      { header: 'Plazo Entrega', key: 'plazoEntrega', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 30 },
      { header: 'Fecha Creación', key: 'fechaCreacion', width: 12 },
      { header: 'Fecha Actualización', key: 'fechaActualizacion', width: 12 }
    ];
    
    // Agregar datos
    exportData.forEach((row) => {
      worksheet.addRow({
        idCotizacion: row['ID Cotización'],
        fechaEmision: row['Fecha Emisión'],
        fechaVencimiento: row['Fecha Vencimiento'],
        estado: row['Estado'],
        clienteRut: row['Cliente RUT'],
        clienteRazonSocial: row['Cliente Razón Social'],
        clienteNombreFantasia: row['Cliente Nombre Fantasía'],
        clienteGiro: row['Cliente Giro'],
        clienteDireccion: row['Cliente Dirección'],
        clienteCiudad: row['Cliente Ciudad'],
        clienteComuna: row['Cliente Comuna'],
        clienteTelefono: row['Cliente Teléfono'],
        clienteEmail: row['Cliente Email'],
        vendedor: row['Vendedor'],
        productoSku: row['Producto SKU'],
        productoNombre: row['Producto Nombre'],
        productoUnidad: row['Producto Unidad'],
        productoTipo: row['Producto Tipo'],
        productoMoneda: row['Producto Moneda'],
        productoAfectoIva: row['Producto Afecto IVA'],
        cantidad: row['Cantidad'],
        precioUnitario: row['Precio Unitario'],
        descuentoPct: row['Descuento %'],
        descuentoMonto: row['Descuento Monto'],
        subtotal: row['Subtotal'],
        ivaAplicado: row['IVA Aplicado'],
        totalBruto: row['Total Bruto Cotización'],
        totalDescuento: row['Total Descuento Cotización'],
        totalNeto: row['Total Neto Cotización'],
        ivaCotizacion: row['IVA Cotización'],
        totalFinal: row['Total Final Cotización'],
        condicionPago: row['Condición Pago'],
        plazoEntrega: row['Plazo Entrega'],
        observaciones: row['Observaciones'],
        fechaCreacion: row['Fecha Creación'],
        fechaActualizacion: row['Fecha Actualización']
      });
    });
    
    // Estilo de encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  // Generar el buffer del archivo
  const buffer = await workbook.xlsx.writeBuffer();

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
