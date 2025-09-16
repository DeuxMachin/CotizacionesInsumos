import { supabase } from '@/lib/supabase'

export interface AuditLogEntry {
  id?: number
  usuario_id: string
  evento: string
  descripcion: string | null
  detalles?: Record<string, any> | null
  tabla_afectada?: string | null
  registro_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export class AuditLogger {
  
  /**
   * Registra un evento en el audit log
   */
  static async logEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'> & { created_at?: string }): Promise<void> {
    try {
      console.log('🔍 AuditLogger: Intentando insertar evento:', entry.evento)
      
      const { data, error } = await supabase
        .from('audit_log')
        .insert({
          ...entry,
          created_at: entry.created_at || new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('❌ AuditLogger: Error inserting audit event:', error)
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        // No lanzar error para evitar interrumpir la operación principal
      } else {
        console.log('✅ AuditLogger: Evento insertado exitosamente:', data)
      }
    } catch (error) {
      console.error('❌ AuditLogger: Unexpected error logging audit event:', error)
    }
  }

  /**
   * Registra login de usuario
   */
  static async logUserLogin(userId: string, userEmail: string, userAgent?: string): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'user_login',
      descripcion: `Usuario ${userEmail} inició sesión`,
      detalles: {
        email: userEmail,
        timestamp: new Date().toISOString()
      },
      user_agent: userAgent
    })
  }

  /**
   * Registra logout de usuario
   */
  static async logUserLogout(userId: string, userEmail: string): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'user_logout',
      descripcion: `Usuario ${userEmail} cerró sesión`,
      detalles: {
        email: userEmail
      }
    })
  }

  /**
   * Registra creación de cotización
   */
  static async logCotizacionCreated(
    userId: string, 
    userEmail: string,
    cotizacionId: number,
    folio: string,
    clienteInfo?: { id: number; nombre: string }
  ): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'cotizacion_creada',
      descripcion: `Creó cotización ${folio}${clienteInfo ? ` para ${clienteInfo.nombre}` : ''}`,
      detalles: {
        cotizacion_id: cotizacionId,
        folio,
        cliente: clienteInfo ? { id: clienteInfo.id, nombre: clienteInfo.nombre } : undefined,
        user_email: userEmail
      },
      tabla_afectada: 'cotizaciones',
      registro_id: cotizacionId.toString()
    })
  }

  /**
   * Registra cambio de estado de cotización
   */
  static async logCotizacionStatusChanged(
    userId: string,
    userEmail: string,
    cotizacionId: number,
    folio: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'cotizacion_actualizada',
      descripcion: `Cambió estado de cotización ${folio} de "${oldStatus}" a "${newStatus}"`,
      detalles: {
        cotizacion_id: cotizacionId,
        folio,
        estado_anterior: oldStatus,
        estado_nuevo: newStatus,
        user_email: userEmail
      },
      tabla_afectada: 'cotizaciones',
      registro_id: cotizacionId.toString()
    })
  }

  /**
   * Registra creación de cliente
   */
  static async logClienteCreated(
    userId: string,
    userEmail: string,
    clienteId: number,
    clienteNombre: string,
    rut: string
  ): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'cliente_creado',
      descripcion: `Creó cliente ${clienteNombre} (${rut})`,
      detalles: {
        cliente_id: clienteId,
        nombre: clienteNombre,
        rut,
        user_email: userEmail
      },
      tabla_afectada: 'clientes',
      registro_id: clienteId.toString()
    })
  }

  /**
   * Registra creación de obra
   */
  static async logObraCreated(
    userId: string,
    obraNombre: string,
    clienteNombre?: string
  ): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'obra_creada',
      descripcion: `Creó obra "${obraNombre}"${clienteNombre ? ` para ${clienteNombre}` : ''}`,
      detalles: {
        nombre: obraNombre,
        cliente: clienteNombre
      }
    })
  }

  /**
   * Registra creación de nota de venta
   */
  static async logNotaVentaCreated(
    userId: string,
    folio: string,
    total: number,
    clienteNombre?: string
  ): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'nota_venta_creada',
      descripcion: `Creó nota de venta ${folio} por $${total.toLocaleString('es-CL')}${clienteNombre ? ` para ${clienteNombre}` : ''}`,
      detalles: {
        folio,
        total,
        cliente: clienteNombre
      }
    })
  }

  /**
   * Registra creación de target
   */
  static async logTargetCreated(
    userId: string,
    titulo: string
  ): Promise<void> {
    await this.logEvent({
      usuario_id: userId,
      evento: 'target_creado',
      descripcion: `Creó target "${titulo}"`,
      detalles: {
        titulo
      }
    })
  }

  /**
   * Obtiene los eventos recientes del audit log
   */
  static async getRecentActivity(limit: number = 20): Promise<AuditLogEntry[]> {
    try {
      console.log('🔍 AuditLogger: Obteniendo actividad reciente, límite:', limit)
      
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ AuditLogger: Error fetching audit log:', error)
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return []
      }

      console.log('✅ AuditLogger: Datos obtenidos exitosamente:', data?.length || 0, 'registros')
      return data || []
    } catch (error) {
      console.error('❌ AuditLogger: Unexpected error fetching audit log:', error)
      return []
    }
  }

  /**
   * Obtiene actividad por usuario
   */
  static async getActivityByUser(userId: string, limit: number = 10): Promise<AuditLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user activity:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Unexpected error fetching user activity:', error)
      return []
    }
  }

  /**
   * Obtiene actividad por tipo de evento
   */
  static async getActivityByType(eventType: string, limit: number = 10): Promise<AuditLogEntry[]> {
    try {
      console.log('🔍 AuditLogger: Obteniendo actividad por tipo:', eventType, 'límite:', limit)
      
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('evento', eventType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ AuditLogger: Error fetching activity by type:', error)
        return []
      }

      console.log('✅ AuditLogger: Actividad por tipo obtenida:', data?.length || 0, 'registros')
      return data || []
    } catch (error) {
      console.error('❌ AuditLogger: Unexpected error fetching activity by type:', error)
      return []
    }
  }

  /**
   * Obtiene actividad por usuario y tipo de evento
   */
  static async getActivityByUserAndType(userId: string, eventType: string, limit: number = 10): Promise<AuditLogEntry[]> {
    try {
      console.log('🔍 AuditLogger: Obteniendo actividad por usuario y tipo:', { userId, eventType, limit })
      
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('usuario_id', userId)
        .eq('evento', eventType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ AuditLogger: Error fetching activity by user and type:', error)
        return []
      }

      console.log('✅ AuditLogger: Actividad por usuario y tipo obtenida:', data?.length || 0, 'registros')
      return data || []
    } catch (error) {
      console.error('❌ AuditLogger: Unexpected error fetching activity by user and type:', error)
      return []
    }
  }
}
