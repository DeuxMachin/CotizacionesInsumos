// Tipos relacionados con clientes ahora basados en la BD (ver Database en lib/supabase)
import type { Database } from '@/lib/supabase'

export type ClienteRow = Database['public']['Tables']['clientes']['Row']

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
export function mapClienteRowToClient(row: ClienteRow): Client {
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
    contactoNombre: row.contacto_pago || '',
    contactoEmail: row.email_pago || '',
    contactoTelefono: row.telefono_pago || ''
  }
}

// Nota: Las funciones de búsqueda y colecciones mock se eliminaron porque ahora los datos provienen de Supabase.
