"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  FiX,
  FiInfo,
  FiUsers,
  FiTag,
  FiSettings
} from "react-icons/fi";
import { useObras } from "../model/useObras";
import { useReuniones } from "@/hooks/useReuniones";
import { useAuth } from "@/contexts/AuthContext";
import type { 
  Obra, 
  EstadoObra, 
  EtapaObra,
  FiltroObras,
  ObraCardProps,
  ObrasTableProps,
  GetEstadoColor,
  GetEtapaColor,
  ReunionObra
} from "../types/obras";
import { getProgressByStage } from "../types/obras";
import dynamic from "next/dynamic";
const CreateObraModal = dynamic(() => import("./CreateObraModal").then(m => m.CreateObraModal), {
  loading: () => <div className="p-6">Cargando formulario…</div>,
  ssr: false,
});
const ObraTiposManager = dynamic(() => import("./components/ObraTiposManager").then(m => m.ObraTiposManager), {
  loading: () => <div className="p-6">Cargando gestor de categorías…</div>,
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

  const { user } = useAuth();
  const { reuniones, getActiveReunion } = useReuniones();

  // Crear mapa de reuniones activas por obra
  const activeReuniones = useMemo(() => {
    const map: Record<number, ReunionObra | null> = {};
    obras.forEach(obra => {
      map[obra.id] = reuniones.find(r => r.obraId === obra.id && r.status === 'abierta') || null;
    });
    return map;
  }, [obras, reuniones]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstados, setSelectedEstados] = useState<EstadoObra[]>([]);
  const [selectedEtapas, setSelectedEtapas] = useState<EtapaObra[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

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
  const handleEliminar = async (obraId: number) => {
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowHelp(v => !v)}
              className="btn-secondary flex items-center gap-2 text-sm"
              aria-expanded={showHelp}
              aria-controls="obras-help-panel"
            >
              <FiInfo className="w-4 h-4" />
              <span className="hidden sm:inline">{showHelp ? 'Ocultar guía' : 'Ver guía'}</span>
              <span className="sm:hidden">Guía</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 relative text-sm"
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
            {isAdmin && (
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
                title="Gestionar categorías de obras"
              >
                <FiTag className="w-4 h-4" />
                <span className="hidden md:inline">Categorías</span>
              </button>
            )}
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Obra</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </div>

        {/* Panel de ayuda para usuarios poco familiarizados */}
        {showHelp && (
          <div id="obras-help-panel" className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}><strong>¿Qué puedo hacer aquí?</strong></p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>Buscar obras por nombre, constructora o dirección usando la barra de búsqueda.</li>
              <li>Usar <em>Filtros</em> para ver solo obras en cierto estado o etapa.</li>
              <li>Crear una nueva obra con el botón <em>Nueva Obra</em>.</li>
              <li>Haz clic en una obra para ver sus detalles.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Estados</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Planificación, Activa, Pausada, Finalizada, Cancelada, Sin contacto.
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs sm:text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Etapas</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Fundación, Estructura, Albañilería, Instalaciones, Terminaciones, Entrega.
                </p>
              </div>
            </div>
          </div>
        )}

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
            <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Consejo: escribe al menos 3 letras para mejores resultados.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'grid' ? { color: 'var(--text-secondary)' } : {}}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
              <span className="text-sm">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'table' ? { color: 'var(--text-secondary)' } : {}}
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                <div className="bg-current h-1 rounded-sm"></div>
                <div className="bg-current h-1 rounded-sm"></div>
                <div className="bg-current h-1 rounded-sm"></div>
              </div>
              <span className="text-sm">Tabla</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div 
              className="p-1.5 sm:p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiTool className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.totalObras}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total Obras
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div 
              className="p-1.5 sm:p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiActivity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.obrasPorEstado.activa || 0}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Obras Activas
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div 
              className="p-1.5 sm:p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {estadisticas.obrasPorEstado.planificacion || 0}
              </div>
              <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                En Planificación
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div 
              className="p-1.5 sm:p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-sm sm:text-base md:text-lg font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
                {formatMoney(estadisticas.valorTotalEstimado)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Valor Estimado
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div 
              className="p-1.5 sm:p-2 rounded flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-sm sm:text-base md:text-lg font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
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
          {obras.map((obra) => {
            const activeReunion = reuniones.find(r => r.obraId === obra.id && r.status === 'abierta');
            return (
              <ObraCard 
                key={obra.id} 
                obra={obra} 
                getEstadoColor={getEstadoColor}
                getEtapaColor={getEtapaColor}
                formatMoney={formatMoney}
                onEliminar={handleEliminar}
                onVerDetalle={handleVerDetalle}
                activeReunion={activeReunion}
              />
            );
          })}
        </div>
      ) : (
        <ObrasTable 
          obras={obras}
          getEstadoColor={getEstadoColor}
          formatMoney={formatMoney}
          onEliminar={handleEliminar}
          onVerDetalle={handleVerDetalle}
          activeReuniones={activeReuniones}
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
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs sm:text-sm text-center sm:text-left" style={{ color: 'var(--text-secondary)' }}>
            <span className="hidden sm:inline">Mostrando {((paginationConfig.currentPage - 1) * paginationConfig.itemsPerPage) + 1} a{' '}
            {Math.min(paginationConfig.currentPage * paginationConfig.itemsPerPage, paginationConfig.totalItems)} de{' '}
            {paginationConfig.totalItems} obras</span>
            <span className="sm:hidden">Pág. {paginationConfig.currentPage} de {paginationConfig.totalPages}</span>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={goToPrevPage}
              disabled={paginationConfig.currentPage === 1}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <FiChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: paginationConfig.totalPages }, (_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === paginationConfig.currentPage;
                
                // En móvil, mostrar solo páginas cercanas a la actual
                const showOnMobile = Math.abs(pageNum - paginationConfig.currentPage) <= 1 || 
                                     pageNum === 1 || 
                                     pageNum === paginationConfig.totalPages;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                      isCurrentPage 
                        ? 'text-white' 
                        : 'hover:bg-opacity-10'
                    } ${!showOnMobile ? 'hidden sm:flex' : 'flex'} items-center justify-center`}
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <FiChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

      {/* Modal de Gestión de Categorías */}
      <ObraTiposManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onUpdate={() => {
          // Las categorías se actualizarán automáticamente en el modal de creación
        }}
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
function ObraCard({ obra, getEstadoColor, getEtapaColor, formatMoney, onEliminar, activeReunion }: ObraCardProps) {
  const estadoColor = getEstadoColor(obra.estado);
  const router = useRouter();

  const goToDetalle = () => router.push(`/dashboard/obras/${obra.id}`);
  const progress = getProgressByStage(obra.etapaActual);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetalle();
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetalle}
      onKeyDown={onKey}
      className="block rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 sm:p-6">
        {/* Header con título y estado */}
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold line-clamp-2 flex-1" style={{ color: 'var(--text-primary)' }}>
            {obra.nombreEmpresa}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeReunion && (
              <span 
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full whitespace-nowrap flex items-center gap-1"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                title={`Reunión activa desde ${activeReunion.startTime.toLocaleTimeString()}`}
              >
                <FiUsers className="w-3 h-3" />
                <span className="hidden sm:inline">En reunión</span>
              </span>
            )}
            <span 
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full whitespace-nowrap"
              style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
            >
              {obra.estado.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Constructora */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <FiHome className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
              {obra.constructora.nombre}
            </span>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              RUT: {obra.constructora.rut}
            </p>
          </div>
        </div>

        {/* Ubicación */}
        <div className="flex items-start gap-2 mb-2 sm:mb-3">
          <FiMapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs sm:text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {obra.direccionObra}
          </span>
        </div>

        {/* Contacto */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <FiPhone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-medium truncate block" style={{ color: 'var(--text-primary)' }}>
              {obra.constructora.contactoPrincipal.nombre}
            </span>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {obra.constructora.contactoPrincipal.cargo}
            </p>
          </div>
        </div>

        {/* Vendedor/Creador */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4 px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <div className="min-w-0 flex-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Vendedor asignado</span>
            <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {obra.nombreVendedor}
            </p>
          </div>
        </div>

        {/* Etapa actual */}
        {/* Progreso de la obra */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Progreso</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--success-text)' }}>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full" aria-label="Progreso de la obra" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
          </div>
        </div>

        {/* Valores */}
        <div 
          className="grid grid-cols-2 gap-3 sm:gap-4 py-2 sm:py-3 border-t border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Valor Estimado</p>
            <p className="text-xs sm:text-sm font-semibold break-words" style={{ color: 'var(--text-primary)' }}>
              {obra.valorEstimado ? formatMoney(obra.valorEstimado) : 'N/A'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Material Vendido</p>
            <p className="text-xs sm:text-sm font-semibold break-words" style={{ color: 'var(--success-text)' }}>
              {formatMoney(obra.materialVendido)}
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mt-3 sm:mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <FiCalendar className="w-3 h-3" />
            <span className="truncate">Inicio: {obra.fechaInicio.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            <span className="truncate">Últ. contacto: {obra.fechaUltimoContacto.toLocaleDateString()}</span>
          </div>
        </div>

        {/* Acciones (card - compacto y elegante) */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToDetalle(); }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Ver detalles"
          >
            <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Ver</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/obras/${obra.id}?edit=1`); }}
            className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs sm:text-sm border"
            style={{ backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            title="Editar"
          >
            <FiEdit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/obras/${obra.id}/nueva-cotizacion`); }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            title="Crear cotización para esta obra"
          >
            <FiDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Cotizar</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onEliminar(obra.id); }}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--danger)]"
            title="Eliminar"
          >
            <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para vista de tabla (simplificado)
function ObrasTable({ obras, getEstadoColor, formatMoney, onEliminar, onVerDetalle, activeReuniones }: ObrasTableProps) {
  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full min-w-[900px]" aria-label="Tabla de obras con opciones de ver, editar y eliminar">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium w-1/5" style={{ color: 'var(--text-secondary)' }}>
                Obra / Constructora
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium w-[12%]" style={{ color: 'var(--text-secondary)' }}>
                Estado
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium w-[18%]" style={{ color: 'var(--text-secondary)' }}>
                Progreso
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
                    <Link href={`/dashboard/obras/${obra.id}`} prefetch className="block">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {obra.nombreEmpresa}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {obra.constructora.nombre}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {activeReuniones?.[obra.id] && (
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap flex items-center gap-1"
                          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                          title={`Reunión activa desde ${activeReuniones[obra.id]!.startTime.toLocaleTimeString()}`}
                        >
                          <FiUsers className="w-3 h-3" />
                          En reunión
                        </span>
                      )}
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
                      >
                        {obra.estado.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {(() => {
                      const progress = getProgressByStage(obra.etapaActual);
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{obra.etapaActual.replace('_', ' ')}</span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--success-text)' }}>{progress}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full" aria-label="Progreso de la obra" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <div className="h-2 rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
                          </div>
                        </div>
                      );
                    })()}
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
                      <Link href={`/dashboard/obras/${obra.id}`} prefetch className="px-2 py-1 rounded transition-colors flex items-center gap-1" style={{ color: 'var(--text-secondary)' }} title="Ver detalles">
                        <FiEye className="w-4 h-4" />
                        <span className="text-xs">Ver</span>
                      </Link>
                      <Link
                        href={`/dashboard/obras/${obra.id}?edit=1`}
                        prefetch
                        className="px-2 py-1 min-h-[36px] rounded-md transition-colors flex items-center gap-1 text-xs"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                        title="Editar"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiEdit3 className="w-4 h-4" />
                        <span>Editar</span>
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/obras/${obra.id}/nueva-cotizacion`; }}
                        className="px-2 py-1 min-h-[36px] rounded-md transition-all duration-200 flex items-center gap-1 text-xs text-white"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                        title="Cotizar"
                      >
                        <FiDollarSign className="w-4 h-4" />
                        <span>Cotizar</span>
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
