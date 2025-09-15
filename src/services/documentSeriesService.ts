import { supabase } from '@/lib/supabase';

/**
 * Registra/actualiza la serie de documentos para descargas y retorna el folio generado.
 * Mantiene una fila por (doc_tipo, anio) e incrementa ultimo_numero de forma atómica.
 */
export async function registerDownloadSeries(docTipo: string, prefijo: string): Promise<{ folio: string; numero: number; anio: number; prefijo: string; }> {
  const anio = new Date().getFullYear();

  // Buscar serie existente
  const { data: existing, error: fetchErr } = await supabase
    .from('document_series')
    .select('*')
    .eq('doc_tipo', docTipo)
    .eq('anio', anio)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  if (!existing) {
    // Crear serie inicial
    const { data: inserted, error: insertErr } = await supabase
      .from('document_series')
      .insert({
        doc_tipo: docTipo,
        anio,
        prefijo,
        ultimo_numero: 1,
        largo: 6,
        activo: true,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;

    const numero = inserted!.ultimo_numero ?? 1;
    const folio = `${inserted!.prefijo}${String(numero).padStart(inserted!.largo ?? 6, '0')}`;
    return { folio, numero, anio, prefijo: inserted!.prefijo };
  }

  // Incrementar ultimo_numero
  const nextNumero = (existing.ultimo_numero ?? 0) + 1;
  const { data: updated, error: updateErr } = await supabase
    .from('document_series')
    .update({ ultimo_numero: nextNumero })
    .eq('id', existing.id)
    .select('*')
    .single();

  if (updateErr) throw updateErr;

  const numero = updated!.ultimo_numero ?? nextNumero;
  const folio = `${updated!.prefijo}${String(numero).padStart(updated!.largo ?? 6, '0')}`;
  return { folio, numero, anio, prefijo: updated!.prefijo };
}
