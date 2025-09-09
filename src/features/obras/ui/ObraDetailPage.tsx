"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  FiMoreHorizontal,
  FiArrowLeft
} from 'react-icons/fi';
import { Obra, EtapaObra, EstadoObra, ContactoObra } from '../types/obras';
import { Toast } from '@/shared/ui/Toast';

interface ObraDetailPageProps {
  obra: Obra;
  onUpdate: (obra: Obra) => Promise<boolean>;
  formatMoney: (amount: number) => string;
  getEstadoColor: (estado: EstadoObra) => { bg: string; text: string };
  getEtapaColor: (etapa: EtapaObra) => { bg: string; text: string };
}

export function ObraDetailPage({
  obra,
  onUpdate,
  formatMoney,
  getEstadoColor,
  getEtapaColor,
}: ObraDetailPageProps) {
  const router = useRouter();
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
  }, [obra, secondaryContact]);

  const estadoColor = getEstadoColor(obra.estado);
  const etapas: EtapaObra[] = ['fundacion', 'estructura', 'albanileria', 'instalaciones', 'terminaciones', 'entrega'];

  const getProgressPercentage = () => {
    return ((obra.etapasCompletadas.length / etapas.length) * 100);
  };

  const setCurrentStage = (etapa: EtapaObra) => {
    const etapaIndex = etapas.indexOf(etapa);
    const prevEtapas = etapas.slice(0, etapaIndex);
    
    const updatedEtapasCompletadas = [...prevEtapas];
    
    setEditedObra({
      ...editedObra,
      etapaActual: etapa,
      etapasCompletadas: updatedEtapasCompletadas
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const success = await onUpdate(editedObra);
      
      if (success) {
  Toast.success('Se actualizó la información');
        setSaveResult({
          success: true,
          message: "Cambios guardados correctamente"
        });
        
        setSavedState({
          etapasCompletadas: [...editedObra.etapasCompletadas],
          etapaActual: editedObra.etapaActual
        });
      } else {
        Toast.error('No se pudieron guardar los cambios');
        setSaveResult({
          success: false,
          message: "No se pudieron guardar los cambios"
        });
      }
    } catch (error) {
      Toast.error('Error al procesar la solicitud');
      setSaveResult({
        success: false,
        message: "Error al procesar la solicitud"
      });
      console.error("Error al guardar los cambios:", error);
    } finally {
      setIsSaving(false);
      
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

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header con botón de regreso */}
        <div className="mb-6">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium hover:bg-opacity-80 transition-colors px-3 py-2 rounded-lg"
            style={{ color: 'var(--accent-primary)' }}
          >
            <FiArrowLeft className="w-4 h-4" />
            Volver a Obras
          </button>
        </div>

        {/* Contenido principal */}
        <div 
          className="rounded-xl overflow-hidden"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/cotizaciones/nueva-obra?obraId=${obra.id}`)}
                        className="text-xs px-2 py-1 flex items-center gap-1 rounded transition-all duration-200 font-medium text-white"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                        title="Crear cotización para esta obra"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                      >
                        <FiDollarSign className="w-3 h-3" />
                        <span className="hidden sm:inline">Cotizar</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary text-xs px-2 py-1 flex items-center gap-1"
                      >
                        <FiEdit3 className="w-3 h-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navegación de pestañas */}
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
                {/* Stats (simplificado, sin anillo de progreso ni presupuesto/duración) */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Material Vendido */}
                    <div 
                      className="p-3 sm:p-4 rounded-lg"
                      style={{ 
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Material Vendido</p>
                          <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1 break-words" style={{ color: 'var(--text-primary)' }}>
                            {editedObra.materialVendido ? formatMoney(editedObra.materialVendido) : formatMoney(0)}
                          </h3>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-success)' }}>
                            {isEditing && (
                              <input
                                type="number"
                                value={editedObra.materialVendido || 0}
                                onChange={(e) => setEditedObra({
                                  ...editedObra,
                                  materialVendido: parseInt(e.target.value, 10)
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

                    {/* Cotizaciones hechas */}
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
                                value={Math.round((editedObra.materialVendido || 0) / 100000)}
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
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedObra.direccionObra}
                          onChange={(e) => setEditedObra({ ...editedObra, direccionObra: e.target.value })}
                          className="mt-1 w-full px-2 py-1 rounded text-sm"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      ) : (
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {obra.direccionObra}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Fecha de Inicio
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={new Date(editedObra.fechaInicio).toISOString().slice(0, 10)}
                          onChange={(e) => setEditedObra({ ...editedObra, fechaInicio: new Date(e.target.value) })}
                          className="mt-1 w-full px-2 py-1 rounded text-sm"
                          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        />
                      ) : (
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(obra.fechaInicio)}
                        </p>
                      )}
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
                  
                  <div className="mt-4">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Descripción
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editedObra.descripcion || ''}
                        onChange={(e) => setEditedObra({ ...editedObra, descripcion: e.target.value })}
                        className="mt-1 w-full px-2 py-1 rounded text-sm"
                        rows={3}
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {obra.descripcion || '—'}
                      </p>
                    )}
                  </div>
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
                    
                    {secondaryContact && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              Nombre Completo
                            </label>
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                              {secondaryContact.nombre}
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              Cargo
                            </label>
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                              {secondaryContact.cargo}
                            </p>
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
                              className="btn-primary text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0"
                              onClick={() => window.open(`tel:${secondaryContact.telefono}`)}
                            >
                              <FiPhone className="w-3 h-3" />
                              <span className="hidden xs:inline">Llamar</span>
                            </button>
                          </div>
                          
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
                              className="btn-secondary text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0"
                              onClick={() => window.open(`mailto:${secondaryContact.email}`)}
                            >
                              <FiMail className="w-3 h-3" />
                              <span className="hidden xs:inline">Email</span>
                            </button>
                          </div>
                        </div>
                      </>
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
                                  nombre: e.target.value,
                                },
                              },
                            })}
                            className="mt-1 w-full px-2 py-1 rounded text-sm"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                                  cargo: e.target.value,
                                },
                              },
                            })}
                            className="mt-1 w-full px-2 py-1 rounded text-sm"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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
                          <div className="min-w-0 w-full">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Teléfono</p>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={editedObra.constructora.contactoPrincipal.telefono}
                                onChange={(e) => setEditedObra({
                                  ...editedObra,
                                  constructora: {
                                    ...editedObra.constructora,
                                    contactoPrincipal: {
                                      ...editedObra.constructora.contactoPrincipal,
                                      telefono: e.target.value,
                                    },
                                  },
                                })}
                                className="mt-1 w-full px-2 py-1 rounded text-sm"
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                              />
                            ) : (
                              <a 
                                href={`tel:${obra.constructora.contactoPrincipal.telefono}`}
                                className="text-sm font-medium transition-colors truncate block"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                {obra.constructora.contactoPrincipal.telefono}
                              </a>
                            )}
                          </div>
                        </div>
                        {!isEditing && (
                          <button
                            className="btn-primary text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0"
                            onClick={() => window.open(`tel:${obra.constructora.contactoPrincipal.telefono}`)}
                          >
                            <FiPhone className="w-3 h-3" />
                            <span className="hidden xs:inline">Llamar</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FiMail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <div className="min-w-0 w-full">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email</p>
                            {isEditing ? (
                              <input
                                type="email"
                                value={editedObra.constructora.contactoPrincipal.email || ''}
                                onChange={(e) => setEditedObra({
                                  ...editedObra,
                                  constructora: {
                                    ...editedObra.constructora,
                                    contactoPrincipal: {
                                      ...editedObra.constructora.contactoPrincipal,
                                      email: e.target.value,
                                    },
                                  },
                                })}
                                className="mt-1 w-full px-2 py-1 rounded text-sm"
                                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                              />
                            ) : (
                              <a 
                                href={`mailto:${obra.constructora.contactoPrincipal.email}`}
                                className="text-sm font-medium transition-colors truncate block"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                {obra.constructora.contactoPrincipal.email}
                              </a>
                            )}
                          </div>
                        </div>
                        {!isEditing && (
                          <button
                            className="btn-secondary text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0"
                            onClick={() => window.open(`mailto:${obra.constructora.contactoPrincipal.email}`)}
                          >
                            <FiMail className="w-3 h-3" />
                            <span className="hidden xs:inline">Email</span>
                          </button>
                        )}
                      </div>
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
                        Nombre
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
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Teléfono Empresa
                      </label>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {obra.constructora.telefono}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Email Empresa
                      </label>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {obra.constructora.email}
                      </p>
                    </div>
                  </div>
                  
                  {obra.constructora.direccion && (
                    <div className="mt-4">
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Dirección Empresa
                      </label>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {obra.constructora.direccion}
                      </p>
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
                    <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Total Cotizado</p>
                      <p className="text-lg sm:text-xl font-bold mt-1 break-words" style={{ color: 'var(--text-primary)' }}>
                        {formatMoney(obra.materialVendido * 1.3)}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Material Vendido</p>
                      <p className="text-lg sm:text-xl font-bold mt-1 break-words" style={{ color: 'var(--success-text)' }}>
                        {formatMoney(obra.materialVendido)}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Pendiente</p>
                      <p className="text-lg sm:text-xl font-bold mt-1 break-words" style={{ color: 'var(--warning-text)' }}>
                        {formatMoney((obra.materialVendido * 1.3) - obra.materialVendido)}
                      </p>
                    </div>
                    
                    <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>% Conversión</p>
                      <p className="text-lg sm:text-xl font-bold mt-1" style={{ color: 'var(--info-text)' }}>
                        76.9%
                      </p>
                    </div>
                  </div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
