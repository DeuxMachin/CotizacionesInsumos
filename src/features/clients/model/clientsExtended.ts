import type { ClienteRowWithType } from './clients'

export type ClientStatus = 'vigente' | 'moroso' | 'inactivo'

// Modelo extendido (para estadísticas y campos adicionales calculados/client-side)
export interface ClientExtended {
  id: number
  rut: string
  razonSocial: string
  giro: string | null
  direccion: string | null
  region: string
  ciudad: string | null
  comuna: string | null
  tipoEmpresa: string
  contactoNombre: string
  contactoEmail: string
  contactoTelefono: string
  status: ClientStatus
  fantasyName?: string | null
  business?: string | null
  paymentResponsible?: string | null
  paymentPhone?: string | null
  credit: number
  additionalDays: number
  creditLine: number
  retention: 'SI' | 'NO'
  discount: number
  email?: string | null
  phone?: string | null
  mobile?: string | null
  contactName?: string | null
  contactPhone?: string | null
  paymentEmail?: string | null
  transferInfo?: string | null
  paid: number
  pending: number
  partial: number
  overdue: number
  clientType?: string | null
  clientTypeId?: number | null
}

// Adaptador: fila BD -> ClientExtended (proporciona defaults)
export function mapRowToClientExtended(row: ClienteRowWithType): ClientExtended {
  // Normalización de estado desde la BD (puede venir en mayúsculas, mixto o null)
  const rawStatus = (row.estado || 'vigente').toString().trim().toLowerCase();
  const allowed: ClientStatus[] = ['vigente','moroso','inactivo'];
  const statusNormalized: ClientStatus = (allowed as string[]).includes(rawStatus) ? rawStatus as ClientStatus : 'vigente';
  return {
    id: row.id,
    rut: row.rut,
    razonSocial: row.nombre_razon_social,
    giro: row.giro,
    direccion: row.direccion,
    region: row.ciudad || '',
    ciudad: row.ciudad,
    comuna: row.comuna,
    tipoEmpresa: row.tipo === 'persona' ? 'Persona' : 'Empresa',
    contactoNombre: row.contacto_pago || '',
    contactoEmail: row.email_pago || '',
    contactoTelefono: row.telefono_pago || '',
    status: statusNormalized,
    fantasyName: row.nombre_fantasia,
    business: row.giro,
    paymentResponsible: row.contacto_pago,
    paymentPhone: row.telefono_pago,
    credit: 0,
    additionalDays: 0,
    creditLine: row.linea_credito || 0,
    retention: 'NO',
    discount: row.descuento_cliente_pct || 0,
    email: row.email_pago,
    phone: row.telefono,
    mobile: row.celular,
    contactName: row.contacto_pago,
    contactPhone: row.telefono_pago,
    paymentEmail: row.email_pago,
    transferInfo: row.forma_pago,
    paid: 0,
    pending: 0,
    partial: 0,
    overdue: 0,
    clientType: row.cliente_tipos?.nombre || null,
    clientTypeId: row.cliente_tipos?.id || null
  }
}

// Nota: ya no exportamos un arreglo mock; los datos se obtienen mediante fetch a /api/clientes.
