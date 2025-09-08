/**
 * API Route para generar PDFs desde datos POST
 * Ruta: /api/pdf/cotizacion/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/shared/lib/pdf/generator';
import type { Quote } from '@/core/domain/quote/Quote';

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
    
  // Generar PDF (condensado)
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
      { error: 'Error al generar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    );
  }
}
