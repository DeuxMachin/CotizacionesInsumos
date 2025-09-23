/**
 * API Route para generar PDFs de notas de venta
 * Ruta: /api/pdf/sales-notes/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/shared/lib/pdf/generator';
import { NotasVentaService } from '@/services/notasVentaService';
import type { SalesNoteRecord } from '@/services/notasVentaService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    // Obtener la nota de venta desde la base de datos
    const salesNote = await NotasVentaService.getById(parseInt(id));

    if (!salesNote) {
      return NextResponse.json(
        { error: 'Nota de venta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener los items de la nota de venta
    const noteItems = await NotasVentaService.getItems(parseInt(id));

    // Convertir el formato de nota de venta al formato esperado por generatePDF
    const pdfData = await convertSalesNoteToPDFData(salesNote, noteItems);

    // Generar PDF (plantilla condensada por defecto, sin fondo)
    const pdfBuffer = await generatePDF(pdfData, undefined, { condensed: true });

    // Configurar headers de respuesta
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', pdfBuffer.length.toString());

    if (preview) {
      // Para previsualización en el navegador
      headers.set('Content-Disposition', 'inline; filename="nota-venta.pdf"');
    } else {
      // Para descarga directa
      headers.set('Content-Disposition', `attachment; filename="nota-venta-${salesNote.folio || id}.pdf"`);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), { headers });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}

// Función para convertir el formato de nota de venta al formato Quote esperado por generatePDF
async function convertSalesNoteToPDFData(salesNote: SalesNoteRecord, noteItems: any[]) {
  // Adaptar la estructura de datos de nota de venta al formato Quote esperado por generatePDF
  const pdfData = {
    id: salesNote.id.toString(),
    numero: salesNote.folio || `NV-${salesNote.id}`,
    cliente: {
      razonSocial: salesNote.cliente_razon_social || '',
      rut: salesNote.cliente_rut || '',
      nombreFantasia: salesNote.cliente_giro || undefined,
      giro: salesNote.cliente_giro || '',
      direccion: salesNote.cliente_direccion || '',
      ciudad: salesNote.cliente_ciudad || '',
      comuna: salesNote.cliente_comuna || '',
      telefono: undefined,
      email: undefined,
      nombreContacto: undefined,
      telefonoContacto: undefined
    },
    fechaCreacion: salesNote.created_at || new Date().toISOString(),
    fechaModificacion: salesNote.updated_at || new Date().toISOString(),
    estado: mapSalesNoteStatus(salesNote.estado) || 'borrador',
    vendedorId: salesNote.vendedor_id || '',
    vendedorNombre: 'Vendedor', // TODO: Obtener nombre real del vendedor
    items: noteItems.map((item) => ({
      id: item.id.toString(),
      productId: item.producto_id,
      codigo: item.producto_id?.toString() || '',
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precioUnitario: item.precio_unitario_neto,
      descuento: item.descuento_pct || 0,
      subtotal: item.subtotal_neto,
      fichaTecnica: item.productos?.ficha_tecnica || undefined
    })),
    despacho: salesNote.direccion_despacho ? {
      direccion: salesNote.direccion_despacho,
      ciudad: salesNote.ciudad_despacho || '',
      comuna: salesNote.comuna_despacho || '',
      fechaEstimada: salesNote.fecha_estimada_entrega || undefined,
      costoDespacho: salesNote.costo_despacho || undefined,
      observaciones: undefined
    } : undefined,
    condicionesComerciales: {
      validezOferta: 30, // Valor por defecto
      formaPago: salesNote.forma_pago_final || '',
      tiempoEntrega: salesNote.fecha_estimada_entrega || '',
      garantia: undefined,
      observaciones: salesNote.observaciones_comerciales || undefined
    },
    subtotal: salesNote.subtotal,
    descuentoTotal: salesNote.descuento_total,
    descuentoLineasMonto: salesNote.descuento_lineas_monto,
    descuentoGlobalMonto: salesNote.descuento_global_monto,
    iva: salesNote.iva_monto,
    total: salesNote.total,
    notas: salesNote.observaciones_comerciales || undefined,
    fechaExpiracion: undefined
  };

  return pdfData;
}

// Función para mapear estados de notas de venta a estados de Quote
function mapSalesNoteStatus(status: string | undefined): 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada' {
  switch (status) {
    case 'creada':
      return 'borrador';
    case 'confirmada':
      return 'aceptada';
    default:
      return 'borrador';
  }
}