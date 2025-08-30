"use client";

import React, { useState, useMemo } from 'react';
import { 
  FiSearch, 
  FiFilter, 
  FiGrid, 
  FiList, 
  FiPlus, 
  FiDownload,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiSend,
  FiDollarSign,
  FiFileText,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
  FiX
} from 'react-icons/fi';
import { useQuotes } from '../model/useQuotes';
import { Quote, QuoteStatus } from '@/core/domain/quote/Quote';
import { QuoteDetailModal } from './QuoteDetailModal';
import { CreateQuoteModal } from './CreateQuoteModal';
import { QuoteFiltersPanel } from './QuoteFiltersPanel';

interface QuoteCardProps {
  quote: Quote;
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onChangeStatus: (id: string, status: QuoteStatus) => void;
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
  canEdit: (quote: Quote) => boolean;
  canDelete: (quote: Quote) => boolean;
}

interface QuotesTableProps {
  quotes: Quote[];
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onChangeStatus: (id: string, status: QuoteStatus) => void;
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
  canEdit: (quote: Quote) => boolean;
  canDelete: (quote: Quote) => boolean;
}

export function QuotesPage() {
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
    formatMoney,
    getStatusColor,
    canEdit,
    canDelete,
    userName,
    isAdmin
  } = useQuotes();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<QuoteStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
    setSelectedQuote(quote);
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsEditMode(true);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      const success = await eliminarCotizacion(id);
      if (success) {
        // Podrías mostrar un toast de éxito aquí
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    const success = await duplicarCotizacion(id);
    if (success) {
      // Podrías mostrar un toast de éxito aquí
    }
  };

  const handleChangeStatus = async (id: string, status: QuoteStatus) => {
    const success = await cambiarEstado(id, status);
    if (success) {
      // Podrías mostrar un toast de éxito aquí
    }
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedQuote(null);
    setIsEditMode(false);
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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Cotizaciones
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gestiona las cotizaciones de productos de construcción
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="p-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              {viewMode === 'grid' ? <FiList className="w-4 h-4" /> : <FiGrid className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Nueva Cotización
            </button>
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
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filtrosActivos > 0 ? 'border-blue-500' : ''
              }`}
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: filtrosActivos > 0 ? 'var(--primary)' : 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <FiFilter className="w-4 h-4" />
              Filtros
              {filtrosActivos > 0 && (
                <span 
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                >
                  {filtrosActivos}
                </span>
              )}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <FiDownload className="w-4 h-4" />
              Exportar
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
              <span 
                className="flex items-center gap-1 px-3 py-1 text-sm rounded-full"
                style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
              >
                Estado: {filtros.estado.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(', ')}
                <button 
                  onClick={() => setSelectedStates([])}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            {filtros.vendedor && (
              <span 
                className="flex items-center gap-1 px-3 py-1 text-sm rounded-full"
                style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
              >
                Vendedor: {filtros.vendedor}
                <button className="ml-1 hover:bg-black/10 rounded-full p-0.5">
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm underline hover:no-underline"
              style={{ color: 'var(--primary)' }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.total}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total
              </p>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--warning)', color: 'white' }}
            >
              <FiEdit2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.borradores}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Borradores
              </p>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--info)', color: 'white' }}
            >
              <FiSend className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.enviadas}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Enviadas
              </p>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--success)', color: 'white' }}
            >
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.aceptadas}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Aceptadas
              </p>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--danger)', color: 'white' }}
            >
              <FiX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.rechazadas}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Rechazadas
              </p>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatMoney(estadisticas.montoTotal)}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Valor Total
              </p>
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
              onDuplicate={handleDuplicate}
              onChangeStatus={handleChangeStatus}
              formatMoney={formatMoney}
              getStatusColor={getStatusColor}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <QuotesTable
          quotes={quotes}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onChangeStatus={handleChangeStatus}
          formatMoney={formatMoney}
          getStatusColor={getStatusColor}
          canEdit={canEdit}
          canDelete={canDelete}
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
            onClick={() => setIsCreateModalOpen(true)}
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

      {/* Modal de Detalle/Edición de Cotización */}
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          isEditMode={isEditMode}
          formatMoney={formatMoney}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Modal de Nueva Cotización */}
      <CreateQuoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Panel de Filtros */}
      <QuoteFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        vendedores={vendedores}
      />
    </div>
  );
}

// Componente para tarjeta individual de cotización
function QuoteCard({ 
  quote, 
  onView, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onChangeStatus,
  formatMoney, 
  getStatusColor, 
  canEdit, 
  canDelete 
}: QuoteCardProps) {
  const statusColor = getStatusColor(quote.estado);
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer relative"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
              Items
            </p>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {quote.items.length}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Total
            </p>
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
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
        <div className={`flex items-center justify-between mt-4 pt-4 border-t transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`} style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(quote);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Ver detalle"
            >
              <FiEye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
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
          </div>
          <div className="flex items-center gap-2">
            {quote.estado === 'borrador' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStatus(quote.id, 'enviada');
                }}
                className="px-3 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Enviar
              </button>
            )}
            {canDelete(quote) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(quote.id);
                }}
                className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                title="Eliminar"
              >
                <FiTrash2 className="w-4 h-4 text-red-500" />
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
  onDuplicate, 
  onChangeStatus,
  formatMoney, 
  getStatusColor, 
  canEdit, 
  canDelete 
}: QuotesTableProps) {
  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Cotización
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Vendedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quotes.map((quote) => {
              const statusColor = getStatusColor(quote.estado);
              return (
                <tr key={quote.id} className="hover:bg-gray-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {quote.numero}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {quote.items.length} items
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                      {canEdit(quote) && (
                        <button
                          onClick={() => onEdit(quote)}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </button>
                      )}
                      <button
                        onClick={() => onDuplicate(quote.id)}
                        className="p-1 rounded hover:bg-gray-100"
                        title="Duplicar"
                      >
                        <FiCopy className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      {canDelete(quote) && (
                        <button
                          onClick={() => onDelete(quote.id)}
                          className="p-1 rounded hover:bg-red-100"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-500" />
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
