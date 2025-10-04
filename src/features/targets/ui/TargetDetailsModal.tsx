"use client";

import { Modal } from "@/shared/ui/Modal";
import { useState, useEffect } from "react";
import { ConvertToObraModal } from "./ConvertToObraModal";
import EditTargetModal from "./EditTargetModal";
import { StatusChangeModal } from "./StatusChangeModal";
import { FiMapPin, FiPhone, FiMail, FiUser, FiCalendar, FiClock, FiMap, FiExternalLink, FiEdit3, FiMessageSquare, FiHome, FiFlag, FiSettings, FiX } from "react-icons/fi";
import type { PosibleTarget, TargetEvento } from "../model/types";
import { useTargets } from "../model/useTargets";

interface TargetDetailsModalProps {
  target: PosibleTarget;
  isOpen: boolean;
  onClose: () => void;
  onTargetUpdated?: () => void;
}

export function TargetDetailsModal({ target, isOpen, onClose, onTargetUpdated }: TargetDetailsModalProps) {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [events, setEvents] = useState<TargetEvento[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { fetchTargetEvents } = useTargets();

  const handleTargetUpdated = () => {
    setRefreshKey(prev => prev + 1);
    onTargetUpdated?.();
  };

  useEffect(() => {
    if (isOpen && target.id) {
      fetchTargetEvents(target.id).then(setEvents);
    }
  }, [isOpen, target.id, refreshKey, fetchTargetEvents]);
  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'badge-base badge-pendiente';
      case 'contactado': return 'badge-base badge-contactado';
      case 'gestionando': return 'badge-base badge-gestionando';
      case 'cerrado': return 'badge-base badge-cerrado';
      case 'descartado': return 'badge-base badge-descartado';
      default: return 'badge-base badge-descartado';
    }
  };

  const getPrioridadClass = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'badge-base badge-alta';
      case 'media': return 'badge-base badge-media';
      case 'baja': return 'badge-base badge-baja';
      default: return 'badge-base badge-media';
    }
  };

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'contacto': return 'var(--info-text)';
      case 'estado_cambio': return 'var(--warning-text)';
      case 'estimado_inicio': return 'var(--success-text)';
      case 'nota': return 'var(--text-muted)';
      case 'liberado': return 'var(--danger-text)';
      default: return 'var(--accent-primary)';
    }
  };

  const getEventLabel = (tipo: string) => {
    switch (tipo) {
      case 'contacto': return 'Contacto';
      case 'estado_cambio': return 'Cambio de Estado';
      case 'estimado_inicio': return 'Inicio Estimado';
      case 'nota': return 'Nota';
      case 'liberado': return 'Liberado';
      default: return tipo;
    }
  };

  const openInMaps = () => {
    const url = target.ubicacion.googleMapsUrl || 
      `https://www.google.com/maps?q=${target.ubicacion.lat},${target.ubicacion.lng}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full max-w-4xl mx-auto max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Header Principal */}
        <div className="p-3 sm:p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {target.titulo}
              </h1>
              <p className="text-sm sm:text-base mb-2" style={{ color: 'var(--text-secondary)' }}>
                {target.descripcion}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className={getEstadoClass(target.estado)}>
                  {target.estado}
                </span>
                <span className={getPrioridadClass(target.prioridad)}>
                  <FiFlag className="w-3 h-3 mr-1" />
                  {target.prioridad}
                </span>
                {target.tipoObra && (
                  <span 
                    className="badge-base"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <FiHome className="w-3 h-3 mr-1" />
                    {target.tipoObra}
                  </span>
                )}
              </div>
            </div>
            
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              title="Cerrar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Información de Gestión - Más compacta */}
          <div 
            className="mt-3 p-2 rounded-lg"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Creado:</span>
                <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                  {formatDate(target.fechaCreacion)}
                </p>
              </div>
              {target.gestionadoPor && (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Gestiona:</span>
                  <p style={{ color: 'var(--accent-primary)' }} className="font-medium">
                    {target.nombreGestionadoPor}
                  </p>
                </div>
              )}
              {target.fechaEstimadaInicio && (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Inicio Est.:</span>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {formatDate(target.fechaEstimadaInicio)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido Principal - Grid Responsivo */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4">
          
          {/* Columna Izquierda - Ubicación */}
          <div className="space-y-4">
            {/* Ubicación */}
            <div 
              className="rounded-lg p-4"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiMapPin className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Ubicación
                </h3>
                <button
                  onClick={openInMaps}
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--accent-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                >
                  <FiExternalLink className="w-3 h-3" />
                  Ver en Maps
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {target.ubicacion.direccion}
                  </p>
                  {target.ubicacion.ciudad && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {target.ubicacion.ciudad}, {target.ubicacion.region}
                    </p>
                  )}
                </div>
                
                {/* Mini mapa más pequeño */}
                <div 
                  className="h-24 sm:h-32 rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  onClick={openInMaps}
                >
                  <div className="text-center">
                    <FiMap className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Vista de Mapa
                    </p>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      <p>Lat: {target.ubicacion.lat.toFixed(4)}</p>
                      <p>Lng: {target.ubicacion.lng.toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div 
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity"
                    style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <div 
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                    >
                      <FiMap className="w-3 h-3 inline mr-1" />
                      Abrir Mapa
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones si existen */}
            {target.observaciones && (
              <div 
                className="rounded-lg p-3"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                  <FiMessageSquare className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Observaciones
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {target.observaciones}
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha - Contacto y Timeline */}
          <div className="space-y-4">
            
            {/* Información de Contacto */}
            <div 
              className="rounded-lg p-3"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
            >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Información de Contacto
              </h3>
              
              {target.contacto.nombre || target.contacto.telefono || target.contacto.email ? (
                <div className="space-y-3">
                  {target.contacto.nombre && (
                    <div className="flex items-center gap-3">
                      <FiUser className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {target.contacto.nombre}
                        </p>
                        {target.contacto.empresa && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {target.contacto.empresa}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {target.contacto.telefono && (
                    <div className="flex items-center gap-3">
                      <FiPhone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <a 
                        href={`tel:${target.contacto.telefono}`}
                        className="font-medium text-sm transition-colors"
                        style={{ color: 'var(--accent-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                      >
                        {target.contacto.telefono}
                      </a>
                    </div>
                  )}
                  
                  {target.contacto.email && (
                    <div className="flex items-center gap-3">
                      <FiMail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <a 
                        href={`mailto:${target.contacto.email}`}
                        className="font-medium text-sm transition-colors"
                        style={{ color: 'var(--accent-primary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                      >
                        {target.contacto.email}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FiUser className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No hay información de contacto
                  </p>
                </div>
              )}
            </div>

            {/* Timeline más compacto */}
            <div 
              className="rounded-lg p-4"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
            >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                <FiCalendar className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Timeline
              </h3>
              
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-4">
                    <FiCalendar className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      No hay eventos registrados
                    </p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-center gap-3">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getEventColor(event.tipo) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {getEventLabel(event.tipo)}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(event.fecha_evento)}
                          </span>
                        </div>
                        {event.detalle && (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {event.detalle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer con Acciones - Más compacto */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 sm:p-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Actualizado: {formatDate(target.fechaCreacion)}
            </span>
          </div>
          
            <div className="flex items-center gap-2 flex-wrap">
            {target.estado !== 'cerrado' && (
              <button 
                className="btn-secondary text-sm flex items-center gap-1 px-2 py-1"
                onClick={() => setShowStatusModal(true)}
              >
                <FiSettings className="w-3 h-3" />
                Cambiar Estado
              </button>
            )}
            {target.estado !== 'cerrado' && (
              <button 
                className="btn-secondary text-sm flex items-center gap-1 px-2 py-1"
                onClick={() => setShowEditModal(true)}
              >
                <FiEdit3 className="w-3 h-3" />
                Editar
              </button>
            )}
            <button 
              className="btn-primary text-sm flex items-center gap-1 px-2 py-1"
              onClick={() => {
                if (target.contacto.email) {
                  window.location.href = `mailto:${target.contacto.email}`;
                }
              }}
              disabled={!target.contacto.email}
            >
              <FiPhone className="w-3 h-3" />
              Contactar
            </button>
            {target.estado !== 'cerrado' && (
              <button
                className="btn-primary text-sm flex items-center gap-1 px-2 py-1"
                onClick={() => setShowConvertModal(true)}
                title="Crear una nueva obra a partir de este target potencial"
              >
                <FiHome className="w-3 h-3" />
                Crear Obra
              </button>
            )}
          </div>
        </div>

        {/* Placeholder del panel de conversión (se implementará en siguiente paso) */}
        {showConvertModal && (
          <ConvertToObraModal
            isOpen={showConvertModal}
            onClose={() => setShowConvertModal(false)}
            targetId={target.id}
            defaultDireccion={{ direccion: target.ubicacion.direccion, comuna: target.ubicacion.comuna ?? undefined, ciudad: target.ubicacion.ciudad ?? undefined }}
            onConverted={() => setShowConvertModal(false)}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <EditTargetModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            target={target}
            onUpdated={() => {
              setShowEditModal(false);
              handleTargetUpdated();
            }}
          />
        )}

        {/* Status Change Modal */}
        {showStatusModal && (
          <StatusChangeModal
            isOpen={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            target={target}
            onStatusUpdated={() => {
              setShowStatusModal(false);
              handleTargetUpdated();
            }}
          />
        )}
      </div>
    </Modal>
  );
}