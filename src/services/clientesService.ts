import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { AuditLogger } from './auditLogger'


type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

export class ClientesService {
  // Obtener todos los clientes
  static async getAll() {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        ),
        cliente_saldos:cliente_saldos!cliente_saldos_cliente_id_fkey (
          id, snapshot_date, pagado, pendiente, vencido, dinero_cotizado
        ).order(snapshot_date.desc)
      `)
      .order('nombre_razon_social')

    if (error) throw error
    return data
  }

  // Obtener cliente por ID
  static async getById(id: number) {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        ),
        cliente_saldos:cliente_saldos!cliente_saldos_cliente_id_fkey (
          id, snapshot_date, pagado, pendiente, vencido, dinero_cotizado
        ).order(snapshot_date.desc)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Buscar clientes por término
  static async search(searchTerm: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        ),
        cliente_saldos:cliente_saldos!cliente_saldos_cliente_id_fkey (
          id, snapshot_date, pagado, pendiente, vencido, dinero_cotizado
        )
      `)
      .or(`nombre_razon_social.ilike.%${searchTerm}%,nombre_fantasia.ilike.%${searchTerm}%,rut.ilike.%${searchTerm}%`)
      .order('nombre_razon_social')

    if (error) throw error
    return data
  }

  // Crear nuevo cliente
  static async create(cliente: ClienteInsert, userInfo?: { id: string; email: string; name?: string }) {
    console.log('🔍 ClientesService.create - userInfo:', userInfo)
    
    const { data, error } = await supabase
      .from('clientes')
      .insert(cliente)
      .select()
      .single()

    if (error) throw error

    console.log('🔍 ClientesService.create - Cliente creado:', data)

    // Registrar en audit log si se proporciona información del usuario
    if (userInfo && data) {
      console.log('🔍 ClientesService.create - Registrando audit log...')
      await AuditLogger.logClienteCreated(
        userInfo.id,
        userInfo.email,
        data.id,
        data.nombre_razon_social,
        data.rut,
        userInfo.name
      )
      console.log('🔍 ClientesService.create - Audit log registrado')
    } else {
      console.log('🔍 ClientesService.create - NO se registra audit log', { userInfo: !!userInfo, data: !!data })
    }

    return data
  }

  // Actualizar cliente
  static async update(id: number, cliente: ClienteUpdate, userInfo?: { id: string; email: string; name?: string }) {
    // Obtener información del cliente antes de actualizarlo para el audit log
    let clienteAntes: { id: number; nombre_razon_social: string; rut: string; nombre_fantasia?: string; direccion?: string } | null = null;
    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nombre_razon_social, rut, nombre_fantasia, telefono, direccion')
        .eq('id', id)
        .single();
      
      if (!clienteError && clienteData) {
        clienteAntes = clienteData;
      }
    } catch (err) {
      console.warn('Error obteniendo cliente para audit log:', err);
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(cliente)
      .eq('id', id)
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre
        )
      `)
      .single()

    if (error) throw error

    // Registrar en audit log si se proporciona información del usuario
    if (userInfo && data && clienteAntes) {
      // Detectar cambios principales
      const cambios: Record<string, { anterior: unknown; nuevo: unknown }> = {};
      
      if (cliente.nombre_razon_social && cliente.nombre_razon_social !== clienteAntes.nombre_razon_social) {
        cambios.nombre = { anterior: clienteAntes.nombre_razon_social, nuevo: cliente.nombre_razon_social };
      }
      if (cliente.nombre_fantasia !== undefined && cliente.nombre_fantasia !== clienteAntes.nombre_fantasia) {
        cambios.nombre_fantasia = { anterior: clienteAntes.nombre_fantasia, nuevo: cliente.nombre_fantasia };
      }
      if (cliente.direccion && cliente.direccion !== clienteAntes.direccion) {
        cambios.direccion = { anterior: clienteAntes.direccion, nuevo: cliente.direccion };
      }

      await AuditLogger.logClienteUpdated(
        userInfo.id,
        userInfo.email,
        data.id,
        data.nombre_razon_social || clienteAntes.nombre_razon_social,
        data.rut || clienteAntes.rut,
        Object.keys(cambios).length > 0 ? cambios : undefined,
        userInfo.name
      )
    }

    return data
  }

  // Eliminar cliente (cambiar estado)
  static async delete(id: number, userInfo?: { id: string; email: string; name?: string }) {
    // Obtener información del cliente antes de eliminarlo para el audit log
    let clienteAntes: { id: number; nombre_razon_social: string; rut: string } | null = null;
    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nombre_razon_social, rut')
        .eq('id', id)
        .single();
      
      if (!clienteError) {
        clienteAntes = clienteData;
      }
    } catch (err) {
      console.warn('No se pudo obtener información del cliente para audit log:', err);
    }
    
    const { data, error } = await supabase
      .from('clientes')
      .update({ estado: 'inactivo' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Registrar en audit log si se proporciona información del usuario
    if (userInfo && data && clienteAntes) {
      await AuditLogger.logClienteDeleted(
        userInfo.id,
        userInfo.email,
        data.id,
        clienteAntes.nombre_razon_social,
        clienteAntes.rut,
        userInfo.name
      )
    }

    return data
  }

  // Verificar si RUT ya existe
  static async checkRutExists(rut: string, excludeId?: number) {
    let query = supabase
      .from('clientes')
      .select('id')
      .eq('rut', rut)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data.length > 0
  }

  // Obtener todos los tipos de cliente
  static async getClientTypes() {
    const { data, error } = await supabase
      .from('cliente_tipos')
      .select('*')
      .order('nombre')

    if (error) throw error
    return data
  }
}
