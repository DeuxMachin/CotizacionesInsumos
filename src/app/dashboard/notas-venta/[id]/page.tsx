"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiDownload,
  FiFileText,
  FiUser,
  FiDollarSign,
  FiPackage,
  FiTruck,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiEdit2,
  FiX,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { NotasVentaService, SalesNoteRecord, SalesNoteItemRow } from '@/services/notasVentaService';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { downloadFileFromResponse } from '@/lib/download';
import { InvoiceItemsModal } from '@/features/sales-notes/ui/InvoiceItemsModal';
import { useSalesNotes } from '@/features/sales-notes/hooks/useSalesNotes';
import { EditSalesNoteModal } from '@/features/sales-notes/ui/EditSalesNoteModal';
import { CancelSalesNoteModal } from '@/features/sales-notes/ui/CancelSalesNoteModal';
import { InvoicedProductsTable } from '@/features/sales-notes/ui/InvoicedProductsTable';


export default function SalesNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatMoney } = useQuotes();
  const { editSalesNote, cancelSalesNote } = useSalesNotes();

  const noteId = params.id as string;
  const numericId = parseInt(noteId);

  // Estados principales
  const [salesNote, setSalesNote] = useState<SalesNoteRecord & { cotizaciones?: { id: number; folio: string | null; fecha_emision: string; estado: string } | null; usuarios?: { id: string; nombre: string | null; apellido: string | null; email: string | null } | null } | null>(null);
  const [noteItems, setNoteItems] = useState<SalesNoteItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Pagination state for products table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modales
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Cargar datos de la nota de venta
  const loadSalesNote = useCallback(async () => {
    if (!numericId) return;

    try {
      setLoading(true);
      const note = await NotasVentaService.getByIdWithQuote(numericId);
      if (!note) {
        setError('Nota de venta no encontrada');
        return;
      }

      setSalesNote(note);
      const items = await NotasVentaService.getItems(numericId);
      setNoteItems(items);
    } catch (e: unknown) {
      console.error('Error cargando nota de venta', e);
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    loadSalesNote();
  }, [loadSalesNote]);

  // Reset pagination when note changes
  useEffect(() => {
    setCurrentPage(1);
  }, [noteId]);

  // Función para exportar PDF
  const handleExportPDF = useCallback(async () => {
    if (!salesNote) return;

    setExporting(true);
    try {
      const response = await fetch(`/api/pdf/sales-notes/${salesNote.id}`);
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }
      await downloadFileFromResponse(response, `nota-venta-${salesNote.folio || salesNote.id}.pdf`);
    } catch (e: unknown) {
      console.error('Error exportando PDF', e);
      alert('Error al exportar PDF');
    } finally {
      setExporting(false);
    }
  }, [salesNote]);

  // Función para abrir el modal de facturación
  const handleOpenInvoiceModal = useCallback(() => {
    setShowInvoiceModal(true);
  }, []);

  // Función para procesar la facturación
  const handleInvoiceConfirm = useCallback(async (itemQuantities: Record<number, number>) => {
    if (!salesNote) return;

    try {
      await NotasVentaService.updateInvoicedItems(salesNote.id, itemQuantities);
      // Recargar la página para mostrar el nuevo estado
      window.location.reload();
    } catch (e: unknown) {
      console.error('Error actualizando facturación', e);
      throw e;
    }
  }, [salesNote]);

  const handleEditSave = async (updates: Parameters<typeof editSalesNote>[1]) => {
    try {
      await editSalesNote(numericId, updates);
      // Recargar los datos
      await loadSalesNote();
      setEditModalOpen(false);
    } catch (e: unknown) {
      console.error('Error al editar nota de venta', e);
      throw e;
    }
  };

  const handleCancelNote = async () => {
    try {
      await cancelSalesNote(numericId);
      // Recargar los datos
      await loadSalesNote();
      setCancelModalOpen(false);
    } catch (e: unknown) {
      console.error('Error al cancelar nota de venta', e);
      throw e;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Cargando nota de venta...
          </h3>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !salesNote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--error)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {error || 'Nota de venta no encontrada'}
          </h3>
          <button
            onClick={() => router.push('/dashboard/notas-venta')}
            className="mt-4 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--button-text)',
              border: 'none'
            }}
          >
            <FiArrowLeft className="w-4 h-4 inline mr-2" />
            Volver a Notas de Venta
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'creada':
        return { bg: 'var(--warning-bg)', text: 'var(--warning-text)', icon: FiClock };
      case 'factura_parcial':
        return { bg: '#FFF4E5', text: '#FF8C00', icon: FiAlertCircle };
      case 'facturada':
        return { bg: 'var(--success-bg)', text: 'var(--success-text)', icon: FiCheckCircle };
      default:
        return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)', icon: FiFileText };
    }
  };

  const statusInfo = getStatusColor(salesNote.estado || 'borrador');
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-20 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center min-w-0 flex-1 sm:flex-initial">
              <button
                onClick={() => router.push('/dashboard/notas-venta')}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors mr-2 sm:mr-4 touch-manipulation flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Volver a notas de venta"
              >
                <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  Nota de Venta {salesNote.folio || `#${salesNote.id}`}
                </h1>
                {salesNote.Numero_Serie && (
                  <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                    Número de orden de compra: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{salesNote.Numero_Serie}</span>
                  </p>
                )}
                <div className="flex items-center mt-1">
                  <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" style={{ color: statusInfo.text }} />
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap"
                    style={{
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.text
                    }}
                  >
                    {salesNote.estado || 'creada'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-initial disabled:opacity-50"
                style={{
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'transparent'
                }}
              >
                <FiDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{exporting ? 'Exportando...' : 'PDF'}</span>
                <span className="inline sm:hidden">{exporting ? '...' : 'PDF'}</span>
              </button>

              {(salesNote.estado === 'creada') && (
                <>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-initial"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <FiEdit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Editar</span>
                    <span className="inline sm:hidden">Editar</span>
                  </button>

                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-initial"
                    style={{
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      border: 'none'
                    }}
                    title="Cancelar nota de venta"
                  >
                    <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Cancelar</span>
                    <span className="inline sm:hidden">Cancelar</span>
                  </button>
                </>
              )}

              {(salesNote.estado === 'creada' || salesNote.estado === 'factura_parcial') && (
                <button
                  onClick={handleOpenInvoiceModal}
                  className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-initial"
                  style={{
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {salesNote.estado === 'factura_parcial' ? 'Completar Facturación' : 'Facturar Nota de Venta'}
                  </span>
                  <span className="inline sm:hidden">
                    {salesNote.estado === 'factura_parcial' ? 'Completar' : 'Facturar'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Note Information */}
            <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <FiFileText className="w-5 h-5 mr-2" />
                  Información de la Nota de Venta
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Folio</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{salesNote.folio || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Número de orden de compra</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {salesNote.Numero_Serie || 'Sin número de orden de compra'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha de Emisión</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {salesNote.fecha_emision ? new Date(salesNote.fecha_emision).toLocaleDateString('es-CL') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Estado</p>
                    <div className="flex items-center mt-1">
                      <StatusIcon className="w-4 h-4 mr-2" style={{ color: statusInfo.text }} />
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                        style={{
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.text
                        }}
                      >
                        {salesNote.estado || 'borrador'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Forma de Pago</p>
                    <p style={{ color: 'var(--text-primary)' }}>{salesNote.forma_pago_final || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Vendedor</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {salesNote.usuarios?.nombre && salesNote.usuarios?.apellido
                        ? `${salesNote.usuarios.nombre} ${salesNote.usuarios.apellido}`
                        : salesNote.usuarios?.nombre || salesNote.usuarios?.email || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Referencia a Cotización */}
                {salesNote.cotizaciones && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-semibold mb-3 flex items-center" style={{ color: 'var(--text-primary)' }}>
                      <FiFileText className="w-4 h-4 mr-2" />
                      Referencia a Cotización
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Folio</p>
                        <p className="font-medium" style={{ color: 'var(--primary)' }}>{salesNote.cotizaciones.folio || `COT${salesNote.cotizaciones.id.toString().padStart(6, '0')}`}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha Cotización</p>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {new Date(salesNote.cotizaciones.fecha_emision).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoiced Products Table */}
            <InvoicedProductsTable items={noteItems} formatMoney={formatMoney} />

            {/* Client Information */}
            <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-5 h-5 mr-2" />
                  Información del Cliente
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Razón Social</p>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{salesNote.cliente_razon_social || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>RUT</p>
                    <p style={{ color: 'var(--text-primary)' }}>{salesNote.cliente_rut || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Giro</p>
                    <p style={{ color: 'var(--text-primary)' }}>{salesNote.cliente_giro || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Dirección</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {salesNote.cliente_direccion ? `${salesNote.cliente_direccion}, ${salesNote.cliente_comuna}, ${salesNote.cliente_ciudad}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <FiPackage className="w-5 h-5 mr-2" />
                  Productos ({noteItems.length})
                </h2>
                {noteItems.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No hay productos en esta nota de venta.</p>
                ) : (
                  <>
                    {/* Pagination logic */}
                    {(() => {
                      const totalPages = Math.ceil(noteItems.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const currentItems = noteItems.slice(startIndex, endIndex);

                      return (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[500px]">
                              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                    Producto
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                    Cantidad
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                    Precio Unit.
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                                    Subtotal
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {currentItems.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-3">
                                      <div>
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                          {item.descripcion}
                                        </p>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                          {item.unidad}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-center" style={{ color: 'var(--text-primary)' }}>
                                      {item.cantidad}
                                    </td>
                                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-primary)' }}>
                                      {formatMoney(item.precio_unitario_neto)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--primary)' }}>
                                      {formatMoney(item.subtotal_neto)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Mostrando {startIndex + 1}-{Math.min(endIndex, noteItems.length)} de {noteItems.length} productos
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={currentPage === 1}
                                  className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    color: 'var(--primary)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--card-bg)'
                                  }}
                                  title="Página anterior"
                                >
                                  <FiChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm px-3 py-1" style={{ color: 'var(--text-primary)' }}>
                                  {currentPage} de {totalPages}
                                </span>
                                <button
                                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                  disabled={currentPage === totalPages}
                                  className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  style={{
                                    color: 'var(--primary)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--card-bg)'
                                  }}
                                  title="Página siguiente"
                                >
                                  <FiChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                  <FiDollarSign className="w-5 h-5 mr-2" />
                  Resumen
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatMoney(salesNote.subtotal)}</span>
                  </div>
                  {salesNote.descuento_total > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Descuento</span>
                      <span className="font-medium" style={{ color: 'var(--error)' }}>-{formatMoney(salesNote.descuento_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>IVA ({salesNote.iva_pct}%)</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatMoney(salesNote.iva_monto)}</span>
                  </div>
                  <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center font-semibold">
                      <span style={{ color: 'var(--text-primary)' }}>Total</span>
                      <span style={{ color: 'var(--primary)' }}>{formatMoney(salesNote.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {(salesNote.direccion_despacho || salesNote.fecha_estimada_entrega) && (
              <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <FiTruck className="w-5 h-5 mr-2" />
                    Despacho
                  </h2>
                  <div className="space-y-3">
                    {salesNote.direccion_despacho && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Dirección</p>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {salesNote.direccion_despacho}
                          {salesNote.comuna_despacho && `, ${salesNote.comuna_despacho}`}
                          {salesNote.ciudad_despacho && `, ${salesNote.ciudad_despacho}`}
                        </p>
                      </div>
                    )}
                    {salesNote.fecha_estimada_entrega && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha Estimada</p>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {new Date(salesNote.fecha_estimada_entrega).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    )}
                    {salesNote.costo_despacho && salesNote.costo_despacho > 0 && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Costo Despacho</p>
                        <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>{formatMoney(salesNote.costo_despacho)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(salesNote.observaciones_comerciales || salesNote.plazo_pago) && (
              <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                    <FiInfo className="w-5 h-5 mr-2" />
                    Detalles Adicionales
                  </h2>
                  <div className="space-y-3">
                    {salesNote.observaciones_comerciales && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Observaciones</p>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>{salesNote.observaciones_comerciales}</p>
                      </div>
                    )}
                    {salesNote.plazo_pago && (
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Plazo de Pago</p>
                        <p style={{ color: 'var(--text-primary)' }}>{salesNote.plazo_pago} días</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón flotante de facturación para móvil */}
      {(salesNote.estado === 'creada' || salesNote.estado === 'factura_parcial') && (
        <div className="fixed bottom-4 right-4 z-10 sm:hidden">
          <button
            onClick={handleOpenInvoiceModal}
            className="w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
            style={{
              backgroundColor: 'var(--success)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            aria-label={salesNote.estado === 'factura_parcial' ? 'Completar Facturación' : 'Facturar Nota de Venta'}
          >
            <FiCheckCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Invoice Items Modal */}
      <InvoiceItemsModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        items={noteItems}
        onConfirm={handleInvoiceConfirm}
        formatMoney={formatMoney}
      />

      {/* Edit Modal */}
      <EditSalesNoteModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        salesNote={salesNote}
        onSave={handleEditSave}
      />

      {/* Cancel Modal */}
      <CancelSalesNoteModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        salesNote={salesNote}
        onConfirm={handleCancelNote}
      />
    </div>
  );
}