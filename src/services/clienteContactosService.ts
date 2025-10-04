import { supabaseAdmin } from '../lib/supabaseAdmin';
import type { ClienteContacto, ClienteContactoInsert, ClienteContactoUpdate } from '../types/ClienteContacto';

/**
 * Servicio para gestionar los contactos de clientes
 */
export class ClienteContactosService {
  /**
   * Obtener todos los contactos de un cliente
   */
  static async getByClienteId(clienteId: number): Promise<ClienteContacto[]> {
    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .order('es_principal', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtener el contacto principal de un cliente
   */
  static async getContactoPrincipal(clienteId: number): Promise<ClienteContacto | null> {
    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'principal')
      .eq('es_principal', true)
      .eq('activo', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  /**
   * Obtener el responsable de pago de un cliente
   */
  static async getResponsablePago(clienteId: number): Promise<ClienteContacto | null> {
    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'pago')
      .eq('activo', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Obtener contactos secundarios de un cliente
   */
  static async getContactosSecundarios(clienteId: number): Promise<ClienteContacto[]> {
    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'secundario')
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crear un nuevo contacto
   */
  static async create(contacto: ClienteContactoInsert): Promise<ClienteContacto> {
    if (!contacto.cliente_id) {
      throw new Error('cliente_id es requerido para crear un contacto');
    }

    // Si el contacto es principal, desactivar otros contactos principales
    if (contacto.es_principal) {
      await this.desactivarContactoPrincipal(contacto.cliente_id);
    }

    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .insert(contacto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crear múltiples contactos de una vez (útil al crear un cliente)
   */
  static async createMultiple(contactos: ClienteContactoInsert[]): Promise<ClienteContacto[]> {
    console.log('🔍 ClienteContactosService.createMultiple - Iniciando con:', contactos.length, 'contactos')
    console.log('🔍 ClienteContactosService.createMultiple - Contactos:', JSON.stringify(contactos, null, 2))
    
    if (contactos.length === 0) {
      console.log('⚠️ ClienteContactosService.createMultiple - Array de contactos vacío, retornando')
      return [];
    }

    // Verificar que solo haya un contacto principal
    const principalCount = contactos.filter(c => c.es_principal).length;
    console.log('🔍 ClienteContactosService.createMultiple - Contactos principales encontrados:', principalCount)
    
    if (principalCount > 1) {
      console.error('❌ ClienteContactosService.createMultiple - Más de un contacto principal')
      throw new Error('Solo puede haber un contacto principal');
    }

    // Asegurar que todos los contactos tengan cliente_id
    const missingCliente = contactos.some(c => !c.cliente_id);
    if (missingCliente) {
      console.error('❌ ClienteContactosService.createMultiple - Algunos contactos no tienen cliente_id')
      console.error('❌ Contactos sin cliente_id:', contactos.filter(c => !c.cliente_id))
      throw new Error('Todos los contactos deben incluir cliente_id');
    }

    console.log('🔍 ClienteContactosService.createMultiple - Insertando en base de datos...')
    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .insert(contactos)
      .select();

    if (error) {
      console.error('❌ ClienteContactosService.createMultiple - Error de Supabase:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      console.error('❌ Error details:', error.details)
      throw error;
    }
    
    console.log('✅ ClienteContactosService.createMultiple - Contactos insertados exitosamente:', data?.length || 0)
    console.log('✅ ClienteContactosService.createMultiple - Datos retornados:', JSON.stringify(data, null, 2))
    
    return data || [];
  }

  /**
   * Actualizar un contacto
   */
  static async update(
    id: number, 
    contacto: ClienteContactoUpdate
  ): Promise<ClienteContacto> {
    // Si se está marcando como principal, desactivar otros principales
    if (contacto.es_principal) {
      const { data: contactoActual } = await supabaseAdmin.from('cliente_contactos')
        .select('cliente_id')
        .eq('id', id)
        .single();

      if (contactoActual) {
        const { cliente_id } = contactoActual as { cliente_id: number };
        await this.desactivarContactoPrincipal(cliente_id, id);
      }
    }

    const { data, error } = await supabaseAdmin.from('cliente_contactos')
      .update(contacto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Desactivar (soft delete) un contacto
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabaseAdmin.from('cliente_contactos')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Eliminar permanentemente un contacto
   */
  static async hardDelete(id: number): Promise<void> {
    const { error } = await supabaseAdmin.from('cliente_contactos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Desactivar el contacto principal actual de un cliente
   * @param clienteId ID del cliente
   * @param exceptId ID del contacto a excluir (opcional)
   */
  private static async desactivarContactoPrincipal(
    clienteId: number, 
    exceptId?: number
  ): Promise<void> {
    let query = supabaseAdmin.from('cliente_contactos')
      .update({ es_principal: false })
      .eq('cliente_id', clienteId)
      .eq('es_principal', true);

    if (exceptId) {
      query = query.neq('id', exceptId);
    }

    const { error } = await query;
    if (error) throw error;
  }

  /**
   * Actualizar todos los contactos de un cliente (reemplazar)
   */
  static async replaceAll(
    clienteId: number, 
    contactos: ClienteContactoInsert[]
  ): Promise<ClienteContacto[]> {
    // Desactivar todos los contactos actuales
    await supabaseAdmin.from('cliente_contactos')
      .update({ activo: false })
      .eq('cliente_id', clienteId);

    // Crear los nuevos contactos
    if (contactos.length === 0) return [];

    // Asegurar que todos los nuevos contactos tengan el cliente_id correcto
    const contactosConCliente = contactos.map(c => ({ ...c, cliente_id: c.cliente_id ?? clienteId }));
    return this.createMultiple(contactosConCliente);
  }
}
