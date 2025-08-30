"use client";

import { useState } from "react";
import {
  FiFilter,
  FiX,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import type { 
  FiltersBarProps, 
  EstadoObra, 
  EtapaObra, 
  FiltroObras 
} from "../types/obras";

export function FiltersBar({ 
  filtros, 
  onFiltrosChange, 
  isOpen, 
  onClose, 
  vendedores 
}: FiltersBarProps) {
  const [tempFiltros, setTempFiltros] = useState<FiltroObras>(filtros);

  const estados: EstadoObra[] = ['planificacion', 'activa', 'pausada', 'finalizada', 'cancelada', 'sin_contacto'];
  const etapas: EtapaObra[] = ['fundacion', 'estructura', 'albanileria', 'instalaciones', 'terminaciones', 'entrega'];

  const aplicarFiltros = () => {
    onFiltrosChange(tempFiltros);
    onClose();
  };

  const limpiarFiltros = () => {
    const filtrosVacios: FiltroObras = {};
    setTempFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
    onClose();
  };

  const getEstadoLabel = (estado: EstadoObra) => {
    const labels = {
      planificacion: 'En Planificación',
      activa: 'Obra Activa',
      pausada: 'Pausada',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada',
      sin_contacto: 'Sin Contacto'
    };
    return labels[estado];
  };

  const getEtapaLabel = (etapa: EtapaObra) => {
    const labels = {
      fundacion: 'Fundación',
      estructura: 'Estructura',
      albanileria: 'Albañilería',
      instalaciones: 'Instalaciones', 
      terminaciones: 'Terminaciones',
      entrega: 'Entrega'
    };
    return labels[etapa];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel de Filtros */}
      <div 
        className="fixed right-0 top-0 h-full w-96 z-50 animate-slideIn custom-scrollbar overflow-y-auto"
        style={{ backgroundColor: 'var(--card-bg)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiFilter className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Filtros Avanzados
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Estados */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>
              Estados de Obra
            </label>
            <div className="space-y-2">
              {estados.map((estado) => (
                <label key={estado} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempFiltros.estado?.includes(estado) || false}
                    onChange={(e) => {
                      const estadosActuales = tempFiltros.estado || [];
                      if (e.target.checked) {
                        setTempFiltros({
                          ...tempFiltros,
                          estado: [...estadosActuales, estado]
                        });
                      } else {
                        setTempFiltros({
                          ...tempFiltros,
                          estado: estadosActuales.filter(e => e !== estado)
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-2 transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      accentColor: 'var(--accent-primary)'
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getEstadoLabel(estado)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Etapas */}
          <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>
              Etapas de Construcción
            </label>
            <div className="space-y-2">
              {etapas.map((etapa) => (
                <label key={etapa} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempFiltros.etapa?.includes(etapa) || false}
                    onChange={(e) => {
                      const etapasActuales = tempFiltros.etapa || [];
                      if (e.target.checked) {
                        setTempFiltros({
                          ...tempFiltros,
                          etapa: [...etapasActuales, etapa]
                        });
                      } else {
                        setTempFiltros({
                          ...tempFiltros,
                          etapa: etapasActuales.filter(et => et !== etapa)
                        });
                      }
                    }}
                    className="w-4 h-4 rounded border-2 transition-colors"
                    style={{ 
                      borderColor: 'var(--border)',
                      accentColor: 'var(--accent-primary)'
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getEtapaLabel(etapa)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Vendedor */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-4 h-4" />
              Vendedor Asignado
            </label>
            <select
              value={tempFiltros.vendedor || ''}
              onChange={(e) => setTempFiltros({
                ...tempFiltros,
                vendedor: e.target.value || undefined
              })}
              className="w-full px-3 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiCalendar className="w-4 h-4" />
              Rango de Fechas
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Desde</label>
                <input
                  type="date"
                  value={tempFiltros.fechaDesde?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setTempFiltros({
                    ...tempFiltros,
                    fechaDesde: e.target.value ? new Date(e.target.value) : undefined
                  })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Hasta</label>
                <input
                  type="date"
                  value={tempFiltros.fechaHasta?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setTempFiltros({
                    ...tempFiltros,
                    fechaHasta: e.target.value ? new Date(e.target.value) : undefined
                  })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Acciones */}
        <div 
          className="sticky bottom-0 p-6 border-t"
          style={{ 
            borderColor: 'var(--border)',
            backgroundColor: 'var(--card-bg)'
          }}
        >
          <div className="flex gap-3">
            <button
              onClick={limpiarFiltros}
              className="flex-1 px-4 py-2 text-sm rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Limpiar Todo
            </button>
            <button
              onClick={aplicarFiltros}
              className="flex-1 px-4 py-2 text-sm rounded-lg text-white transition-colors"
              style={{ backgroundColor: 'var(--accent-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
