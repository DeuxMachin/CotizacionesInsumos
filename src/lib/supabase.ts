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
      bodegas: {
        Row: {
          id: number
          nombre: string
          ubicacion: string | null
        }
        Insert: {
          id?: number
          nombre: string
          ubicacion?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          ubicacion?: string | null
        }
      }
      categorias_productos: {
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
          cliente_tipo_id: number | null
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
          cliente_tipo_id?: number | null
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
          cliente_tipo_id?: number | null
        }
      }
      cotizaciones: {
        Row: {
          id: number
          folio: string | null
          estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada'
          vendedor_id: string
          cliente_principal_id: number | null
          obra_id: number | null
          fecha_emision: string
          validez_dias: number
          fecha_vencimiento: string | null
          condicion_pago_id: number | null
          condicion_pago_texto: string | null
          plazo_entrega_id: number | null
          plazo_entrega_texto: string | null
          forma_pago_texto: string | null
          observaciones_pago: string | null
          descuento_global_monto: number
          descuento_global_pct: number | null
          monto_exento: number
          total_bruto: number
          total_descuento: number
          total_neto: number
          iva_pct: number
          iva_monto: number
          impuesto_adicional: number
          total_final: number
          doc_tipo: string | null
          doc_folio_asociado: string | null
          hash_cotizacion: string | null
          created_at: string
          updated_at: string
          nota_venta_id: number | null
        }
        Insert: {
          id?: number
          folio?: string | null
          estado?: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada'

          vendedor_id: string
          cliente_principal_id?: number | null
          obra_id?: number | null
          fecha_emision?: string
          validez_dias?: number
          fecha_vencimiento?: string | null
          condicion_pago_id?: number | null
          condicion_pago_texto?: string | null
          plazo_entrega_id?: number | null
          plazo_entrega_texto?: string | null
          forma_pago_texto?: string | null
          observaciones_pago?: string | null
          descuento_global_monto?: number
          descuento_global_pct?: number | null
          monto_exento?: number
          total_bruto?: number
          total_descuento?: number
          total_neto?: number
          iva_pct?: number
          iva_monto?: number
          impuesto_adicional?: number
          total_final?: number
          doc_tipo?: string | null
          doc_folio_asociado?: string | null
          hash_cotizacion?: string | null
          created_at?: string
          updated_at?: string
          nota_venta_id?: number | null
        }
        Update: {
          id?: number
          folio?: string | null
          estado?: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada'

          vendedor_id?: string
          cliente_principal_id?: number | null
          obra_id?: number | null
          fecha_emision?: string
          validez_dias?: number
          fecha_vencimiento?: string | null
          condicion_pago_id?: number | null
          condicion_pago_texto?: string | null
            plazo_entrega_id?: number | null
          plazo_entrega_texto?: string | null
          forma_pago_texto?: string | null
          observaciones_pago?: string | null
          descuento_global_monto?: number
          descuento_global_pct?: number | null
          monto_exento?: number
          total_bruto?: number
          total_descuento?: number
          total_neto?: number
          iva_pct?: number
          iva_monto?: number
          impuesto_adicional?: number
          total_final?: number
          doc_tipo?: string | null
          doc_folio_asociado?: string | null
          hash_cotizacion?: string | null
          created_at?: string
          updated_at?: string
          nota_venta_id?: number | null
        }
      }
      cotizacion_clientes: {
        Row: {
          cotizacion_id: number
          cliente_id: number
          rol: string | null
          created_at: string
        }
        Insert: {
          cotizacion_id: number
          cliente_id: number
          rol?: string | null
          created_at?: string
        }
        Update: {
          cotizacion_id?: number
          cliente_id?: number
          rol?: string | null
          created_at?: string
        }
      }
      cotizacion_items: {
        Row: {
          id: number
          cotizacion_id: number
          producto_id: number | null
          descripcion: string | null
          unidad: string | null
          cantidad: number
          precio_unitario_neto: number
          descuento_pct: number | null
          descuento_monto: number
          iva_aplicable: boolean
          subtotal_neto: number
          total_neto: number
          created_at: string
        }
        Insert: {
          id?: number
          cotizacion_id: number
          producto_id?: number | null
          descripcion?: string | null
          unidad?: string | null
          cantidad: number
          precio_unitario_neto: number
          descuento_pct?: number | null
          descuento_monto?: number
          iva_aplicable?: boolean
          subtotal_neto?: number
          total_neto?: number
          created_at?: string
        }
        Update: {
          id?: number
          cotizacion_id?: number
          producto_id?: number | null
          descripcion?: string | null
          unidad?: string | null
          cantidad?: number
          precio_unitario_neto?: number
          descuento_pct?: number | null
          descuento_monto?: number
          iva_aplicable?: boolean
          subtotal_neto?: number
          total_neto?: number
          created_at?: string
        }
      }
      cotizacion_despachos: {
        Row: {
          id: number
          cotizacion_id: number
          direccion: string
          complemento: string | null
          comuna_id: number | null
          region_id: number | null
          ciudad_texto: string | null
          costo: number
          fecha_entrega: string | null
          observaciones: string | null
          created_at: string
        }
        Insert: {
          id?: number
          cotizacion_id: number
          direccion: string
          complemento?: string | null
          comuna_id?: number | null
          region_id?: number | null
          ciudad_texto?: string | null
          costo?: number
          fecha_entrega?: string | null
          observaciones?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          cotizacion_id?: number
          direccion?: string
          complemento?: string | null
          comuna_id?: number | null
          region_id?: number | null
          ciudad_texto?: string | null
          costo?: number
          fecha_entrega?: string | null
          observaciones?: string | null
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
  
          estado: string
          activo: boolean
          created_at: string
          tipo_id: number | null
          afecto_iva: boolean
          moneda: string | null
          costo_unitario: number | null
          precio_neto: number | null
          precio_venta: number | null
          control_stock: boolean
          ficha_tecnica: string | null
        }
        Insert: {
          id?: number
          sku?: string | null
          nombre: string
          descripcion?: string | null
          unidad?: string

          estado?: string
          activo?: boolean
          created_at?: string
          tipo_id?: number | null
          afecto_iva?: boolean
          moneda?: string | null
          costo_unitario?: number | null
          precio_neto?: number | null
          precio_venta?: number | null
          control_stock?: boolean
          ficha_tecnica?: string | null
        }
        Update: {
          id?: number
          sku?: string | null
          nombre?: string
          descripcion?: string | null
          unidad?: string

          estado?: string
          activo?: boolean
          created_at?: string
          tipo_id?: number | null
          afecto_iva?: boolean
          moneda?: string | null
          costo_unitario?: number | null
          precio_neto?: number | null
          precio_venta?: number | null
          control_stock?: boolean
          ficha_tecnica?: string | null
        }
      }
      producto_tipos: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
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
          estado: string
          etapa_actual: string | null
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
          estado?: string
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
          estado?: string
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
      document_series: {
        Row: {
          id: number,
          doc_tipo: string,
          anio: number,
          prefijo: string,
          ultimo_numero: number,
          largo: number,
          activo: boolean
        }
        Insert: {
          id?: number
          doc_tipo: string
          anio: number
          prefijo: string
          ultimo_numero?: number
          largo?: number
          activo?: boolean
        }
        Update: {
          id?: number
          doc_tipo?: string
          anio?: number
          prefijo?: string
          ultimo_numero?: number
          largo?: number
          activo?: boolean
        }
      }
      ,
      notas_venta: {
        Row: {
          id: number
          folio: string | null
          Numero_Serie: string | null
          cotizacion_id: number | null
          vendedor_id: string
          cliente_principal_id: number | null
          obra_id: number | null
          cliente_rut: string | null
          cliente_razon_social: string | null
          cliente_giro: string | null
          cliente_direccion: string | null
          cliente_comuna: string | null
          cliente_ciudad: string | null
          fecha_emision: string
          estado: string
          confirmed_at: string | null
          forma_pago_final: string | null
          plazo_pago: string | null
          observaciones_comerciales: string | null
          direccion_despacho: string | null
          comuna_despacho: string | null
          ciudad_despacho: string | null
          costo_despacho: number
          fecha_estimada_entrega: string | null
          subtotal: number
          descuento_lineas_monto: number
          descuento_global_monto: number
          descuento_total: number
          subtotal_neto_post_desc: number
          iva_pct: number
          iva_monto: number
          total: number
          hash_documento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          folio?: string | null
          Numero_Serie?: string | null
          cotizacion_id?: number | null
          vendedor_id: string
          cliente_principal_id?: number | null
          obra_id?: number | null
          cliente_rut?: string | null
          cliente_razon_social?: string | null
          cliente_giro?: string | null
          cliente_direccion?: string | null
          cliente_comuna?: string | null
          cliente_ciudad?: string | null
          fecha_emision?: string
          estado?: string
          confirmed_at?: string | null
          forma_pago_final?: string | null
          plazo_pago?: string | null
          observaciones_comerciales?: string | null
          direccion_despacho?: string | null
          comuna_despacho?: string | null
          ciudad_despacho?: string | null
          costo_despacho?: number
          fecha_estimada_entrega?: string | null
          subtotal?: number
          descuento_lineas_monto?: number
          descuento_global_monto?: number
          descuento_total?: number
          subtotal_neto_post_desc?: number
          iva_pct?: number
          iva_monto?: number
          total?: number
          hash_documento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          folio?: string | null
          Numero_Serie?: string | null
          cotizacion_id?: number | null
          vendedor_id?: string
          cliente_principal_id?: number | null
          obra_id?: number | null
          cliente_rut?: string | null
          cliente_razon_social?: string | null
          cliente_giro?: string | null
          cliente_direccion?: string | null
          cliente_comuna?: string | null
          cliente_ciudad?: string | null
          fecha_emision?: string
          estado?: string
          confirmed_at?: string | null
          forma_pago_final?: string | null
          plazo_pago?: string | null
          observaciones_comerciales?: string | null
          direccion_despacho?: string | null
          comuna_despacho?: string | null
          ciudad_despacho?: string | null
          costo_despacho?: number
          fecha_estimada_entrega?: string | null
          subtotal?: number
          descuento_lineas_monto?: number
          descuento_global_monto?: number
          descuento_total?: number
          subtotal_neto_post_desc?: number
          iva_pct?: number
          iva_monto?: number
          total?: number
          hash_documento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ,
      nota_venta_items: {
        Row: {
          id: number
          nota_venta_id: number
          producto_id: number | null
          descripcion: string | null
          unidad: string | null
          cantidad: number
          precio_unitario_neto: number
          descuento_pct: number | null
          descuento_monto: number
          iva_aplicable: boolean
          subtotal_neto: number
          total_neto: number
          created_at: string
        }
        Insert: {
          id?: number
          nota_venta_id: number
          producto_id?: number | null
          descripcion?: string | null
          unidad?: string | null
          cantidad: number
          precio_unitario_neto: number
          descuento_pct?: number | null
          descuento_monto?: number
          iva_aplicable?: boolean
          subtotal_neto?: number
          total_neto?: number
          created_at?: string
        }
        Update: {
          id?: number
          nota_venta_id?: number
          producto_id?: number | null
          descripcion?: string | null
          unidad?: string | null
          cantidad?: number
          precio_unitario_neto?: number
          descuento_pct?: number | null
          descuento_monto?: number
          iva_aplicable?: boolean
          subtotal_neto?: number
          total_neto?: number
          created_at?: string
        }
      }
      ,
      condiciones_pago: {
        Row: { id: number; nombre: string; dias: number | null; descripcion: string | null; activa: boolean; created_at: string; updated_at: string }
        Insert: { id?: number; nombre: string; dias?: number | null; descripcion?: string | null; activa?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: number; nombre?: string; dias?: number | null; descripcion?: string | null; activa?: boolean; created_at?: string; updated_at?: string }
      }
      ,
      plazos_entrega: {
        Row: { id: number; nombre: string; dias_habiles: number | null; descripcion: string | null; activa: boolean; created_at: string; updated_at: string }
        Insert: { id?: number; nombre: string; dias_habiles?: number | null; descripcion?: string | null; activa?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: number; nombre?: string; dias_habiles?: number | null; descripcion?: string | null; activa?: boolean; created_at?: string; updated_at?: string }
      }
      ,
      cliente_usuarios: {
        Row: { cliente_id: number; usuario_id: string; created_at: string; cliente_tipo_id: number | null; es_responsable: boolean; asignado_por: string | null; asignado_at: string; activo: boolean; nota: string | null }
        Insert: { cliente_id: number; usuario_id: string; created_at?: string; cliente_tipo_id?: number | null; es_responsable?: boolean; asignado_por?: string | null; asignado_at?: string; activo?: boolean; nota?: string | null }
        Update: { cliente_id?: number; usuario_id?: string; created_at?: string; cliente_tipo_id?: number | null; es_responsable?: boolean; asignado_por?: string | null; asignado_at?: string; activo?: boolean; nota?: string | null }
      }
      ,
      cliente_saldos: {
        Row: { id: number; cliente_id: number; snapshot_date: string; pagado: number; pendiente: number; vencido: number; dinero_cotizado: number; created_at: string }
        Insert: { id?: number; cliente_id: number; snapshot_date?: string; pagado?: number; pendiente?: number; vencido?: number; dinero_cotizado?: number; created_at?: string }
        Update: { id?: number; cliente_id?: number; snapshot_date?: string; pagado?: number; pendiente?: number; vencido?: number; dinero_cotizado?: number; created_at?: string }
      }
      ,
      cliente_tipos: {
        Row: { id: number; nombre: string; descripcion: string | null }
        Insert: { id?: number; nombre: string; descripcion?: string | null }
        Update: { id?: number; nombre?: string; descripcion?: string | null }
      }
      ,
      cxc_aplicaciones: {
        Row: { pago_id: number; documento_id: number; monto_aplicado: number; created_at: string }
        Insert: { pago_id: number; documento_id: number; monto_aplicado: number; created_at?: string }
        Update: { pago_id?: number; documento_id?: number; monto_aplicado?: number; created_at?: string }
      }
      ,
      cxc_documentos: {
        Row: { id: number; cliente_id: number; nota_venta_id: number | null; doc_tipo: string; moneda: string | null; monto_total: number; saldo_pendiente: number; fecha_emision: string; fecha_vencimiento: string | null; estado: string; observacion: string | null; created_at: string; updated_at: string }
        Insert: { id?: number; cliente_id: number; nota_venta_id?: number | null; doc_tipo: string; moneda?: string | null; monto_total: number; saldo_pendiente: number; fecha_emision?: string; fecha_vencimiento?: string | null; estado?: string; observacion?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: number; cliente_id?: number; nota_venta_id?: number | null; doc_tipo?: string; moneda?: string | null; monto_total?: number; saldo_pendiente?: number; fecha_emision?: string; fecha_vencimiento?: string | null; estado?: string; observacion?: string | null; created_at?: string; updated_at?: string }
      }
      ,
      cxc_pagos: {
        Row: { id: number; cliente_id: number; fecha_pago: string; monto_total: number; moneda: string | null; metodo_pago: string | null; referencia: string | null; observacion: string | null; created_by: string | null; created_at: string }
        Insert: { id?: number; cliente_id: number; fecha_pago?: string; monto_total: number; moneda?: string | null; metodo_pago?: string | null; referencia?: string | null; observacion?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: number; cliente_id?: number; fecha_pago?: string; monto_total?: number; moneda?: string | null; metodo_pago?: string | null; referencia?: string | null; observacion?: string | null; created_by?: string | null; created_at?: string }
      }
      ,
      audit_log: {
        Row: {
          id: number
          usuario_id: string | null
          evento: string
          descripcion: string
          detalles: Record<string, unknown> | null
          tabla_afectada: string | null
          registro_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: number
          usuario_id?: string | null
          evento: string
          descripcion: string
          detalles?: Record<string, unknown> | null
          tabla_afectada?: string | null
          registro_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          usuario_id?: string | null
          evento?: string
          descripcion?: string
          detalles?: Record<string, unknown> | null
          tabla_afectada?: string | null
          registro_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
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
