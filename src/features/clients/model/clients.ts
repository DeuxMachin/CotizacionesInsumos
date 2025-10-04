// Tipos relacionados con clientes ahora basados en la BD (ver Database en lib/supabase)
import type { Database } from '@/lib/supabase'

export type ClienteRow = Database['public']['Tables']['clientes']['Row']

// Tipo extendido para incluir la relación con cliente_tipos
export type ClienteRowWithType = ClienteRow & {
  cliente_tipos?: {
    id: number
    nombre: string
    descripcion?: string | null
  } | null,
  cliente_saldos?: Array<{
    id: number
    snapshot_date: string
    pagado: number
    pendiente: number
    vencido: number
    dinero_cotizado?: number
  }>,
  cliente_contactos?: Array<{
    id: number
    tipo: 'principal' | 'pago' | 'secundario' | 'otro'
    nombre: string
    cargo?: string | null
    email?: string | null
    telefono?: string | null
    celular?: string | null
    es_principal: boolean
    activo: boolean
  }>
}

// Tipo simplificado usado previamente en el front. Lo mantenemos para evitar romper componentes.
export interface Client {
  id: number
  rut: string
  razonSocial: string
  giro: string | null
  direccion: string | null
  region: string // No existe en tabla: se infiere (usamos ciudad como fallback)
  ciudad: string | null
  comuna: string | null
  tipoEmpresa: string
  contactoNombre: string
  contactoEmail: string
  contactoTelefono: string
}

// Utilidad para mapear una fila de BD al tipo Client (básico)
export function mapClienteRowToClient(row: ClienteRowWithType): Client {
  // Función helper para obtener información de contacto con fallback
  const getContactInfo = () => {
    // Buscar contacto principal activo
    const contactoPrincipal = row.cliente_contactos?.find(c => c.tipo === 'principal' && c.activo);
    
    // Si hay contacto principal, usarlo
    if (contactoPrincipal) {
      return {
        nombre: contactoPrincipal.nombre,
        email: contactoPrincipal.email || '',
        telefono: contactoPrincipal.telefono || ''
      };
    }
    
    // Si no hay contacto principal, buscar responsable de pagos activo
    const responsablePagos = row.cliente_contactos?.find(c => c.tipo === 'pago' && c.activo);
    
    if (responsablePagos) {
      return {
        nombre: responsablePagos.nombre,
        email: responsablePagos.email || '',
        telefono: responsablePagos.telefono || ''
      };
    }
    
    // Fallback a campos legacy
    return {
      nombre: row.contacto_pago || '',
      email: row.email_pago || '',
      telefono: row.telefono_pago || ''
    };
  };

  const contactInfo = getContactInfo();

  return {
    id: row.id,
    rut: row.rut,
    razonSocial: row.nombre_razon_social,
    giro: row.giro,
    direccion: row.direccion,
    region: row.ciudad || '', // Asunción: no tenemos región en la tabla
    ciudad: row.ciudad,
    comuna: row.comuna,
    tipoEmpresa: row.tipo === 'persona' ? 'Persona' : 'Empresa',
    contactoNombre: contactInfo.nombre,
    contactoEmail: contactInfo.email,
    contactoTelefono: contactInfo.telefono
  }
}

// Nota: Las funciones de búsqueda y colecciones mock se eliminaron porque ahora los datos provienen de Supabase.
