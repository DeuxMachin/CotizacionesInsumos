import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { AuditLogger } from './auditLogger'


type CotizacionInsert = Database['public']['Tables']['cotizaciones']['Insert']
type CotizacionUpdate = Database['public']['Tables']['cotizaciones']['Update']

export class CotizacionesService {
  // Obtener todas las cotizaciones con datos relacionados
  static async getAll() {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(id, nombre_razon_social, rut),
        obra:obras(id, nombre),
  creador:usuarios!vendedor_id(id, nombre, apellido)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Obtener cotización por ID
  static async getById(id: number) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(*),
        obra:obras(*),
  creador:usuarios!vendedor_id(id, nombre, apellido)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Crear nueva cotización
  static async create(cotizacion: CotizacionInsert, userInfo?: { id: string; email: string; name?: string }) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert(cotizacion)
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(id, nombre_razon_social, rut)
      `)
      .single()

    if (error) throw error

    // Actualizar dinero_cotizado en cliente_saldos
    if (data?.cliente_principal_id) {
      const clienteId = data.cliente_principal_id as number;
      const monto = (data.total_final ?? data.total_neto ?? 0) as number;
      console.log('🔄 Actualizando saldo para cotización:', { clienteId, monto, total_final: data.total_final, total_neto: data.total_neto });
      if (monto > 0) {
        // Obtener el saldo más reciente
        const { data: saldoActual } = await supabase
          .from('cliente_saldos')
          .select('id, dinero_cotizado')
          .eq('cliente_id', clienteId)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Saldo actual:', saldoActual);
        if (saldoActual) {
          const nuevoDineroCotizado = (saldoActual.dinero_cotizado || 0) + monto;
          console.log('Actualizando saldo existente:', { id: saldoActual.id, nuevoDineroCotizado });
          await supabase
            .from('cliente_saldos')
            .update({ dinero_cotizado: nuevoDineroCotizado })
            .eq('id', saldoActual.id);
        } else {
          console.log('Insertando nuevo saldo:', { clienteId, monto });
          await supabase
            .from('cliente_saldos')
            .insert({
              cliente_id: clienteId,
              snapshot_date: new Date().toISOString().split('T')[0],
              pagado: 0,
              pendiente: 0,
              vencido: 0,
              dinero_cotizado: monto
            });
        }
      } else {
        console.log('Monto es 0, no se actualiza saldo');
      }
    }

    // Registrar en audit log si se proporciona información del usuario
    if (userInfo && data) {
      const clienteInfo = data.cliente_principal ? {
        id: data.cliente_principal.id,
        nombre: data.cliente_principal.nombre_razon_social
      } : undefined

      await AuditLogger.logCotizacionCreated(
        userInfo.id,
        userInfo.email,
        data.id,
        data.folio || `#${data.id}`,
        clienteInfo
      )
    }

    return data
  }

  // Actualizar cotización
  static async update(id: number, cotizacion: CotizacionUpdate, userInfo?: { id: string; email: string; name?: string }) {
    // Obtener la cotización actual antes de actualizar para calcular cambios en saldos
    const { data: oldQuote, error: oldError } = await supabase
      .from('cotizaciones')
      .select('cliente_principal_id, total_final, total_neto, estado')
      .eq('id', id)
      .single();

    if (oldError) throw oldError;

    const { data, error } = await supabase
      .from('cotizaciones')
      .update(cotizacion)
      .eq('id', id)
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(id, nombre_razon_social, rut)
      `)
      .single()

    if (error) throw error

    // Ajustar dinero_cotizado si cambió el total y la cotización no está aceptada
    if (data && oldQuote && oldQuote.estado !== 'aceptada' && data.estado !== 'aceptada') {
      const oldTotal = oldQuote.total_final ?? oldQuote.total_neto ?? 0;
      const newTotal = data.total_final ?? data.total_neto ?? 0;
      const difference = newTotal - oldTotal;

      if (difference !== 0 && data.cliente_principal_id) {
        const { data: saldoActual } = await supabase
          .from('cliente_saldos')
          .select('id, dinero_cotizado')
          .eq('cliente_id', data.cliente_principal_id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (saldoActual) {
          const nuevoDineroCotizado = (saldoActual.dinero_cotizado || 0) + difference;
          await supabase
            .from('cliente_saldos')
            .update({ dinero_cotizado: Math.max(0, nuevoDineroCotizado) })
            .eq('id', saldoActual.id);
        } else if (newTotal > 0) {
          await supabase
            .from('cliente_saldos')
            .insert({
              cliente_id: data.cliente_principal_id,
              snapshot_date: new Date().toISOString().split('T')[0],
              pagado: 0,
              pendiente: 0,
              vencido: 0,
              dinero_cotizado: newTotal
            });
        }
      }
    }

    // Registrar en audit log si se proporciona información del usuario
    if (userInfo && data) {
      const clienteInfo = data.cliente_principal ? {
        id: data.cliente_principal.id,
        nombre: data.cliente_principal.nombre_razon_social
      } : undefined

      await AuditLogger.logEvent({
        usuario_id: userInfo.id,
        evento: 'cotizacion_actualizada',
        descripcion: `Actualizó cotización ${data.folio || `#${data.id}`}${clienteInfo ? ` para ${clienteInfo.nombre}` : ''}`,
        detalles: {
          cotizacion_id: data.id,
          folio: data.folio,
          cliente: clienteInfo,
          user_email: userInfo.email,
          cambios: cotizacion
        },
        tabla_afectada: 'cotizaciones',
        registro_id: data.id.toString()
      })
    }

    return data
  }

  // Cambiar estado de cotización
  static async updateStatus(
    id: number, 
    estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada',
    userInfo?: { id: string; email: string; name?: string }
  ) {
    // Primero obtener el estado actual
    const { data: currentData, error: currentError } = await supabase
      .from('cotizaciones')
      .select('estado, folio')
      .eq('id', id)
      .single()

    if (currentError) throw currentError

    const oldStatus = currentData.estado
    
    // Actualizar el estado
    const { data, error } = await supabase
      .from('cotizaciones')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Registrar en audit log si se proporciona información del usuario y el estado cambió
    if (userInfo && data && oldStatus !== estado) {
      await AuditLogger.logCotizacionStatusChanged(
        userInfo.id,
        userInfo.email,
        data.id,
        data.folio || `#${data.id}`,
        oldStatus,
        estado
      )
    }

    return data
  }

  // Obtener cotizaciones por cliente
  static async getByCliente(clienteId: number) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        obra:obras(id, nombre),
  creador:usuarios!vendedor_id(id, nombre, apellido)
      `)
      .eq('cliente_principal_id', clienteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Obtener cotizaciones por estado
  static async getByEstado(estado: string) {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cliente_principal:clientes!cliente_principal_id(id, nombre_razon_social, rut),
        obra:obras(id, nombre),
  creador:usuarios!vendedor_id(id, nombre, apellido)
      `)
      .eq('estado', estado)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Generar próximo folio
  static async generateFolio() {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('folio')
      .not('folio', 'is', null)
      .order('id', { ascending: false })
      .limit(1)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'COT-0001'
    }

    const lastFolio = data[0].folio
    if (!lastFolio) {
      return 'COT-0001'
    }

    // Extraer número del folio (formato: COT-XXXX)
    const match = lastFolio.match(/COT-(\d+)/)
    if (match) {
      const nextNumber = parseInt(match[1]) + 1
      return `COT-${nextNumber.toString().padStart(4, '0')}`
    }

    return 'COT-0001'
  }
}
