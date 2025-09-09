"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  FiTool, 
  FiHome, 
  FiCalendar, 
  FiDollarSign,
  FiSearch,
  FiFilter,
  FiPlus,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiPhone,
  FiMapPin,
  FiActivity,
  FiClock,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
  FiX
} from "react-icons/fi";
import { useObras } from "../model/useObras";
import type { 
  Obra, 
  EstadoObra, 
  EtapaObra,
  FiltroObras,
  ObraCardProps,
  ObrasTableProps,
  GetEstadoColor,
  GetEtapaColor
} from "../types/obras";
import dynamic from "next/dynamic";
const CreateObraModal = dynamic(() => import("./CreateObraModal").then(m => m.CreateObraModal), {
  loading: () => <div className="p-6">Cargando formulario…</div>,
  ssr: false,
});
import { FiltersBar } from "./FiltersBar";

export function ObrasPage() {
  const router = useRouter();
  const { 
    obras, 
    todasLasObras,
    loading, 
    estadisticas, 
    filtros, 
    setFiltros, 
    isAdmin,
    eliminarObra,
    crearObra,
    paginationConfig,
    goToPage,
    goToNextPage,
    goToPrevPage,
    userId,
    userName
  } = useObras();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstados, setSelectedEstados] = useState<EstadoObra[]>([]);
  const [selectedEtapas, setSelectedEtapas] = useState<EtapaObra[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Aplicar filtros
  useMemo(() => {
    setFiltros({
      busqueda: searchTerm || undefined,
      estado: selectedEstados.length > 0 ? selectedEstados : undefined,
      etapa: selectedEtapas.length > 0 ? selectedEtapas : undefined
    });
  }, [searchTerm, selectedEstados, selectedEtapas, setFiltros]);

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filtros.estado && filtros.estado.length > 0) count++;
    if (filtros.etapa && filtros.etapa.length > 0) count++;
    if (filtros.vendedor) count++;
    if (filtros.fechaDesde) count++;
    if (filtros.fechaHasta) count++;
    if (filtros.busqueda) count++;
    return count;
  }, [filtros]);

  // Obtener lista única de vendedores
  const vendedores = useMemo(() => {
    const vendedoresSet = new Set(todasLasObras.map(obra => obra.nombreVendedor));
    return Array.from(vendedoresSet).map(nombre => ({
      id: nombre.toLowerCase().replace(/\s+/g, '-'),
      nombre
    }));
  }, [todasLasObras]);

  // Obtener color según estado de obra
  const getEstadoColor: GetEstadoColor = (estado: EstadoObra) => {
    const colores = {
      planificacion: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
      activa: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      pausada: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      finalizada: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' },
      cancelada: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
      sin_contacto: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' }
    };
    return colores[estado];
  };

  // Obtener color según etapa
  const getEtapaColor: GetEtapaColor = (etapa: EtapaObra) => {
    const colores = {
      fundacion: { bg: '#8B5CF6', text: '#FFFFFF' }, // purple
      estructura: { bg: '#3B82F6', text: '#FFFFFF' }, // blue  
      albanileria: { bg: '#F59E0B', text: '#FFFFFF' }, // amber
      instalaciones: { bg: '#10B981', text: '#FFFFFF' }, // emerald
      terminaciones: { bg: '#EF4444', text: '#FFFFFF' }, // red
      entrega: { bg: '#6B7280', text: '#FFFFFF' } // gray
    };
    return colores[etapa];
  };

  // Formatear moneda
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Manejar acciones de obra
  const handleEliminar = async (obraId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta obra?')) {
      const success = await eliminarObra(obraId);
      if (success) {
        alert('Obra eliminada exitosamente');
      }
    }
  };

  const handleVerDetalle = (obra: Obra) => {
    router.push(`/dashboard/obras/${obra.id}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedEstados([]);
    setSelectedEtapas([]);
    setFiltros({});
  };

  const handleFiltroChange = <K extends keyof FiltroObras>(
    key: K, 
    value: FiltroObras[K]
  ) => {
    if (key === 'busqueda') {
      setSearchTerm(value as string || '');
    } else if (key === 'estado') {
      setSelectedEstados(value as EstadoObra[] || []);
    } else if (key === 'etapa') {
      setSelectedEtapas(value as EtapaObra[] || []);
    }
    
    setFiltros({
      ...filtros,
      [key]: value
    });
  };

  const handleCreateObra = async (nuevaObra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>): Promise<boolean> => {
    const success = await crearObra(nuevaObra);
    if (success) {
      // Refrescar datos o hacer algo adicional si es necesario
    }
    return success;
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
            <div 
              key={i} 
              className="rounded-xl shadow-sm p-6 animate-pulse"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
            >
              <div className="h-6 rounded w-3/4 mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }} />
              <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--bg-secondary)' }} />
              <div className="h-4 rounded w-2/3 mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>
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
              <FiTool className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              Gestión de Obras
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isAdmin ? 'Vista completa de todas las obras del sistema' : 'Administra tus obras en construcción'}
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
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Nueva Obra
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
              placeholder="Buscar por nombre, constructora, RUT o dirección..."
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
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'table' ? { color: 'var(--text-secondary)' } : {}}
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                <div className="bg-current h-1 rounded-sm"></div>
                <div className="bg-current h-1 rounded-sm"></div>
                <div className="bg-current h-1 rounded-sm"></div>
              </div>
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
                  onClick={() => setFiltros({ ...filtros, estado: undefined })}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            {filtros.etapa && filtros.etapa.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}>
                Etapas: {filtros.etapa.length}
                <button
                  onClick={() => setFiltros({ ...filtros, etapa: undefined })}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            {filtros.vendedor && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                {filtros.vendedor}
                <button
                  onClick={() => setFiltros({ ...filtros, vendedor: undefined })}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            {(filtros.fechaDesde || filtros.fechaHasta) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                Rango de fechas
                <button
                  onClick={() => setFiltros({ ...filtros, fechaDesde: undefined, fechaHasta: undefined })}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => setFiltros({})}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiTool className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.totalObras}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total Obras
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiActivity className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.obrasPorEstado.activa || 0}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Obras Activas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiClock className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.obrasPorEstado.planificacion || 0}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                En Planificación
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-base md:text-lg font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
                {formatMoney(estadisticas.valorTotalEstimado)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Valor Estimado
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-base md:text-lg font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
                {formatMoney(estadisticas.materialVendidoTotal)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Material Vendido
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de obras - Vista Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {obras.map((obra) => (
            <ObraCard 
              key={obra.id} 
              obra={obra} 
              getEstadoColor={getEstadoColor}
              getEtapaColor={getEtapaColor}
              formatMoney={formatMoney}
              onEliminar={handleEliminar}
              onVerDetalle={handleVerDetalle}
            />
          ))}
        </div>
      ) : (
        <ObrasTable 
          obras={obras}
          getEstadoColor={getEstadoColor}
          formatMoney={formatMoney}
          onEliminar={handleEliminar}
          onVerDetalle={handleVerDetalle}
        />
      )}

      {/* Mensaje cuando no hay obras */}
      {obras.length === 0 && (
        <div className="text-center py-12">
          <FiTool className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No se encontraron obras
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm || selectedEstados.length > 0 || selectedEtapas.length > 0 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primera obra'
            }
          </p>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <FiPlus className="w-4 h-4" />
            Nueva Obra
          </button>
        </div>
      )}

      {/* Paginación */}
      {paginationConfig.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {((paginationConfig.currentPage - 1) * paginationConfig.itemsPerPage) + 1} a{' '}
            {Math.min(paginationConfig.currentPage * paginationConfig.itemsPerPage, paginationConfig.totalItems)} de{' '}
            {paginationConfig.totalItems} obras
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={paginationConfig.currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <FiChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: paginationConfig.totalPages }, (_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === paginationConfig.currentPage;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isCurrentPage 
                        ? 'text-white' 
                        : 'hover:bg-opacity-10'
                    }`}
                    style={{
                      backgroundColor: isCurrentPage 
                        ? 'var(--primary)' 
                        : 'transparent',
                      color: isCurrentPage 
                        ? 'white' 
                        : 'var(--text-secondary)',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={paginationConfig.currentPage === paginationConfig.totalPages}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Siguiente
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Nueva Obra */}
      <CreateObraModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateObra}
        currentUserId={userId || ''}
        currentUserName={userName}
      />

      {/* Panel de Filtros */}
      <FiltersBar
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onFiltroChange={handleFiltroChange}
        onClearFilters={handleClearFilters}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        vendedores={vendedores}
      />
    </div>
  );
}

// Componente para tarjeta individual de obra
function ObraCard({ obra, getEstadoColor, getEtapaColor, formatMoney, onEliminar, onVerDetalle }: ObraCardProps) {
  const estadoColor = getEstadoColor(obra.estado);
  
  return (
    <div
      onClick={() => onVerDetalle(obra)}
      className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)'
      }}
    >
      <div className="p-6">
        {/* Header con título y estado */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {obra.nombreEmpresa}
          </h3>
          <span 
            className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap"
            style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
          >
            {obra.estado.replace('_', ' ')}
          </span>
        </div>

        {/* Constructora */}
        <div className="flex items-center gap-2 mb-3">
          <FiHome className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {obra.constructora.nombre}
            </span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              RUT: {obra.constructora.rut}
            </p>
          </div>
        </div>

        {/* Ubicación */}
        <div className="flex items-start gap-2 mb-3">
          <FiMapPin className="w-4 h-4 mt-0.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {obra.direccionObra}
          </span>
        </div>

        {/* Contacto */}
        <div className="flex items-center gap-2 mb-4">
          <FiPhone className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {obra.constructora.contactoPrincipal.nombre}
            </span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {obra.constructora.contactoPrincipal.cargo}
            </p>
          </div>
        </div>

        {/* Etapa actual */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getEtapaColor(obra.etapaActual).bg }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {obra.etapaActual}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {obra.etapasCompletadas.length} etapas completadas
          </span>
        </div>

        {/* Valores */}
        <div 
          className="grid grid-cols-2 gap-4 py-3 border-t border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Valor Estimado</p>
            <p className="text-sm font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
              {obra.valorEstimado ? formatMoney(obra.valorEstimado) : 'N/A'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Material Vendido</p>
            <p className="text-sm font-semibold break-words" style={{ color: 'var(--success-text)' }}>
              {formatMoney(obra.materialVendido)}
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div className="flex items-center justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <FiCalendar className="w-3 h-3" />
            Inicio: {obra.fechaInicio.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            Último contacto: {obra.fechaUltimoContacto.toLocaleDateString()}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerDetalle(obra);
              }}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Ver detalles"
            >
              <FiEye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Editar"
            >
              <FiEdit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEliminar(obra.id);
              }}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Eliminar"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Por: {obra.nombreVendedor}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para vista de tabla (simplificado)
function ObrasTable({ obras, getEstadoColor, formatMoney, onEliminar, onVerDetalle }: ObrasTableProps) {
  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full min-w-[900px]">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium w-1/5" style={{ color: 'var(--text-secondary)' }}>
                Obra / Constructora
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium w-[12%]" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium w-[12%]" style={{ color: 'var(--text-secondary)' }}>
                Etapa
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium w-1/4" style={{ color: 'var(--text-secondary)' }}>
                Valor / Vendido
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium w-[12%]" style={{ color: 'var(--text-secondary)' }}>
                Vendedor
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium w-[10%]" style={{ color: 'var(--text-secondary)' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {obras.map((obra) => {
              const estadoColor = getEstadoColor(obra.estado);
              return (
                <tr 
                  key={obra.id}
                  onClick={() => onVerDetalle(obra)}
                  className={`border-t transition-colors hover:bg-opacity-50 cursor-pointer`}
                  style={{ 
                    borderColor: 'var(--border)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {obra.nombreEmpresa}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {obra.constructora.nombre}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
                    >
                      {obra.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.etapaActual}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>
                        {obra.valorEstimado ? formatMoney(obra.valorEstimado) : 'N/A'}
                      </div>
                      <div className="text-sm break-words" style={{ color: 'var(--success-text)' }}>
                        {formatMoney(obra.materialVendido)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.nombreVendedor}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDetalle(obra);
                        }}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Ver detalles"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Editar"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminar(obra.id);
                        }}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
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
