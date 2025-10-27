"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiPlus, 
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiSend,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiX,
  FiShoppingCart,
  FiDownload,
  FiStar,
  FiXCircle,
  FiHelpCircle
} from 'react-icons/fi';

import { useQuotes } from '../model/useQuotes';
import { Quote, QuoteStatus, QuoteItem, DeliveryInfo } from '@/core/domain/quote/Quote';
import { useAuth } from '@/contexts/AuthContext';

// Import the filters panel component
import { QuoteFiltersPanel } from './QuoteFiltersPanel';
import { downloadFileFromResponse } from '@/lib/download';
import { Toast } from '@/shared/ui/Toast';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { HelpGuide } from '@/shared/ui/HelpGuide';
import { SendEmailModal } from './components/SendEmailModal';
import { EditQuoteModal } from './components/EditQuoteModal';

interface QuoteCardProps {
  quote: Quote;
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onDuplicate: (id: string) => void;
  onChangeStatus: (id: string, status: QuoteStatus) => void;
  onSendEmail: (quote: Quote) => void;
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
  canEdit: (quote: Quote) => boolean;
  canDelete: (quote: Quote) => boolean;
  onConvert: (q: Quote) => void;
}

interface QuotesTableProps {
  quotes: Quote[];
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onDuplicate: (id: string) => void;
  onChangeStatus: (id: string, status: QuoteStatus) => void;
  onSendEmail: (quote: Quote) => void;
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
  canEdit: (quote: Quote) => boolean;
  canDelete: (quote: Quote) => boolean;
  onConvert: (q: Quote) => void;
  isVendedor: boolean;
  onUpdatePriority: (id: string, prioridad: number | null) => Promise<void>;
}

export function QuotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    quotes,
    todasLasCotizaciones,
    loading,
    estadisticas,
    filtros,
    setFiltros,
    paginationConfig,
    goToPage,
    goToNextPage,
    goToPrevPage,
    eliminarCotizacion,
    duplicarCotizacion,
    cambiarEstado,
    cancelarCotizacion,
    actualizarCotizacion,
    actualizarPrioridad,
    formatMoney,
    getStatusColor,
    canEdit,
    canDelete,
    userId,
    isAdmin
    
  } = useQuotes();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<QuoteStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Estados para modales
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; quoteId: string | null }>({ isOpen: false, quoteId: null });
  const [cancelDialog, setCancelDialog] = useState<{ isOpen: boolean; quoteId: string | null }>({ isOpen: false, quoteId: null });
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [sendEmailModal, setSendEmailModal] = useState<{ isOpen: boolean; quote: Quote | null }>({ isOpen: false, quote: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; quote: Quote | null }>({ isOpen: false, quote: null });

  // Verificar si el usuario es vendedor (no admin)
  const isVendedor = user && !isAdmin && user.role?.toLowerCase() === 'vendedor';

  // Aplicar filtros
  React.useMemo(() => {
    setFiltros({
      busqueda: searchTerm || undefined,
      estado: selectedStates.length > 0 ? selectedStates : undefined
    });
  }, [searchTerm, selectedStates, setFiltros]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filtros.estado && filtros.estado.length > 0) count++;
    if (filtros.vendedor) count++;
    if (filtros.fechaDesde) count++;
    if (filtros.fechaHasta) count++;
    if (filtros.busqueda) count++;
    if (filtros.cliente) count++;
    return count;
  }, [filtros]);

  // Obtener lista única de vendedores
  const vendedores = useMemo(() => {
    const vendedoresSet = new Set(todasLasCotizaciones.map(quote => quote.vendedorNombre));
    return Array.from(vendedoresSet).map(nombre => ({
      id: nombre.toLowerCase().replace(/\s+/g, '-'),
      nombre
    }));
  }, [todasLasCotizaciones]);

  // Handlers
  const handleView = (quote: Quote) => {
    // Asegurar que tenemos los datos antes de navegar
    if (quote) {
      // Navegación inmediata a la página de detalle
      router.push(`/dashboard/cotizaciones/${quote.id}`);
    }
  };

  const handleEdit = (quote: Quote) => {
    // Abrir modal de edición
    setEditModal({ isOpen: true, quote });
  };

  const handleSaveEdit = async (items: QuoteItem[], despacho: DeliveryInfo, vendedorId?: string, vendedorNombre?: string) => {
    if (!editModal.quote) return false;
    const success = await actualizarCotizacion(editModal.quote.id, { items, despacho, vendedorId, vendedorNombre });
    if (success) {
      Toast.success('Cotización actualizada exitosamente');
      setEditModal({ isOpen: false, quote: null });
      return true;
    } else {
      Toast.error('No se pudo actualizar la cotización');
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteDialog({ isOpen: true, quoteId: id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.quoteId) return;
    const success = await eliminarCotizacion(deleteDialog.quoteId);
    if (success) {
      Toast.success('Cotización eliminada exitosamente');
    } else {
      Toast.error('No se pudo eliminar la cotización');
    }
    setDeleteDialog({ isOpen: false, quoteId: null });
  };

  const handleCancel = async (id: string) => {
    setCancelDialog({ isOpen: true, quoteId: id });
  };

  const confirmCancel = async () => {
    if (!cancelDialog.quoteId) return;
    const success = await cancelarCotizacion(cancelDialog.quoteId);
    if (success) {
      Toast.success('Cotización rechazada exitosamente');
    } else {
      Toast.error('No se pudo cancelar la cotización');
    }
    setCancelDialog({ isOpen: false, quoteId: null });
  };

  const handleDuplicate = async (id: string) => {
    const success = await duplicarCotizacion(id);
    if (success) {
      // Podrías mostrar un toast de éxito aquí
    }
  };

  const handleSendEmail = async (email: string, name: string, message?: string) => {
    if (!sendEmailModal.quote) return;
    try {
      const response = await fetch('/api/cotizaciones/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteData: sendEmailModal.quote,
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

  const handleOpenSendEmailModal = (quote: Quote) => {
    setSendEmailModal({ isOpen: true, quote });
  };

  const handleExport = async () => {
    try {
      if (!userId) {
        Toast.error('Usuario no identificado');
        return;
      }

      const response = await fetch(`/api/downloads/quotes?userId=${userId}&isAdmin=${isAdmin}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Descargar el archivo
      const filename = `cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
      await downloadFileFromResponse(response, filename);

      Toast.success('Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error('Error exportando cotizaciones:', error);
      Toast.error('Error al exportar las cotizaciones. Por favor, inténtalo de nuevo.');
    }
  };

  const handleChangeStatus = async (id: string, status: QuoteStatus) => {
    const success = await cambiarEstado(id, status);
    if (success) {
      // Si se acepta la cotización, mostrar mensaje pero no redirigir automáticamente
      if (status === 'aceptada') {
        Toast.success('Cotización aceptada exitosamente');
      }
    }
  };

  const handleConvert = async (quote: Quote) => {
    router.push(`/dashboard/notas-venta/convertir?quoteId=${encodeURIComponent(quote.id)}`);
  };

  const handleUpdatePriority = async (id: string, prioridad: number | null) => {
    const success = await actualizarPrioridad(id, prioridad);
    if (success) {
      Toast.success('Prioridad actualizada exitosamente');
    } else {
      Toast.error('Error al actualizar la prioridad');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStates([]);
    setFiltros({});
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <div className="h-8 rounded w-48 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          <div className="h-10 rounded w-40 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <FiFileText className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              Cotizaciones
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gestiona las cotizaciones de productos de construcción
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 relative px-3 py-2"
            >
              <FiFilter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {filtrosActivos > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {filtrosActivos}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowHelpGuide(true)}
              className="btn-secondary flex items-center gap-2 px-3 py-2"
              title="Ver guía de ayuda"
            >
              <FiHelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Ayuda</span>
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2 px-3 py-2"
            >
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/cotizaciones/nueva')}
              className="btn-primary flex items-center gap-2 px-3 py-2"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden xs:inline">Nueva Cotización</span>
              <span className="xs:hidden">Nueva</span>
            </button>
          </div>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Buscar por número, cliente, RUT o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'grid' ? { color: 'var(--text-secondary)' } : {}}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'table' ? { color: 'var(--text-secondary)' } : {}}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtros Activos */}
        {filtrosActivos > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Filtros activos:
            </span>
            {filtros.estado && filtros.estado.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                Estados: {filtros.estado.length}
                <button 
                  onClick={() => setSelectedStates([])}
                  className="w-4 h-4 rounded-full flex items-center justify-center ml-1 hover:bg-red-200"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            {filtros.vendedor && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                {filtros.vendedor}
                <button className="w-4 h-4 rounded-full flex items-center justify-center ml-1 hover:bg-red-200">
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ 
                color: 'var(--text-muted)',
                textDecoration: 'underline'
              }}
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.total}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiEdit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.borradores}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Borradores
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.enviadas}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Enviadas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.aceptadas}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Aceptadas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)' }}
            >
              <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.rechazadas}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Rechazadas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatMoney(estadisticas.montoTotal)}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Valor Total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de cotizaciones */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCancel={handleCancel}
              onDuplicate={handleDuplicate}
              onChangeStatus={handleChangeStatus}
              onSendEmail={handleOpenSendEmailModal}
              formatMoney={formatMoney}
              getStatusColor={getStatusColor}
              canEdit={canEdit}
              canDelete={canDelete}
              onConvert={handleConvert}
            />
          ))}
        </div>
      ) : (
        <QuotesTable
          quotes={quotes}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCancel={handleCancel}
          onDuplicate={handleDuplicate}
          onChangeStatus={handleChangeStatus}
          onSendEmail={handleOpenSendEmailModal}
          formatMoney={formatMoney}
          getStatusColor={getStatusColor}
          canEdit={canEdit}
          canDelete={canDelete}
          onConvert={handleConvert}
          isVendedor={!!isVendedor}
          onUpdatePriority={handleUpdatePriority}
        />
      )}

      {/* Mensaje cuando no hay cotizaciones */}
      {quotes.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No se encontraron cotizaciones
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {filtrosActivos > 0 
              ? 'No hay cotizaciones que coincidan con los filtros aplicados.' 
              : 'Comienza creando tu primera cotización para gestionar tus ventas.'
            }
          </p>
          <button 
            onClick={() => router.push('/dashboard/cotizaciones/nueva')}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <FiPlus className="w-4 h-4" />
            Nueva Cotización
          </button>
        </div>
      )}

      {/* Paginación */}
      {paginationConfig.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {((paginationConfig.currentPage - 1) * paginationConfig.itemsPerPage) + 1} a{' '}
            {Math.min(paginationConfig.currentPage * paginationConfig.itemsPerPage, paginationConfig.totalItems)} de{' '}
            {paginationConfig.totalItems} cotizaciones
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={paginationConfig.currentPage === 1}
              className="p-2 rounded-lg border transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: paginationConfig.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  page === paginationConfig.currentPage ? 'border-blue-500 bg-blue-50' : ''
                }`}
                style={{
                  backgroundColor: page === paginationConfig.currentPage ? 'var(--primary-bg)' : 'var(--bg-primary)',
                  borderColor: page === paginationConfig.currentPage ? 'var(--primary)' : 'var(--border)',
                  color: page === paginationConfig.currentPage ? 'var(--primary)' : 'var(--text-primary)'
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={goToNextPage}
              disabled={paginationConfig.currentPage === paginationConfig.totalPages}
              className="p-2 rounded-lg border transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Panel de Filtros */}
      <QuoteFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        vendedores={vendedores}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, quoteId: null })}
        onConfirm={confirmDelete}
        title="Eliminar Cotización"
        message="¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer y se eliminarán todos los datos relacionados."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Diálogo de confirmación para cancelar */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, quoteId: null })}
        onConfirm={confirmCancel}
        title="Cancelar Cotización"
        message="¿Estás seguro de que deseas rechazar esta cotización? Una vez rechazada, no se podrá modificar ni eliminar."
        confirmText="Cancelar Cotización"
        cancelText="Volver"
        type="warning"
      />

      {/* Guía de ayuda */}
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
      />

      {/* Modal de envío de email */}
      {sendEmailModal.quote && (
        <SendEmailModal
          isOpen={sendEmailModal.isOpen}
          onClose={() => setSendEmailModal({ isOpen: false, quote: null })}
          quote={sendEmailModal.quote}
          onSend={handleSendEmail}
        />
      )}

      {/* Modal de edición */}
      {editModal.quote && (
        <EditQuoteModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, quote: null })}
          quote={editModal.quote}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

// Componente para tarjeta individual de cotización
function QuoteCard({ 
  quote, 
  onView, 
  onEdit, 
  onDelete,
  onCancel,
  onDuplicate, 
  onChangeStatus,
  onSendEmail,
  formatMoney, 
  getStatusColor, 
  canEdit, 
  canDelete,
  onConvert
}: QuoteCardProps) {
  const statusColor = getStatusColor(quote.estado);

  return (
    <div
      onClick={() => onView(quote)}
      className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)'
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              {quote.numero}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
            </p>
          </div>
          <span
            className="px-3 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.text
            }}
          >
            {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
          </span>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-2 mb-3">
          <FiUsers className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {quote.cliente.razonSocial}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {quote.cliente.rut}
            </p>
          </div>
        </div>

        {/* Vendedor */}
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Vendedor: {quote.vendedorNombre}
          </p>
        </div>

        {/* Totales */}
        <div 
          className="grid grid-cols-2 gap-4 py-3 border-t border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Productos
            </p>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {quote.items.length} ítems
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Total
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--accent-primary)' }}>
              {formatMoney(quote.total)}
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div className="flex items-center justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Creada: {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}</span>
          {quote.fechaExpiracion && (
            <span>Expira: {new Date(quote.fechaExpiracion).toLocaleDateString('es-CL')}</span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
       
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSendEmail(quote);
              }}
              className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
              title="Enviar por email"
            >
              <FiSend className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvert(quote);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Convertir a nota de venta"
            >
              <FiShoppingCart className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
            {quote.estado !== 'aceptada' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(quote.id);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Duplicar"
              >
                <FiCopy className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
            {canEdit(quote) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(quote);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Editar"
              >
                <FiEdit2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {quote.estado === 'borrador' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus(quote.id, 'aceptada');
                }}
                className="px-3 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600"
                title="Aceptar cotización"
              >
                Aceptar
              </button>
            )}
            {quote.estado === 'enviada' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus(quote.id, 'aceptada');
                }}
                className="px-3 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600"
                title="Aceptar cotización"
              >
                Aceptar
              </button>
            )}
            {canDelete(quote) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(quote.id);
                }}
                className="p-2 rounded-lg hover:bg-red-100 transition-colors group"
                title="Eliminar cotización"
              >
                <FiTrash2 className="w-4 h-4 text-red-500 group-hover:text-red-700" />
              </button>
            )}
            {quote.estado !== 'aceptada' && quote.estado !== 'rechazada' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(quote.id);
                }}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors group"
                title="Cancelar cotización"
              >
                <FiXCircle className="w-4 h-4 text-orange-500 group-hover:text-orange-700" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para vista de tabla (simplificado)
function QuotesTable({ 
  quotes, 
  onView, 
  onEdit, 
  onDelete,
  onCancel,
  onDuplicate, 
  onChangeStatus,
  onSendEmail,
  formatMoney, 
  getStatusColor, 
  canEdit, 
  canDelete,
  onConvert,
  isVendedor,
  onUpdatePriority
}: QuotesTableProps) {
  const [sortedQuotes, setSortedQuotes] = React.useState<Quote[]>(quotes);

  // Ordenar cotizaciones por prioridad si el usuario es vendedor
  React.useEffect(() => {
    if (isVendedor) {
      const sorted = [...quotes].sort((a, b) => {
        // Las cotizaciones sin prioridad van al final
        if (a.prioridad === undefined || a.prioridad === null) return 1;
        if (b.prioridad === undefined || b.prioridad === null) return -1;
        return a.prioridad - b.prioridad;
      });
      setSortedQuotes(sorted);
    } else {
      setSortedQuotes(quotes);
    }
  }, [quotes, isVendedor]);

  // Estado para controlar el menú desplegable de acciones
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const toggleMenu = (quoteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === quoteId ? null : quoteId);
  };

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-container')) {
        setOpenMenuId(null);
      }
    };
    
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const handleMoveUp = async (quote: Quote, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    const prevQuote = sortedQuotes[currentIndex - 1];
    
    // Calcular nueva prioridad justo antes del elemento anterior
    if (currentIndex === 1) {
      // Si vamos a ser el primero, usar prioridad 1
      await onUpdatePriority(quote.id, 1);
    } else if (prevQuote.prioridad) {
      // Tomar un número menor que el anterior
      const newPriority = Math.max(1, prevQuote.prioridad - 1);
      await onUpdatePriority(quote.id, newPriority);
    } else {
      await onUpdatePriority(quote.id, currentIndex);
    }
  };

  const handleMoveDown = async (quote: Quote, currentIndex: number) => {
    const lastPrioritizedIndex = sortedQuotes.findLastIndex(q => q.prioridad !== undefined && q.prioridad !== null);
    if (currentIndex >= lastPrioritizedIndex) return;
    
    const nextQuote = sortedQuotes[currentIndex + 1];
    
    // Calcular nueva prioridad justo después del elemento siguiente
    if (nextQuote.prioridad) {
      const newPriority = nextQuote.prioridad + 1;
      await onUpdatePriority(quote.id, newPriority);
    } else {
      await onUpdatePriority(quote.id, (currentIndex + 2) * 10);
    }
  };

  const handleSetPriority = async (quote: Quote, index: number) => {
    // Encontrar la última prioridad usada
    const maxPriority = Math.max(
      ...sortedQuotes
        .filter(q => q.prioridad !== undefined && q.prioridad !== null)
        .map(q => q.prioridad as number),
      0
    );
    // Asignar la siguiente prioridad disponible
    await onUpdatePriority(quote.id, maxPriority + 10);
  };

  const handleRemovePriority = async (quote: Quote) => {
    await onUpdatePriority(quote.id, null);
  };

  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              {isVendedor && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Prioridad
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Documento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                Vendedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedQuotes.map((quote, index) => {
              const statusColor = getStatusColor(quote.estado);
              return (
                <tr key={quote.id} className="hover:bg-gray-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  {isVendedor && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Mostrar posición visual (no el número de prioridad de BD) */}
                        <div className="flex items-center gap-1 min-w-[60px]">
                          {quote.prioridad !== undefined && quote.prioridad !== null ? (
                            <>
                              <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                #{index + 1}
                              </span>
                            </>
                          ) : (
                            <button
                              onClick={() => handleSetPriority(quote, index)}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-blue-50 border border-blue-300 text-blue-600"
                              title="Marcar como prioritaria"
                            >
                              <FiStar className="w-3 h-3" />
                              <span>Priorizar</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Controles de movimiento solo si está priorizada */}
                        {quote.prioridad !== undefined && quote.prioridad !== null && (
                          <div className="flex items-center gap-1 border-l pl-2" style={{ borderColor: 'var(--border)' }}>
                            <button
                              onClick={() => handleMoveUp(quote, index)}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover arriba"
                            >
                              <FiChevronUp className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleMoveDown(quote, index)}
                              disabled={index === sortedQuotes.length - 1}
                              className="p-1 rounded hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover abajo"
                            >
                              <FiChevronDown className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleRemovePriority(quote)}
                              className="p-1 rounded hover:bg-red-100 transition-colors ml-1"
                              title="Quitar de prioritarias"
                            >
                              <FiX className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {quote.numero}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {quote.items.length} {quote.estado === 'aceptada' ? 'productos' : 'cotizaciones'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.razonSocial}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {quote.cliente.rut}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell" style={{ color: 'var(--text-primary)' }}>
                    {quote.vendedorNombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{
                        backgroundColor: statusColor.bg,
                        color: statusColor.text
                      }}
                    >
                      {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatMoney(quote.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => onView(quote)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Ver detalle"
                      >
                        <FiEye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button
                        onClick={() => onSendEmail(quote)}
                        className="p-1 rounded hover:bg-blue-100"
                        title="Enviar por email"
                      >
                        <FiSend className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => onConvert(quote)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Convertir a nota de venta"
                        disabled={quote.estado === 'aceptada'}
                        style={quote.estado === 'aceptada' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <FiShoppingCart className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      {quote.estado !== 'aceptada' && (
                        <button
                          onClick={() => onDuplicate(quote.id)}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Duplicar"
                        >
                          <FiCopy className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </button>
                      )}
                      {(quote.estado === 'borrador' || quote.estado === 'enviada') && (
                        <button
                          onClick={() => onChangeStatus(quote.id, 'aceptada')}
                          className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600"
                          title="Aceptar cotización y convertir a venta"
                        >
                          Aceptar
                        </button>
                      )}
                      {/* Menú desplegable de Acciones */}
                      <div className="relative actions-menu-container">
                        <button
                          onClick={(e) => toggleMenu(quote.id, e)}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Acciones"
                        >
                          <FiHelpCircle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </button>
                        {openMenuId === quote.id && (
                          <div 
                            className="absolute right-0 mt-1 w-32 rounded-md shadow-lg z-50"
                            style={{ 
                              backgroundColor: 'var(--card-bg)', 
                              border: '1px solid var(--border)' 
                            }}
                          >
                            {canEdit(quote) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(quote);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                <FiEdit2 className="inline w-4 h-4 mr-2" />
                                Editar
                              </button>
                            )}
                            {canDelete(quote) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(quote.id);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                              >
                                <FiTrash2 className="inline w-4 h-4 mr-2" />
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {quote.estado !== 'aceptada' && quote.estado !== 'rechazada' && (
                        <button
                          onClick={() => onCancel(quote.id)}
                          className="p-1 rounded hover:bg-orange-100 transition-colors group"
                          title="Cancelar cotización"
                        >
                          <FiXCircle className="w-4 h-4 text-orange-500 group-hover:text-orange-700" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
