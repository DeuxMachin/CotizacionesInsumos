import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, getUserInfoForAudit } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      cliente_id,
      monto,
      fecha_pago,
      tipo_pago,
      metodo_pago,
      referencia,
      descripcion,
      notas
    } = body;

    // Validaciones
    if (!cliente_id || typeof cliente_id !== 'number') {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    if (!monto || typeof monto !== 'number' || monto <= 0) {
      return NextResponse.json(
        { error: 'Monto válido requerido' },
        { status: 400 }
      );
    }

    if (!fecha_pago) {
      return NextResponse.json(
        { error: 'Fecha de pago requerida' },
        { status: 400 }
      );
    }

    if (!tipo_pago || !['parcial', 'total', 'adelanto'].includes(tipo_pago)) {
      return NextResponse.json(
        { error: 'Tipo de pago inválido' },
        { status: 400 }
      );
    }

    if (!metodo_pago || !['efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro'].includes(metodo_pago)) {
      return NextResponse.json(
        { error: 'Método de pago inválido' },
        { status: 400 }
      );
    }

    // Verificar que el cliente existe
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nombre_razon_social')
      .eq('id', cliente_id)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Insertar el pago
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .insert({
        cliente_id,
        monto,
        fecha_pago,
        tipo_pago,
        metodo_pago,
        referencia: referencia || null,
        descripcion: descripcion || null,
        notas: notas || null,
        registrado_por: user.id
      })
      .select()
      .single();

    if (pagoError) {
      console.error('Error creando pago:', pagoError);
      return NextResponse.json(
        { error: 'Error al registrar el pago' },
        { status: 500 }
      );
    }

    // Registrar en audit log
    await supabase
      .from('audit_log')
      .insert({
        usuario_id: user.id,
        evento: 'pago_registrado',
        descripcion: `Pago registrado para cliente ${cliente.nombre_razon_social}`,
        detalles: {
          pago_id: pago.id,
          cliente_id,
          monto,
          tipo_pago,
          metodo_pago
        },
        tabla_afectada: 'pagos',
        registro_id: pago.id.toString()
      });

    // Actualizar saldos del cliente
    // Primero obtener el saldo actual más reciente
    const { data: saldoActual, error: saldoError } = await supabase
      .from('cliente_saldos')
      .select('id, pagado, pendiente, vencido')
      .eq('cliente_id', cliente_id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (saldoActual && !saldoError) {
      // Actualizar el saldo existente
      const nuevoPagado = saldoActual.pagado + monto;
      const nuevoPendiente = Math.max(0, saldoActual.pendiente - monto);

      const { error: updateSaldoError } = await supabase
        .from('cliente_saldos')
        .update({
          pagado: nuevoPagado,
          pendiente: nuevoPendiente,
          updated_at: new Date().toISOString()
        })
        .eq('id', saldoActual.id);

      if (updateSaldoError) {
        console.error('Error actualizando saldo del cliente:', updateSaldoError);
        // No fallar la operación completa por esto, solo loggear
      }
    } else {
      // Si no hay saldo existente, crear uno nuevo con el pago
      const { error: insertSaldoError } = await supabase
        .from('cliente_saldos')
        .insert({
          cliente_id,
          snapshot_date: new Date().toISOString().split('T')[0], // Fecha actual
          pagado: monto,
          pendiente: 0, // Asumir que este pago cubre todo lo pendiente inicialmente
          vencido: 0
        });

      if (insertSaldoError) {
        console.error('Error creando saldo inicial del cliente:', insertSaldoError);
        // No fallar la operación completa por esto, solo loggear
      }
    }

    return NextResponse.json({
      success: true,
      pago,
      message: 'Pago registrado exitosamente'
    });

  } catch (error) {
    console.error('Error en API pagos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cliente_id = searchParams.get('cliente_id');

    if (!cliente_id) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      );
    }

    // Obtener pagos del cliente
    const { data: pagos, error } = await supabase
      .from('pagos')
      .select(`
        *,
        registrado_por_usuario:usuarios!pagos_registrado_por_fkey (
          nombre,
          apellido
        )
      `)
      .eq('cliente_id', cliente_id)
      .order('fecha_pago', { ascending: false });

    if (error) {
      console.error('Error obteniendo pagos:', error);
      return NextResponse.json(
        { error: 'Error al obtener pagos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pagos });

  } catch (error) {
    console.error('Error en API pagos GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}