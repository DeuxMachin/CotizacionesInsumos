"use client";

import { useState, useEffect, useMemo } from "react";
import { FiPlus, FiMapPin, FiPhone, FiUser, FiClock, FiArrowLeft, FiArrowRight, FiMap, FiFilter, FiTrash2 } from "react-icons/fi";
import { useTargets } from "../model/useTargets";
import { UnifiedFilters, FilterSection, FilterCheckbox } from "@/shared/ui/UnifiedFilters";
import dynamic from "next/dynamic";
const CreateTargetModal = dynamic(() => import("./CreateTargetModal"), { ssr: false, loading: () => null });
const TargetDetailsModal = dynamic(() => import("./TargetDetailsModal").then(m => m.TargetDetailsModal), { ssr: false, loading: () => null });
import type { PosibleTarget } from "../model/types";

// Definir tipos de filtros para targets
interface TargetFilters {
  estado?: string[];
  prioridad?: string[];
  tipoObra?: string[];
}

export function PosiblesTargetsPage() {
  const { targets, loading, fetchTargets, deleteTarget } = useTargets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PosibleTarget | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TargetFilters>({});
  const TARGETS_PER_PAGE = 6;

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // Update selectedTarget when targets change
  useEffect(() => {
    if (selectedTarget) {
      const updatedTarget = targets.find(t => t.id === selectedTarget.id);
      if (updatedTarget && JSON.stringify(updatedTarget) !== JSON.stringify(selectedTarget)) {
        setSelectedTarget(updatedTarget);
      }
    }
  }, [targets]);

  // Filtrar targets según los filtros aplicados
  const filteredTargets = useMemo(() => {
    return targets.filter((target: PosibleTarget) => {
      // Filtro por estado
      if (filters.estado && filters.estado.length > 0) {
        if (!filters.estado.includes(target.estado)) return false;
      }
      
      // Filtro por prioridad
      if (filters.prioridad && filters.prioridad.length > 0) {
        if (!filters.prioridad.includes(target.prioridad)) return false;
      }
      
      // Filtro por tipo de obra
      if (filters.tipoObra && filters.tipoObra.length > 0) {
        if (!target.tipoObra || !filters.tipoObra.includes(target.tipoObra)) return false;
      }
      
      return true;
    });
  }, [targets, filters]);

  const totalPages = Math.ceil(filteredTargets.length / TARGETS_PER_PAGE);
  const paginatedTargets = filteredTargets.slice(
    currentPage * TARGETS_PER_PAGE,
    (currentPage + 1) * TARGETS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'badge-base badge-pendiente';
      case 'contactado':
        return 'badge-base badge-contactado';
      case 'gestionando':
        return 'badge-base badge-gestionando';
      case 'cerrado':
        return 'badge-base badge-cerrado';
      case 'descartado':
        return 'badge-base badge-descartado';
      default:
        return 'badge-base badge-descartado';
    }
  };

  const getPrioridadClass = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'badge-base badge-alta';
      case 'media':
        return 'badge-base badge-media';
      case 'baja':
        return 'badge-base badge-baja';
      default:
        return 'badge-base badge-media';
    }
  };

  const openGoogleMaps = (target: PosibleTarget) => {
    const url = target.ubicacion.googleMapsUrl || 
      `https://www.google.com/maps?q=${target.ubicacion.lat},${target.ubicacion.lng}`;
    window.open(url, '_blank');
  };

  const handleDeleteTarget = async (target: PosibleTarget, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalles
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el target "${target.titulo}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (confirmDelete) {
      try {
        await deleteTarget(target.id);
        // Si el target eliminado era el seleccionado, cerramos el modal
        if (selectedTarget?.id === target.id) {
          setSelectedTarget(null);
        }
      } catch (error) {
        console.error('Error al eliminar target:', error);
        alert('Error al eliminar el target. Por favor, inténtalo de nuevo.');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <div className="h-8 rounded w-48 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          <div className="h-10 rounded w-40 animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
              <div className="h-8 rounded w-20" style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Posibles Targets
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gestiona oportunidades de negocio encontradas en terreno ({filteredTargets.length} targets)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FiFilter className="w-4 h-4" />
            Filtros
            {(filters.estado?.length || 0) + (filters.prioridad?.length || 0) + (filters.tipoObra?.length || 0) > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {(filters.estado?.length || 0) + (filters.prioridad?.length || 0) + (filters.tipoObra?.length || 0)}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Nuevo Target
          </button>
        </div>
      </div>

      {filteredTargets.length === 0 ? (
        <div className="text-center py-12">
          <FiMapPin className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {targets.length === 0 ? 'No hay targets registrados' : 'No se encontraron targets con los filtros aplicados'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {targets.length === 0 
              ? 'Comienza agregando el primer posible target encontrado en terreno'
              : 'Intenta ajustar los filtros o agregar un nuevo target'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <FiPlus className="w-4 h-4" />
            {targets.length === 0 ? 'Agregar Primer Target' : 'Nuevo Target'}
          </button>
        </div>
      ) : (
        <>
          {/* Carrusel de Targets */}
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedTargets.map((target: PosibleTarget) => (
                <div
                  key={target.id}
                  className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                  onClick={() => setSelectedTarget(target)}
                >
                  <div className="p-6">
                    {/* Header con título y estado */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {target.titulo}
                      </h3>
                      <span className={getEstadoClass(target.estado)}>
                        {target.estado}
                      </span>
                    </div>

                    {/* Descripción */}
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {target.descripcion}
                    </p>

                    {/* Ubicación */}
                    <div className="flex items-center gap-2 mb-3">
                      <FiMapPin className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                        {target.ubicacion.direccion}
                      </span>
                    </div>

                    {/* Contacto */}
                    {target.contacto.nombre && (
                      <div className="flex items-center gap-2 mb-3">
                        <FiUser className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {target.contacto.nombre}
                        </span>
                        {target.contacto.telefono && (
                          <>
                            <FiPhone className="w-3 h-3 ml-2" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {target.contacto.telefono}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Información adicional */}
                    <div 
                      className="flex items-center justify-between mt-4 pt-4 border-t"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={getPrioridadClass(target.prioridad)}>
                          {target.prioridad}
                        </span>
                        {target.tipoObra && (
                          <span 
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {target.tipoObra}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openGoogleMaps(target);
                          }}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: 'var(--accent-primary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        >
                          <FiMap className="w-3 h-3" />
                          Ver mapa
                        </button>
                        
                        <button
                          onClick={(e) => handleDeleteTarget(target, e)}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: 'var(--danger-text)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--danger-text)'}
                        >
                          <FiTrash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Footer con fecha y gestión */}
                    <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(target.fechaCreacion).toLocaleDateString()}
                        </div>
                        {target.gestionadoPor && (
                          <div className="flex items-center gap-1">
                            <FiUser className="w-3 h-3" />
                            <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                              {target.nombreGestionadoPor}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación del carrusel */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
                  onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--card-bg)' }}
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Anterior
                </button>
                
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Página {currentPage + 1} de {totalPages} • {filteredTargets.length} targets
                  {filteredTargets.length !== targets.length && ` (${targets.length} total)`}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)' }}
                  onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'var(--card-bg)' }}
                >
                  Siguiente
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modales */}
      {showCreateModal && (
        <CreateTargetModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {selectedTarget && (
        <TargetDetailsModal
          target={selectedTarget}
          isOpen={!!selectedTarget}
          onClose={() => setSelectedTarget(null)}
          onTargetUpdated={() => {
            // Refresh the selected target from the updated targets list
            const updatedTarget = targets.find(t => t.id === selectedTarget.id);
            if (updatedTarget) {
              setSelectedTarget(updatedTarget);
            }
          }}
        />
      )}

      {/* Componente de Filtros */}
      {showFilters && (
        <TargetFiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
          isOpen={showFilters}
          targets={targets}
        />
      )}
    </div>
  );
}

// Componente de filtros para targets
function TargetFiltersPanel({
  filters,
  onFiltersChange,
  onClose,
  isOpen,
  targets
}: {
  filters: TargetFilters;
  onFiltersChange: (filters: TargetFilters) => void;
  onClose: () => void;
  isOpen: boolean;
  targets: PosibleTarget[];
}) {
  const [tempFilters, setTempFilters] = useState<TargetFilters>(filters);

  // Obtener valores únicos de los datos
  const estados = ['pendiente', 'contactado', 'gestionando', 'cerrado', 'descartado'];
  const prioridades = ['alta', 'media', 'baja'];
  const tiposObra = [...new Set(targets.filter(t => t.tipoObra).map(t => t.tipoObra!))];

  const aplicarFiltros = () => {
    onFiltersChange(tempFilters);
    onClose();
  };

  const limpiarFiltros = () => {
    const filtrosVacios: TargetFilters = {};
    setTempFilters(filtrosVacios);
    onFiltersChange(filtrosVacios);
    onClose();
  };

  const getEstadoLabel = (estado: string) => {
    const labels: { [key: string]: string } = {
      pendiente: 'Pendiente',
      contactado: 'Contactado',
      gestionando: 'Gestionando',
      cerrado: 'Cerrado',
      descartado: 'Descartado'
    };
    return labels[estado] || estado;
  };

  const getPrioridadLabel = (prioridad: string) => {
    const labels: { [key: string]: string } = {
      alta: 'Alta',
      media: 'Media',
      baja: 'Baja'
    };
    return labels[prioridad] || prioridad;
  };

  const getEstadoColor = (estado: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      pendiente: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      contactado: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
      gestionando: { bg: 'var(--accent-bg)', text: 'var(--accent-text)' },
      cerrado: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      descartado: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
    };
    return colors[estado] || { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' };
  };

  const getPrioridadColor = (prioridad: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      alta: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
      media: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      baja: { bg: 'var(--success-bg)', text: 'var(--success-text)' }
    };
    return colors[prioridad] || { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' };
  };

  const handleEstadoChange = (estado: string, checked: boolean) => {
    const currentEstados = tempFilters.estado || [];
    const updatedEstados = checked
      ? [...currentEstados, estado]
      : currentEstados.filter(e => e !== estado);
    
    setTempFilters({
      ...tempFilters,
      estado: updatedEstados.length > 0 ? updatedEstados : undefined
    });
  };

  const handlePrioridadChange = (prioridad: string, checked: boolean) => {
    const currentPrioridades = tempFilters.prioridad || [];
    const updatedPrioridades = checked
      ? [...currentPrioridades, prioridad]
      : currentPrioridades.filter(p => p !== prioridad);
    
    setTempFilters({
      ...tempFilters,
      prioridad: updatedPrioridades.length > 0 ? updatedPrioridades : undefined
    });
  };

  const handleTipoObraChange = (tipo: string, checked: boolean) => {
    const currentTipos = tempFilters.tipoObra || [];
    const updatedTipos = checked
      ? [...currentTipos, tipo]
      : currentTipos.filter(t => t !== tipo);
    
    setTempFilters({
      ...tempFilters,
      tipoObra: updatedTipos.length > 0 ? updatedTipos : undefined
    });
  };

  return (
    <UnifiedFilters
      isOpen={isOpen}
      onClose={onClose}
      onApply={aplicarFiltros}
      onClear={limpiarFiltros}
      title="Filtros de Targets"
      showApplyButton={true}
    >
      {/* Sección de Estados */}
      <FilterSection title="Estado">
        {estados.map((estado) => (
          <FilterCheckbox
            key={estado}
            checked={tempFilters.estado?.includes(estado) || false}
            onChange={(checked: boolean) => handleEstadoChange(estado, checked)}
            label={getEstadoLabel(estado)}
            color={getEstadoColor(estado)}
          />
        ))}
      </FilterSection>

      {/* Sección de Prioridades */}
      <FilterSection title="Prioridad">
        {prioridades.map((prioridad) => (
          <FilterCheckbox
            key={prioridad}
            checked={tempFilters.prioridad?.includes(prioridad) || false}
            onChange={(checked: boolean) => handlePrioridadChange(prioridad, checked)}
            label={getPrioridadLabel(prioridad)}
            color={getPrioridadColor(prioridad)}
          />
        ))}
      </FilterSection>

      {/* Sección de Tipos de Obra */}
      {tiposObra.length > 0 && (
        <FilterSection title="Tipo de Obra">
          {tiposObra.map((tipo) => (
            <FilterCheckbox
              key={tipo}
              checked={tempFilters.tipoObra?.includes(tipo) || false}
              onChange={(checked: boolean) => handleTipoObraChange(tipo, checked)}
              label={tipo}
            />
          ))}
        </FilterSection>
      )}
    </UnifiedFilters>
  );
}
