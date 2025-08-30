"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from "@/shared/ui/Modal";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiClock,
  FiTool,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiEdit3,
  FiSave,
  FiRotateCcw,
  FiHome,
  FiMessageSquare,
  FiFlag,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle,
  FiCalendar,
  FiEye,
  FiPercent,
  FiMoreHorizontal
} from 'react-icons/fi';
import { Obra, EtapaObra, EstadoObra, ContactoObra } from '../model/types';

interface ObraDetailModalProps {
  obra: Obra;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (obra: Obra) => Promise<boolean>;
  formatMoney: (amount: number) => string;
  getEstadoColor: (estado: EstadoObra) => { bg: string; text: string };
  getEtapaColor: (etapa: EtapaObra) => { bg: string; text: string };
}

export function ObraDetailModal({
  obra,
  isOpen,
  onClose,
  onUpdate,
  formatMoney,
  getEstadoColor,
  getEtapaColor,
}: ObraDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'contact' | 'financial'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedObra, setEditedObra] = useState<Obra>(obra);
  const [showSecondaryContact, setShowSecondaryContact] = useState(false);
  const [secondaryContact, setSecondaryContact] = useState<ContactoObra | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{success: boolean, message: string} | null>(null);
  const [savedState, setSavedState] = useState<{etapasCompletadas: EtapaObra[], etapaActual: EtapaObra}>(
    {etapasCompletadas: [...obra.etapasCompletadas], etapaActual: obra.etapaActual}
  );
  
  useEffect(() => {
    setEditedObra(obra);
    
    // También actualizamos el estado guardado cuando cambia la obra
    setSavedState({
      etapasCompletadas: [...obra.etapasCompletadas],
      etapaActual: obra.etapaActual
    });
    
    // Inicializar el contacto secundario con valores predeterminados
    // En una implementación real, esto vendría de la API
    if (!secondaryContact) {
      setSecondaryContact({
        nombre: "Carlos Rodriguez",
        cargo: "Comprador de Materiales",
        telefono: "+56 9 8765 4321",
        email: "carlos.rodriguez@" + obra.constructora.nombre.toLowerCase().replace(/\s+/g, '') + ".cl"
      });
    }
    // Nota: incluimos secondaryContact para satisfacer eslint exhaustive-deps.
    // setSecondaryContact es estable de React.
  }, [obra, secondaryContact]);

  const estadoColor = getEstadoColor(obra.estado);
  const etapas: EtapaObra[] = ['fundacion', 'estructura', 'albanileria', 'instalaciones', 'terminaciones', 'entrega'];

  const getProgressPercentage = () => {
    return ((obra.etapasCompletadas.length / etapas.length) * 100);
  };

  // (toggleStageCompletion eliminado hasta que se necesite)

  const setCurrentStage = (etapa: EtapaObra) => {
    // Esta es ahora la única forma de gestionar el progreso de las etapas
    const etapaIndex = etapas.indexOf(etapa);
  const prevEtapas = etapas.slice(0, etapaIndex);
    
    // 1. Marcar todas las etapas previas como completadas
    const updatedEtapasCompletadas = [...prevEtapas]; // Todas las etapas anteriores se consideran completadas
    
    // 2. Asegurarse que la etapa actual NO esté marcada como completada
    // (ya que está "En progreso")
    
    // 3. Asegurarse que todas las etapas posteriores NO estén marcadas como completadas
    // (esto evita tener etapas completadas después de la etapa actual)
    
    setEditedObra({
      ...editedObra,
      etapaActual: etapa,
      etapasCompletadas: updatedEtapasCompletadas
    });
    
    // Esta actualización fuerza un progreso lineal:
    // - Las etapas previas siempre están completadas
    // - La etapa actual está en progreso
    // - Las etapas posteriores están pendientes
  };

  const handleSave = async () => {
    // Activamos el estado de carga y limpiamos cualquier resultado anterior
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      // Llamamos a la función onUpdate proporcionada por el componente padre
      const success = await onUpdate(editedObra);
      
      if (success) {
        // Si la actualización fue exitosa
        setSaveResult({
          success: true,
          message: "Cambios guardados correctamente"
        });
        
        // Si estaba en modo edición, lo mantenemos; si no, seguimos sin él
        // Esto proporciona consistencia en la experiencia de usuario
        
        // Actualizamos el estado guardado para que coincida con el editado
        // Esto hará que el botón "Guardar cambios" desaparezca
        setSavedState({
          etapasCompletadas: [...editedObra.etapasCompletadas],
          etapaActual: editedObra.etapaActual
        });
      } else {
        // Si la actualización falló
        setSaveResult({
          success: false,
          message: "No se pudieron guardar los cambios"
        });
      }
    } catch (error) {
      // Si ocurrió una excepción
      setSaveResult({
        success: false,
        message: "Error al procesar la solicitud"
      });
      console.error("Error al guardar los cambios:", error);
    } finally {
      // Desactivamos el estado de carga
      setIsSaving(false);
      
      // Configuramos un temporizador para eliminar el mensaje después de 3 segundos
      setTimeout(() => {
        setSaveResult(null);
      }, 3000);
    }
  };

  const handleCancel = () => {
    setEditedObra(obra);
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getDaysFromNow = (date: Date) => {
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header Principal */}
        <div className="p-4 sm:p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="p-3 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
                >
                  <FiTool className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {obra.nombreEmpresa}
                  </h1>
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    {obra.constructora.nombre} • {obra.nombreVendedor}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span 
                  className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
                >
                  {obra.estado.replace('_', ' ').toUpperCase()}
                </span>
                
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCancel}
                      className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <span className="hidden xs:inline">Cancelar</span>
                      <span className="xs:hidden">✕</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
                    >
                      <FiSave className="w-3 h-3" />
                      <span className="hidden xs:inline">Guardar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
                  >
                    <FiEdit3 className="w-3 h-3" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                )}
              </div>
            </div>            {/* Navegación de pestañas */}
            <div className="flex border-b overflow-x-auto scrollbar-hide" style={{ borderColor: 'var(--border)' }}>
              {[
                { id: 'overview', label: 'Resumen', icon: FiHome },
                { id: 'progress', label: 'Progreso', icon: FiActivity },
                { id: 'contact', label: 'Contacto', icon: FiUser },
                { id: 'financial', label: 'Finanzas', icon: FiDollarSign },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'overview' | 'progress' | 'contact' | 'financial')}
                    className={`flex items-center gap-1 py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap flex-1 sm:flex-initial justify-center sm:justify-start ${
                      isActive ? 'border-b-2 font-medium' : ''
                    }`}
                    style={{
                      borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xxs:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Información de Gestión - Compacto */}
            <div 
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Inicio:</span>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {formatDate(obra.fechaInicio)}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Último contacto:</span>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium">
                    Hace {getDaysFromNow(obra.fechaUltimoContacto)} días
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Etapa actual:</span>
                  <p style={{ color: 'var(--text-primary)' }} className="font-medium capitalize">
                    {obra.etapaActual.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Progreso:</span>
                  <p style={{ color: 'var(--accent-primary)' }} className="font-medium">
                    {Math.round(getProgressPercentage())}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal - Tabbed */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Tab: Resumen */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Progress Ring y Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Progress Ring */}
                <div 
                  className="p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center text-center"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="relative inline-flex my-2">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="var(--border)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="var(--accent-primary)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - getProgressPercentage() / 100)}`}
                        className="transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {Math.round(getProgressPercentage())}%
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium mt-2" style={{ color: 'var(--text-primary)' }}>
                    Progreso General
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {obra.etapasCompletadas.length} de {etapas.length} etapas completadas
                  </p>
                </div>

                {/* Stats de 2 columnas */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Stat 1 */}
                  <div 
                    className="p-3 sm:p-4 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Presupuesto Total</p>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {obra.presupuesto ? formatMoney(obra.presupuesto) : 'No definido'}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-success)' }}>
                          {isEditing && (
                            <input
                              type="number"
                              value={editedObra.presupuesto || 0}
                              onChange={(e) => setEditedObra({
                                ...editedObra,
                                presupuesto: parseInt(e.target.value, 10)
                              })}
                              className="w-full px-2 py-1 rounded text-sm"
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                            />
                          )}
                        </p>
                      </div>
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--badge-info-bg)' }}
                      >
                        <FiDollarSign size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-info-text)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div 
                    className="p-3 sm:p-4 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Duración Estimada</p>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {obra.duracionEstimada || '?'} meses
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-error)' }}>
                          {isEditing && (
                            <input
                              type="number"
                              value={editedObra.duracionEstimada || 0}
                              onChange={(e) => setEditedObra({
                                ...editedObra,
                                duracionEstimada: parseInt(e.target.value, 10)
                              })}
                              className="w-full px-2 py-1 rounded text-sm"
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                            />
                          )}
                        </p>
                      </div>
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--badge-warning-bg)' }}
                      >
                        <FiClock size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-warning-text)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div 
                    className="p-3 sm:p-4 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Materiales Requeridos</p>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {editedObra.materialVendido ? Math.round(editedObra.materialVendido / 10000) : 0} ítems
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-success)' }}>
                          {isEditing && (
                            <input
                              type="number"
                              value={Math.round(editedObra.materialVendido / 10000)}
                              onChange={(e) => setEditedObra({
                                ...editedObra,
                                materialVendido: parseInt(e.target.value, 10) * 10000
                              })}
                              className="w-full px-2 py-1 rounded text-sm"
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                            />
                          )}
                        </p>
                      </div>
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--badge-success-bg)' }}
                      >
                        <FiBox size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-success-text)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Stat 4 */}
                  <div 
                    className="p-3 sm:p-4 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cotizaciones hechas</p>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {editedObra.materialVendido ? Math.round(editedObra.materialVendido / 100000) : 0}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-info)' }}>
                          {isEditing && (
                            <input
                              type="number"
                              value={Math.round(editedObra.materialVendido / 100000)}
                              onChange={(e) => setEditedObra({
                                ...editedObra,
                                materialVendido: parseInt(e.target.value, 10) * 100000
                              })}
                              className="w-full px-2 py-1 rounded text-sm"
                              style={{ backgroundColor: 'var(--bg-secondary)' }}
                            />
                          )}
                        </p>
                      </div>
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--badge-primary-bg)' }}
                      >
                        <FiFileText size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-primary-text)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la Obra */}
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiHome className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Información de la Obra
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Constructora
                    </label>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.constructora.nombre}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      RUT: {obra.constructora.rut}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Dirección de la Obra
                    </label>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.direccionObra}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Fecha de Inicio
                    </label>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(obra.fechaInicio)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Vendedor Asignado
                    </label>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.nombreVendedor}
                    </p>
                  </div>
                </div>
                
                {obra.descripcion && (
                  <div className="mt-4">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Descripción
                    </label>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {obra.descripcion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tab: Progreso */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Timeline de etapas */}
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FiActivity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Cronograma de Etapas
                  </h3>
                  
                  {/* Indicador de cambios pendientes */}
                  {JSON.stringify(savedState.etapasCompletadas) !== JSON.stringify(editedObra.etapasCompletadas) || 
                   savedState.etapaActual !== editedObra.etapaActual ? (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                      Cambios pendientes
                    </span>
                  ) : null}
                </div>
                
                <div className="space-y-4">
                  {etapas.map((etapa, index) => {
                    const isCompleted = editedObra.etapasCompletadas.includes(etapa);
                    const isCurrent = editedObra.etapaActual === etapa;
                    const etapaColor = getEtapaColor(etapa);
                    
                    return (
                      <div key={etapa} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium`}
                            style={{
                              backgroundColor: isCompleted 
                                ? 'var(--success-bg)' 
                                : isCurrent 
                                ? etapaColor.bg 
                                : 'var(--bg-secondary)',
                              color: isCompleted 
                                ? 'var(--success-text)' 
                                : isCurrent 
                                ? etapaColor.text 
                                : 'var(--text-secondary)',
                              border: '1px solid',
                              borderColor: isCompleted 
                                ? 'var(--success-text)' 
                                : isCurrent 
                                ? etapaColor.text 
                                : 'var(--border)'
                            }}
                          >
                            {isCompleted ? (
                              <FiCheckCircle className="w-4 h-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          
                          {index < etapas.length - 1 && (
                            <div 
                              className="w-px h-8 mx-auto"
                              style={{ 
                                backgroundColor: isCompleted ? 'var(--success-text)' : 'var(--border)'
                              }}
                            />
                          )}
                        </div>
                        
                        <div className="flex-1 pt-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <h4 
                              className="text-sm font-medium capitalize"
                              style={{ 
                                color: isCompleted 
                                  ? 'var(--success-text)' 
                                  : isCurrent 
                                  ? 'var(--text-primary)' 
                                  : 'var(--text-secondary)' 
                              }}
                            >
                              {etapa.replace('_', ' ')}
                            </h4>
                            
                            {/* Botones de acción para gestionar etapas */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Botón "Completado" con estilo verde - solo lectura */}
                              {isCompleted && (
                                <button
                                  className="text-xs px-3 py-1 rounded"
                                  style={{
                                    backgroundColor: 'var(--success-bg)',
                                    color: 'var(--success-text)',
                                  }}
                                  disabled
                                >
                                  Completado
                                </button>
                              )}
                              
                              {/* Botón "En progreso" o "Establecer actual" */}
                              {isCurrent ? (
                                <button
                                  className="text-xs px-3 py-1 rounded"
                                  style={{
                                    backgroundColor: 'var(--accent-bg)',
                                    color: 'var(--accent-text)',
                                  }}
                                  disabled
                                >
                                  En progreso
                                </button>
                              ) : (
                                <button
                                  onClick={() => setCurrentStage(etapa)}
                                  className="text-xs px-3 py-1 rounded"
                                  style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--accent-primary)',
                                    border: '1px solid var(--accent-primary)',
                                  }}
                                >
                                  Establecer actual
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {isCurrent && (
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              Etapa actual en desarrollo
                            </p>
                          )}
                        </div>
                        
                        {/* Eliminamos los botones de flechas para mover etapas */}
                      </div>
                    );
                  })}
                </div>
                
                {/* Botón de guardar cambios */}
                {(JSON.stringify(savedState.etapasCompletadas) !== JSON.stringify(editedObra.etapasCompletadas) || 
                  savedState.etapaActual !== editedObra.etapaActual) && (
                  <div className="mt-4 flex justify-end items-center gap-3">
                    {/* Mensaje de resultado */}
                    {saveResult && (
                      <div 
                        className="text-sm px-3 py-1 rounded animate-fade-in" 
                        style={{ 
                          backgroundColor: saveResult.success ? 'var(--success-bg)' : 'var(--error-bg)',
                          color: saveResult.success ? 'var(--success-text)' : 'var(--error-text)',
                          animation: 'fadeIn 0.3s ease-in-out',
                        }}
                      >
                        {saveResult.message}
                      </div>
                    )}
                    
                    {/* Botón de guardar */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded"
                      style={{
                        backgroundColor: isSaving ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                        color: isSaving ? 'var(--text-secondary)' : 'white',
                        transition: 'all 0.2s ease',
                        cursor: isSaving ? 'wait' : 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                      }}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Actividad Reciente y Próximos Hitos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                    <FiRotateCcw className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Actividad Reciente
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: 'var(--success-text)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          Etapa de {obra.etapasCompletadas[obra.etapasCompletadas.length - 1] || 'inicio'} completada
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Hace {getDaysFromNow(obra.fechaActualizacion) + 2} días
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: 'var(--accent-primary)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          Reunión de seguimiento realizada
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Hace {getDaysFromNow(obra.fechaUltimoContacto)} días
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: 'var(--info-text)' }} />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          Material entregado en sitio
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Hace {getDaysFromNow(obra.fechaActualizacion) + 5} días
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className="p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text-primary)' }}>
                    <FiFlag className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Próximos Hitos
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <FiAlertCircle className="w-4 h-4" style={{ color: 'var(--warning-text)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Revisión de instalaciones
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          En 7 días
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <FiClock className="w-4 h-4" style={{ color: 'var(--info-text)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Entrega de material fase {obra.etapasCompletadas.length + 1}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          En 14 días
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab: Contacto */}
          {activeTab === 'contact' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Sección de contactos */}

              {/* Carrusel de contactos */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  {showSecondaryContact ? 'Persona que compra materiales' : 'Contacto Principal'}
                </h3>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSecondaryContact(false)}
                    className={`p-1 rounded ${!showSecondaryContact ? 'opacity-50' : 'hover:bg-opacity-80'}`}
                    style={{ 
                      backgroundColor: !showSecondaryContact ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                      color: !showSecondaryContact ? 'var(--accent-text)' : 'var(--text-primary)'
                    }}
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSecondaryContact(true)}
                    className={`p-1 rounded ${showSecondaryContact ? 'opacity-50' : 'hover:bg-opacity-80'}`}
                    style={{ 
                      backgroundColor: showSecondaryContact ? 'var(--accent-bg)' : 'var(--bg-secondary)',
                      color: showSecondaryContact ? 'var(--accent-text)' : 'var(--text-primary)'
                    }}
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {showSecondaryContact ? (
                <div 
                  className="p-3 sm:p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="p-2 rounded mb-3" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.15)' }}>
                    <p className="text-sm italic" style={{ color: 'var(--accent-text)' }}>
                      Este contacto es la persona que se encarga de comprar materiales para la obra
                    </p>
                  </div>
                  
                  {secondaryContact ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Nombre Completo
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={secondaryContact.nombre}
                              onChange={(e) => setSecondaryContact({
                                ...secondaryContact,
                                nombre: e.target.value
                              })}
                              className="w-full mt-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-sm"
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          ) : (
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                              {secondaryContact.nombre}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            Cargo
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={secondaryContact.cargo}
                              onChange={(e) => setSecondaryContact({
                                ...secondaryContact,
                                cargo: e.target.value
                              })}
                              className="w-full mt-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-sm"
                              style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border)',
                                color: 'var(--text-primary)'
                              }}
                            />
                          ) : (
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                              {secondaryContact.cargo}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FiPhone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <div className="min-w-0">
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Teléfono</p>
                              <a 
                                href={`tel:${secondaryContact.telefono}`}
                                className="text-sm font-medium transition-colors truncate block"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                {secondaryContact.telefono}
                              </a>
                            </div>
                          </div>
                          <button
                            className="text-xs px-2 py-1 rounded flex-shrink-0"
                            style={{ 
                              backgroundColor: 'var(--accent-bg)', 
                              color: 'var(--accent-text)' 
                            }}
                          >
                            Llamar
                          </button>
                        </div>
                        
                        {secondaryContact.email && (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FiMail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                              <div className="min-w-0">
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email</p>
                                <a 
                                  href={`mailto:${secondaryContact.email}`}
                                  className="text-sm font-medium transition-colors truncate block"
                                  style={{ color: 'var(--accent-primary)' }}
                                >
                                  {secondaryContact.email}
                                </a>
                              </div>
                            </div>
                            <button
                              className="text-xs px-2 py-1 rounded flex-shrink-0"
                              style={{ 
                                backgroundColor: 'var(--info-bg)', 
                                color: 'var(--info-text)' 
                              }}
                            >
                              Enviar Email
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Añadir persona que compra materiales
                          </p>
                          <button
                            onClick={() => setSecondaryContact({
                              nombre: "Carlos Rodriguez",
                              cargo: "Comprador de Materiales",
                              telefono: "+56 9 8765 4321",
                              email: "carlos.rodriguez@sanmartin.cl"
                            })}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            <span className="flex items-center gap-1">
                              <FiUser className="w-3 h-3" />
                              Añadir
                            </span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          No hay persona de compras registrada
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="p-3 sm:p-4 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Nombre Completo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedObra.constructora.contactoPrincipal.nombre}
                          onChange={(e) => setEditedObra({
                            ...editedObra,
                            constructora: {
                              ...editedObra.constructora,
                              contactoPrincipal: {
                                ...editedObra.constructora.contactoPrincipal,
                                nombre: e.target.value
                              }
                            }
                          })}
                          className="w-full mt-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-sm"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {obra.constructora.contactoPrincipal.nombre}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Cargo
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedObra.constructora.contactoPrincipal.cargo}
                          onChange={(e) => setEditedObra({
                            ...editedObra,
                            constructora: {
                              ...editedObra.constructora,
                              contactoPrincipal: {
                                ...editedObra.constructora.contactoPrincipal,
                                cargo: e.target.value
                              }
                            }
                          })}
                          className="w-full mt-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-sm"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      ) : (
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {obra.constructora.contactoPrincipal.cargo}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FiPhone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <div className="min-w-0">
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Teléfono</p>
                          <a 
                            href={`tel:${obra.constructora.contactoPrincipal.telefono}`}
                            className="text-sm font-medium transition-colors truncate block"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            {obra.constructora.contactoPrincipal.telefono}
                          </a>
                        </div>
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded flex-shrink-0"
                        style={{ 
                          backgroundColor: 'var(--accent-bg)', 
                          color: 'var(--accent-text)' 
                        }}
                      >
                        Llamar
                      </button>
                    </div>
                    
                    {obra.constructora.contactoPrincipal.email && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FiMail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <div className="min-w-0">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email</p>
                            <a 
                              href={`mailto:${obra.constructora.contactoPrincipal.email}`}
                              className="text-sm font-medium transition-colors truncate block"
                              style={{ color: 'var(--accent-primary)' }}
                            >
                              {obra.constructora.contactoPrincipal.email}
                            </a>
                          </div>
                        </div>
                        <button
                          className="text-xs px-2 py-1 rounded flex-shrink-0"
                          style={{ 
                            backgroundColor: 'var(--info-bg)', 
                            color: 'var(--info-text)' 
                          }}
                        >
                          Enviar Email
                        </button>
                      </div>
                    )}
                    
                    {obra.constructora.contactoPrincipal.whatsapp && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FiMessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <div className="min-w-0">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>WhatsApp</p>
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {obra.constructora.contactoPrincipal.whatsapp}
                            </p>
                          </div>
                        </div>
                        <button
                          className="text-xs px-2 py-1 rounded flex-shrink-0 text-white"
                          style={{ backgroundColor: '#25D366' }}
                        >
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Datos de la Empresa */}
              <div 
                className="p-3 sm:p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiHome className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Datos de la Constructora
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Razón Social
                    </label>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.constructora.nombre}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      RUT
                    </label>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {obra.constructora.rut}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <FiPhone className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Teléfono Empresa</p>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {obra.constructora.telefono}
                      </p>
                    </div>
                  </div>
                  
                  {obra.constructora.email && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FiMail className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email Empresa</p>
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {obra.constructora.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {obra.constructora.direccion && (
                  <div className="mt-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FiMapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                      <div className="min-w-0">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Dirección Empresa</p>
                        <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>
                          {obra.constructora.direccion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tab: Financiero */}
          {activeTab === 'financial' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Resumen Financiero */}
              <div 
                className="p-3 sm:p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiDollarSign className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Resumen de Cotizaciones
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="relative group">
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Valor Total Cotizado</p>
                      <button 
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        title="Total de todas las cotizaciones realizadas, incluyendo las que no se concretaron"
                      >
                        <FiHelpCircle className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {obra.valorEstimado ? formatMoney(obra.valorEstimado * 1.3) : formatMoney(15000000)}
                    </p>
                  </div>
                  
                  <div className="relative group">
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cotizaciones Concretadas</p>
                      <button 
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        title="Valor de las cotizaciones que se confirmaron y resultaron en ventas"
                      >
                        <FiHelpCircle className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--success-text)' }}>
                      {formatMoney(obra.materialVendido)}
                    </p>
                  </div>
                  
                  <div className="relative group">
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cotizaciones Hechas</p>
                      <button 
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        title="Número total de cotizaciones realizadas para esta obra"
                      >
                        <FiHelpCircle className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--accent-text)' }}>
                      {12} cotizaciones
                    </p>
                  </div>
                  
                  <div className="relative group">
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cotizaciones Aprobadas</p>
                      <button 
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        title="Porcentaje de cotizaciones que fueron aprobadas y se concretaron"
                      >
                        <FiHelpCircle className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--info-text)' }}>
                      {Math.round((8 / 12) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas de Vendedor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div 
                  className="p-3 sm:p-4 rounded-lg text-center"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
                  >
                    <FiPercent className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Tasa de Conversión
                  </h3>
                  <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--success-text)' }}>
                    67%
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Cotizaciones convertidas a ventas
                  </p>
                </div>

                <div 
                  className="p-3 sm:p-4 rounded-lg text-center"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
                  >
                    <FiTrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Volumen de Ventas
                  </h3>
                  <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--accent-text)' }}>
                    {formatMoney(obra.materialVendido).slice(0, -3)}K
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Total vendido en esta obra
                  </p>
                </div>

                <div 
                  className="p-3 sm:p-4 rounded-lg text-center"
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div 
                    className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
                  >
                    <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Frecuencia
                  </h3>
                  <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--info-text)' }}>
                    2.3
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Cotizaciones por semana
                  </p>
                </div>
              </div>

              {/* Historial de Cotizaciones */}
              <div 
                className="p-3 sm:p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiFileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Historial de Cotizaciones
                </h3>
                
                {/* Encabezados de tabla */}
                <div className="hidden sm:grid sm:grid-cols-6 gap-3 pb-2 mb-3 text-xs font-medium" style={{ 
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}>
                  <div className="text-left">Cotizador</div>
                  <div className="text-center">RUT</div>
                  <div className="text-center">N° Cotización</div>
                  <div className="text-center">Monto</div>
                  <div className="text-center">Estado</div>
                  <div className="text-center">Acciones</div>
                </div>
                
                {/* Lista de cotizaciones */}
                <div className="space-y-2">
                  {/* Cotización 1 */}
                  <div className="sm:grid sm:grid-cols-6 gap-3 p-3 rounded border border-opacity-50" style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)'
                  }}>
                    <div className="sm:flex sm:items-center sm:justify-start">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Cotizador: </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Juan Pérez</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>RUT: </span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>12.345.678-9</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>N°: </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>COT-2025-001</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Monto: </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--success-text)' }}>{formatMoney(2500000)}</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Estado: </span>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: 'var(--success-bg)',
                        color: 'var(--success-text)'
                      }}>
                        Confirmada
                      </span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center mt-2 sm:mt-0">
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent-text)'
                        }}
                      >
                        <FiEye className="w-3 h-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                  
                  {/* Cotización 2 */}
                  <div className="sm:grid sm:grid-cols-6 gap-3 p-3 rounded border border-opacity-50" style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)'
                  }}>
                    <div className="sm:flex sm:items-center sm:justify-start">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Cotizador: </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>María González</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>RUT: </span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>98.765.432-1</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>N°: </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>COT-2025-002</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Monto: </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(1800000)}</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Estado: </span>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: 'var(--warning-bg)',
                        color: 'var(--warning-text)'
                      }}>
                        Pendiente
                      </span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center mt-2 sm:mt-0">
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent-text)'
                        }}
                      >
                        <FiEye className="w-3 h-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                  
                  {/* Cotización 3 */}
                  <div className="sm:grid sm:grid-cols-6 gap-3 p-3 rounded border border-opacity-50" style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)'
                  }}>
                    <div className="sm:flex sm:items-center sm:justify-start">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Cotizador: </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Carlos López</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>RUT: </span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>15.987.654-3</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>N°: </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>COT-2025-003</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Monto: </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(950000)}</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Estado: </span>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: 'var(--error-bg)',
                        color: 'var(--error-text)'
                      }}>
                        Rechazada
                      </span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center mt-2 sm:mt-0">
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent-text)'
                        }}
                      >
                        <FiEye className="w-3 h-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                  
                  {/* Cotización 4 */}
                  <div className="sm:grid sm:grid-cols-6 gap-3 p-3 rounded border border-opacity-50" style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)'
                  }}>
                    <div className="sm:flex sm:items-center sm:justify-start">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Cotizador: </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ana Martínez</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>RUT: </span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>18.456.789-2</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>N°: </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>COT-2025-004</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Monto: </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--success-text)' }}>{formatMoney(3200000)}</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Estado: </span>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: 'var(--success-bg)',
                        color: 'var(--success-text)'
                      }}>
                        Confirmada
                      </span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center mt-2 sm:mt-0">
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent-text)'
                        }}
                      >
                        <FiEye className="w-3 h-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                  
                  {/* Cotización 5 */}
                  <div className="sm:grid sm:grid-cols-6 gap-3 p-3 rounded border border-opacity-50" style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)'
                  }}>
                    <div className="sm:flex sm:items-center sm:justify-start">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Cotizador: </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Diego Silva</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>RUT: </span>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>22.334.567-8</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>N°: </span>
                      <span className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>COT-2025-005</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Monto: </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatMoney(1450000)}</span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-xs sm:hidden" style={{ color: 'var(--text-secondary)' }}>Estado: </span>
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor: 'var(--warning-bg)',
                        color: 'var(--warning-text)'
                      }}>
                        Pendiente
                      </span>
                    </div>
                    <div className="sm:flex sm:items-center sm:justify-center mt-2 sm:mt-0">
                      <button
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--accent-bg)',
                          color: 'var(--accent-text)'
                        }}
                      >
                        <FiEye className="w-3 h-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Sistema de paginación */}
                <div className="mt-4 flex justify-between items-center">
                  {/* Info de resultados */}
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Mostrando 5 de 12 cotizaciones
                  </div>
                  
                  {/* Controles de paginación */}
                  <div className="flex items-center gap-2">
                    {/* Botón página anterior */}
                    <button
                      className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)'
                      }}
                      disabled
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex items-center gap-1">
                      {/* Página 1 - activa */}
                      <button
                        className="px-3 py-1.5 rounded text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'white'
                        }}
                      >
                        1
                      </button>
                      
                      {/* Página 2 */}
                      <button
                        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-opacity-80"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        2
                      </button>
                      
                      {/* Página 3 */}
                      <button
                        className="px-3 py-1.5 rounded text-sm font-medium hover:bg-opacity-80"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        3
                      </button>
                      
                      {/* Separador visual */}
                      <span className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <FiMoreHorizontal className="w-4 h-4" />
                      </span>
                    </div>
                    
                    {/* Botón página siguiente */}
                    <button
                      className="p-2 rounded hover:bg-opacity-80"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 md:p-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Actualizado: {formatDate(obra.fechaActualizacion)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button className="btn-secondary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2">
              <FiMessageSquare className="w-3 h-3" />
              <span className="hidden xs:inline">Agregar Nota</span>
              <span className="xs:hidden">Nota</span>
            </button>
            <button className="btn-secondary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2">
              <FiActivity className="w-3 h-3" />
              <span className="hidden xs:inline">Actualizar Etapa</span>
              <span className="xs:hidden">Etapa</span>
            </button>
            <button className="btn-primary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2">
              <FiPhone className="w-3 h-3" />
              <span className="hidden xs:inline">Contactar</span>
              <span className="xs:hidden">Llamar</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
