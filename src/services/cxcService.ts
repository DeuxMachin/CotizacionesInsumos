import { supabase } from '../lib/supabase';
import type { Database } from '@/lib/supabase';


type CxcPagoInsert = Database['public']['Tables']['cxc_pagos']['Insert'];

export class CxcService {
  // Crear un pago y aplicarlo a documentos
  static async createPago(
    pago: Omit<CxcPagoInsert, 'created_at'>,
    aplicaciones: Array<{ documento_id: number; monto_aplicado: number }>
  ) {
    const { data: pagoInsert, error: pagoError } = await supabase
      .from('cxc_pagos')
      .insert(pago)
      .select()
      .single();

    if (pagoError) throw pagoError;

    // Crear aplicaciones
    const aplicacionesPayload = aplicaciones.map(app => ({
      pago_id: pagoInsert.id,
      documento_id: app.documento_id,
      monto_aplicado: app.monto_aplicado
    }));

    const { error: appError } = await supabase
      .from('cxc_aplicaciones')
      .insert(aplicacionesPayload);

    if (appError) throw appError;

    // Actualizar saldos de documentos
    for (const app of aplicaciones) {
      await supabase.rpc('update_documento_saldo', {
        doc_id: app.documento_id,
        monto_aplicado: app.monto_aplicado
      });
    }

    // Actualizar cliente_saldos
    await this.updateClienteSaldos(pago.cliente_id);

    return pagoInsert;
  }

  // Obtener documentos pendientes de un cliente
  static async getDocumentosPendientes(clienteId: number) {
    const { data, error } = await supabase
      .from('cxc_documentos')
      .select(`
        *,
        nota_venta:notas_venta(folio, fecha_emision)
      `)
      .eq('cliente_id', clienteId)
      .eq('estado', 'pendiente')
      .order('fecha_emision', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Obtener pagos de un cliente
  static async getPagosCliente(clienteId: number) {
    const { data, error } = await supabase
      .from('cxc_pagos')
      .select(`
        *,
        cxc_aplicaciones(
          monto_aplicado,
          cxc_documentos(
            id,
            doc_tipo,
            notas_venta(folio)
          )
        )
      `)
      .eq('cliente_id', clienteId)
      .order('fecha_pago', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Actualizar saldos del cliente (esto podría ser un trigger en BD)
  static async updateClienteSaldos(clienteId: number) {
    // Calcular totales desde cxc_documentos
    const { data: documentos, error: docError } = await supabase
      .from('cxc_documentos')
      .select('estado, saldo_pendiente, fecha_vencimiento')
      .eq('cliente_id', clienteId);

    if (docError) throw docError;

    const now = new Date();
    let pendiente = 0;
    let vencido = 0;

    for (const doc of documentos || []) {
      if (doc.estado === 'pendiente' || doc.estado === 'parcial') {
        pendiente += doc.saldo_pendiente || 0;
        if (doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < now) {
          vencido += doc.saldo_pendiente || 0;
        }
      }
    }

    // Obtener el último snapshot
    const { data: ultimoSaldo, error: saldoError } = await supabase
      .from('cliente_saldos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (saldoError) throw saldoError;

    const pagado = ultimoSaldo?.pagado || 0;
    const dineroCotizado = ultimoSaldo?.dinero_cotizado || 0;

    if (ultimoSaldo) {
      await supabase
        .from('cliente_saldos')
        .update({
          pendiente,
          vencido,
          pagado,
          dinero_cotizado: dineroCotizado
        })
        .eq('id', ultimoSaldo.id);
    } else {
      await supabase
        .from('cliente_saldos')
        .insert({
          cliente_id: clienteId,
          snapshot_date: new Date().toISOString().split('T')[0],
          pagado,
          pendiente,
          vencido,
          dinero_cotizado: dineroCotizado
        });
    }
  }
}