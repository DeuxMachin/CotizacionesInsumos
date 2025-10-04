import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
import { AuditLogger } from './auditLogger'
import { ClienteContactosService } from './clienteContactosService'
import type { ClienteContactoInsert } from '../types/ClienteContacto'


type ClienteInsert = Database['public']['Tables']['clientes']['Insert']
type ClienteUpdate = Database['public']['Tables']['clientes']['Update']

// Tipos extendidos para incluir contactos
export interface ClienteConContactosInsert extends ClienteInsert {
  contactos?: ClienteContactoInsert[];
}

export interface ClienteConContactosUpdate extends ClienteUpdate {
  contactos?: ClienteContactoInsert[];
}

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
        ),
        cliente_contactos:cliente_contactos!cliente_contactos_cliente_id_fkey (
          id, tipo, nombre, cargo, email, telefono, celular, es_principal, activo
        )
      `)
      // Orden raíz
      .order('nombre_razon_social')
      // Orden anidado en tablas relacionadas
      .order('snapshot_date', { foreignTable: 'cliente_saldos', ascending: false })
      .order('es_principal', { foreignTable: 'cliente_contactos', ascending: false })

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
        ),
        cliente_contactos:cliente_contactos!cliente_contactos_cliente_id_fkey (
          id, tipo, nombre, cargo, email, telefono, celular, es_principal, activo, created_at
        )
      `)
      .eq('id', id)
      // Orden anidado en tablas relacionadas
      .order('snapshot_date', { foreignTable: 'cliente_saldos', ascending: false })
      .order('es_principal', { foreignTable: 'cliente_contactos', ascending: false })
      .order('created_at', { foreignTable: 'cliente_contactos', ascending: true })
      .single()

    if (error) throw error
    return data
  }

  // Buscar clientes por término
  static async search(searchTerm: string) {
    // Normalizar el término de búsqueda para RUT (eliminar puntos, guiones y espacios)
    const normalizedSearchTerm = searchTerm.replace(/[.\-\s]/g, '');

    // Si el término parece ser un RUT (solo números después de normalizar)
    if (/^\d+$/.test(normalizedSearchTerm)) {
      // Para RUTs, usar una consulta SQL directa que normalice el RUT
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
        .or(`replace(replace(replace(rut, '.', ''), '-', ''), ' ', '')::text.ilike.%${normalizedSearchTerm}%`)
        .order('nombre_razon_social');

      if (error) {
        console.error('Error en búsqueda de RUT:', error);
        // Fallback: búsqueda simple
        const { data: fallbackData, error: fallbackError } = await supabase
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
          .ilike('rut', `%${normalizedSearchTerm}%`)
          .order('nombre_razon_social');

        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      return data;
    } else {
      // Búsqueda normal por nombre/razón social y nombre fantasia
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
        .or(`nombre_razon_social.ilike.%${searchTerm}%,nombre_fantasia.ilike.%${searchTerm}%`)
        .order('nombre_razon_social');

      if (error) throw error;
      return data;
    }
  }

  // Crear nuevo cliente
  static async create(clienteData: ClienteConContactosInsert, userInfo?: { id: string; email: string; name?: string }) {
    console.log('🔍 ClientesService.create - userInfo:', userInfo)
    console.log('🔍 ClientesService.create - clienteData:', clienteData)
    
    // Extraer contactos del objeto
    const { contactos, ...cliente } = clienteData;
    
    const { data, error } = await supabase.from('clientes')
      .insert(cliente)
      .select()
      .single()

    if (error) throw error

    console.log('🔍 ClientesService.create - Cliente creado:', data)

    // Crear contactos si se proporcionaron
    if (contactos && contactos.length > 0 && data) {
      console.log('🔍 ClientesService.create - Intentando crear contactos:', contactos.length)
      console.log('🔍 ClientesService.create - Contactos recibidos:', JSON.stringify(contactos, null, 2))
      
      // Agregar el cliente_id a cada contacto
      const contactosConClienteId = contactos.map(contacto => ({
        ...contacto,
        cliente_id: data.id
      }));
      
      console.log('🔍 ClientesService.create - Contactos con cliente_id:', JSON.stringify(contactosConClienteId, null, 2))
      
      try {
        const contactosCreados = await ClienteContactosService.createMultiple(contactosConClienteId);
        console.log('✅ ClientesService.create - Contactos creados exitosamente:', contactosCreados.length)
        console.log('✅ ClientesService.create - Detalles de contactos creados:', JSON.stringify(contactosCreados, null, 2))
      } catch (contactError) {
        console.error('❌ ClientesService.create - Error creando contactos:', contactError)
        console.error('❌ ClientesService.create - Error details:', JSON.stringify(contactError, null, 2))
        // Re-lanzar el error para que la creación del cliente falle si los contactos fallan
        throw new Error(`Error al crear contactos: ${contactError instanceof Error ? contactError.message : String(contactError)}`);
      }
    } else {
      console.log('⚠️ ClientesService.create - No se crearon contactos:', {
        tieneContactos: !!contactos,
        cantidadContactos: contactos?.length || 0,
        clienteCreado: !!data
      })
    }

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
  static async update(id: number, clienteData: ClienteConContactosUpdate, userInfo?: { id: string; email: string; name?: string }) {
    // Obtener información del cliente antes de actualizarlo para el audit log
    let clienteAntes: { id: number; nombre_razon_social: string; rut: string; nombre_fantasia?: string; direccion?: string } | null = null;
    try {
      const { data: clienteData, error: clienteError } = await supabase.from('clientes')
        .select('id, nombre_razon_social, rut, nombre_fantasia, telefono, direccion')
        .eq('id', id)
        .single();
      
      if (!clienteError && clienteData) {
        clienteAntes = clienteData;
      }
    } catch (err) {
      console.warn('Error obteniendo cliente para audit log:', err);
    }

    // Extraer contactos del objeto
    const { contactos, ...cliente } = clienteData;

    const { data, error } = await supabase.from('clientes')
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

    // Actualizar contactos si se proporcionaron
    if (contactos && data) {
      console.log('🔍 ClientesService.update - Actualizando contactos:', contactos.length)
      
      try {
        // Reemplazar todos los contactos
        await ClienteContactosService.replaceAll(id, contactos);
        console.log('🔍 ClientesService.update - Contactos actualizados exitosamente')
      } catch (contactError) {
        console.error('🔍 ClientesService.update - Error actualizando contactos:', contactError)
        // No fallamos la operación si los contactos fallan
      }
    }

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
      const { data: clienteData, error: clienteError } = await supabase.from('clientes')
        .select('id, nombre_razon_social, rut')
        .eq('id', id)
        .single();
      
      if (!clienteError) {
        clienteAntes = clienteData;
      }
    } catch (err) {
      console.warn('No se pudo obtener información del cliente para audit log:', err);
    }
    
    const { data, error } = await supabase.from('clientes')
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
    // Normalizar el RUT (eliminar puntos, guiones y espacios)
    const normalizedRut = rut.replace(/[.\-\s]/g, '');
    
    let query = supabase.from('clientes')
      .select('id, rut')

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Buscar coincidencia normalizando todos los RUTs de la base de datos
    const rutExists = data?.some((cliente: { id: number; rut: string }) => 
      cliente.rut.replace(/[.\-\s]/g, '') === normalizedRut
    ) ?? false;
    
    return rutExists
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
