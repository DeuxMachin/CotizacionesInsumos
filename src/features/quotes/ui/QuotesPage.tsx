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
  FiX,
  FiShoppingCart,
  FiDownload
} from 'react-icons/fi';
import { NotasVentaService } from '@/services/notasVentaService';
import { supabase } from '@/lib/supabase';
import { useQuotes } from '../model/useQuotes';
import { Quote, QuoteStatus } from '@/core/domain/quote/Quote';
import { exportCotizacionesToExcel } from '@/lib/exportUtils';

// Import the filters panel component
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
  onConvert: (q: Quote) => void;
  convertingId: string | null;
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
  onConvert: (q: Quote) => void;
  convertingId: string | null;
}

export function QuotesPage() {
  const router = useRouter();
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
    userId,
    userName,
    isAdmin
    
  } = useQuotes();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<QuoteStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [convertingId, setConvertingId] = useState<string | null>(null);

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
    // Funcionalidad de edición será implementada después
    alert('Funcionalidad de edición en desarrollo');
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

  const handleExport = async () => {
    await exportCotizacionesToExcel(userId || undefined, isAdmin);
  };

  const handleChangeStatus = async (id: string, status: QuoteStatus) => {
    const success = await cambiarEstado(id, status);
    if (success) {
      // Podrías mostrar un toast de éxito aquí
    }
  };

  const handleConvert = async (quote: Quote) => {
    if (!confirm('¿Pasar esta cotización a Nota de Venta (borrador)?')) return;
    setConvertingId(quote.id);
    try {
      // Obtener id numérico real de cotización por folio (quote.id es folio)
      const cotizacionNumericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);
      
      // Asegurarnos de obtener el ID numérico del cliente
      let clientePrincipalId = null;
      try {
        if (quote.cliente && quote.cliente.rut) {
          // Consulta para obtener el ID del cliente a partir del RUT
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('id')
            .eq('rut', quote.cliente.rut)
            .single();
          
          if (clienteData) {
            clientePrincipalId = clienteData.id;
            console.log(`Cliente encontrado con ID: ${clientePrincipalId}`);
          } else {
            console.warn(`No se encontró el cliente con RUT: ${quote.cliente.rut}`);
          }
        }
      } catch (err) {
        console.error("Error al buscar el ID del cliente:", err);
      }
      

      
      // No redirigimos; forzamos refresco de datos (estrategia simple: reload)
      // Ideal: invalidar cache en hook useQuotes.
      window.location.reload();
    } catch (e: unknown) {
      console.error('Error convirtiendo cotización a nota de venta', e);
      const msg = e instanceof Error ? e.message : 'desconocido';
      alert('Error al convertir: ' + msg);
    } finally {
      setConvertingId(null);
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
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <FiFileText className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              Cotizaciones
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gestiona las cotizaciones de productos de construcción
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 relative"
            >
              <FiFilter className="w-4 h-4" />
              Filtros
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
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              Exportar Excel
            </button>
            <button
              onClick={() => router.push('/dashboard/cotizaciones/nueva')}
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.total}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiEdit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.borradores}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Borradores
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiSend className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.enviadas}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Enviadas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.aceptadas}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Aceptadas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)' }}
            >
              <FiX className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.rechazadas}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Rechazadas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiDollarSign className="w-5 h-5" />
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
              onDuplicate={handleDuplicate}
              onChangeStatus={handleChangeStatus}
              formatMoney={formatMoney}
              getStatusColor={getStatusColor}
              canEdit={canEdit}
              canDelete={canDelete}
        onConvert={handleConvert}
        convertingId={convertingId}
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
      onConvert={handleConvert}
      convertingId={convertingId}
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
  canDelete,
  onConvert,
  convertingId
}: QuoteCardProps) {
  const statusColor = getStatusColor(quote.estado);
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      onClick={() => onView(quote)}
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
            {quote.estado !== 'aceptada' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConvert(quote);
                }}
                disabled={convertingId === quote.id}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Pasar a Venta"
              >
                <FiShoppingCart className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
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
  canDelete,
  onConvert,
  convertingId
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
                Documento
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
                      {quote.estado !== 'aceptada' && (
                        <button
                          onClick={() => onConvert(quote)}
                          disabled={convertingId === quote.id}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                          title="Pasar a Venta"
                        >
                          <FiShoppingCart className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </button>
                      )}
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
