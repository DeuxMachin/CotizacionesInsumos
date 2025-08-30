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
  FiDownload,
  FiShare2,
  FiEdit3,
  FiSave,
  FiRotateCcw,
  FiBarChart,
  FiTarget,
  FiHome,
  FiMessageSquare,
  FiFlag,
  FiArrowUpRight,
  FiArrowDownRight,
  FiBox,
  FiUsers
} from 'react-icons/fi';
import { Obra, EtapaObra, EstadoObra } from '../model/types';

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
  // Note and setNote state removed as they're not used

  useEffect(() => {
    setEditedObra(obra);
  }, [obra]);

  const estadoColor = getEstadoColor(obra.estado);
  const etapas: EtapaObra[] = ['fundacion', 'estructura', 'albanileria', 'instalaciones', 'terminaciones', 'entrega'];

  const getProgressPercentage = () => {
    return ((obra.etapasCompletadas.length / etapas.length) * 100);
  };

  const getRandomPercentage = () => {
    return Math.floor(Math.random() * 30) + 10;
  };

  const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const handleSave = async () => {
    const success = await onUpdate(editedObra);
    if (success) {
      setIsEditing(false);
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
                          ${obra.presupuesto?.toLocaleString('es-CL')}
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-success)' }}>
                          <span className="flex items-center">
                            <FiArrowUpRight className="mr-1" />
                            {getRandomPercentage()}% vs anterior
                          </span>
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
                          {obra.duracionEstimada} meses
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-error)' }}>
                          <span className="flex items-center">
                            <FiArrowDownRight className="mr-1" />
                            {getRandomPercentage()}% retraso
                          </span>
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
                          {getRandomNumber(30, 100)} ítems
                        </h3>
                        <p className="text-xs mt-1" style={{ color: getRandomPercentage() > 50 ? 'var(--text-success)' : 'var(--text-error)' }}>
                          <span className="flex items-center">
                            {getRandomPercentage() > 50 ? (
                              <>
                                <FiArrowUpRight className="mr-1" />
                                {getRandomPercentage()}% stock
                              </>
                            ) : (
                              <>
                                <FiArrowDownRight className="mr-1" />
                                {getRandomPercentage()}% pendiente
                              </>
                            )}
                          </span>
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
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Personal Asignado</p>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {getRandomNumber(15, 50)} personas
                        </h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-info)' }}>
                          <span className="flex items-center">
                            <FiUser className="mr-1" />
                            {getRandomNumber(3, 8)} especialidades
                          </span>
                        </p>
                      </div>
                      <div 
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'var(--badge-primary-bg)' }}
                      >
                        <FiUsers size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-primary-text)' }} />
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
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiActivity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Cronograma de Etapas
                </h3>
                
                <div className="space-y-4">
                  {etapas.map((etapa, index) => {
                    const isCompleted = obra.etapasCompletadas.includes(etapa);
                    const isCurrent = obra.etapaActual === etapa;
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
                            
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
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
                                  : 'var(--text-secondary)'
                              }}
                            >
                              {isCompleted ? 'Completado' : isCurrent ? 'En progreso' : 'Pendiente'}
                            </span>
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
                          Hace {Math.floor(Math.random() * 10) + 1} días
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
                          Hace {Math.floor(Math.random() * 20) + 1} días
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
                          En {Math.floor(Math.random() * 10) + 1} días
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
                          En {Math.floor(Math.random() * 15) + 1} días
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
              {/* Contacto Principal */}
              <div 
                className="p-3 sm:p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Contacto Principal
                </h3>
                
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
                  Resumen Financiero
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Valor Total Obra</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {obra.valorEstimado ? formatMoney(obra.valorEstimado) : 'No definido'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Material Vendido</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--success-text)' }}>
                      {formatMoney(obra.materialVendido)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Margen Estimado</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--accent-text)' }}>
                      {formatMoney(obra.materialVendido * 0.25)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>% de Avance</p>
                    <p className="text-sm sm:text-base md:text-lg font-semibold" style={{ color: 'var(--info-text)' }}>
                      {obra.valorEstimado ? Math.round((obra.materialVendido / obra.valorEstimado) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Métricas */}
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
                    <FiTarget className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Rendimiento
                  </h3>
                  <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--success-text)' }}>
                    92%
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Cumplimiento del cronograma
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
                    ROI
                  </h3>
                  <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--accent-text)' }}>
                    +18%
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Retorno sobre inversión
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
                    <FiBarChart className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Eficiencia
                  </h3>
                  <div className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--info-text)' }}>
                    87%
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Utilización de recursos
                  </p>
                </div>
              </div>

              {/* Opciones de Exportación */}
              <div 
                className="p-3 sm:p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                <h3 className="text-base font-semibold flex items-center gap-2 mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiDownload className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Exportar Reportes
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <button
                    className="flex items-center gap-2 p-2 sm:p-3 rounded border text-left transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <FiFileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">PDF Completo</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Reporte detallado</p>
                    </div>
                  </button>
                  
                  <button
                    className="flex items-center gap-2 p-2 sm:p-3 rounded border text-left transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <FiBarChart className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Excel Financiero</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Datos financieros</p>
                    </div>
                  </button>
                  
                  <button
                    className="flex items-center gap-2 p-2 sm:p-3 rounded border text-left transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <FiActivity className="w-4 h-4" style={{ color: 'var(--info-text)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Cronograma</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Timeline de obra</p>
                    </div>
                  </button>
                  
                  <button
                    className="flex items-center gap-2 p-2 sm:p-3 rounded border text-left transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <FiShare2 className="w-4 h-4" style={{ color: 'var(--warning-text)' }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">Compartir</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Enviar por email</p>
                    </div>
                  </button>
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
