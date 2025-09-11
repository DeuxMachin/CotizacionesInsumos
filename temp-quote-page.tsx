"use client";

import React from 'react';
import { 
  FiCheck,
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
import { useParams, useRouter } from 'next/navigation';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { NotasVentaService, SalesNoteRecord } from '@/services/notasVentaService';
import { FiShoppingCart } from 'react-icons/fi';
import { ProductsForm } from '@/features/quotes/ui/components/ProductsForm';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getQuoteById, formatMoney, getStatusColor, loading } = useQuotes();
  
  const quoteFolio = params.id as string; // folio (ej: COT000002)
  const quote = getQuoteById ? getQuoteById(quoteFolio) : null;
  const [notaVenta, setNotaVenta] = React.useState<SalesNoteRecord | null>(null);
  const [nvItems, setNvItems] = React.useState<any[]>([]);
  const [nvLoading, setNvLoading] = React.useState(false);
  const [nvAddDraft, setNvAddDraft] = React.useState({ descripcion:'', unidad:'Unidad', cantidad:1, precio:0, descuento:0 });
  const [nvSaving, setNvSaving] = React.useState(false);
  const [nvError, setNvError] = React.useState<string | null>(null);
  
  // Estados para conversión a nota de venta
  const [creatingSale, setCreatingSale] = React.useState(false);
  const [saleError, setSaleError] = React.useState<string | null>(null);
  const [showSaleConversionModal, setShowSaleConversionModal] = React.useState(false);
  const [saleConversionItems, setSaleConversionItems] = React.useState<any[]>([]);

  // TODOS los hooks dependientes (useCallback/useEffect) ANTES de cualquier return condicional
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
    } catch (e:any) { setNvError(e.message || 'Error cargando nota de venta'); }
    finally { setNvLoading(false); }
  }, [quote]);

  React.useEffect(() => { loadNotaVenta(); }, [loadNotaVenta]);

  // Iniciar flujo de conversión a Nota de Venta
  const startConvertToSale = () => {
    if (!quote) return;
    setSaleConversionItems(quote.items);
    setShowSaleConversionModal(true);
  };

  // Confirmar conversión con los items seleccionados
  const confirmConvertToSale = async () => {
    if (!quote || saleConversionItems.length === 0) {
      alert('Debe seleccionar al menos un producto para la nota de venta');
      return;
    }
    setCreatingSale(true);
    setSaleError(null);
    
    try {
      const cotizacionNumericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);
      
      // Convertir a nota de venta con items editados y finalizarInmediatamente=true
      const nota = await NotasVentaService.convertFromQuote(quote, {
        formaPago: quote.condicionesComerciales?.formaPago,
        cotizacionDbId: cotizacionNumericId || undefined,
        itemsOverride: saleConversionItems,
        finalizarInmediatamente: true // Crear nota como confirmada (no editable)
      });
      
      // Cerrar modal y actualizar estado
      setShowSaleConversionModal(false);
      await loadNotaVenta();
      alert('Nota de venta creada correctamente');
    } catch (e: any) {
      console.error('Error creando nota de venta', e);
      setSaleError(e.message || 'Error desconocido');
      alert('Error al crear nota de venta: ' + (e.message || ''));
    } finally {
      setCreatingSale(false);
    }
  };

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

  const handleExport = () => {
    // Funcionalidad de exportación será implementada después
    alert('Funcionalidad de exportación en desarrollo');
  };

  const handleEdit = () => {
    // Funcionalidad de edición será implementada después
    alert('Funcionalidad de edición en desarrollo');
  };

  const recalcNotaVentaTotals = (base: SalesNoteRecord, items: any[]) => {
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
    } catch(e:any){ setNvError(e.message || 'Error agregando ítem'); }
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
    } catch(e:any){ setNvError(e.message || 'Error eliminando ítem'); }
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
            onClick={() => router.push('/dashboard/cotizaciones')}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
            aria-label="Volver a cotizaciones"
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
              {notaVenta ? 'Nota de Venta ' : 'Cotización '} {quote.numero}
            </h1>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1">
              <span 
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap"
                style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
              >
                {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
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
              onClick={startConvertToSale}
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
            className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
          >
            <FiDownload className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Exportar</span>
          </button>
          <button
            onClick={handleEdit}
            className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
          >
            <FiEdit2 className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Editar</span>
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

      {/* Modal de selección final de productos para Nota de Venta */}
      {showSaleConversionModal && quote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold" style={{color: 'var(--text-primary)'}}>
                Finalizar Nota de Venta
              </h2>
              <button 
                onClick={() => setShowSaleConversionModal(false)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={creatingSale}
              >
                ✖
              </button>
            </div>

            <div className="mb-6">
              <p className="mb-4" style={{color: 'var(--text-secondary)'}}>
                Configure los productos finales para la Nota de Venta. Una vez creada, la Nota de Venta no podrá ser modificada.
              </p>
              <div className="p-4 rounded-lg mb-4" style={{backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-border)'}}>
                <div className="flex items-start">
                  <div className="mr-3 text-blue-500">
                    <FiInfo className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Información importante</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Puede agregar o eliminar productos antes de crear la Nota de Venta definitiva</li>
                      <li>Al crear la Nota de Venta, la cotización pasará a estado "Aceptada"</li>
                      <li>Las Notas de Venta confirmadas no pueden modificarse posteriormente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <ProductsForm 
                items={saleConversionItems}
                onChange={setSaleConversionItems}
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-4" style={{borderColor: 'var(--border)'}}>
              <button
                onClick={() => setShowSaleConversionModal(false)}
                className="btn-secondary px-4 py-2"
                disabled={creatingSale}
              >
                Cancelar
              </button>
              <button
                onClick={confirmConvertToSale}
                disabled={creatingSale || saleConversionItems.length === 0}
                className="btn-primary flex items-center gap-2 px-4 py-2"
                style={creatingSale ? { opacity: .7, cursor: 'wait' } : {}}
              >
                {creatingSale ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <FiCheck className="w-4 h-4" />
                )}
                Guardar Nota de Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
