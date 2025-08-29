"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiMapPin, FiPhone, FiUser, FiClock, FiArrowLeft, FiArrowRight, FiMap } from "react-icons/fi";
import { useTargets } from "../model/useTargets";
import CreateTargetModal from "./CreateTargetModal";
import { TargetDetailsModal } from "./TargetDetailsModal";
import type { PosibleTarget } from "../model/types";

export function PosiblesTargetsPage() {
  const { targets, loading, fetchTargets } = useTargets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PosibleTarget | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const TARGETS_PER_PAGE = 6;

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  const totalPages = Math.ceil(targets.length / TARGETS_PER_PAGE);
  const paginatedTargets = targets.slice(
    currentPage * TARGETS_PER_PAGE,
    (currentPage + 1) * TARGETS_PER_PAGE
  );

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
            Gestiona oportunidades de negocio encontradas en terreno
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Nuevo Target
        </button>
      </div>

      {targets.length === 0 ? (
        <div className="text-center py-12">
          <FiMapPin className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No hay targets registrados
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Comienza agregando el primer posible target encontrado en terreno
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <FiPlus className="w-4 h-4" />
            Agregar Primer Target
          </button>
        </div>
      ) : (
        <>
          {/* Carrusel de Targets */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  Página {currentPage + 1} de {totalPages} • {targets.length} targets
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
        />
      )}
    </div>
  );
}
