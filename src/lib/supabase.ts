import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para la base de datos (basados en tu esquema)
export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          email: string
          nombre: string | null
          apellido: string | null
          rol: 'admin' | 'vendedor' | 'cliente'
          activo: boolean
          created_at: string
          password_hash: string
          last_login_at: string | null
          password_updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          nombre?: string | null
          apellido?: string | null
          rol?: 'admin' | 'vendedor' | 'cliente'
          activo?: boolean
          created_at?: string
          password_hash: string
          last_login_at?: string | null
          password_updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          nombre?: string | null
          apellido?: string | null
          rol?: 'admin' | 'vendedor' | 'cliente'
          activo?: boolean
          created_at?: string
          password_hash?: string
          last_login_at?: string | null
          password_updated_at?: string | null
        }
      }
      clientes: {
        Row: {
          id: number
          rut: string
          tipo: 'empresa' | 'persona'
          nombre_razon_social: string
          nombre_fantasia: string | null
          codigo_interno: string | null
          giro: string | null
          direccion: string | null
          ciudad: string | null
          comuna: string | null
          telefono: string | null
          celular: string | null
          forma_pago: string | null
          contacto_pago: string | null
          email_pago: string | null
          telefono_pago: string | null
          linea_credito: number
          descuento_cliente_pct: number
          estado: string
          created_at: string
        }
        Insert: {
          id?: number
          rut: string
          tipo?: 'empresa' | 'persona'
          nombre_razon_social: string
          nombre_fantasia?: string | null
          codigo_interno?: string | null
          giro?: string | null
          direccion?: string | null
          ciudad?: string | null
          comuna?: string | null
          telefono?: string | null
          celular?: string | null
          forma_pago?: string | null
          contacto_pago?: string | null
          email_pago?: string | null
          telefono_pago?: string | null
          linea_credito?: number
          descuento_cliente_pct?: number
          estado?: string
          created_at?: string
        }
        Update: {
          id?: number
          rut?: string
          tipo?: 'empresa' | 'persona'
          nombre_razon_social?: string
          nombre_fantasia?: string | null
          codigo_interno?: string | null
          giro?: string | null
          direccion?: string | null
          ciudad?: string | null
          comuna?: string | null
          telefono?: string | null
          celular?: string | null
          forma_pago?: string | null
          contacto_pago?: string | null
          email_pago?: string | null
          telefono_pago?: string | null
          linea_credito?: number
          descuento_cliente_pct?: number
          estado?: string
          created_at?: string
        }
      }
      cotizaciones: {
        Row: {
          id: number
          folio: string | null
          creada_por: string | null
          cliente_principal_id: number | null
          obra_id: number | null
          estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida'
          fecha_emision: string | null
          validez_dias: number
          fecha_vencimiento: string | null
          moneda: string
          forma_pago: string | null
          observaciones_pago: string | null
          plazo_entrega: string | null
          comentario: string | null
          descuento_global: number
          monto_exento: number
          total_bruto: number
          total_descuento: number
          total_neto: number
          iva: number
          impuesto_adicional: number
          total_final: number
          doc_tipo: string | null
          doc_folio_asociado: string | null
          created_at: string
        }
        Insert: {
          id?: number
          folio?: string | null
          creada_por?: string | null
          cliente_principal_id?: number | null
          obra_id?: number | null
          estado?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida'
          fecha_emision?: string | null
          validez_dias?: number
          fecha_vencimiento?: string | null
          moneda?: string
          forma_pago?: string | null
          observaciones_pago?: string | null
          plazo_entrega?: string | null
          comentario?: string | null
          descuento_global?: number
          monto_exento?: number
          total_bruto?: number
          total_descuento?: number
          total_neto?: number
          iva?: number
          impuesto_adicional?: number
          total_final?: number
          doc_tipo?: string | null
          doc_folio_asociado?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          folio?: string | null
          creada_por?: string | null
          cliente_principal_id?: number | null
          obra_id?: number | null
          estado?: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida'
          fecha_emision?: string | null
          validez_dias?: number
          fecha_vencimiento?: string | null
          moneda?: string
          forma_pago?: string | null
          observaciones_pago?: string | null
          plazo_entrega?: string | null
          comentario?: string | null
          descuento_global?: number
          monto_exento?: number
          total_bruto?: number
          total_descuento?: number
          total_neto?: number
          iva?: number
          impuesto_adicional?: number
          total_final?: number
          doc_tipo?: string | null
          doc_folio_asociado?: string | null
          created_at?: string
        }
      }
      productos: {
        Row: {
          id: number
          sku: string | null
          nombre: string
          descripcion: string | null
          unidad: string
          codigo_barra: string | null
          precio_compra: number | null
          precio_venta_neto: number | null
          estado: string
          activo: boolean
          created_at: string
        }
        Insert: {
          id?: number
          sku?: string | null
          nombre: string
          descripcion?: string | null
          unidad?: string
          codigo_barra?: string | null
          precio_compra?: number | null
          precio_venta_neto?: number | null
          estado?: string
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          sku?: string | null
          nombre?: string
          descripcion?: string | null
          unidad?: string
          codigo_barra?: string | null
          precio_compra?: number | null
          precio_venta_neto?: number | null
          estado?: string
          activo?: boolean
          created_at?: string
        }
      }
      obras: {
        Row: {
          id: number
          cliente_id: number | null
          nombre: string
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          vendedor_id: string | null
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
          proximo_seguimiento?: string | null
          notas?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: number
          cliente_id?: number | null
          nombre: string
          direccion?: string | null
          comuna?: string | null
          ciudad?: string | null
          vendedor_id?: string | null
          tipo_obra_id?: number | null
          tamano_obra_id?: number | null
          estado?: string | null
          etapa_actual?: string | null
          descripcion?: string | null
          fecha_inicio?: string | null
          fecha_estimada_fin?: string | null
          fecha_ultimo_contacto?: string | null
          valor_estimado?: number | null
          material_vendido?: number | null
          proximo_seguimiento?: string | null
          notas?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          cliente_id?: number | null
          nombre?: string
          direccion?: string | null
          comuna?: string | null
          ciudad?: string | null
          vendedor_id?: string | null
          tipo_obra_id?: number | null
          tamano_obra_id?: number | null
          estado?: string | null
          etapa_actual?: string | null
          descripcion?: string | null
          fecha_inicio?: string | null
          fecha_estimada_fin?: string | null
          fecha_ultimo_contacto?: string | null
          valor_estimado?: number | null
          material_vendido?: number | null
          proximo_seguimiento?: string | null
          notas?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      ,
      obra_tipos: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          descripcion?: string | null
        }
      }
      ,
      obra_tamanos: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          descripcion?: string | null
        }
      }
      ,
      target_tipos: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          descripcion?: string | null
        }
      }
      ,
      obra_contactos: {
        Row: {
          id: number
          obra_id: number
          nombre: string
          cargo: string
          telefono: string | null
          email: string | null
          es_principal: boolean
          created_at: string
        }
        Insert: {
          id?: number
          obra_id: number
          nombre: string
          cargo: string
          telefono?: string | null
          email?: string | null
          es_principal?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          obra_id?: number
          nombre?: string
          cargo?: string
          telefono?: string | null
          email?: string | null
          es_principal?: boolean
          created_at?: string
        }
      }
      ,

    
      targets: {
        Row: {
          id: number
          titulo: string
          descripcion: string | null
          estado: string
          prioridad: string
          tipo_id: number | null
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          region: string | null
          lat: number | null
          lng: number | null
          creado_por: string
          asignado_a: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          titulo: string
          descripcion?: string | null
          estado?: string
          prioridad?: string
          tipo_id?: number | null
          direccion?: string | null
          comuna?: string | null
          ciudad?: string | null
          region?: string | null
          lat?: number | null
          lng?: number | null
          creado_por: string
          asignado_a?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          titulo?: string
          descripcion?: string | null
          estado?: string
          prioridad?: string
          tipo_id?: number | null
          direccion?: string | null
          comuna?: string | null
          ciudad?: string | null
          region?: string | null
          lat?: number | null
          lng?: number | null
          creado_por?: string
          asignado_a?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ,
      target_contactos: {
        Row: {
          id: number
          target_id: number
          nombre: string | null
          empresa: string | null
          telefono: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: number
          target_id: number
          nombre?: string | null
          empresa?: string | null
          telefono?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          target_id?: number
          nombre?: string | null
          empresa?: string | null
          telefono?: string | null
          email?: string | null
          created_at?: string
        }
      }
      ,
      target_notas: {
        Row: {
          id: number
          target_id: number
          nota: string
          creado_por: string | null
          created_at: string
        }
        Insert: {
          id?: number
          target_id: number
          nota: string
          creado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          target_id?: number
          nota?: string
          creado_por?: string | null
          created_at?: string
        }
      }
      ,
      target_eventos: {
        Row: {
          id: number
          target_id: number
          tipo: string
          detalle: string | null
          fecha_evento: string
          creado_por: string | null
          created_at: string
        }
        Insert: {
          id?: number
          target_id: number
          tipo: string
          detalle?: string | null
          fecha_evento?: string
          creado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          target_id?: number
          tipo?: string
          detalle?: string | null
          fecha_evento?: string
          creado_por?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
