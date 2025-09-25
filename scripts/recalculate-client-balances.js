const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
console.log('KEY:', supabaseServiceKey ? 'OK' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recalculateClientBalances() {
  console.log('🔄 Iniciando recálculo de saldos de clientes basado en HISTORIAL de notas de venta...');

  try {
    // 1. Obtener todos los clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nombre_razon_social');

    if (clientesError) {
      console.error('Error obteniendo clientes:', clientesError);
      return;
    }

    console.log(`👥 Procesando ${clientes.length} clientes...`);

    for (const cliente of clientes) {
      try {
        console.log(`📋 Procesando cliente ${cliente.id}: ${cliente.nombre_razon_social}`);

        // 2. Calcular total de pagos realizados (cxc_pagos)
        const { data: pagos, error: pagosError } = await supabase
          .from('cxc_pagos')
          .select('monto_total')
          .eq('cliente_id', cliente.id);

        if (pagosError) {
          console.error(`Error obteniendo pagos para cliente ${cliente.id}:`, pagosError);
          continue;
        }

        const totalPagos = (pagos || []).reduce((sum, pago) => sum + (pago.monto_total || 0), 0);
        console.log(`💰 Pagos realizados encontrados: ${pagos.length}, Total pagado: ${totalPagos}`);

        // 3. Calcular pendiente y vencido de documentos CxC
        const { data: docs, error: docsError } = await supabase
          .from('cxc_documentos')
          .select('saldo_pendiente, fecha_vencimiento, estado')
          .eq('cliente_id', cliente.id)
          .neq('estado', 'pagado');

        if (docsError) {
          console.error(`Error obteniendo documentos para cliente ${cliente.id}:`, docsError);
          continue;
        }

        const hoy = new Date().toISOString().split('T')[0];
        let pendiente = 0;
        let vencido = 0;

        for (const doc of docs || []) {
          const saldo = doc.saldo_pendiente || 0;
          pendiente += saldo;
          if (doc.fecha_vencimiento && doc.fecha_vencimiento < hoy) {
            vencido += saldo;
          }
        }

        console.log(`📄 Documentos pendientes: ${docs.length}, Pendiente: ${pendiente}, Vencido: ${vencido}`);

        // 4. Obtener dinero_cotizado actual (de cotizaciones no aceptadas)
        const { data: cotizaciones, error: cotError } = await supabase
          .from('cotizaciones')
          .select('total_final')
          .eq('cliente_principal_id', cliente.id)
          .not('estado', 'eq', 'aceptada');

        if (cotError) {
          console.error(`Error obteniendo cotizaciones para cliente ${cliente.id}:`, cotError);
          continue;
        }

        const dineroCotizado = (cotizaciones || []).reduce((sum, cot) => sum + (cot.total_final || 0), 0);

        // 5. Preparar payload para cliente_saldos
        const payload = {
          cliente_id: cliente.id,
          pagado: totalPagos, // Total de pagos realizados acumulados
          pendiente,
          vencido,
          dinero_cotizado: dineroCotizado,
          snapshot_date: new Date().toISOString().split('T')[0]
        };

        console.log(`💾 Payload para cliente_saldos:`, payload);

        // 6. Verificar si existe un registro de hoy
        const { data: existente } = await supabase
          .from('cliente_saldos')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('snapshot_date', payload.snapshot_date)
          .maybeSingle();

        if (existente) {
          const { error: updateError } = await supabase
            .from('cliente_saldos')
            .update(payload)
            .eq('id', existente.id);

          if (updateError) {
            console.error(`❌ Error actualizando saldo para cliente ${cliente.id}:`, updateError);
          } else {
            console.log(`✅ Actualizado saldo para cliente ${cliente.id}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from('cliente_saldos')
            .insert(payload);

          if (insertError) {
            console.error(`❌ Error insertando saldo para cliente ${cliente.id}:`, insertError);
          } else {
            console.log(`✅ Insertado saldo para cliente ${cliente.id}`);
          }
        }

      } catch (error) {
        console.error(`❌ Error procesando cliente ${cliente.id}:`, error);
      }
    }

    console.log('🎉 Recálculo completado para todos los clientes.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
recalculateClientBalances().then(() => {
  console.log('🏁 Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});