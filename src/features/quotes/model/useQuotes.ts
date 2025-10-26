"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Quote, 
  QuoteStatus, 
  QuoteFilters, 
  QuotePaginationConfig, 
  QuoteStatusValidator,
  
  QuoteAmountCalculator,

} from '@/core/domain/quote/Quote';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { mapCotizacionToDomain, type CotizacionAggregate } from './adapters';
import type { Database } from '@/lib/supabase';

// DB row aliases to avoid repeating long generic paths
type CotizacionRow = Database['public']['Tables']['cotizaciones']['Row'];
type ItemRow = Database['public']['Tables']['cotizacion_items']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];
type DespRow = Database['public']['Tables']['cotizacion_despachos']['Row'];

// Ahora las cotizaciones se cargan desde Supabase (sin mocks)

interface UseQuotesReturn {
  // Estado
  quotes: Quote[];
  todasLasCotizaciones: Quote[];
  loading: boolean;
  error: string | null;
  
  // Estadísticas
  estadisticas: {
    total: number;
    borradores: number;
    enviadas: number;
    aceptadas: number;
    rechazadas: number;
    expiradas: number;
    montoTotal: number;
  };
  
  // Filtros y paginación
  filtros: QuoteFilters;
  setFiltros: (filtros: QuoteFilters) => void;
  paginationConfig: QuotePaginationConfig;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  
  // Acciones CRUD
  crearCotizacion: (
    cotizacion: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'>,
    extras?: { 
      globalDiscountPct?: number; 
      globalDiscountAmount?: number; 
      lineDiscountTotal?: number; // monto de descuentos de línea (sin el global)
    }
  ) => Promise<boolean>;
  actualizarCotizacion: (id: string, cotizacion: Partial<Quote>) => Promise<boolean>;
  eliminarCotizacion: (id: string) => Promise<boolean>;
  duplicarCotizacion: (id: string) => Promise<boolean>;
  cambiarEstado: (id: string, nuevoEstado: QuoteStatus) => Promise<boolean>;
  cancelarCotizacion: (id: string) => Promise<boolean>;
  actualizarPrioridad: (id: string, prioridad: number | null) => Promise<boolean>;
  
  // Utilidades
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
  getQuoteById: (id: string) => Quote | null;
  canEdit: (cotizacion: Quote) => boolean;
  canDelete: (cotizacion: Quote) => boolean;
  
  // Info del usuario
  userId: string | null;
  userName: string | null;
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 10;

// Asegura que exista una serie activa para el tipo de documento y año indicado.
// 1. Intenta buscar la serie activa.
// 2. Si no existe, intenta crearla con valores por defecto.
// 3. Reintenta la búsqueda y retorna la fila o null si falla.
async function ensureActiveDocumentSeries(docTipo: string, year: number) {
  try {
    const { data: existing, error: findErr } = await supabase
      .from('document_series')
      .select('*')
      .eq('doc_tipo', docTipo)
      .eq('anio', year)
      .eq('activo', true)
      .maybeSingle();
    if (findErr) {
      console.warn('document_series find error (ignorando si es no-row):', findErr.message);
    }
    if (existing) return existing;

    // Intentar creación defensiva (puede fallar si RLS lo impide o falta permiso)
    const defaultPayload = {
      doc_tipo: docTipo,
      anio: year,
      prefijo: docTipo === 'cotizacion' ? 'COT' : docTipo.substring(0, 3).toUpperCase(),
      ultimo_numero: 0,
      largo: 6,
      activo: true
    };
    console.debug('[ensureActiveDocumentSeries] Creando serie faltante', defaultPayload);
    const { error: insertErr } = await supabase
      .from('document_series')
      .insert([defaultPayload]);
    if (insertErr) {
      // Si ya existe pero inactiva o conflicto de unique (si hay constraint adicional), intentar activarla
      console.warn('[ensureActiveDocumentSeries] Insert falló, intentando activar existente', insertErr.message);
      const { data: maybeInactive, error: inactiveErr } = await supabase
        .from('document_series')
        .select('*')
        .eq('doc_tipo', docTipo)
        .eq('anio', year)
        .maybeSingle();
      if (!inactiveErr && maybeInactive && !maybeInactive.activo) {
        const { error: activateErr } = await supabase
          .from('document_series')
          .update({ activo: true })
          .eq('id', maybeInactive.id);
        if (activateErr) {
          console.error('[ensureActiveDocumentSeries] No se pudo activar serie existente:', activateErr.message);
        }
      }
    }
    // Reintentar búsqueda final
    const { data: finalSerie } = await supabase
      .from('document_series')
      .select('*')
      .eq('doc_tipo', docTipo)
      .eq('anio', year)
      .eq('activo', true)
      .maybeSingle();
    return finalSerie || null;
  } catch (e: unknown) {
    console.error('[ensureActiveDocumentSeries] Error inesperado:', e);
    return null;
  }
}

// Normaliza un RUT eliminando puntos, guiones y forzando minúsculas en el dígito verificador.
function normalizeRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toLowerCase();
}

export function useQuotes(): UseQuotesReturn {
  const { user } = useAuth();
  const isAdmin = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
  
  // Estado local
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<QuoteFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Función para recargar cotizaciones (reutilizable)
  const refetchQuotes = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase
        .from('cotizaciones')
        .select(`*,
          cotizacion_items(*, productos(*)),
          cotizacion_clientes(*, clientes(*)),
          cotizacion_despachos(*),
          clientes!cotizaciones_cliente_principal_id_fkey(*),
          usuarios!cotizaciones_vendedor_id_fkey(*)
        `)
        .order('updated_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('vendedor_id', user.id);
      }

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;

      // Mapear resultados
type CotizacionRow = Database['public']['Tables']['cotizaciones']['Row'];
type ItemRow = Database['public']['Tables']['cotizacion_items']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];
type DespRow = Database['public']['Tables']['cotizacion_despachos']['Row'];
      const mapped: Quote[] = (data || []).map((row) => mapCotizacionToDomain({
        cotizacion: row as CotizacionRow,
        items: ((row as unknown as { cotizacion_items?: ItemRow[] }).cotizacion_items) || [],
        clientes_adicionales: ((row as unknown as { cotizacion_clientes?: { cliente?: ClienteRow | null }[] }).cotizacion_clientes) || [],
        despacho: ((row as unknown as { cotizacion_despachos?: DespRow[] }).cotizacion_despachos)?.[0] || null,
        cliente_principal: (row as unknown as { clientes?: ClienteRow }).clientes,
        vendedor: (row as unknown as { usuarios?: UsuarioRow }).usuarios
      } as CotizacionAggregate));

      setAllQuotes(mapped);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError('Error al cargar las cotizaciones');
    }
  }, [isAdmin, user]);

  // Cargar cotizaciones desde Supabase
  useEffect(() => {
    const loadQuotes = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      await refetchQuotes();
      setLoading(false);
    };
    loadQuotes();
  }, [refetchQuotes, user]);

  // Filtrar cotizaciones
  const filteredQuotes = useMemo(() => {
    let filtered = [...allQuotes];

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const searchTerm = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(quote =>
        quote.numero.toLowerCase().includes(searchTerm) ||
        quote.cliente.razonSocial.toLowerCase().includes(searchTerm) ||
        quote.cliente.rut.includes(searchTerm) ||
        quote.cliente.nombreFantasia?.toLowerCase().includes(searchTerm) ||
        quote.vendedorNombre.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por estado
    if (filtros.estado && filtros.estado.length > 0) {
      filtered = filtered.filter(quote => filtros.estado!.includes(quote.estado));
    }
    // Mostrar todas las cotizaciones, incluyendo las aceptadas (convertidas)

    // Filtro por vendedor
    if (filtros.vendedor) {
      filtered = filtered.filter(quote => quote.vendedorId === filtros.vendedor);
    }

    // Filtro por cliente
    if (filtros.cliente) {
      filtered = filtered.filter(quote => 
        quote.cliente.razonSocial.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }

    // Filtros de fecha
    if (filtros.fechaDesde) {
      filtered = filtered.filter(quote => quote.fechaCreacion >= filtros.fechaDesde!);
    }
    if (filtros.fechaHasta) {
      filtered = filtered.filter(quote => quote.fechaCreacion <= filtros.fechaHasta!);
    }

    return filtered.sort((a, b) => new Date(b.fechaModificacion).getTime() - new Date(a.fechaModificacion).getTime());
  }, [allQuotes, filtros]);

  // Paginación
  const paginationConfig: QuotePaginationConfig = useMemo(() => {
    const totalItems = filteredQuotes.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    return {
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      totalItems,
      totalPages
    };
  }, [filteredQuotes.length, currentPage]);

  const quotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuotes, currentPage]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const stats = {
      total: allQuotes.length,
      borradores: allQuotes.filter(q => q.estado === 'borrador').length,
      enviadas: allQuotes.filter(q => q.estado === 'enviada').length,
      aceptadas: allQuotes.filter(q => q.estado === 'aceptada').length,
      rechazadas: allQuotes.filter(q => q.estado === 'rechazada').length,
      expiradas: allQuotes.filter(q => q.estado === 'expirada').length,
      montoTotal: allQuotes.reduce((sum, q) => sum + q.total, 0)
    };
    return stats;
  }, [allQuotes]);

  // Funciones de paginación
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationConfig.totalPages) {
      setCurrentPage(page);
    }
  }, [paginationConfig.totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < paginationConfig.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, paginationConfig.totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Acciones CRUD
  const crearCotizacion = async (
    nuevaCotizacion: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'>,
    extras?: { globalDiscountPct?: number; globalDiscountAmount?: number; lineDiscountTotal?: number }
  ): Promise<boolean> => {
    try {
      if (!user) throw new Error('Usuario no autenticado');
      // Validar que el usuario existe en tabla usuarios (FK vendedor_id)
      const { data: vendedorRow, error: vendedorErr } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      if (vendedorErr) {
        console.error('Error buscando vendedor:', vendedorErr);
        throw new Error('No se pudo validar el usuario vendedor');
      }
      if (!vendedorRow) {
        throw new Error('El usuario actual no existe en la tabla usuarios (FK vendedor_id)');
      }
      // Asegurar serie activa (auto-creación defensiva)
      const year = new Date().getFullYear();
      const serie = await ensureActiveDocumentSeries('cotizacion', year);
      if (!serie) {
        throw new Error(`No se pudo asegurar serie activa para cotizacion - ${year}. Verifica RLS/permisos o crea la fila manualmente.`);
      }
      // Resolver cliente_principal_id (preferir id directo si viene del selector)
      let clientePrincipalId: number | null = null;
      if (nuevaCotizacion.cliente) {
        const c = nuevaCotizacion.cliente;
        // Prefer numeric id if present via narrow cast from any external selector shape
        const maybeId = (c as unknown as { id?: number }).id;
        if (typeof maybeId === 'number') {
          clientePrincipalId = maybeId;
        } else if (c.rut) {
          const rawRut = c.rut.trim();
          const normRut = normalizeRut(rawRut);
          try {
            // Buscar por raw o normalizado (OR)
            const { data: encontrados, error: cliErr } = await supabase
              .from('clientes')
              .select('id,rut')
              .or(`rut.eq.${rawRut},rut.eq.${normRut}`);
            if (cliErr) {
              console.warn('Lookup clientes error (continuo):', cliErr.message);
            } else if (encontrados && encontrados.length > 0) {
              // Elegir el que normalice igual
              const match = encontrados.find(e => normalizeRut(e.rut) === normRut) || encontrados[0];
              clientePrincipalId = match.id;
            } else {
              // Intento de creación básica si tenemos datos mínimos
              if (c.razonSocial || c.nombreFantasia) {
                const nombre: string = c.nombreFantasia ?? c.razonSocial;
                const insertPayload: Database['public']['Tables']['clientes']['Insert'] = {
                  rut: normRut,
                  nombre_razon_social: nombre,
                  nombre_fantasia: c.nombreFantasia || null,
                  direccion: c.direccion || null,
                  ciudad: c.ciudad || null,
                  comuna: c.comuna || null
                };
                console.debug('Creando cliente on-the-fly para cotizacion:', insertPayload);
                const { data: nuevoCli, error: insCliErr } = await supabase
                  .from('clientes')
                  .insert([insertPayload])
                  .select('id,rut')
                  .maybeSingle();
                if (insCliErr) {
                  console.warn('No se pudo crear cliente automáticamente:', insCliErr.message);
                } else if (nuevoCli?.id) {
                  clientePrincipalId = nuevoCli.id;
                }
              }
            }
          } catch (cliLookupErr: unknown) {
            console.error('Fallo inesperado buscando/creando cliente:', cliLookupErr);
          }
        }
      }

      const validez = nuevaCotizacion.condicionesComerciales.validezOferta;
      let fechaVencimiento: string | null = null;
      if (validez && Number.isFinite(validez)) {
        const d = new Date();
        d.setDate(d.getDate() + validez);
        fechaVencimiento = d.toISOString().split('T')[0];
      }
      // Insert cabecera
      const cabeceraPayload: Database['public']['Tables']['cotizaciones']['Insert'] = {
        estado: nuevaCotizacion.estado || 'borrador',
        vendedor_id: user.id,
        cliente_principal_id: clientePrincipalId || null,
        obra_id: nuevaCotizacion.obraId || null,
        validez_dias: nuevaCotizacion.condicionesComerciales.validezOferta || 30,
        condicion_pago_texto: nuevaCotizacion.condicionesComerciales.formaPago || null,
        plazo_entrega_texto: nuevaCotizacion.condicionesComerciales.tiempoEntrega || null,
        observaciones_pago: nuevaCotizacion.condicionesComerciales.observaciones || null,
        // total_neto representa el neto después de descuentos de línea + global (ya viene en subtotal dominio tras recálculo)
        total_neto: nuevaCotizacion.subtotal ?? 0,
        // total_descuento: sólo descuentos de línea (sin incluir global)
        total_descuento: extras?.lineDiscountTotal ?? 0,
        descuento_global_pct: typeof extras?.globalDiscountPct === 'number' ? extras?.globalDiscountPct : null,
        descuento_global_monto: extras?.globalDiscountAmount ?? 0,
        iva_pct: 19,
        iva_monto: nuevaCotizacion.iva ?? 0,
        total_final: nuevaCotizacion.total ?? 0,
        fecha_vencimiento: fechaVencimiento
      };
      console.debug('Insert cotizacion payload', cabeceraPayload);
      const { data: cabeceraArr, error: insertError } = await supabase.from('cotizaciones')
        .insert([cabeceraPayload])
        .select('*');
      if (insertError) {
        console.error('Insert cotizacion error detail:', insertError?.message, insertError);
        throw insertError;
      }
      const cabecera = cabeceraArr?.[0];
      if (insertError) throw insertError;
      const cotizacionId = cabecera!.id;

      // Actualizar dinero_cotizado en cliente_saldos
      if (clientePrincipalId && (cabecera.total_final ?? cabecera.total_neto ?? 0) > 0) {
        const monto = (cabecera.total_final ?? cabecera.total_neto ?? 0) as number;
        console.log('🔄 Actualizando saldo para cotización:', { clienteId: clientePrincipalId, monto, total_final: cabecera.total_final, total_neto: cabecera.total_neto });

        // Obtener el saldo más reciente
        const { data: saldoActual } = await supabase
          .from('cliente_saldos')
          .select('id, dinero_cotizado')
          .eq('cliente_id', clientePrincipalId)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Saldo actual:', saldoActual);
        if (saldoActual) {
          const nuevoDineroCotizado = (saldoActual.dinero_cotizado || 0) + monto;
          console.log('Actualizando saldo existente:', { id: saldoActual.id, nuevoDineroCotizado });
          await supabase
            .from('cliente_saldos')
            .update({ dinero_cotizado: nuevoDineroCotizado })
            .eq('id', saldoActual.id);
        } else {
          console.log('Insertando nuevo saldo:', { clienteId: clientePrincipalId, monto });
          await supabase
            .from('cliente_saldos')
            .insert({
              cliente_id: clientePrincipalId,
              snapshot_date: new Date().toISOString().split('T')[0],
              pagado: 0,
              pendiente: 0,
              vencido: 0,
              dinero_cotizado: monto
            });
        }
      }

      // Insert items
      if (nuevaCotizacion.items.length > 0) {
        const itemsPayload = nuevaCotizacion.items.map(it => ({
          cotizacion_id: cotizacionId,
          producto_id: it.productId || undefined,
          descripcion: it.descripcion,
          unidad: it.unidad,
          cantidad: it.cantidad,
            precio_unitario_neto: it.precioUnitario,
          descuento_pct: it.descuento || null,
          descuento_monto: 0, // backend podría recalcular
          iva_aplicable: true,
          subtotal_neto: it.cantidad * it.precioUnitario,
          total_neto: it.subtotal
        }));
  console.debug('Insert cotizacion_items payload', itemsPayload);
  const { error: itemsError } = await supabase.from('cotizacion_items').insert(itemsPayload);
        if (itemsError) {
          console.error('Insert items error detail:', itemsError?.message, itemsError);
          throw itemsError;
        }
      }

      // Insert despacho opcional (solo si hay dirección o costo)
      if (nuevaCotizacion.despacho && (nuevaCotizacion.despacho.direccion || nuevaCotizacion.despacho.costoDespacho)) {
  const despachoPayload = {
          cotizacion_id: cotizacionId,
          direccion: nuevaCotizacion.despacho.direccion || '',
          ciudad_texto: nuevaCotizacion.despacho.ciudad || null,
          costo: nuevaCotizacion.despacho.costoDespacho || 0,
          fecha_entrega: nuevaCotizacion.despacho.fechaEstimada || null,
          observaciones: nuevaCotizacion.despacho.observaciones || null
  };
  console.debug('Insert cotizacion_despachos payload', despachoPayload);
  const { error: despError } = await supabase.from('cotizacion_despachos').insert(despachoPayload);
        if (despError) {
          console.error('Insert despacho error detail:', despError?.message, despError);
          throw despError;
        }
      }

      // Refetch respetando permisos del usuario
      let reloadQuery = supabase
        .from('cotizaciones')
        .select(`*, cotizacion_items(*, productos(*)), cotizacion_clientes(*, clientes(*)), cotizacion_despachos(*), clientes!cotizaciones_cliente_principal_id_fkey(*), usuarios!cotizaciones_vendedor_id_fkey(*)`)
        .order('updated_at', { ascending: false });
      
      // Si no es admin, solo cargar cotizaciones del vendedor
      if (!isAdmin && user?.id) {
        reloadQuery = reloadQuery.eq('vendedor_id', user.id);
      }
      
      const { data, error: reloadErr } = await reloadQuery;
      if (reloadErr) {
        console.error('Reload cotizaciones error:', reloadErr?.message, reloadErr);
        throw reloadErr;
      }
      const mapped: Quote[] = (data || []).map((row) => mapCotizacionToDomain({
        cotizacion: row as CotizacionRow,
        items: ((row as unknown as { cotizacion_items?: ItemRow[] }).cotizacion_items) || [],
        clientes_adicionales: ((row as unknown as { cotizacion_clientes?: { cliente?: ClienteRow | null }[] }).cotizacion_clientes) || [],
        despacho: ((row as unknown as { cotizacion_despachos?: DespRow[] }).cotizacion_despachos)?.[0] || null,
        cliente_principal: (row as unknown as { clientes?: ClienteRow }).clientes,
        vendedor: (row as unknown as { usuarios?: UsuarioRow }).usuarios
      } as CotizacionAggregate));
      setAllQuotes(mapped);
      return true;
    } catch (error: unknown) {
      console.error('Error creating quote:', error);
      return false;
    }
  };

  const actualizarCotizacion = async (id: string, datosActualizados: Partial<Quote>): Promise<boolean> => {
    try {
      // Encontrar registro por folio (id en dominio == folio)
      const target = allQuotes.find(q => q.id === id);
      if (!target) throw new Error('Cotización no encontrada');

      // Obtener datos actuales antes de actualizar
      const { data: oldQuote, error: oldError } = await supabase
        .from('cotizaciones')
        .select('id, cliente_principal_id, total_final, total_neto, estado')
        .eq('folio', id)
        .single();
      if (oldError) throw oldError;
      
      const numericId = oldQuote.id;

      // Si hay items, actualizarlos
      if (datosActualizados.items) {
        // Eliminar items existentes
        await supabase
          .from('cotizacion_items')
          .delete()
          .eq('cotizacion_id', numericId);

        // Insertar nuevos items con los nombres correctos de campos
        const itemsToInsert = datosActualizados.items.map((item) => {
          const descuentoPct = item.descuento || 0;
          const montoOriginal = item.cantidad * item.precioUnitario;
          const descuentoMonto = montoOriginal * (descuentoPct / 100);
          
          return {
            cotizacion_id: numericId,
            producto_id: item.productId || null,
            descripcion: item.descripcion,
            unidad: item.unidad,
            cantidad: item.cantidad,
            precio_unitario_neto: item.precioUnitario,
            descuento_pct: descuentoPct,
            descuento_monto: descuentoMonto,
            iva_aplicable: true,
            subtotal_neto: item.subtotal,
            total_neto: item.subtotal
          };
        });

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('cotizacion_items')
            .insert(itemsToInsert);
          if (itemsError) throw itemsError;
        }
      }

      // Si hay despacho, actualizarlo
      if (datosActualizados.despacho) {
        // Eliminar despacho existente
        await supabase
          .from('cotizacion_despachos')
          .delete()
          .eq('cotizacion_id', numericId);

        // Insertar nuevo despacho con los nombres correctos de campos
        const { error: despachoError } = await supabase
          .from('cotizacion_despachos')
          .insert({
            cotizacion_id: numericId,
            direccion: datosActualizados.despacho.direccion,
            complemento: null,
            comuna_id: null,
            region_id: null,
            ciudad_texto: datosActualizados.despacho.ciudad || null,
            costo: datosActualizados.despacho.costoDespacho || 0,
            fecha_entrega: datosActualizados.despacho.fechaEstimada || null,
            observaciones: datosActualizados.despacho.observaciones || null
          });
        if (despachoError) throw despachoError;
      }

      // Calcular totales si hay items
      let calculatedSubtotal = datosActualizados.subtotal;
      let calculatedDescuento = datosActualizados.descuentoTotal;
      let calculatedIva = datosActualizados.iva;
      let calculatedTotal = datosActualizados.total;

      if (datosActualizados.items) {
        calculatedSubtotal = datosActualizados.items.reduce((sum, item) => sum + item.subtotal, 0);
        calculatedDescuento = datosActualizados.items.reduce((sum, item) => {
          const porcentaje = Math.max(0, Math.min(100, item.descuento || 0));
          const montoOriginal = (item.cantidad || 0) * (item.precioUnitario || 0);
          const montoDescontado = montoOriginal * (porcentaje / 100);
          return sum + montoDescontado;
        }, 0);
        calculatedIva = calculatedSubtotal * 0.19;
        calculatedTotal = calculatedSubtotal + calculatedIva + (datosActualizados.despacho?.costoDespacho || 0);
      }

      const updates: Database['public']['Tables']['cotizaciones']['Update'] = {
        updated_at: new Date().toISOString()
      };
      if (datosActualizados.estado) updates.estado = datosActualizados.estado;
      if (datosActualizados.condicionesComerciales) {
        updates.validez_dias = datosActualizados.condicionesComerciales.validezOferta;
        updates.condicion_pago_texto = datosActualizados.condicionesComerciales.formaPago;
        updates.plazo_entrega_texto = datosActualizados.condicionesComerciales.tiempoEntrega;
        updates.observaciones_pago = datosActualizados.condicionesComerciales.observaciones;
      }
      if (typeof calculatedSubtotal === 'number') updates.total_neto = calculatedSubtotal;
      if (typeof calculatedDescuento === 'number') updates.total_descuento = calculatedDescuento;
      if (typeof calculatedIva === 'number') updates.iva_monto = calculatedIva;
      if (typeof calculatedTotal === 'number') updates.total_final = calculatedTotal;
      if (datosActualizados.vendedorId) updates.vendedor_id = datosActualizados.vendedorId;

      const { data: updatedQuote, error: updError } = await supabase
        .from('cotizaciones')
        .update(updates)
        .eq('folio', id)
        .select('cliente_principal_id, total_final, total_neto, estado')
        .single();
      if (updError) throw updError;

      // Rehidratar datos después de actualizar
      await refetchQuotes();

      // Ajustar dinero_cotizado si cambió el total y la cotización no está aceptada
      if (oldQuote && updatedQuote && oldQuote.estado !== 'aceptada' && updatedQuote.estado !== 'aceptada') {
        const oldTotal = oldQuote.total_final ?? oldQuote.total_neto ?? 0;
        const newTotal = updatedQuote.total_final ?? updatedQuote.total_neto ?? 0;
        const difference = newTotal - oldTotal;

        if (difference !== 0 && updatedQuote.cliente_principal_id) {
          const { data: saldoActual } = await supabase
            .from('cliente_saldos')
            .select('id, dinero_cotizado')
            .eq('cliente_id', updatedQuote.cliente_principal_id)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (saldoActual) {
            const nuevoDineroCotizado = (saldoActual.dinero_cotizado || 0) + difference;
            await supabase
              .from('cliente_saldos')
              .update({ dinero_cotizado: Math.max(0, nuevoDineroCotizado) })
              .eq('id', saldoActual.id);
          } else if (newTotal > 0) {
            await supabase
              .from('cliente_saldos')
              .insert({
                cliente_id: updatedQuote.cliente_principal_id,
                snapshot_date: new Date().toISOString().split('T')[0],
                pagado: 0,
                pendiente: 0,
                vencido: 0,
                dinero_cotizado: newTotal
              });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating quote:', error);
      return false;
    }
  };

  const eliminarCotizacion = async (id: string): Promise<boolean> => {
    try {
      // Validar permisos: solo admin y dueño pueden eliminar cotizaciones
      if (!isAdmin) {
        console.error('Permisos insuficientes para eliminar cotización');
        return false;
      }

      // 1. Obtener id numérico real por folio y datos para ajustar saldos
      const { data: cot, error: findErr } = await supabase
        .from('cotizaciones')
        .select('id, cliente_principal_id, total_final, total_neto, estado')
        .eq('folio', id)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!cot) throw new Error('Cotización no encontrada');
      const numericId = cot.id;

      // Ajustar dinero_cotizado si la cotización no está aceptada
      if (cot.estado !== 'aceptada' && cot.cliente_principal_id) {
        const total = cot.total_final ?? cot.total_neto ?? 0;
        if (total > 0) {
          const { data: saldoActual } = await supabase
            .from('cliente_saldos')
            .select('id, dinero_cotizado')
            .eq('cliente_id', cot.cliente_principal_id)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (saldoActual) {
            const nuevoDineroCotizado = Math.max(0, (saldoActual.dinero_cotizado || 0) - total);
            await supabase
              .from('cliente_saldos')
              .update({ dinero_cotizado: nuevoDineroCotizado })
              .eq('id', saldoActual.id);
          }
        }
      }

      // 2. Eliminar nota de venta asociada (y sus ítems)
      try {
        const { data: nv } = await supabase
          .from('notas_venta')
          .select('id')
          .eq('cotizacion_id', numericId)
          .maybeSingle();
        if (nv?.id) {
          const { error: delNVItems } = await supabase
            .from('nota_venta_items')
            .delete()
            .eq('nota_venta_id', nv.id);
          if (delNVItems) throw delNVItems;
          const { error: delNV } = await supabase
            .from('notas_venta')
            .delete()
            .eq('id', nv.id);
          if (delNV) throw delNV;
        }
      } catch (e) {
  const msg = (e as unknown as { message?: string })?.message;
  console.warn('No se pudo eliminar nota de venta asociada (continuando):', msg);
      }

      // 3. Eliminar dependientes de la cotización
      await supabase.from('cotizacion_items').delete().eq('cotizacion_id', numericId);
      await supabase.from('cotizacion_despachos').delete().eq('cotizacion_id', numericId);
      await supabase.from('cotizacion_clientes').delete().eq('cotizacion_id', numericId);

      // 4. Eliminar cotización
      const { error: delError } = await supabase.from('cotizaciones').delete().eq('id', numericId);
      if (delError) throw delError;
      
      // Rehidratar datos después de eliminar
      await refetchQuotes();
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  };

  const duplicarCotizacion = async (id: string): Promise<boolean> => {
    try {
      const original = allQuotes.find(q => q.id === id);
      if (!original) return false;
      const nueva = {
        cliente: original.cliente,
        estado: 'borrador' as QuoteStatus,
        vendedorId: original.vendedorId,
        vendedorNombre: original.vendedorNombre,
        items: original.items,
        despacho: original.despacho,
        condicionesComerciales: original.condicionesComerciales,
        subtotal: original.subtotal,
        descuentoTotal: original.descuentoTotal,
        iva: original.iva,
        total: original.total,
        notas: original.notas,
        fechaExpiracion: original.fechaExpiracion
      };
      return await crearCotizacion(nueva);
    } catch (error) {
      console.error('Error duplicating quote:', error);
      return false;
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: QuoteStatus): Promise<boolean> => {
    return actualizarCotizacion(id, { estado: nuevoEstado });
  };

  const cancelarCotizacion = async (id: string): Promise<boolean> => {
    try {
      // Solo admin y dueño pueden cancelar cotizaciones
      if (!isAdmin) {
        console.error('Permisos insuficientes para cancelar cotización');
        return false;
      }

      // Obtener la cotización para validar
      const cotizacion = allQuotes.find(q => q.id === id);
      if (!cotizacion) {
        console.error('Cotización no encontrada');
        return false;
      }

      // No se puede cancelar una cotización ya aceptada
      if (cotizacion.estado === 'aceptada') {
        console.error('No se puede cancelar una cotización aceptada');
        return false;
      }

      // Cambiar estado a rechazada (cancelar cotización)
      return await cambiarEstado(id, 'rechazada');
    } catch (error) {
      console.error('Error cancelando cotización:', error);
      return false;
    }
  };

  const actualizarPrioridad = async (id: string, prioridad: number | null): Promise<boolean> => {
    try {
      // Solo vendedores pueden actualizar la prioridad de sus propias cotizaciones
      const cotizacion = allQuotes.find(q => q.id === id);
      if (!cotizacion) {
        console.error('Cotización no encontrada');
        return false;
      }

      // Verificar que el usuario sea el vendedor de la cotización (no admin)
      if (user?.id !== cotizacion.vendedorId) {
        console.error('Solo el vendedor puede priorizar sus cotizaciones');
        return false;
      }

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('cotizaciones')
        .update({ prioridad_vendedor: prioridad } as { prioridad_vendedor: number | null })
        .eq('folio', id);

      if (updateError) throw updateError;

      // Recargar datos respetando los permisos del usuario
      let query = supabase
        .from('cotizaciones')
        .select(`*, cotizacion_items(*, productos(*)), cotizacion_clientes(*, clientes(*)), cotizacion_despachos(*), clientes!cotizaciones_cliente_principal_id_fkey(*), usuarios!cotizaciones_vendedor_id_fkey(*)`)
        .order('updated_at', { ascending: false });

      // Si no es admin, solo cargar cotizaciones del vendedor
      if (!isAdmin && user?.id) {
        query = query.eq('vendedor_id', user.id);
      }
      
      const { data, error: reloadErr } = await query;
      
      if (reloadErr) throw reloadErr;
      
      const mapped: Quote[] = (data || []).map((row) => mapCotizacionToDomain({
        cotizacion: row as CotizacionRow,
        items: ((row as unknown as { cotizacion_items?: ItemRow[] }).cotizacion_items) || [],
        clientes_adicionales: ((row as unknown as { cotizacion_clientes?: { cliente?: ClienteRow | null }[] }).cotizacion_clientes) || [],
        despacho: ((row as unknown as { cotizacion_despachos?: DespRow[] }).cotizacion_despachos)?.[0] || null,
        cliente_principal: (row as unknown as { clientes?: ClienteRow }).clientes,
        vendedor: (row as unknown as { usuarios?: UsuarioRow }).usuarios
      } as CotizacionAggregate));
      
      setAllQuotes(mapped);
      return true;
    } catch (error) {
      console.error('Error actualizando prioridad:', error);
      return false;
    }
  };

  // Utilidades
  const formatMoney = (amount: number): string => {
    return QuoteAmountCalculator.formatCurrency(amount);
  };

  const getStatusColor = (status: QuoteStatus) => {
    return QuoteStatusValidator.getStatusColor(status);
  };

  const canEdit = (cotizacion: Quote): boolean => {
    if (isAdmin) return true;
    if (user?.id !== cotizacion.vendedorId) return false;
    // Permitir editar cotizaciones en borrador y aceptadas
    return cotizacion.estado === 'borrador' || cotizacion.estado === 'aceptada';
  };

  const canDelete = (cotizacion: Quote): boolean => {
    if (!isAdmin) return false;
    // No se puede eliminar cotizaciones aceptadas o rechazadas (canceladas)
    return cotizacion.estado !== 'aceptada' && cotizacion.estado !== 'rechazada';
  };

  // Optimización: Retornar la cotización desde el array completo sin filtros adicionales
  // para evitar búsquedas o procesamiento adicional
  const getQuoteById = (id: string): Quote | null => {
    return allQuotes.find(q => q.id === id) || null;
  };

  return {
    // Estado
    quotes,
    todasLasCotizaciones: allQuotes,
    loading,
    error,
    
    // Estadísticas
    estadisticas,
    
    // Filtros y paginación
    filtros,
    setFiltros,
    paginationConfig,
    goToPage,
    goToNextPage,
    goToPrevPage,
    
    // Acciones CRUD
    crearCotizacion,
    actualizarCotizacion,
    eliminarCotizacion,
    duplicarCotizacion,
    cambiarEstado,
    cancelarCotizacion,
    actualizarPrioridad,
    
    // Utilidades
    formatMoney,
    getStatusColor,
    getQuoteById,
    canEdit,
    canDelete,
    
    // Info del usuario
  userId: user?.id || null,
  userName: user?.name || user?.email || null,
    isAdmin
  };
}
