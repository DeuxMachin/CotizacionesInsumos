/**
 * API Route para generar PDFs desde datos POST
 * Ruta: /api/pdf/cotizacion/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/shared/lib/pdf/generator';
import type { Quote, QuoteItem } from '@/core/domain/quote/Quote';

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
    
  // Enriquecer items con ficha_técnica si faltara (preview/borrador)
  const items = Array.isArray(quoteData.items) ? quoteData.items : [];
  const productIds = Array.from(new Set(items.map((it: QuoteItem) => it?.productId).filter((v: number | undefined) => v != null))) as number[];
  let enrichedQuote = quoteData;
  try {
    if (productIds.length > 0) {
      const { supabase } = await import('@/lib/supabase');
      const { data: productos } = await supabase
        .from('productos')
        .select('id, ficha_tecnica')
        .in('id', productIds);
      const fichaMap = new Map<number, string | undefined>((productos || []).map((p: { id: number; ficha_tecnica: string | null }) => [p.id, p.ficha_tecnica || undefined]));
      const newItems = items.map((it: QuoteItem) => {
        if (it.fichaTecnica || !it.productId) return it;
        const ficha = fichaMap.get(Number(it.productId));
        return ficha ? { ...it, fichaTecnica: ficha } : it;
      });
      enrichedQuote = { ...quoteData, items: newItems } as Quote;
    }
  } catch {}

  // Generar PDF (condensado)
  const pdfBuffer = await generatePDF(enrichedQuote, undefined, { condensed: true, docType: 'cotizacion' });
    
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
