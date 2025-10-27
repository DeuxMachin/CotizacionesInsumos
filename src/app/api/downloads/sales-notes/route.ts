import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';
import { AuditService } from '@/services/auditService';

interface NotasVentaExportRow {
  idNotaVenta: number;
  folio: string;
  numeroCotizacion: string;
  clienteRut: string;
  clienteRazonSocial: string;
  clienteEmail: string;
  producto: string;
  sku: string;
  categoria: string;
  vendedorAsignado: string;
  cantidad: number;
  precioUnitario: number;
  totalLinea: number;
  estado: string;
  fechaCreacion: string;
  fechaFacturacion: string;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener información del usuario
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const isVendedor = searchParams.get('isVendedor') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requerido' },
        { status: 400 }
      );
    }

    if (!isAdmin && !isVendedor) {
      return NextResponse.json(
        { error: 'Solo los administradores y vendedores pueden descargar el historial de notas de venta' },
        { status: 403 }
      );
    }

    // Obtener IP del cliente
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Obtener User Agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Consultar notas de venta con relaciones
    const { data: notasVentaData, error: notasVentaError } = await supabase
      .from('notas_venta')
      .select(`
        id,
        folio,
        cotizacion_id,
        estado,
        created_at,
        updated_at,
        fecha_emision,
        confirmed_at,
        cliente_rut,
        cliente_razon_social,
        vendedor:usuarios!vendedor_id(id, nombre, apellido),
        clientes!notas_venta_cliente_principal_id_fkey(
          email_pago
        ),
        nota_venta_items(
          descripcion,
          cantidad,
          precio_unitario_neto,
          total_neto,
          productos!nota_venta_items_producto_id_fkey(
            sku,
            nombre,
            tipo_id
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (notasVentaError) {
      console.error('Error consultando notas de venta:', notasVentaError);
      throw notasVentaError;
    }

    if (!notasVentaData || notasVentaData.length === 0) {
      return NextResponse.json(
        { error: 'No hay notas de venta para exportar' },
        { status: 404 }
      );
    }

    // Obtener tipos de productos para mapear categorías
    const { data: tiposProductos } = await supabase
      .from('producto_tipos')
      .select('id, nombre');

    const tiposMap = new Map(tiposProductos?.map(t => [t.id, t.nombre]) || []);

    // Preparar datos para Excel
    const exportData: NotasVentaExportRow[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notasVentaData.forEach((notaVenta) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cliente = notaVenta.clientes as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vendedor = notaVenta.vendedor as any;
      const vendedorAsignado = vendedor?.nombre ? `${vendedor.nombre} ${vendedor.apellido || ''}`.trim() : 'N/A';
      const items = notaVenta.nota_venta_items || [];

      // Determinar fecha de facturación basada en el estado y updated_at
      let fechaFacturacion = '';
      if (notaVenta.estado === 'facturada') {
        // Usar confirmed_at si existe, sino usar updated_at como respaldo
        const fecha = notaVenta.confirmed_at || notaVenta.updated_at;
        fechaFacturacion = fecha ? new Date(fecha).toLocaleDateString('es-CL') : 'N/A';
      } else if (notaVenta.estado === 'factura_parcial') {
        const fecha = notaVenta.confirmed_at || notaVenta.updated_at;
        fechaFacturacion = fecha ? `Parcial: ${new Date(fecha).toLocaleDateString('es-CL')}` : 'N/A';
      }

      // Para cada item de la nota de venta, agregar una fila
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items.forEach((item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const producto = item.productos as any;
        const categoria = producto?.tipo_id ? (tiposMap.get(producto.tipo_id) || 'Sin categoría') : 'Sin categoría';

        exportData.push({
          idNotaVenta: notaVenta.id,
          folio: notaVenta.folio || 'Sin folio',
          numeroCotizacion: notaVenta.cotizacion_id ? `COT-${notaVenta.cotizacion_id.toString().padStart(6, '0')}` : 'N/A',
          clienteRut: notaVenta.cliente_rut || 'N/A',
          clienteRazonSocial: notaVenta.cliente_razon_social || 'N/A',
          clienteEmail: cliente?.email_pago || 'No especeficiado',
          producto: item.descripcion || producto?.nombre || 'N/A',
          sku: producto?.sku || 'Sin asignar',
          categoria: categoria,
          vendedorAsignado: vendedorAsignado,
          cantidad: item.cantidad || 0,
          precioUnitario: item.precio_unitario_neto || 0,
          totalLinea: item.total_neto || 0,
          estado: notaVenta.estado || 'creada',
          fechaCreacion: notaVenta.created_at ? new Date(notaVenta.created_at).toLocaleDateString('es-CL') : '',
          fechaFacturacion: fechaFacturacion
        });
      });

      // Si no hay items, agregar una fila con datos de la nota de venta
      if (items.length === 0) {
        exportData.push({
          idNotaVenta: notaVenta.id,
          folio: notaVenta.folio || 'Sin folio',
          numeroCotizacion: notaVenta.cotizacion_id ? `COT-${notaVenta.cotizacion_id.toString().padStart(6, '0')}` : 'N/A',
          clienteRut: notaVenta.cliente_rut || 'N/A',
          clienteRazonSocial: notaVenta.cliente_razon_social || 'N/A',
          clienteEmail: cliente?.email_pago || 'N/A',
          producto: 'Sin productos',
          sku: 'N/A',
          categoria: 'N/A',
          vendedorAsignado: vendedorAsignado,
          cantidad: 0,
          precioUnitario: 0,
          totalLinea: 0,
          estado: notaVenta.estado || 'creada',
          fechaCreacion: notaVenta.created_at ? new Date(notaVenta.created_at).toLocaleDateString('es-CL') : '',
          fechaFacturacion: fechaFacturacion
        });
      }
    });

    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Cotizaciones';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Notas de Venta');
    
    // Definir columnas con headers y anchos (ordenadas por importancia)
    worksheet.columns = [
      { header: 'ID Nota Venta', key: 'idNotaVenta', width: 15 },
      { header: 'Folio', key: 'folio', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Cotización Referenciada', key: 'numeroCotizacion', width: 20 },
      { header: 'Cliente RUT', key: 'clienteRut', width: 15 },
      { header: 'Cliente Razón Social', key: 'clienteRazonSocial', width: 30 },
      { header: 'Cliente Email', key: 'clienteEmail', width: 30 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Vendedor asignado', key: 'vendedorAsignado', width: 25 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Precio Unitario', key: 'precioUnitario', width: 15 },
      { header: 'Total Línea', key: 'totalLinea', width: 15 },
      { header: 'Fecha Creación', key: 'fechaCreacion', width: 15 },
      { header: 'Fecha Facturación', key: 'fechaFacturacion', width: 20 }
    ];
    
    // Agregar datos
    exportData.forEach((row) => {
      worksheet.addRow({
        idNotaVenta: row.idNotaVenta,
        folio: row.folio,
        estado: row.estado,
        numeroCotizacion: row.numeroCotizacion,
        clienteRut: row.clienteRut,
        clienteRazonSocial: row.clienteRazonSocial,
        clienteEmail: row.clienteEmail,
        producto: row.producto,
        sku: row.sku,
        categoria: row.categoria,
        vendedorAsignado: row.vendedorAsignado,
        cantidad: row.cantidad,
        precioUnitario: row.precioUnitario,
        totalLinea: row.totalLinea,
        fechaCreacion: row.fechaCreacion,
        fechaFacturacion: row.fechaFacturacion
      });
    });
    
    // Estilo de encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Formato para columnas numéricas
    worksheet.getColumn('cantidad').numFmt = '#,##0';
    worksheet.getColumn('precioUnitario').numFmt = '"$"#,##0.00';
    worksheet.getColumn('totalLinea').numFmt = '"$"#,##0.00';

    // Generar el buffer del archivo
    const buffer = await workbook.xlsx.writeBuffer();

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