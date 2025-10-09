// Endpoint de Pagos - implementación limpia
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth-helpers';

// ----- Utilidades de cálculo -----
async function recalcSaldos(clienteId: number) {
  // Total pagos registrados
  const { data: pagos, error: pagosErr } = await supabase
    .from('cxc_pagos')
    .select('monto_total')
    .eq('cliente_id', clienteId);
  if (pagosErr) throw pagosErr;
  const totalPagos = (pagos || []).reduce((s, p) => s + (p.monto_total || 0), 0);

  // Total notas de venta (todas) por cliente_principal_id
  const { data: notas, error: notasErr } = await supabase
    .from('notas_venta')
    .select('total')
    .eq('cliente_principal_id', clienteId);
  if (notasErr) throw notasErr;
  const totalNotas = (notas || []).reduce((s, n) => s + (n.total || 0), 0);

  // Documentos abiertos (estado != pagado) para calcular deuda de documentos CXC
  const { data: docs, error: docsErr } = await supabase
    .from('cxc_documentos')
    .select('saldo_pendiente, fecha_vencimiento, estado')
    .eq('cliente_id', clienteId)
    .neq('estado', 'pagado');
  if (docsErr) throw docsErr;

  const hoy = new Date().toISOString().split('T')[0];
  let deudaDocumentos = 0;
  let vencido = 0;
  for (const d of docs || []) {
    const saldo = d.saldo_pendiente || 0;
    deudaDocumentos += saldo;
    if (d.fecha_vencimiento && d.fecha_vencimiento < hoy) vencido += saldo;
  }

  // LÓGICA CORREGIDA: Pendiente = Deuda total de documentos, Pagado = Total pagos realizados
  const pendiente = deudaDocumentos;
  const pagado = totalPagos;

  // Snapshot existente (buscar por cliente_id y snapshot_date)
  const snapshotDate = new Date().toISOString().split('T')[0];
  const { data: existente, error: selErr } = await supabase
    .from('cliente_saldos')
    .select('id, dinero_cotizado')
    .eq('cliente_id', clienteId)
    .eq('snapshot_date', snapshotDate)
    .maybeSingle();

  const payload = {
    cliente_id: clienteId,
    pagado, // total pagos realizados
    pendiente, // total deuda de documentos
    vencido,
    dinero_cotizado: existente?.dinero_cotizado || 0
  };

  console.log('[recalcSaldos] Calculando para cliente', clienteId, { 
    totalPagos, 
    totalNotas, 
    deudaDocumentos, 
    pendiente: `Deuda total: ${deudaDocumentos}`,
    pagado: `Pagos totales: ${pagado}`,
    vencido, 
    payload 
  });

  if (existente) {
    const { error: updErr } = await supabase
      .from('cliente_saldos')
      .update(payload)
      .eq('cliente_id', clienteId)
      .eq('snapshot_date', snapshotDate);
    if (updErr) throw updErr;
  } else {
    const { error: insErr } = await supabase
      .from('cliente_saldos')
      .insert({ ...payload, snapshot_date: snapshotDate });
    if (insErr) throw insErr;
  }
  return payload;
}

async function aplicarPagoAFacturas(pagoId: number, clienteId: number, monto: number) {
  const { data: docs, error: docsErr } = await supabase
    .from('cxc_documentos')
    .select('id, saldo_pendiente')
    .eq('cliente_id', clienteId)
    .neq('estado', 'pagado')
    .gt('saldo_pendiente', 0)
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false });
  if (docsErr) throw docsErr;

  let restante = monto;
  for (const d of docs || []) {
    if (restante <= 0) break;
    const aplicar = Math.min(restante, d.saldo_pendiente || 0);
    if (aplicar <= 0) continue;

    const { error: appErr } = await supabase
      .from('cxc_aplicaciones')
      .insert({ pago_id: pagoId, documento_id: d.id, monto_aplicado: aplicar });
    if (appErr) throw appErr;

    const nuevoSaldo = (d.saldo_pendiente || 0) - aplicar;
    const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'parcial';
    const { error: updErr } = await supabase
      .from('cxc_documentos')
      .update({ saldo_pendiente: Math.max(0, nuevoSaldo), estado: nuevoEstado })
      .eq('id', d.id);
    if (updErr) throw updErr;
    restante -= aplicar;
  }
}

// ----- Handlers -----
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { cliente_id, monto, fecha_pago, metodo_pago, referencia, descripcion, notas } = body || {};

    if (typeof cliente_id !== 'number' || cliente_id <= 0) {
      return NextResponse.json({ error: 'cliente_id inválido' }, { status: 400 });
    }
    if (typeof monto !== 'number' || monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    if (!fecha_pago) {
      return NextResponse.json({ error: 'Fecha de pago requerida' }, { status: 400 });
    }

    // Validar cliente
    const { data: clienteRow, error: clienteErr } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .single();
    if (clienteErr || !clienteRow) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Insertar pago
    const { data: pago, error: pagoErr } = await supabase
      .from('cxc_pagos')
      .insert({
        cliente_id,
        fecha_pago,
        monto_total: monto,
        moneda: 'CLP',
        metodo_pago: metodo_pago || null,
        referencia: referencia || null,
        observacion: `${descripcion || ''} ${notas || ''}`.trim() || null,
        created_by: user.id
      })
      .select()
      .single();
    if (pagoErr || !pago) {
      return NextResponse.json({ error: 'Error registrando pago' }, { status: 500 });
    }

    // Aplicar a documentos
    await aplicarPagoAFacturas(pago.id, cliente_id, monto);
    // Recalcular snapshot
    const snapshot = await recalcSaldos(cliente_id);

    return NextResponse.json({ success: true, pago, snapshot });
  } catch (error) {
    console.error('[POST /api/pagos] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clienteIdParam = searchParams.get('cliente_id');
    if (!clienteIdParam) return NextResponse.json({ error: 'cliente_id requerido' }, { status: 400 });
    const cliente_id = Number(clienteIdParam);
    if (Number.isNaN(cliente_id)) return NextResponse.json({ error: 'cliente_id inválido' }, { status: 400 });

    const { data: pagos, error } = await supabase
      .from('cxc_pagos')
      .select('*')
      .eq('cliente_id', cliente_id)
      .order('fecha_pago', { ascending: false });
    if (error) {
      return NextResponse.json({ error: 'Error obteniendo pagos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pagos });
  } catch (error) {
    console.error('[GET /api/pagos] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}