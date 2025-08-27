"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiMapPin, FiPhone, FiUser, FiClock, FiArrowLeft, FiArrowRight, FiMap } from "react-icons/fi";
import { useTargets } from "../model/useTargets";
import { CreateTargetModal } from "./CreateTargetModal";
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'contactado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'gestionando':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cerrado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'descartado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Posibles Targets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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
          <FiMapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay targets registrados
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
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
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTarget(target)}
                >
                  <div className="p-6">
                    {/* Header con título y estado */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {target.titulo}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(target.estado)}`}>
                        {target.estado}
                      </span>
                    </div>

                    {/* Descripción */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {target.descripcion}
                    </p>

                    {/* Ubicación */}
                    <div className="flex items-center gap-2 mb-3">
                      <FiMapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {target.ubicacion.direccion}
                      </span>
                    </div>

                    {/* Contacto */}
                    {target.contacto.nombre && (
                      <div className="flex items-center gap-2 mb-3">
                        <FiUser className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {target.contacto.nombre}
                        </span>
                        {target.contacto.telefono && (
                          <>
                            <FiPhone className="w-3 h-3 text-gray-400 ml-2" />
                            <span className="text-xs text-gray-500">
                              {target.contacto.telefono}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Información adicional */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadColor(target.prioridad)}`}>
                          {target.prioridad}
                        </span>
                        {target.tipoObra && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            {target.tipoObra}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMaps(target);
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <FiMap className="w-3 h-3" />
                        Ver mapa
                      </button>
                    </div>

                    {/* Footer con fecha y gestión */}
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(target.fechaCreacion).toLocaleDateString()}
                        </div>
                        {target.gestionadoPor && (
                          <div className="flex items-center gap-1">
                            <FiUser className="w-3 h-3" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Anterior
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage + 1} de {totalPages} • {targets.length} targets
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
