"use client";

import React from 'react';
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
  FiAlertCircle,
  FiTrash2,
  FiXCircle,
  FiSend,
  FiHelpCircle
} from 'react-icons/fi';
import { FiShoppingCart } from 'react-icons/fi';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { downloadFileFromResponse } from '@/lib/download';
import { NotasVentaService, SalesNoteRecord } from '@/services/notasVentaService';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { EditQuoteModal, SendEmailModal } from '@/features/quotes/ui/components';
import { Toast } from '@/shared/ui/Toast';
import type { QuoteItem, DeliveryInfo } from '@/core/domain/quote/Quote';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getQuoteById, formatMoney, getStatusColor, loading, eliminarCotizacion, cancelarCotizacion, actualizarCotizacion, canDelete, isAdmin } = useQuotes();
  
  const quoteFolio = params.id as string; // folio (ej: COT000002)
  const quote = getQuoteById ? getQuoteById(quoteFolio) : null;

  // Estado para exportar PDF
  const [exporting, setExporting] = React.useState(false);
  // Estado para la nota de venta correspondiente (si existe)
  const [relatedSalesNote, setRelatedSalesNote] = React.useState<SalesNoteRecord | null>(null);
  // Estados para modales
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [cancelDialog, setCancelDialog] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);
  const [sendEmailModal, setSendEmailModal] = React.useState(false);
  // Estado para menú de acciones
  const [openActionsMenu, setOpenActionsMenu] = React.useState(false);

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setOpenActionsMenu(false);
      }
    };
    
    if (openActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openActionsMenu]);

  // Buscar nota de venta correspondiente cuando la cotización esté aceptada
  React.useEffect(() => {
    const findRelatedSalesNote = async () => {
      if (quote && quote.estado === 'aceptada') {
        try {
          const numericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);
          if (numericId) {
            const salesNote = await NotasVentaService.getByCotizacionId(numericId);
            setRelatedSalesNote(salesNote);
          }
        } catch (error) {
          console.error('Error buscando nota de venta relacionada:', error);
        }
      }
    };
    findRelatedSalesNote();
  }, [quote]);

  // Navegar a la nueva página de conversión (sin modal)
  const handleConvert = React.useCallback(() => {
    if (!quote) return;
    router.push(`/dashboard/notas-venta/convertir?quoteId=${encodeURIComponent(quote.id)}`);
  }, [quote, router]);

  // ===== HOOKS CALLBACK ANTES DE RETURNS CONDICIONALES =====
  const handleDeleteQuote = React.useCallback(async () => {
    if (!quote) return;
    setDeleteDialog(false);
    const ok = await eliminarCotizacion(quote.id);
    if (ok) {
      Toast.success('Cotización eliminada exitosamente');
      router.push('/dashboard/cotizaciones');
    } else {
      Toast.error('No se pudo eliminar la cotización');
    }
  }, [quote, eliminarCotizacion, router]);

  const handleCancelQuote = React.useCallback(async () => {
    if (!quote) return;
    setCancelDialog(false);
    const ok = await cancelarCotizacion(quote.id);
    if (ok) {
      Toast.success('Cotización rechazada exitosamente');
    } else {
      Toast.error('No se pudo cancelar la cotización');
    }
  }, [quote, cancelarCotizacion]);

  const handleSaveEdit = React.useCallback(async (items: QuoteItem[], despacho: DeliveryInfo, vendedorId?: string, vendedorNombre?: string) => {
    if (!quote) return false;
    const success = await actualizarCotizacion(quote.id, { items, despacho, vendedorId, vendedorNombre });
    if (success) {
      Toast.success('Cotización actualizada exitosamente');
      // Forzar recarga de la página para mostrar cambios
      window.location.reload();
      return true;
    } else {
      Toast.error('No se pudo actualizar la cotización');
      return false;
    }
  }, [quote, actualizarCotizacion]);

  const handleSendEmail = async (email: string, name: string, message?: string) => {
    if (!quote) return;
    try {
      const response = await fetch('/api/cotizaciones/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteData: quote,
          recipientEmail: email,
          recipientName: name,
          message: message || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Toast.success('Cotización enviada por email exitosamente');
      } else {
        Toast.error(`Error al enviar email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error enviando email:', error);
      Toast.error('Error al enviar la cotización por email');
    }
  };

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
              {`Cotización ${quote.numero}`}
            </h1>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1">
              <span 
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap status-badge-${quote.estado}`}
                style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
              >
                {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
              </span>
              {quote.estado === 'aceptada' && (
                <button
                  onClick={() => relatedSalesNote && router.push(`/dashboard/notas-venta/${relatedSalesNote.id}`)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap flex items-center gap-1 hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: 'none', cursor: relatedSalesNote ? 'pointer' : 'default' }}
                  disabled={!relatedSalesNote}
                >
                  <FiShoppingCart className="w-3 h-3" />
                  {relatedSalesNote ? `Ver Nota de Venta ${relatedSalesNote.folio || `#${relatedSalesNote.id}`}` : 'Convertida a Venta'}
                </button>
              )}
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

        {/* Advertencia para cotizaciones aceptadas */}
        {quote.estado === 'aceptada' && (
          <div className="flex items-start gap-2 p-3 rounded-lg mt-4" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-text)' }}>
            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning-text)' }} />
            <div className="text-sm" style={{ color: 'var(--warning-text)' }}>
              <strong>Cotización Aceptada:</strong> Los cambios que realices se reflejarán automáticamente en la nota de venta relacionada.
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0 flex-wrap">
          <button
            onClick={handleConvert}
            disabled={quote?.estado === 'aceptada' || quote?.estado === 'rechazada'}
            className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium"
            style={quote?.estado === 'aceptada' || quote?.estado === 'rechazada' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            title="Convertir cotización a nota de venta"
          >
            <FiShoppingCart className="w-4 h-4" />
            <span>Pasar a Venta</span>
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium"
            style={exporting ? { opacity: .7, cursor: 'wait' } : {}}
            title="Descargar PDF de la cotización"
          >
            <FiDownload className="w-4 h-4" />
            <span>{exporting ? 'Descargando...' : 'Descargar PDF'}</span>
          </button>
          <button
            onClick={() => setSendEmailModal(true)}
            className="btn-secondary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium"
            title="Enviar cotización por email"
          >
            <FiSend className="w-4 h-4" />
            <span>Enviar</span>
          </button>
          {/* Menú desplegable de Acciones */}
          <div className="relative actions-menu-container">
            <button
              onClick={() => setOpenActionsMenu(!openActionsMenu)}
              className="btn-secondary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium"
              title="Acciones"
            >
              <FiHelpCircle className="w-4 h-4" />
              <span>Acciones</span>
            </button>
            {openActionsMenu && (
              <div 
                className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-50"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border)' 
                }}
              >
                <button
                  onClick={() => {
                    setEditModal(true);
                    setOpenActionsMenu(false);
                  }}
                  disabled={quote?.estado === 'rechazada'}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiEdit2 className="inline w-4 h-4 mr-2" />
                  Editar
                </button>
                {isAdmin && quote?.estado !== 'rechazada' && (
                  <button
                    onClick={() => {
                      setCancelDialog(true);
                      setOpenActionsMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-orange-50 text-orange-600"
                  >
                    <FiXCircle className="inline w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                )}
                {canDelete && canDelete(quote) && (
                  <button
                    onClick={() => {
                      setDeleteDialog(true);
                      setOpenActionsMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                  >
                    <FiTrash2 className="inline w-4 h-4 mr-2" />
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Errores de venta eliminados junto con el flujo modal */}
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
              Detalle de Productos ({(quote.items?.length || 0)} ítems)
            </h3>
            {quote.items && quote.items.length > 0 ? (
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
                        <td className="py-4 sm:py-4 whitespace-nowrap">
                          <span className="font-mono text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.codigo}
                          </span>
                        </td>
                        <td className="py-4 sm:py-4">
                          <span className="font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                            {item.descripcion}
                          </span>
                          <span className="text-xs block sm:hidden mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {item.unidad} | {formatMoney(item.precioUnitario)}
                            {item.descuento ? ` | -${item.descuento}%` : ''}
                          </span>
                        </td>
                        <td className="py-4 sm:py-4 text-center hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                          {item.unidad}
                        </td>
                        <td className="py-4 sm:py-4 text-center whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad.toLocaleString('es-CL')}
                        </td>
                        <td className="py-4 sm:py-4 text-right hidden md:table-cell whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(item.precioUnitario)}
                        </td>
                        <td className="py-4 sm:py-4 text-right hidden md:table-cell whitespace-nowrap" style={{ color: item.descuento ? 'var(--success-text)' : 'var(--text-muted)' }}>
                          {item.descuento ? `${item.descuento}%` : '-'}
                        </td>
                        <td className="py-4 sm:py-4 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(item.subtotal)}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8"><p style={{ color: 'var(--text-secondary)' }}>No hay productos agregados a esta cotización</p></div>
            )}
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
              Resumen Financiero
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span><span className="font-medium text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.subtotal)}</span></div>
              {quote.descuentoTotal > 0 && (<div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color: 'var(--text-secondary)' }}>Descuento:</span><span className="font-medium text-base sm:text-lg" style={{ color: 'var(--success-text)' }}> -{formatMoney(quote.descuentoTotal)}</span></div>)}
              <div className="flex justify-between items-center py-1 sm:py-2"><span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span><span className="font-medium text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.iva)}</span></div>
              <div className="border-t pt-3 sm:pt-4 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}><span className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Total:</span><span className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>{formatMoney(quote.total)}</span></div>
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

      {/* Modales */}
      {quote && (
        <>
          <ConfirmDialog
            isOpen={deleteDialog}
            onClose={() => setDeleteDialog(false)}
            onConfirm={handleDeleteQuote}
            title="Eliminar Cotización"
            message="¿Estás seguro de que deseas eliminar esta cotización? Esta acción eliminará permanentemente todos los datos relacionados (productos, despacho, clientes adicionales). Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            type="danger"
          />

          <ConfirmDialog
            isOpen={cancelDialog}
            onClose={() => setCancelDialog(false)}
            onConfirm={handleCancelQuote}
            title="Cancelar Cotización"
            message={`¿Estás seguro de que deseas rechazar esta cotización?${quote?.estado === 'aceptada' && relatedSalesNote ? ' También se cancelará la nota de venta relacionada.' : ''} Una vez rechazada, no se podrá modificar ni eliminar. Esta acción es reversible solo por un administrador.`}
            confirmText="Cancelar Cotización"
            cancelText="Volver"
            type="warning"
          />

          <EditQuoteModal
            isOpen={editModal}
            onClose={() => setEditModal(false)}
            quote={quote}
            onSave={handleSaveEdit}
          />

          <SendEmailModal
            isOpen={sendEmailModal}
            onClose={() => setSendEmailModal(false)}
            quote={quote}
            onSend={handleSendEmail}
          />
        </>
      )}
    </div>
  );
}
