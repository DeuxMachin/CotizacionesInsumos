/**
 * API Route para generar PDFs de cotizaciones
 * Ruta: /api/pdf/cotizacion/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/shared/lib/pdf/generator';
import type { Quote } from '@/core/domain/quote/Quote';
import { supabase, type Database } from '@/lib/supabase';

type CotizacionItemRow = Database['public']['Tables']['cotizacion_items']['Row'];
type ProductoPartial = { id: number; sku: string | null; nombre: string; ficha_tecnica: string | null };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    const pdfBuffer = await generatePDF(quote, undefined, { condensed: true, docType: 'cotizacion' });
    
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
    const pdfBuffer = await generatePDF(quoteData, undefined, { condensed: true, docType: 'cotizacion' });
    
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

// Función para obtener cotización por ID
async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    let query = supabase
      .from('cotizaciones')
      .select(`
        *,
        cotizacion_items(*, producto:productos!cotizacion_items_producto_id_fkey(id, sku, nombre, ficha_tecnica)),
        cotizacion_clientes(*, clientes(*)),
        cotizacion_despachos(*),
        clientes!cotizaciones_cliente_principal_id_fkey(*),
        usuarios!cotizaciones_vendedor_id_fkey(*)
      `);

    // Si el ID contiene "COT", buscar por folio, sino por ID numérico
    if (id.startsWith('COT')) {
      query = query.eq('folio', id);
    } else {
      query = query.eq('id', parseInt(id));
    }

    const { data, error } = await query.single();

    if (error || !data) return null;

    // Usar el adaptador para convertir a dominio
    const { mapCotizacionToDomain } = await import('@/features/quotes/model/adapters');
    // Enriquecer items con datos de producto por producto_id (fallback por si el join no retorna)
    const rawItems = (data.cotizacion_items || []) as (CotizacionItemRow & { producto?: ProductoPartial | null })[];
    let itemsWithProduct = rawItems;
    let fichaMap: Map<number, string | undefined> | undefined;
    try {
      const productIds = Array.from(new Set(rawItems.map((it) => it?.producto_id).filter((v) => v != null)));
      if (productIds.length > 0) {
        const { data: productosData } = await supabase
          .from('productos')
          .select('id, sku, nombre, ficha_tecnica')
          .in('id', productIds.map((v: number)=> Number(v)) as number[]);
        const prodMap = new Map<number, ProductoPartial>((productosData || []).map((p: ProductoPartial) => [p.id, p]));
        fichaMap = new Map<number, string | undefined>((productosData || []).map((p: ProductoPartial) => [p.id, p.ficha_tecnica || undefined]));
        itemsWithProduct = rawItems.map((it) => ({
          ...it,
          producto: it.producto ?? (it.producto_id ? prodMap.get(it.producto_id) : null) ?? null,
        }));
      }
    } catch {}

    const aggregate = {
      cotizacion: data,
      items: itemsWithProduct,
      clientes_adicionales: data.cotizacion_clientes || [],
      despacho: data.cotizacion_despachos?.[0] || null,
      cliente_principal: data.clientes,
      vendedor: data.usuarios
    };

    const quote = mapCotizacionToDomain(aggregate);
    if (fichaMap && fichaMap.size) {
      const enrichedItems = quote.items.map((it) => {
        if (it.fichaTecnica || !it.productId) return it;
        const ficha = fichaMap?.get(Number(it.productId));
        return ficha ? { ...it, fichaTecnica: ficha } : it;
      });
      return { ...quote, items: enrichedItems };
    }
    return quote;
  } catch {
    return null;
  }
}
