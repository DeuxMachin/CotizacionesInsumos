import { supabase } from '../lib/supabase';
import type { Quote, QuoteItem } from '@/core/domain/quote/Quote';
import type { Database } from '@/lib/supabase';

// Interfaces locales (en espera de tipado generado de Supabase)
// ===== Nuevas interfaces alineadas al esquema SQL final =====
export interface SalesNoteItemInput {
  producto_id?: number | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario_neto: number; // precio base neto por unidad (sin IVA)
  descuento_pct?: number;       // % aplicado a la línea
  descuento_monto?: number;     // monto absoluto descontado en la línea
  iva_aplicable?: boolean;      // true por defecto
  subtotal_neto: number;        // después de descuento (base imponible línea)
  total_neto: number;           // igual a subtotal_neto si IVA se calcula global
}

export interface SalesNoteInput {
  folio?: string | null;
  Numero_Serie?: string | null;
  cotizacion_id?: number | null;
  vendedor_id?: string | null;
  cliente_principal_id?: number | null;
  obra_id?: number | null;
  cliente_rut?: string | null;
  cliente_razon_social?: string | null;
  cliente_giro?: string | null;
  cliente_direccion?: string | null;
  cliente_comuna?: string | null;
  cliente_ciudad?: string | null;
  // Totales
  subtotal: number;
  descuento_lineas_monto: number;
  descuento_global_monto: number;
  descuento_total: number;
  subtotal_neto_post_desc: number;
  iva_pct: number;
  iva_monto: number;
  total: number;
  // Comerciales / logística
  forma_pago_final?: string | null;
  plazo_pago?: string | null;
  observaciones_comerciales?: string | null;
  direccion_despacho?: string | null;
  comuna_despacho?: string | null;
  ciudad_despacho?: string | null;
  costo_despacho?: number | null;
  fecha_estimada_entrega?: string | null;
  estado?: 'creada' | 'confirmada';
}

export interface SalesNoteRecord extends SalesNoteInput {
  id: number;
  fecha_emision?: string;
  confirmed_at?: string | null;
  hash_documento?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Precise row types from Supabase schema
export type SalesNoteRow = Database['public']['Tables']['notas_venta']['Row'];
export type SalesNoteItemRow = Database['public']['Tables']['nota_venta_items']['Row'];

export class NotasVentaService {
  // Columnas reales según DDL (evita usar columnas antiguas como forma_pago)
  private static readonly SELECT_COLS = [
    'id','folio','Numero_Serie','cotizacion_id','vendedor_id','cliente_principal_id','obra_id',
    'cliente_rut','cliente_razon_social','cliente_giro','cliente_direccion','cliente_comuna','cliente_ciudad',
    'fecha_emision','estado','confirmed_at','forma_pago_final','plazo_pago','observaciones_comerciales',
    'direccion_despacho','comuna_despacho','ciudad_despacho','costo_despacho','fecha_estimada_entrega',
    'subtotal','descuento_lineas_monto','descuento_global_monto','descuento_total','subtotal_neto_post_desc',
    'iva_pct','iva_monto','total','hash_documento','created_at','updated_at'
  ].join(',');
  static async generateFolio() {
    // Usar la tabla document_series para generar el numero_serie
    const currentYear = new Date().getFullYear();

    // Buscar la serie activa para notas de venta
    const { data: series, error: seriesError } = await supabase
      .from('document_series')
      .select('*')
      .eq('doc_tipo', 'nota_venta')
      .eq('anio', currentYear)
      .eq('activo', true)
      .single();

    if (seriesError || !series) {
      throw new Error(`No se encontró una serie de documentos activa para notas de venta del año ${currentYear}`);
    }

    // Incrementar el último número
    const nextNumber = series.ultimo_numero + 1;
    const numeroSerie = `${series.prefijo}${nextNumber.toString().padStart(series.largo, '0')}`;

    // Actualizar el último número en la base de datos
    const { error: updateError } = await supabase
      .from('document_series')
      .update({ ultimo_numero: nextNumber })
      .eq('id', series.id);

    if (updateError) {
      throw new Error(`Error al actualizar el contador de serie de documentos: ${updateError.message}`);
    }

    return numeroSerie;
  }

  /** Elimina una nota de venta y todos sus ítems */
  static async deleteById(id: number) {
    // Borrar ítems primero (FK constraint)
    const { error: itemsErr } = await supabase
      .from('nota_venta_items')
      .delete()
      .eq('nota_venta_id', id);
    if (itemsErr) throw itemsErr;
    const { error: nvErr } = await supabase
      .from('notas_venta')
      .delete()
      .eq('id', id);
    if (nvErr) throw nvErr;
    return true;
  }

  /** Busca una nota de venta por cotizacion_id y la elimina en cascada */
  static async deleteByCotizacionId(cotizacionId: number) {
  const { data, error } = await supabase
      .from('notas_venta')
      .select('id')
      .eq('cotizacion_id', cotizacionId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return false;
  await this.deleteById(data.id);
    return true;
  }

  static async create(nota: SalesNoteInput, items: SalesNoteItemInput[]) {
    console.debug('[NotasVentaService.create] salesNote input:', nota);
    // Inserta cabecera
    // Solo columnas existentes en la tabla notas_venta (según DDL entregado)
    const allowedKeys: (keyof SalesNoteInput | 'folio')[] = [
      'folio','Numero_Serie','cotizacion_id','vendedor_id','cliente_principal_id','obra_id','cliente_rut','cliente_razon_social','cliente_giro','cliente_direccion','cliente_comuna','cliente_ciudad','forma_pago_final','plazo_pago','observaciones_comerciales','direccion_despacho','comuna_despacho','ciudad_despacho','costo_despacho','fecha_estimada_entrega','subtotal','descuento_lineas_monto','descuento_global_monto','descuento_total','subtotal_neto_post_desc','iva_pct','iva_monto','total','estado'
    ];
    const base: Partial<SalesNoteInput> & { folio: string | null } = {
      ...nota,
      folio: nota.folio || (nota.Numero_Serie ? `NV-${nota.Numero_Serie}` : `NV-${Date.now()}`)
    };
    const insertPayload: Record<string, unknown> = {};
    for (const k of allowedKeys) {
      if (base[k] !== undefined) insertPayload[k] = base[k];
    }
    if (!insertPayload.vendedor_id) {
      console.error('[NotasVentaService.create] vendedor_id faltante. salesNote:', nota);
      throw new Error('vendedor_id requerido para crear nota de venta. Verifica que la cotización tenga un vendedor asignado.');
    }
    if (!insertPayload.estado) insertPayload.estado = 'borrador';
    console.debug('[NotasVentaService.create] insertPayload', insertPayload);
    const { data: notaInsert, error: notaError } = await supabase
      .from('notas_venta')
      .insert(insertPayload)
      .select('id, folio, Numero_Serie, cotizacion_id, vendedor_id, cliente_principal_id, estado, created_at')
      .single();
    if (notaError) {
      console.error('[NotasVentaService.create] Error insert notas_venta', notaError);
      const errMsg = (notaError as unknown as { message?: string; details?: string }).message || (notaError as unknown as { details?: string }).details || 'Fallo al insertar nota de venta';
      throw new Error(errMsg);
    }
    if (!notaInsert) throw new Error('No se pudo insertar nota de venta');

    // Si hay cotizacion_id, actualizar el estado de la cotización a 'aceptada'
    if (insertPayload.cotizacion_id) {
      const { error: updateError } = await supabase
        .from('cotizaciones')
        .update({ estado: 'aceptada' })
        .eq('id', insertPayload.cotizacion_id);
      if (updateError) {
        console.warn('[NotasVentaService.create] No se pudo actualizar estado de cotización', updateError);
      }
    }

    // Ítems (tabla singular: nota_venta_items)
    if (items.length) {
      const itemsPayload = items.map(it => ({
        nota_venta_id: (notaInsert as unknown as SalesNoteRow).id,
        producto_id: it.producto_id ?? null,
        descripcion: it.descripcion,
        unidad: it.unidad,
        cantidad: it.cantidad,
        precio_unitario_neto: it.precio_unitario_neto,
        descuento_pct: it.descuento_pct ?? 0,
        descuento_monto: it.descuento_monto ?? 0,
        iva_aplicable: it.iva_aplicable ?? true,
        subtotal_neto: it.subtotal_neto,
        total_neto: it.total_neto
      }));
      const { error: itemsError } = await supabase
        .from('nota_venta_items')
        .insert(itemsPayload);
      if (itemsError) {
        console.error('[NotasVentaService.create] Error insert nota_venta_items', itemsError);
        const errMsg = (itemsError as unknown as { message?: string; details?: string }).message || (itemsError as unknown as { details?: string }).details || 'Fallo al insertar ítems de nota de venta';
        throw new Error(errMsg);
      }
    }
    // Actualizar saldos del cliente al crear nota de venta (mueve de cotizado a pendiente)
    try {
      const clienteId = (notaInsert as unknown as SalesNoteRow).cliente_principal_id as number | null;
      const total = (notaInsert as unknown as SalesNoteRow).total as number;
      const notaVentaId = (notaInsert as unknown as SalesNoteRow).id as number;
      console.log('[NotasVentaService.create] Procesando CxC:', { clienteId, total, notaVentaId });

      if (clienteId && total && total > 0) {
        // Crear documento CxC para la nota de venta
        const cxcData = {
          cliente_id: clienteId,
          nota_venta_id: notaVentaId,
          doc_tipo: 'nota_venta',
          moneda: 'CLP', // Asumiendo CLP por defecto, ajustar si es necesario
          monto_total: total,
          saldo_pendiente: total,
          fecha_emision: new Date().toISOString().split('T')[0],
          estado: 'pendiente'
        };
        console.log('[NotasVentaService.create] Creando documento CxC:', cxcData);

        const { error: cxcError } = await supabase
          .from('cxc_documentos')
          .insert(cxcData);
        if (cxcError) {
          console.error('[NotasVentaService.create] Error creando documento CxC', cxcError);
          throw new Error(`Fallo al crear documento CxC: ${cxcError.message}`);
        }

        console.log('[NotasVentaService.create] Documento CxC creado exitosamente');

        // Actualizar dinero_cotizado en cliente_saldos
        const { data: saldoActual } = await supabase
          .from('cliente_saldos')
          .select('id, dinero_cotizado, pendiente')
          .eq('cliente_id', clienteId)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[NotasVentaService.create] Saldo actual del cliente:', saldoActual);

        if (saldoActual) {
          const nuevoCotizado = Math.max(0, (saldoActual.dinero_cotizado || 0) - total);
          const nuevoPendiente = (saldoActual.pendiente || 0) + total;
          console.log('[NotasVentaService.create] Actualizando saldo existente:', {
            id: saldoActual.id,
            dineroCotizadoActual: saldoActual.dinero_cotizado,
            nuevoCotizado,
            pendienteActual: saldoActual.pendiente,
            nuevoPendiente
          });

          const { error: saldoError } = await supabase
            .from('cliente_saldos')
            .update({
              dinero_cotizado: nuevoCotizado,
              pendiente: nuevoPendiente
            })
            .eq('id', saldoActual.id);
          if (saldoError) {
            console.error('[NotasVentaService.create] Error actualizando cliente_saldos', saldoError);
            throw new Error(`Fallo al actualizar saldos del cliente: ${saldoError.message}`);
          }
        } else {
          // Si no existe registro en cliente_saldos, crear uno con dinero_cotizado = 0
          // (ya que la cotización se convirtió a venta, el dinero ya no está cotizado)
          const nuevoSaldo = {
            cliente_id: clienteId,
            snapshot_date: new Date().toISOString().split('T')[0],
            pagado: 0,
            pendiente: total, // El monto de la venta pasa a pendiente
            vencido: 0,
            dinero_cotizado: 0 // Ya no está cotizado
          };
          console.log('[NotasVentaService.create] Creando nuevo registro en cliente_saldos:', nuevoSaldo);

          const { error: saldoError } = await supabase
            .from('cliente_saldos')
            .insert(nuevoSaldo);
          if (saldoError) {
            console.error('[NotasVentaService.create] Error creando registro en cliente_saldos', saldoError);
            throw new Error(`Fallo al crear registro de saldos del cliente: ${saldoError.message}`);
          }
        }
      }
    } catch (e) {
      console.error('[NotasVentaService.create] Error en integración CxC', e);
      throw e; // Re-throw to fail the creation if CxC fails
    }
    return notaInsert as unknown as SalesNoteRecord;
  }

  static async getById(id: number) {
    const { data, error } = await supabase
      .from('notas_venta')
      .select(this.SELECT_COLS)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as unknown as SalesNoteRecord;
  }

  static async getItems(notaVentaId: number) {
  const { data, error } = await supabase
      .from('nota_venta_items')
      .select(`
        *,
        productos (
          id,
          nombre,
          ficha_tecnica
        )
      `)
      .eq('nota_venta_id', notaVentaId)
      .order('id', { ascending: true });
    if (error) throw error;
  return data as (SalesNoteItemRow & { productos?: any })[];
  }

  static async addItem(notaVentaId: number, item: SalesNoteItemInput) {
    const payload = {
      nota_venta_id: notaVentaId,
      producto_id: item.producto_id ?? null,
      descripcion: item.descripcion,
      unidad: item.unidad,
      cantidad: item.cantidad,
      precio_unitario_neto: item.precio_unitario_neto,
      descuento_pct: item.descuento_pct ?? 0,
      descuento_monto: item.descuento_monto ?? Math.round(item.cantidad * item.precio_unitario_neto * ((item.descuento_pct ?? 0) / 100)),
      iva_aplicable: item.iva_aplicable ?? true,
      subtotal_neto: item.subtotal_neto,
      total_neto: item.total_neto
    };
    const { data, error } = await supabase
      .from('nota_venta_items')
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error('[NotasVentaService.addItem] Error insert nota_venta_items', error);
      const errMsg = (error as unknown as { message?: string; details?: string }).message || (error as unknown as { details?: string }).details || 'Fallo al agregar ítem';
      throw new Error(errMsg);
    }
    return data as SalesNoteItemRow;
  }

  static async removeItem(itemId: number) {
    const { error } = await supabase
      .from('nota_venta_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
    return true;
  }

  /** Obtiene el id numérico real de la cotización dado su folio (ej: COT000002) */
  static async getCotizacionNumericIdByFolio(folio: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('id')
      .eq('folio', folio)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[NotasVentaService.getCotizacionNumericIdByFolio] error', error);
      return null;
    }
    return data?.id ?? null;
  }

  /** Obtiene nota de venta por id de cotización (numeric) */
  static async getByCotizacionId(cotizacionId: number) {
    const { data, error } = await supabase
      .from('notas_venta')
      .select(this.SELECT_COLS)
      .eq('cotizacion_id', cotizacionId)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as SalesNoteRecord | null;
  }

  static async getByObraId(obraId: number): Promise<SalesNoteRecord[]> {
    const { data, error } = await supabase
      .from('notas_venta')
      .select(this.SELECT_COLS)
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as SalesNoteRecord[];
  }

  static async update(notaVentaId: number, patch: Partial<SalesNoteInput>) {
    const { data, error } = await supabase
      .from('notas_venta')
      .update(patch)
      .eq('id', notaVentaId)
      .select(this.SELECT_COLS)
      .single();
    if (error) throw error;
    return data as unknown as SalesNoteRecord;
  }

  static async confirm(notaVentaId: number) {
    return this.update(notaVentaId, { estado: 'confirmada' });
  }

  /**
   * Convierte un objeto Quote (front) en una nota de venta (borrador) alineada al nuevo esquema.
   * options:
   *  - cotizacionDbId: id numérico real en BD (si lo tienes). Si no, se deja null.
   *  - vendedorId: UUID del usuario (si la tabla lo requiere NOT NULL).
   *  - formaPago, descuentoExtraMonto: ajustes al convertir.
   */
  static async convertFromQuote(
    quote: Quote,
    options: {
      cotizacionDbId?: number;
      vendedorId?: string;
      clientePrincipalId?: number;
      obraId?: number;
      formaPago?: string;
      descuentoExtraMonto?: number;
      costoDespacho?: number;
      fechaEstimadaEntrega?: string; // ISO date
      itemsOverride?: QuoteItem[];
      finalizarInmediatamente?: boolean;
      clienteGiro?: string | null;
      clienteDireccion?: string | null;
      clienteComuna?: string | null;
      clienteCiudad?: string | null;
      folio?: string; // Manual folio
      numeroSerie?: string; // Manual numero serie
    } = {}
  ) {
    const itemsSource = options.itemsOverride ?? quote.items;
    const subtotalBruto = itemsSource.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
    const lineDiscount = itemsSource.reduce((s, it) => {
      const brutoLinea = it.cantidad * it.precioUnitario;
      const descPct = it.descuento || 0;
      return s + Math.round(brutoLinea * (descPct / 100));
    }, 0);
    const globalDiscount = quote.descuentoGlobalMonto || 0;
    const descuentoExtra = options.descuentoExtraMonto || 0;
    const descuentoLineasFinal = lineDiscount;
    const descuentoGlobalFinal = globalDiscount + descuentoExtra;
    const descuentoTotal = descuentoLineasFinal + descuentoGlobalFinal;
    const subtotalNetoPostDesc = subtotalBruto - descuentoTotal;
    const ivaPct = 19;
    const ivaMonto = Math.round(subtotalNetoPostDesc * ivaPct / 100);
    const total = subtotalNetoPostDesc + ivaMonto;

    const salesNote: SalesNoteInput = {
      folio: options.folio || null, // Use manual folio if provided, else null for auto-generate
      Numero_Serie: options.numeroSerie || null, // Use manual numero serie if provided
      cotizacion_id: options.cotizacionDbId ?? null,
      vendedor_id: options.vendedorId ?? quote.vendedorId ?? null,
      cliente_principal_id: options.clientePrincipalId ?? null,
      obra_id: options.obraId ?? null,
      cliente_rut: quote.cliente.rut,
      cliente_razon_social: quote.cliente.razonSocial,
      // Agregamos datos adicionales del cliente
      cliente_giro: options.clienteGiro ?? quote.cliente.giro ?? null,
      cliente_direccion: options.clienteDireccion ?? quote.cliente.direccion ?? null,
      cliente_comuna: options.clienteComuna ?? quote.cliente.comuna ?? null,
      cliente_ciudad: options.clienteCiudad ?? quote.cliente.ciudad ?? null,
      // Datos financieros
      subtotal: subtotalBruto,
      descuento_lineas_monto: descuentoLineasFinal,
      descuento_global_monto: descuentoGlobalFinal,
      descuento_total: descuentoTotal,
      subtotal_neto_post_desc: subtotalNetoPostDesc,
      iva_pct: ivaPct,
      iva_monto: ivaMonto,
      total,
      forma_pago_final: options.formaPago || quote.condicionesComerciales?.formaPago || null,
      costo_despacho: options.costoDespacho ?? quote.despacho?.costoDespacho ?? 0,
      fecha_estimada_entrega: options.fechaEstimadaEntrega || quote.despacho?.fechaEstimada || null,
      direccion_despacho: quote.despacho?.direccion || null,
      comuna_despacho: quote.despacho?.comuna || null,
      ciudad_despacho: quote.despacho?.ciudad || null,
      estado: options.finalizarInmediatamente ? 'confirmada' : 'creada',
      observaciones_comerciales: quote.condicionesComerciales?.observaciones || null,
    };

    const items: SalesNoteItemInput[] = itemsSource.map(i => {
      const brutoLinea = i.cantidad * i.precioUnitario;
      const descPct = i.descuento || 0;
      const descMonto = Math.round(brutoLinea * (descPct / 100));
      const netoLinea = brutoLinea - descMonto;
      return {
        producto_id: i.productId,
        descripcion: i.descripcion,
        unidad: i.unidad,
        cantidad: i.cantidad,
        precio_unitario_neto: i.precioUnitario,
        descuento_pct: descPct,
        descuento_monto: descMonto,
        iva_aplicable: true,
        subtotal_neto: netoLinea,
        total_neto: netoLinea
      };
    });

    return this.create(salesNote, items);
  }

  /** Obtiene todas las notas de venta ordenadas por fecha de creación descendente */
  static async getAll(): Promise<SalesNoteRecord[]> {
    const { data, error } = await supabase
      .from('notas_venta')
      .select(this.SELECT_COLS)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as SalesNoteRecord[];
  }
}

// NOTA: Asegúrate de crear en tu base de datos:
// Ajustado al nuevo esquema: notas_venta / nota_venta_items.
