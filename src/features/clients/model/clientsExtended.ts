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
  cliente_saldos?: Array<{
    id: number
    snapshot_date: string
    pagado: number
    pendiente: number
    vencido: number
    dinero_cotizado?: number
  }>
  // Nuevos datos de contactos estructurados
  contactos?: {
    principal?: {
      nombre: string
      cargo?: string | null
      email?: string | null
      telefono?: string | null
      celular?: string | null
    }
    pago?: {
      nombre: string
      cargo?: string | null
      email?: string | null
      telefono?: string | null
      celular?: string | null
    }
    secundarios?: Array<{
      id: number
      nombre: string
      cargo?: string | null
      email?: string | null
      telefono?: string | null
      celular?: string | null
    }>
  }
}

// Adaptador: fila BD -> ClientExtended (proporciona defaults)
export function mapRowToClientExtended(row: ClienteRowWithType): ClientExtended {
  // Normalización de estado desde la BD (puede venir en mayúsculas, mixto o null)
  const rawStatus = (row.estado || 'vigente').toString().trim().toLowerCase();
  const allowed: ClientStatus[] = ['vigente','moroso','inactivo'];
  const statusNormalized: ClientStatus = (allowed as string[]).includes(rawStatus) ? rawStatus as ClientStatus : 'vigente';
  // Tomar el último snapshot de cliente_saldos si existe
  const saldos = Array.isArray(row.cliente_saldos) ? row.cliente_saldos : [];
  const latestSaldo = saldos
    .slice()
    .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())[0];
  
  
  const paid = latestSaldo?.pagado ?? 0;
  const pending = latestSaldo?.pendiente ?? 0;
  const overdue = latestSaldo?.vencido ?? 0;
  const partial = latestSaldo?.dinero_cotizado ?? 0;
  
  // Procesar contactos estructurados
  const contactosArray = Array.isArray(row.cliente_contactos) ? row.cliente_contactos : [];
  const contactoPrincipal = contactosArray.find(c => c.tipo === 'principal' && c.activo);
  const contactoPago = contactosArray.find(c => c.tipo === 'pago' && c.activo);
  const contactosSecundarios = contactosArray.filter(c => c.tipo === 'secundario' && c.activo);
  

  
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
    // Mantener compatibilidad con campos legacy usando el contacto principal si existe
    contactoNombre: contactoPrincipal?.nombre || row.contacto_pago || '',
    contactoEmail: contactoPrincipal?.email || row.email_pago || '',
    contactoTelefono: contactoPrincipal?.telefono || row.telefono_pago || '',
    status: statusNormalized,
    fantasyName: row.nombre_fantasia,
    business: row.giro,
    paymentResponsible: contactoPago?.nombre || row.contacto_pago,
    paymentPhone: contactoPago?.telefono || row.telefono_pago,
    credit: 0,
    additionalDays: 0,
    creditLine: row.linea_credito || 0,
    retention: 'NO',
    discount: row.descuento_cliente_pct || 0,
    email: contactoPrincipal?.email || row.email_pago,
    phone: row.telefono,
    mobile: contactoPrincipal?.celular || row.celular,
    contactName: contactoPrincipal?.nombre || row.contacto_pago,
    contactPhone: contactoPrincipal?.telefono || row.telefono_pago,
    paymentEmail: contactoPago?.email || row.email_pago,
    transferInfo: row.forma_pago,
    paid,
    pending,
    partial,
    overdue,
    clientType: row.cliente_tipos?.nombre || null,
    clientTypeId: row.cliente_tipos?.id || null,
    cliente_saldos: row.cliente_saldos,
    // Datos estructurados de contactos
    contactos: {
      principal: contactoPrincipal ? {
        nombre: contactoPrincipal.nombre,
        cargo: contactoPrincipal.cargo,
        email: contactoPrincipal.email,
        telefono: contactoPrincipal.telefono,
        celular: contactoPrincipal.celular
      } : undefined,
      pago: contactoPago ? {
        nombre: contactoPago.nombre,
        cargo: contactoPago.cargo,
        email: contactoPago.email,
        telefono: contactoPago.telefono,
        celular: contactoPago.celular
      } : undefined,
      secundarios: contactosSecundarios.map(c => ({
        id: c.id,
        nombre: c.nombre,
        cargo: c.cargo,
        email: c.email,
        telefono: c.telefono,
        celular: c.celular
      }))
    }
  }
}

// Nota: ya no exportamos un arreglo mock; los datos se obtienen mediante fetch a /api/clientes.
