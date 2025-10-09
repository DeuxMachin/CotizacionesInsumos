import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, getUserInfoForAudit } from '@/lib/auth-helpers'
import { AuditLogger } from '@/services/auditLogger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, monto, descripcion, fecha_vencimiento, tasa_interes, notas } = body

    // Validar datos requeridos
    if (!cliente_id || !monto || !descripcion) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos: cliente_id, monto, descripcion'
      }, { status: 400 })
    }

    if (monto <= 0) {
      return NextResponse.json({
        success: false,
        error: 'El monto debe ser mayor a 0'
      }, { status: 400 })
    }

    // Obtener información del usuario autenticado
    const user = await getCurrentUser(request)
    const userInfo = getUserInfoForAudit(user)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no autenticado'
      }, { status: 401 })
    }

    console.log('[API Loan] Registrando préstamo como cargo manual CXC:', cliente_id, 'monto:', monto)

    // Obtener el saldo actual del cliente ANTES del préstamo
    const { data: saldoActual, error: saldoError } = await supabase
      .from('cliente_saldos')
      .select('id, pagado, pendiente, vencido, dinero_cotizado')
      .eq('cliente_id', cliente_id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (saldoError) {
      console.error('[API Loan] Error obteniendo saldo actual:', saldoError)
      return NextResponse.json({
        success: false,
        error: `Error al obtener saldo actual: ${saldoError.message}`
      }, { status: 500 })
    }

    // Crear un documento CXC tipo "cargo_manual" para el préstamo
    const { data: documento, error: docError } = await supabase
      .from('cxc_documentos')
      .insert({
        cliente_id: cliente_id,
        doc_tipo: 'cargo_manual',
        nota_venta_id: null,
        moneda: 'CLP',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_vencimiento: fecha_vencimiento || null,
        monto_total: monto,
        saldo_pendiente: monto,
        estado: 'pendiente',
        observacion: `PRÉSTAMO: ${descripcion}${notas ? ` - ${notas}` : ''}${tasa_interes ? ` (Tasa: ${tasa_interes}%)` : ''}`
      })
      .select()
      .single()

    if (docError || !documento) {
      console.error('[API Loan] Error creando documento CXC:', docError)
      return NextResponse.json({
        success: false,
        error: `Error al crear préstamo: ${docError?.message || 'Error desconocido'}`
      }, { status: 500 })
    }

    console.log('[API Loan] Documento CXC (cargo_manual) creado exitosamente:', documento.id)

    // Recalcular saldos sumando todos los documentos CXC pendientes y restando pagos
    const { data: docs, error: docsErr } = await supabase
      .from('cxc_documentos')
      .select('saldo_pendiente, fecha_vencimiento')
      .eq('cliente_id', cliente_id)
      .neq('estado', 'pagado')

    if (docsErr) {
      console.error('[API Loan] Error obteniendo documentos:', docsErr)
      return NextResponse.json({
        success: false,
        error: `Error al recalcular saldos: ${docsErr.message}`
      }, { status: 500 })
    }

    // Total pagos
    const { data: pagos, error: pagosErr } = await supabase
      .from('cxc_pagos')
      .select('monto_total')
      .eq('cliente_id', cliente_id)
    if (pagosErr) {
      console.error('[API Loan] Error obteniendo pagos:', pagosErr)
      return NextResponse.json({
        success: false,
        error: `Error al recalcular saldos: ${pagosErr.message}`
      }, { status: 500 })
    }

    const totalPagos = (pagos || []).reduce((s, p) => s + (p.monto_total || 0), 0)
    const hoy = new Date().toISOString().split('T')[0]
    let deudaDocumentos = 0
    let vencido = 0

    for (const d of docs || []) {
      const saldo = d.saldo_pendiente || 0
      deudaDocumentos += saldo
      if (d.fecha_vencimiento && d.fecha_vencimiento < hoy) vencido += saldo
    }

    const nuevoPendiente = deudaDocumentos
    const newPagado = totalPagos
    const snapshotDate = new Date().toISOString().split('T')[0]

    if (saldoActual) {
      // Actualizar el registro existente
      const { error: updateError } = await supabase
        .from('cliente_saldos')
        .update({
          pendiente: nuevoPendiente,
          pagado: newPagado,
          vencido: vencido,
          snapshot_date: snapshotDate
        })
        .eq('id', saldoActual.id)

      if (updateError) {
        console.error('[API Loan] Error actualizando cliente_saldos:', updateError)
        return NextResponse.json({
          success: false,
          error: `Error al actualizar saldo: ${updateError.message}`
        }, { status: 500 })
      }

      console.log('[API Loan] cliente_saldos actualizado exitosamente:', {
        id: saldoActual.id,
        pendiente_anterior: saldoActual.pendiente,
        pendiente_nuevo: nuevoPendiente,
        pagado_anterior: saldoActual.pagado,
        pagado_nuevo: newPagado,
        deudaDocumentos,
        totalPagos
      })
    } else {
      // Crear nuevo registro de saldos
      const { error: insertError } = await supabase
        .from('cliente_saldos')
        .insert({
          cliente_id: cliente_id,
          snapshot_date: snapshotDate,
          pagado: newPagado,
          pendiente: nuevoPendiente,
          vencido: vencido,
          dinero_cotizado: 0
        })

      if (insertError) {
        console.error('[API Loan] Error creando cliente_saldos:', insertError)
        return NextResponse.json({
          success: false,
          error: `Error al crear registro de saldo: ${insertError.message}`
        }, { status: 500 })
      }

      console.log('[API Loan] cliente_saldos creado exitosamente para préstamo')
    }

    // Registrar en audit log
    if (userInfo) {
      await AuditLogger.logEvent({
        usuario_id: userInfo.id,
        evento: 'PRESTAMO_REGISTRADO',
        descripcion: `Préstamo registrado para cliente ${cliente_id}: $${monto.toLocaleString()}`,
        detalles: {
          cliente_id,
          monto,
          descripcion,
          fecha_vencimiento,
          tasa_interes,
          notas,
          pendiente_anterior: saldoActual?.pendiente || 0,
          pendiente_nuevo: nuevoPendiente,
          pagado_anterior: saldoActual?.pagado || 0,
          pagado_nuevo: newPagado
        },
        tabla_afectada: 'cliente_saldos',
        registro_id: cliente_id.toString()
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        loan: {
          cliente_id,
          monto,
          descripcion,
          fecha_vencimiento,
          tasa_interes,
          notas,
          fecha_registro: snapshotDate,
          pendiente_anterior: saldoActual?.pendiente || 0,
          pendiente_nuevo: nuevoPendiente,
          pagado_anterior: saldoActual?.pagado || 0,
          pagado_nuevo: newPagado
        }
      }
    })

  } catch (error) {
    console.error('[API Loan] Error registrando préstamo:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}