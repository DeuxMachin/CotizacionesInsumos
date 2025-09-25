import type { Database } from '@/lib/supabase'
import type { Obra, EstadoObra, EtapaObra, ObraContacto } from '../types/obras'

export type ObrasRow = Database['public']['Tables']['obras']['Row']

type RelatedCliente = {
  id: number
  rut: string | null
  nombre_razon_social: string | null
  telefono: string | null
  celular: string | null
  email_pago: string | null
  direccion: string | null
  comuna: string | null
  ciudad: string | null
} | null

type RelatedVendedor = {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
} | null

type RelatedContacto = {
  id: number
  nombre: string | null
  cargo: string | null
  telefono: string | null
  email: string | null
  es_principal: boolean
}

type RelatedTipo = { id: number; nombre: string } | null

type RelatedTamano = { id: number; nombre: string } | null

type RelatedNotaVenta = { total: number } | null

export type SupabaseJoinedObra = {
  id: number
  nombre: string
  direccion: string | null
  comuna: string | null
  ciudad: string | null
  vendedor_id: string | null
  cliente_id: number | null
  tipo_obra_id: number | null
  tamano_obra_id: number | null
  estado?: string | null
  etapa_actual?: string | null
  descripcion?: string | null
  fecha_inicio?: string | null
  fecha_estimada_fin?: string | null
  fecha_ultimo_contacto?: string | null
  valor_estimado?: number | null
  material_vendido?: number | null
  pendiente?: number | null
  proximo_seguimiento?: string | null
  notas?: string | null
  created_at?: string | null
  updated_at?: string | null
  cliente?: RelatedCliente
  vendedor?: RelatedVendedor
  contactos?: RelatedContacto[] | null
  tipo?: RelatedTipo
  tamano?: RelatedTamano
  notas_venta?: RelatedNotaVenta[] | null
}

function safeDate(value?: string | null, fallback?: Date): Date | undefined {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

const ESTADOS_VALIDOS: EstadoObra[] = ['planificacion', 'activa', 'pausada', 'finalizada', 'cancelada', 'sin_contacto']
const ETAPAS_VALIDAS: EtapaObra[] = ['fundacion', 'estructura', 'albanileria', 'instalaciones', 'terminaciones', 'entrega']

export function normalizarEstado(value?: string | null): EstadoObra {
  const v = (value || '').toLowerCase()
  return (ESTADOS_VALIDOS as string[]).includes(v) ? (v as EstadoObra) : 'planificacion'
}

export function normalizarEtapa(value?: string | null): EtapaObra {
  const v = (value || '').toLowerCase()
  return (ETAPAS_VALIDAS as string[]).includes(v) ? (v as EtapaObra) : 'fundacion'
}

export function mapSupabaseObra(row: SupabaseJoinedObra): Obra {
  const contactos = (row.contactos || []).map((contacto) => ({
    nombre: contacto.nombre || 'No registrado',
    cargo: contacto.cargo || 'Sin cargo',
    telefono: contacto.telefono || '',
    email: contacto.email || undefined,
    es_principal: !!contacto.es_principal
  })) as ObraContacto[]

  const principal = contactos.find((c) => c.es_principal) || contactos[0]
  const cliente = row.cliente
  const vendedor = row.vendedor
  const nombreVendedor = [vendedor?.nombre, vendedor?.apellido].filter(Boolean).join(' ') || vendedor?.email || ''

  const direccionPartes = [row.direccion, row.comuna, row.ciudad].filter(Boolean)

  const fechaInicio = safeDate(row.fecha_inicio, safeDate(row.created_at, new Date())) || new Date()
  const fechaUltimoContacto = safeDate(row.fecha_ultimo_contacto, fechaInicio) || fechaInicio

  const materialVendido = (row.notas_venta || []).reduce((acc, nota) => acc + (nota?.total || 0), 0)

  return {
    id: String(row.id),
    nombreEmpresa: row.nombre,
    constructora: {
      nombre: cliente?.nombre_razon_social || 'Sin nombre',
      rut: cliente?.rut || '',
      telefono: cliente?.telefono || cliente?.celular || '',
      email: cliente?.email_pago || undefined,
      direccion: cliente?.direccion || undefined,
      contactoPrincipal: {
        nombre: principal?.nombre || 'No registrado',
        cargo: principal?.cargo || 'Sin cargo',
        telefono: principal?.telefono || '',
        email: principal?.email,
      },
    },
    vendedorAsignado: row.vendedor_id || '',
    nombreVendedor,
    contactos,
    estado: normalizarEstado(row.estado),
    etapaActual: normalizarEtapa(row.etapa_actual),
    etapasCompletadas: [],
    descripcion: row.descripcion || undefined,
    direccionObra: direccionPartes.join(', '),
    comuna: row.comuna || undefined,
    ciudad: row.ciudad || undefined,
    fechaInicio,
    fechaEstimadaFin: safeDate(row.fecha_estimada_fin),
    fechaUltimoContacto,
    valorEstimado: row.valor_estimado ?? undefined,
    materialVendido,
    pendiente: row.pendiente ?? 0,
    proximoSeguimiento: safeDate(row.proximo_seguimiento),
    fechaCreacion: safeDate(row.created_at, new Date()) || new Date(),
    fechaActualizacion: safeDate(row.updated_at, new Date()) || new Date(),
    notas: row.notas || undefined,
    clienteId: row.cliente_id ?? undefined,
    tipoObraId: row.tipo_obra_id ?? undefined,
    tamanoObraId: row.tamano_obra_id ?? undefined,
  }
}
