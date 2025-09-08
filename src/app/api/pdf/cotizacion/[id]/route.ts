/**
 * API Route para generar PDFs de cotizaciones
 * Ruta: /api/pdf/cotizacion/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/shared/lib/pdf/generator';
import type { Quote } from '@/core/domain/quote/Quote';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';
    
    // Aquí deberías obtener la cotización desde tu base de datos
    // Por ahora usamos datos mock para testing
    const quote = await getQuoteById(id);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }
    
  // Generar PDF (plantilla condensada por defecto, sin fondo)
    const pdfBuffer = await generatePDF(quote, undefined, { condensed: true });
    
    // Configurar headers de respuesta
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', pdfBuffer.length.toString());
    
    if (preview) {
      // Para previsualización en el navegador
      headers.set('Content-Disposition', 'inline; filename="cotizacion.pdf"');
    } else {
      // Para descarga directa
      headers.set('Content-Disposition', `attachment; filename="cotizacion-${quote.numero || id}.pdf"`);
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

export async function POST(request: NextRequest) {
  try {
    // Para generar PDF con datos enviados en el body (útil para cotizaciones en borrador)
    const quoteData: Quote = await request.json();
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';
    
    // Validar datos mínimos
    if (!quoteData.cliente || !quoteData.items || quoteData.items.length === 0) {
      return NextResponse.json(
        { error: 'Datos de cotización incompletos' },
        { status: 400 }
      );
    }
    
  // Generar PDF
    const pdfBuffer = await generatePDF(quoteData, undefined, { condensed: true });
    
    // Configurar headers de respuesta
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', pdfBuffer.length.toString());
    
    if (preview) {
      headers.set('Content-Disposition', 'inline; filename="cotizacion-preview.pdf"');
    } else {
      headers.set('Content-Disposition', `attachment; filename="cotizacion-${quoteData.numero || 'nueva'}.pdf"`);
    }
    
    return new NextResponse(new Uint8Array(pdfBuffer), { headers });
    
  } catch (error) {
    console.error('Error generating PDF from POST data:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}

// Función mock para obtener cotización - reemplaza con tu lógica real
async function getQuoteById(id: string): Promise<Quote | null> {
  // IMPORTANTE: Reemplaza esto con tu lógica real de base de datos
  // Ejemplo usando Supabase o tu ORM preferido:
  // const { data, error } = await supabase
  //   .from('quotes')
  //   .select('*')
  //   .eq('id', id)
  //   .single();
  // return data;
  
  // Por ahora retornamos datos mock para testing
  return {
    id,
    numero: 'COT-2024-001',
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
    fechaExpiracion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cliente: {
      rut: '12345678-9',
      razonSocial: 'Empresa de Prueba S.A.',
      nombreFantasia: 'Empresa Prueba',
      giro: 'Servicios de construcción',
      direccion: 'Av. Providencia 1234',
      comuna: 'Providencia',
      ciudad: 'Santiago',
      telefono: '+56 2 2234 5678',
      email: 'contacto@empresaprueba.cl'
    },
    items: [
      {
        id: '1',
        codigo: 'PROD-001',
        descripcion: 'Producto de ejemplo 1',
        cantidad: 2,
        unidad: 'unidades',
        precioUnitario: 50000,
        descuento: 0,
        subtotal: 100000
      },
      {
        id: '2',
        codigo: 'PROD-002',
        descripcion: 'Producto de ejemplo 2',
        cantidad: 1,
        unidad: 'servicio',
        precioUnitario: 75000,
        descuento: 10,
        subtotal: 67500
      }
    ],
    condicionesComerciales: {
      validezOferta: 30,
      formaPago: 'Transferencia bancaria',
      tiempoEntrega: '7 días hábiles',
      garantia: '1 año'
    },
    estado: 'enviada',
    vendedorId: 'USER001',
    vendedorNombre: 'Juan Pérez',
    subtotal: 167500,
    descuentoTotal: 7500,
    iva: 30400,
    total: 190400,
    notas: 'Esta es una cotización de ejemplo generada para testing del sistema PDF.'
  };
}
