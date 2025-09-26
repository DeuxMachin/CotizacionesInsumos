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

    // Actualizar directamente cliente_saldos para el préstamo
    console.log('[API Loan] Actualizando saldos del cliente para préstamo:', cliente_id, 'monto:', monto)

    // Obtener el saldo actual del cliente
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

    const nuevoPendiente = (saldoActual?.pendiente || 0) + monto
    const snapshotDate = new Date().toISOString().split('T')[0]

    if (saldoActual) {
      // Actualizar el registro existente
      const { error: updateError } = await supabase
        .from('cliente_saldos')
        .update({
          pendiente: nuevoPendiente,
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
        pendiente_nuevo: nuevoPendiente
      })
    } else {
      // Crear nuevo registro de saldos
      const { error: insertError } = await supabase
        .from('cliente_saldos')
        .insert({
          cliente_id: cliente_id,
          snapshot_date: snapshotDate,
          pagado: 0,
          pendiente: nuevoPendiente,
          vencido: 0,
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
          pendiente_nuevo: nuevoPendiente
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
          pendiente_nuevo: nuevoPendiente
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