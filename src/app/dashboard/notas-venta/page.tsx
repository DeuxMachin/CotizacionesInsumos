"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {  FiEye, FiFileText, FiCalendar, FiDollarSign, FiUser, FiSearch, FiArrowLeft, FiDownload, FiEdit2, FiX } from 'react-icons/fi';
import { NotasVentaService, SalesNoteRecord } from '@/services/notasVentaService';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { useAuth } from '@/contexts/AuthContext';
import { useSalesNotes } from '@/features/sales-notes/hooks/useSalesNotes';
import { EditSalesNoteModal } from '@/features/sales-notes/ui/EditSalesNoteModal';
import { CancelSalesNoteModal } from '@/features/sales-notes/ui/CancelSalesNoteModal';
import { useActionAuthorization } from '@/middleware/AuthorizationMiddleware';

export default function SalesNotesPage() {
  const router = useRouter();
  const { formatMoney } = useQuotes();
  const { user } = useAuth();
  const { editSalesNote, cancelSalesNote } = useSalesNotes();
  const { canEdit } = useActionAuthorization();

  const [salesNotes, setSalesNotes] = useState<SalesNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modales
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SalesNoteRecord | null>(null);

  // Cargar notas de venta
  useEffect(() => {
    loadSalesNotes();
  }, []);

  const loadSalesNotes = async () => {
    try {
      setLoading(true);
      const notes = await NotasVentaService.getAll();
      setSalesNotes(notes);
    } catch (e: unknown) {
      console.error('Error cargando notas de venta', e);
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (note: SalesNoteRecord) => {
    setSelectedNote(note);
    setEditModalOpen(true);
  };

  const handleOpenCancelModal = (note: SalesNoteRecord) => {
    setSelectedNote(note);
    setCancelModalOpen(true);
  };

  const handleEditSave = async (updates: Parameters<typeof editSalesNote>[1]) => {
    if (!selectedNote) return;
    try {
      await editSalesNote(selectedNote.id, updates);
      // Recargar la lista
      await loadSalesNotes();
      setEditModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    }
  };

  const handleCancelNote = async () => {
    if (!selectedNote) return;
    try {
      await cancelSalesNote(selectedNote.id);
      // Recargar la lista
      await loadSalesNotes();
      setCancelModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    }
  };

  const handleDownloadXLSX = async () => {
    if (!user || !user.isAdmin) return;

    try {
      const response = await fetch(`/api/downloads/sales-notes?userId=${user.id}&isAdmin=${user.isAdmin}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notas_venta_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error descargando XLSX:', error);
      setError(error instanceof Error ? error.message : 'Error al descargar el archivo XLSX');
    }
  };

  // Filtrar notas de venta por búsqueda
  const filteredNotes = salesNotes.filter(note =>
    (note.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (note.cliente_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (note.cotizacion_id?.toString().includes(searchTerm) ?? false)
  );

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'facturada':
        return { bg: 'var(--success-bg)', text: 'var(--success-text)' };
      case 'factura_parcial':
        return { bg: '#FFF4E5', text: '#FF8C00' };
      case 'creada':
        return { bg: 'var(--warning-bg)', text: 'var(--warning-text)' };
      default:
        return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Cargando notas de venta...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="min-w-0 flex-1 sm:flex-initial">
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                Notas de Venta
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Gestiona las notas de venta y conversiones de cotizaciones
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => router.push('/dashboard/notas-venta/crear')}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border-2"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderColor: 'var(--primary)'
                }}
              >
                <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Crear Nota</span>
                <span className="inline sm:hidden">Crear</span>
              </button>
              <button
                onClick={handleDownloadXLSX}
                disabled={!user || !user.isAdmin}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderColor: '#28a745'
                }}
              >
                <FiDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Descargar XLSX</span>
                <span className="inline sm:hidden">Descargar</span>
              </button>
              <button
                onClick={() => router.push('/dashboard/cotizaciones')}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md border-2"
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderColor: '#007bff'
                }}
              >
                <FiArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Volver</span>
                <span className="inline sm:hidden">Volver</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Search */}
        <div className="mb-4 sm:mb-6">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Buscar por folio, cliente o cotización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border" style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error)',
            color: 'var(--error-text)'
          }}>
            Error cargando notas de venta: {error}
          </div>
        )}

        {/* Sales Notes List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {paginatedNotes.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <FiFileText className="w-8 sm:w-12 h-8 sm:h-12 mx-auto mb-3 sm:mb-4" style={{ color: 'var(--text-secondary)' }} />
              <h3 className="text-sm sm:text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {searchTerm ? 'No se encontraron notas de venta' : 'No hay notas de venta'}
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Las notas de venta aparecerán aquí cuando conviertas cotizaciones aceptadas'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] sm:min-w-[600px]">
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Folio
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Cliente
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Fecha
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Total
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Estado
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Cotización
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {paginatedNotes.map((note) => {
                    const statusColors = getStatusColor(note.estado || 'borrador');
                    return (
                      <tr 
                        key={note.id} 
                        onClick={() => router.push(`/dashboard/notas-venta/${note.id}`)}
                        className="hover:bg-opacity-50 cursor-pointer transition-colors"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiFileText className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                            <span className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                              {note.folio || 'Sin folio'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center min-w-0">
                            <FiUser className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                            <span className="truncate text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                              {note.cliente_razon_social || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                            <span className="text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                              {note.fecha_emision ? new Date(note.fecha_emision).toLocaleDateString('es-CL') : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiDollarSign className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                            <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--primary)' }}>
                              {formatMoney(note.total)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.text
                            }}
                          >
                            {note.estado || 'borrador'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <span className="text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                            {note.cotizacion_id ? `COT${note.cotizacion_id.toString().padStart(6, '0')}` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/notas-venta/${note.id}`);
                              }}
                              className="px-2 sm:px-3 py-1 rounded-lg transition-colors text-xs sm:text-sm opacity-75 hover:opacity-100"
                              style={{
                                color: 'var(--primary)',
                                border: '1px solid var(--primary)',
                                backgroundColor: 'transparent'
                              }}
                              title="Ver detalles"
                            >
                              <FiEye className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
                              <span className="hidden xs:inline">Ver</span>
                            </button>

                            {note.estado && ['creada', 'borrador'].includes(note.estado) && canEdit('sales-notes') && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(note);
                                  }}
                                  className="px-2 sm:px-3 py-1 rounded-lg transition-colors text-xs sm:text-sm"
                                  style={{
                                    color: 'white',
                                    backgroundColor: 'var(--primary)',
                                    border: '1px solid var(--primary)'
                                  }}
                                  title="Editar nota de venta"
                                >
                                  <FiEdit2 className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
                                  <span className="hidden xs:inline">Editar</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCancelModal(note);
                                  }}
                                  className="px-2 sm:px-3 py-1 rounded-lg transition-colors text-xs sm:text-sm"
                                  style={{
                                    color: 'white',
                                    backgroundColor: '#ff6b6b',
                                    border: '1px solid #ff6b6b'
                                  }}
                                  title="Cancelar nota de venta"
                                >
                                  <FiX className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
                                  <span className="hidden xs:inline">Cancelar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 sm:px-4 py-3 bg-white border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--primary)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--primary)',
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredNotes.length)}</span> de{' '}
                    <span className="font-medium">{filteredNotes.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--primary)',
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                    >
                      <span className="sr-only">Anterior</span>
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-2 sm:px-4 py-2 border text-xs sm:text-sm font-medium ${
                          page === currentPage ? 'z-10' : ''
                        }`}
                        style={{
                          color: page === currentPage ? 'white' : 'var(--primary)',
                          borderColor: 'var(--border)',
                          backgroundColor: page === currentPage ? 'var(--primary)' : 'var(--bg-primary)'
                        }}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--primary)',
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--bg-primary)'
                      }}
                    >
                      <span className="sr-only">Siguiente</span>
                      ›
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditSalesNoteModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedNote(null);
        }}
        salesNote={selectedNote}
        onSave={handleEditSave}
      />

      {/* Cancel Modal */}
      <CancelSalesNoteModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedNote(null);
        }}
        salesNote={selectedNote}
        onConfirm={handleCancelNote}
      />
    </div>
  );
}