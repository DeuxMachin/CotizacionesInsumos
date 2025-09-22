"use client";

import React, { useCallback } from 'react';
import { 
  FiArrowLeft, 
  FiDownload, 
  FiEdit2, 
  FiFileText, 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiCalendar, 
  FiTruck, 
  FiClock, 
  FiDollarSign, 
  FiInfo,
  FiPackage,
  FiShield,
  FiCreditCard,
  FiAlertCircle
} from 'react-icons/fi';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { NotasVentaService, SalesNoteRecord, SalesNoteItemRow } from '@/services/notasVentaService';
import type { QuoteItem } from '@/core/domain/quote/Quote';
import { FiCheckCircle, FiShoppingCart } from 'react-icons/fi';
import { ProductsForm } from '@/features/quotes/ui/components/ProductsForm';
import { downloadFileFromResponse } from '@/lib/download';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getQuoteById, formatMoney, getStatusColor, loading, eliminarCotizacion } = useQuotes();
  
  const quoteFolio = params.id as string; // folio (ej: COT000002)
  const quote = getQuoteById ? getQuoteById(quoteFolio) : null;
  
  // Estados principales
  const [notaVenta, setNotaVenta] = React.useState<SalesNoteRecord | null>(null);
  const [nvItems, setNvItems] = React.useState<SalesNoteItemRow[]>([]);
  const [, setNvLoading] = React.useState(false);
  const [nvAddDraft, setNvAddDraft] = React.useState({ descripcion:'', unidad:'Unidad', cantidad:1, precio:0, descuento:0 });
  const [nvSaving, setNvSaving] = React.useState(false);
  const [nvError, setNvError] = React.useState<string | null>(null);
  
  // Estados para modal de selección de productos previo a conversión
  const [showProductsModal, setShowProductsModal] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<QuoteItem[]>([]);
  const [, setIsSelectingProducts] = React.useState(false);

  // Estados para conversión a nota de venta
  const [creatingSale, setCreatingSale] = React.useState(false);
  const [saleError, setSaleError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  // ===== HOOKS CALLBACK ANTES DE RETURNS CONDICIONALES =====
  const handleDeleteQuote = React.useCallback(async () => {
    if (!quote) return;
    if (!confirm('¿Eliminar DEFINITIVAMENTE esta cotización y todos sus datos relacionados (ítems, despacho, clientes adicionales y nota de venta si existe)?')) return;
    const ok = await eliminarCotizacion(quote.id);
    if (ok) {
      router.push('/dashboard/cotizaciones');
    } else {
      alert('No se pudo eliminar la cotización');
    }
  }, [quote, eliminarCotizacion, router]);
  
  // Cargar nota de venta
  const loadNotaVenta = React.useCallback(async () => {
    if (!quote) return;
    setNvLoading(true);
    try {
      const cotizacionNumericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);
      if (!cotizacionNumericId) { setNvLoading(false); return; }
      const nv = await NotasVentaService.getByCotizacionId(cotizacionNumericId);
      if (nv) {
        setNotaVenta(nv);
        const its = await NotasVentaService.getItems(nv.id);
        setNvItems(its);
      }
  } catch (e: unknown) { setNvError(e instanceof Error ? e.message : 'Error cargando nota de venta'); }
    finally { setNvLoading(false); }
  }, [quote]);

  // Abrir selección de productos
  const handleOpenProductSelection = useCallback(() => {
    if (!quote) return;
    // Inicializa con los items actuales
    setSelectedItems([...quote.items]);
    setShowProductsModal(true);
  }, [quote]);
  
  // Cancelar selección de productos
  const handleCancelProductSelection = useCallback(() => {
    setShowProductsModal(false);
    setSelectedItems([]);
  }, []);
  
  // Guardar nota de venta
  const handleSaveNotaVenta = useCallback(async () => {
    if (!quote || !selectedItems.length) return;
    setCreatingSale(true);
    setSaleError(null);
    setIsSelectingProducts(true);
    
    try {
      const cotizacionNumericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);
      await NotasVentaService.convertFromQuote(quote, {
        formaPago: quote.condicionesComerciales?.formaPago,
        cotizacionDbId: cotizacionNumericId || undefined,
        itemsOverride: selectedItems,
        finalizarInmediatamente: true // La nota queda confirmada/aceptada de inmediato
      });
      
      setShowProductsModal(false);
      await loadNotaVenta(); // Recargar datos de la nota
      
    } catch (e: unknown) {
      console.error('Error creando nota de venta', e);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setSaleError(msg);
      alert('Error al crear nota de venta: ' + msg);
    } finally {
      setCreatingSale(false);
      setIsSelectingProducts(false);
    }
  }, [quote, selectedItems, loadNotaVenta]);

  // Efecto para cargar la nota de venta al inicio
  React.useEffect(() => { loadNotaVenta(); }, [loadNotaVenta]);
  
  // ===== RETURNS CONDICIONALES =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Cargando cotización...
          </h3>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiFileText className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Cotización no encontrada
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            La cotización que buscas no existe o ha sido eliminada.
          </p>
          <button 
            onClick={() => router.push('/dashboard/cotizaciones')}
            className="btn-primary"
          >
            Volver a Cotizaciones
          </button>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(quote.estado);

  // Calcular días restantes para expiración
  const getDaysUntilExpiration = () => {
    if (!quote.fechaExpiracion) return null;
    const today = new Date();
    const expiration = new Date(quote.fechaExpiracion);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExport = async () => {
    if (!quote) return;
    try {
      setExporting(true);
      const response = await fetch('/api/pdf/cotizacion/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }
      const filename = `cotizacion-${quote.numero || quote.id}.pdf`;
      await downloadFileFromResponse(response, filename);
    } catch (e: unknown) {
      console.error('Error descargando PDF de cotización', e);
      alert(`No se pudo generar el PDF: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleEdit = () => {
    // Funcionalidad de edición será implementada después
    alert('Funcionalidad de edición en desarrollo');
  };

  // (Las funciones handleOpenProductSelection, handleCancelProductSelection y handleSaveNotaVenta se movieron arriba)
  
  // (loadNotaVenta y useEffect ya movidos arriba)

  const recalcNotaVentaTotals = (base: SalesNoteRecord, items: SalesNoteItemRow[]) => {
    const subtotal = items.reduce((s,it)=> s + (it.cantidad * it.precio_unitario_neto),0);
    const descLineas = items.reduce((s,it)=> s + (it.descuento_monto || 0),0);
    const descGlobal = base.descuento_global_monto || 0;
    const descuento_total = descLineas + descGlobal;
    const subtotal_neto_post_desc = subtotal - descuento_total;
    const iva_monto = Math.round(subtotal_neto_post_desc * (base.iva_pct||19)/100);
    const total = subtotal_neto_post_desc + iva_monto;
    return { subtotal, descuento_lineas_monto: descLineas, descuento_total, subtotal_neto_post_desc, iva_monto, total };
  };

  const handleAddNvItem = async () => {
    if (!notaVenta || notaVenta.estado !== 'borrador') return;
    if (!nvAddDraft.descripcion) return;
    setNvSaving(true); setNvError(null);
    try {
      const bruto = nvAddDraft.cantidad * nvAddDraft.precio;
      const descMonto = Math.round(bruto * (nvAddDraft.descuento/100));
      const subtotal_neto = bruto - descMonto;
      const inserted = await NotasVentaService.addItem(notaVenta.id, {
        descripcion: nvAddDraft.descripcion,
        unidad: nvAddDraft.unidad,
        cantidad: nvAddDraft.cantidad,
        precio_unitario_neto: nvAddDraft.precio,
        descuento_pct: nvAddDraft.descuento,
        descuento_monto: descMonto,
        subtotal_neto,
        total_neto: subtotal_neto
      });
      const updatedItems = [...nvItems, inserted];
      setNvItems(updatedItems);
      const patch = recalcNotaVentaTotals(notaVenta, updatedItems);
      const updated = await NotasVentaService.update(notaVenta.id, patch);
      setNotaVenta(updated);
      setNvAddDraft({ descripcion:'', unidad:'Unidad', cantidad:1, precio:0, descuento:0 });
  } catch(e: unknown){ setNvError(e instanceof Error ? e.message : 'Error agregando ítem'); }
    finally { setNvSaving(false); }
  };

  const handleRemoveNvItem = async (itemId: number) => {
    if (!notaVenta || notaVenta.estado !== 'borrador') return;
    if (!confirm('Eliminar ítem?')) return;
    setNvSaving(true); setNvError(null);
    try {
      await NotasVentaService.removeItem(itemId);
      const remaining = nvItems.filter(i=> i.id!==itemId);
      setNvItems(remaining);
      const patch = recalcNotaVentaTotals(notaVenta, remaining);
      const updated = await NotasVentaService.update(notaVenta.id, patch);
      setNotaVenta(updated);
  } catch(e: unknown){ setNvError(e instanceof Error ? e.message : 'Error eliminando ítem'); }
    finally { setNvSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div 
        className="p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <button
            onClick={() => {
              const from = searchParams.get('from');
              const clientId = searchParams.get('client_id');
              if (from === 'client' && clientId) {
                router.push(`/dashboard/clientes/${clientId}`);
              } else {
                router.push('/dashboard/cotizaciones');
              }
            }}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
            aria-label="Volver"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div 
            className="p-2 sm:p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
          >
            <FiFileText className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {notaVenta 
                ? `Nota de Venta ${notaVenta.folio || 'NV' + quote.numero.substring(3)}` 
                : quote.estado === 'aceptada' 
                  ? `Nota de Venta ${quote.numero.replace('COT', 'NV')}` 
                  : `Cotización ${quote.numero}`
              }
            </h1>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1">
              <span 
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap status-badge-${quote.estado}`}
                style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
              >
                {quote.estado === 'aceptada' && notaVenta ? 'Confirmada' : quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
                {notaVenta && quote.estado === 'aceptada' && (
                  <span className="ml-1 inline-flex items-center">• Finalizada</span>
                )}
              </span>
              {daysUntilExpiration !== null && (
                <span className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  <FiClock className="w-3 sm:w-4 h-3 sm:h-4" />
                  {daysUntilExpiration > 0 
                    ? `Expira en ${daysUntilExpiration} días`
                    : daysUntilExpiration === 0 
                      ? 'Expira hoy'
                      : `Expiró hace ${Math.abs(daysUntilExpiration)} días`
                  }
                  {daysUntilExpiration !== null && daysUntilExpiration <= 5 && (
                    <FiAlertCircle className="w-3 sm:w-4 h-3 sm:h-4 ml-1" style={{ color: 'var(--danger-text)' }} />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0 flex-wrap">
          {!notaVenta && (
            <button
              onClick={handleOpenProductSelection}
              disabled={creatingSale}
              className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
              style={creatingSale ? { opacity: .7, cursor:'wait' } : {}}
            >
              <FiShoppingCart className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden xs:inline">Pasar a Venta</span>
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
            style={exporting ? { opacity: .7, cursor: 'wait' } : {}}
          >
            <FiDownload className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">{exporting ? 'Descargando...' : 'Descargar'}</span>
          </button>
          <button
            onClick={handleEdit}
            className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
          >
            <FiEdit2 className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Editar</span>
          </button>
          <button
            onClick={handleDeleteQuote}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm rounded-lg"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
          >
            <FiAlertCircle className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Eliminar</span>
          </button>
          {saleError && (
            <span className="text-xs text-red-500 w-full">{saleError}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna izquierda - Información del cliente y productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div 
            className="rounded-lg p-6 w-full"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Razón Social
                </label>
                <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.razonSocial || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  RUT
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.rut || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Nombre Fantasía
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.nombreFantasia || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Giro Comercial
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.giro || 'No especificado'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiMapPin className="w-4 h-4" />
                  Dirección
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.direccion ? 
                    `${quote.cliente.direccion}, ${quote.cliente.comuna || ''}, ${quote.cliente.ciudad || ''}` : 
                    'No especificada'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Contacto
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.nombreContacto || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiPhone className="w-4 h-4" />
                  Teléfono
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.telefonoContacto || quote.cliente.telefono || 'No especificado'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiMail className="w-4 h-4" />
                  Email
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.email || 'No especificado'}
                </p>
              </div>
            </div>
          </div>

          {/* Detalle de Productos / Ítems */}
          <div 
            className="rounded-lg p-4 sm:p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiPackage className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              {notaVenta ? 'Ítems Nota de Venta' : 'Detalle de Productos'} ({notaVenta ? nvItems.length : (quote.items?.length || 0)} ítems)
              {notaVenta && <span className="ml-2 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                {notaVenta.estado === 'confirmada' ? 'No Editable' : 'Borrador'}
              </span>}
            </h3>
            {notaVenta && notaVenta.estado==='borrador' && (
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6 text-xs md:text-sm">
                <input placeholder="Descripción" value={nvAddDraft.descripcion} onChange={e=>setNvAddDraft({...nvAddDraft, descripcion:e.target.value})} className="px-2 py-1 rounded border col-span-2 md:col-span-2" style={{borderColor:'var(--border)'}} />
                <input placeholder="Unidad" value={nvAddDraft.unidad} onChange={e=>setNvAddDraft({...nvAddDraft, unidad:e.target.value})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <input type="number" min={1} value={nvAddDraft.cantidad} onChange={e=>setNvAddDraft({...nvAddDraft, cantidad: parseFloat(e.target.value)||1})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <input type="number" min={0} value={nvAddDraft.precio} onChange={e=>setNvAddDraft({...nvAddDraft, precio: parseFloat(e.target.value)||0})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <input type="number" min={0} max={100} value={nvAddDraft.descuento} onChange={e=>setNvAddDraft({...nvAddDraft, descuento: parseFloat(e.target.value)||0})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <button onClick={handleAddNvItem} disabled={nvSaving || !nvAddDraft.descripcion} className="btn-primary col-span-2 md:col-span-1" style={nvSaving?{opacity:.7}:{}}>Agregar</button>
              </div>
            )}
            {notaVenta ? (
              nvItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left" style={{ borderColor: 'var(--border)' }}>
                        <th className="pb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Descripción</th>
                        <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Cant</th>
                        <th className="pb-3 font-medium text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>P.Unit</th>
                        <th className="pb-3 font-medium text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Desc</th>
                        <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Subtotal</th>
                        {notaVenta.estado==='borrador' && <th className="pb-3" />}
                      </tr>
                    </thead>
                    <tbody>
                      {nvItems.map((it, index) => (
                        <tr key={it.id || index} className={index !== nvItems.length - 1 ? 'border-b' : ''} style={{ borderColor: 'var(--border)' }}>
                          <td className="py-3 sm:py-4">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{it.descripcion}</span>
                            <span className="text-xs block sm:hidden mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {it.unidad} | {formatMoney(it.precio_unitario_neto)}{it.descuento_pct?` | -${it.descuento_pct}%`:''}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 text-right" style={{ color: 'var(--text-primary)' }}>{it.cantidad}</td>
                          <td className="py-3 sm:py-4 text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>{formatMoney(it.precio_unitario_neto)}</td>
                          <td className="py-3 sm:py-4 text-right hidden md:table-cell" style={{ color: it.descuento_pct? 'var(--success-text)':'var(--text-muted)' }}>{it.descuento_pct? it.descuento_pct+'%':'-'}</td>
                          <td className="py-3 sm:py-4 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{formatMoney(it.subtotal_neto)}</td>
                          {notaVenta.estado==='borrador' && (
                            <td className="py-3 sm:py-4 text-right">
                              <button onClick={()=>handleRemoveNvItem(it.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8"><p style={{ color: 'var(--text-secondary)' }}>No hay ítems en la nota de venta</p></div>
              )
            ) : (
              quote.items && quote.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr 
                      className="border-b text-left"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <th className="pb-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Código</th>
                      <th className="pb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Descripción</th>
                      <th className="pb-3 font-medium text-center hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Unidad</th>
                      <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Cantidad</th>
                      <th className="pb-3 font-medium text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Precio Unit.</th>
                      <th className="pb-3 font-medium text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Desc.</th>
                      <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr 
                        key={item.id || index}
                        className={index !== quote.items.length - 1 ? 'border-b' : ''}
                        style={{ borderColor: 'var(--border)' }}
                      >
                          <td className="py-3 sm:py-4 whitespace-nowrap">
                          <span className="font-mono text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.codigo}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4">
                          <span className="font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                            {item.descripcion}
                          </span>
                          <span className="text-xs block sm:hidden mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {item.unidad} | {formatMoney(item.precioUnitario)}
                            {item.descuento ? ` | -${item.descuento}%` : ''}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 text-center hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                          {item.unidad}
                        </td>
                        <td className="py-3 sm:py-4 text-right whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 sm:py-4 text-right hidden md:table-cell whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(item.precioUnitario)}
                        </td>
                        <td className="py-3 sm:py-4 text-right hidden md:table-cell whitespace-nowrap" style={{ color: item.descuento ? 'var(--success-text)' : 'var(--text-muted)' }}>
                          {item.descuento ? `${item.descuento}%` : '-'}
                        </td>
                        <td className="py-3 sm:py-4 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(item.subtotal)}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8"><p style={{ color: 'var(--text-secondary)' }}>No hay productos agregados a esta cotización</p></div>
            ))}
            {nvError && <p className="text-sm text-red-500 mt-4">{nvError}</p>}
          </div>

          {/* Información de Despacho */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiTruck className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Información de Despacho
            </h3>
            {quote.despacho ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Dirección de Entrega
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.direccion ? 
                      `${quote.despacho.direccion}, ${quote.despacho.comuna || ''}, ${quote.despacho.ciudad || ''}` : 
                      'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Fecha Estimada
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.fechaEstimada ? formatDate(quote.despacho.fechaEstimada) : 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Costo de Despacho
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.costoDespacho ? formatMoney(quote.despacho.costoDespacho) : 'No especificado'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Observaciones de Despacho
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.observaciones || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p style={{ color: 'var(--text-secondary)' }}>No hay información de despacho disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha - Resumen y condiciones */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div 
            className="rounded-lg p-4 sm:p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiDollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              {notaVenta ? 'Resumen Nota de Venta' : 'Resumen Financiero'}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {notaVenta ? (
                <>
                  <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color:'var(--text-secondary)' }}>Subtotal:</span><span className="font-medium" style={{ color:'var(--text-primary)' }}>{formatMoney(notaVenta.subtotal)}</span></div>
                  {notaVenta.descuento_lineas_monto>0 && <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color:'var(--text-secondary)' }}>Desc. Líneas:</span><span style={{ color:'var(--success-text)' }}> -{formatMoney(notaVenta.descuento_lineas_monto)}</span></div>}
                  {notaVenta.descuento_global_monto>0 && <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color:'var(--text-secondary)' }}>Desc. Global:</span><span style={{ color:'var(--success-text)' }}> -{formatMoney(notaVenta.descuento_global_monto)}</span></div>}
                  <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color:'var(--text-secondary)' }}>Subtotal Neto:</span><span style={{ color:'var(--text-primary)' }}>{formatMoney(notaVenta.subtotal_neto_post_desc)}</span></div>
                  <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color:'var(--text-secondary)' }}>IVA ({notaVenta.iva_pct}%):</span><span style={{ color:'var(--text-primary)' }}>{formatMoney(notaVenta.iva_monto)}</span></div>
                  <div className="border-t pt-3 sm:pt-4 flex justify-between items-center" style={{ borderColor:'var(--border)' }}>
                    <span className="text-lg sm:text-xl font-semibold" style={{ color:'var(--text-primary)' }}>Total:</span>
                    <span className="text-xl sm:text-2xl font-bold" style={{ color:'var(--accent-primary)' }}>{formatMoney(notaVenta.total)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span><span className="font-medium text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.subtotal)}</span></div>
                  {quote.descuentoTotal > 0 && (<div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color: 'var(--text-secondary)' }}>Descuento:</span><span className="font-medium text-base sm:text-lg" style={{ color: 'var(--success-text)' }}> -{formatMoney(quote.descuentoTotal)}</span></div>)}
                  <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span><span className="font-medium text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.iva)}</span></div>
                  <div className="border-t pt-3 sm:pt-4 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}><span className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Total:</span><span className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{formatMoney(quote.total)}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Información de Fechas */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiCalendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Fechas Importantes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Fecha de Creación
                </label>
                <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(quote.fechaCreacion)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Última Modificación
                </label>
                <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(quote.fechaModificacion)}
                </p>
              </div>
              {quote.fechaExpiracion && (
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Fecha de Expiración
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-medium" style={{ color: daysUntilExpiration && daysUntilExpiration <= 5 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                      {formatDate(quote.fechaExpiracion)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Condiciones Comerciales */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Condiciones Comerciales
            </h3>
            {quote.condicionesComerciales ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiClock className="w-4 h-4" />
                    Validez de la Oferta
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.validezOferta ? `${quote.condicionesComerciales.validezOferta} días` : 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiCreditCard className="w-4 h-4" />
                    Forma de Pago
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.formaPago || 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiTruck className="w-4 h-4" />
                    Tiempo de Entrega
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.tiempoEntrega || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiShield className="w-4 h-4" />
                    Garantía
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.garantia || 'No especificada'}
                  </p>
                </div>
                {quote.condicionesComerciales.observaciones && (
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiInfo className="w-4 h-4" />
                      Observaciones
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.condicionesComerciales.observaciones}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p style={{ color: 'var(--text-secondary)' }}>No hay condiciones comerciales definidas</p>
              </div>
            )}
          </div>

          {/* Vendedor */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Información del Vendedor
            </h3>
            {quote.vendedorNombre ? (
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Vendedor Responsable
                </label>
                <p className="mt-1 font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
                  {quote.vendedorNombre}
                </p>
                {quote.vendedorId && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    ID: {quote.vendedorId}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <p style={{ color: 'var(--text-secondary)' }}>Vendedor no asignado</p>
              </div>
            )}
          </div>

          {/* Notas Adicionales */}
          {(quote.notas || quote.condicionesComerciales.observaciones) && (
            <div 
              className="rounded-lg p-6"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                Notas y Observaciones
              </h3>
              <div className="space-y-4">
                {quote.notas && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Notas Internas
                    </label>
                    <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {quote.notas}
                    </p>
                  </div>
                )}
                {quote.condicionesComerciales.observaciones && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Observaciones Comerciales
                    </label>
                    <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {quote.condicionesComerciales.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de selección de productos para nota de venta */}
      {showProductsModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="p-6 flex justify-between items-center sticky top-0 z-10" style={{ 
              backgroundColor: 'var(--card-bg)',
              borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Crear Nota de Venta
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Seleccione los productos finales para la nota de venta
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelProductSelection}
                  className="btn-secondary px-4 py-2"
                  disabled={creatingSale}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotaVenta}
                  className="btn-primary flex items-center gap-2 px-4 py-2"
                  disabled={creatingSale || !selectedItems.length}
                >
                  {creatingSale ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2" style={{ 
                        borderTopColor: 'transparent',
                        borderLeftColor: 'var(--button-text)',
                        borderRightColor: 'var(--button-text)',
                        borderBottomColor: 'var(--button-text)'
                      }} />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      Guardar Nota de Venta
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <ProductsForm
                items={selectedItems}
                onChange={setSelectedItems}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
