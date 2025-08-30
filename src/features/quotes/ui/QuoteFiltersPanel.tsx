"use client";

import React, { useState } from 'react';
import { FiX, FiCalendar, FiUser, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { QuoteFilters, QuoteStatus } from '@/core/domain/quote/Quote';

interface QuoteFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: QuoteFilters;
  onFiltrosChange: (filtros: QuoteFilters) => void;
  vendedores: Array<{ id: string; nombre: string }>;
}

const estadosOptions: { value: QuoteStatus; label: string; color: string }[] = [
  { value: 'borrador', label: 'Borrador', color: 'orange' },
  { value: 'enviada', label: 'Enviada', color: 'blue' },
  { value: 'aceptada', label: 'Aceptada', color: 'green' },
  { value: 'rechazada', label: 'Rechazada', color: 'red' },
  { value: 'expirada', label: 'Expirada', color: 'gray' }
];

export function QuoteFiltersPanel({
  isOpen,
  onClose,
  filtros,
  onFiltrosChange,
  vendedores
}: QuoteFiltersPanelProps) {
  // Estados locales para los filtros
  const [selectedEstados, setSelectedEstados] = useState<QuoteStatus[]>(filtros.estado || []);
  const [selectedVendedor, setSelectedVendedor] = useState<string>(filtros.vendedor || '');
  const [fechaDesde, setFechaDesde] = useState<string>(filtros.fechaDesde || '');
  const [fechaHasta, setFechaHasta] = useState<string>(filtros.fechaHasta || '');
  const [clienteBusqueda, setClienteBusqueda] = useState<string>(filtros.cliente || '');

  if (!isOpen) return null;

  // Manejar cambio de estado
  const handleEstadoChange = (estado: QuoteStatus) => {
    const newSelectedEstados = selectedEstados.includes(estado)
      ? selectedEstados.filter(e => e !== estado)
      : [...selectedEstados, estado];
    setSelectedEstados(newSelectedEstados);
  };

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    const newFiltros: QuoteFilters = {
      ...filtros,
      estado: selectedEstados.length > 0 ? selectedEstados : undefined,
      vendedor: selectedVendedor || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      cliente: clienteBusqueda || undefined
    };

    onFiltrosChange(newFiltros);
    onClose();
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setSelectedEstados([]);
    setSelectedVendedor('');
    setFechaDesde('');
    setFechaHasta('');
    setClienteBusqueda('');
    onFiltrosChange({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-96 max-w-full shadow-xl transform transition-transform"
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Filtros
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-full pb-24">
          {/* Estados */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiCheckSquare className="w-4 h-4" />
              Estados
            </h3>
            <div className="space-y-2">
              {estadosOptions.map(estado => (
                <label key={estado.value} className="flex items-center gap-3 cursor-pointer">
                  <div 
                    onClick={() => handleEstadoChange(estado.value)}
                    className="flex items-center justify-center w-5 h-5 border-2 rounded transition-colors cursor-pointer"
                    style={{
                      borderColor: selectedEstados.includes(estado.value) ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: selectedEstados.includes(estado.value) ? 'var(--primary)' : 'transparent'
                    }}
                  >
                    {selectedEstados.includes(estado.value) && (
                      <FiCheckSquare className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: estado.color === 'orange' ? '#F59E0B' :
                          estado.color === 'blue' ? '#3B82F6' :
                          estado.color === 'green' ? '#10B981' :
                          estado.color === 'red' ? '#EF4444' :
                          '#6B7280'
                      }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {estado.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Vendedor */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-4 h-4" />
              Vendedor
            </h3>
            <select
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Todos los vendedores</option>
              {vendedores.map(vendedor => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Cliente
            </h3>
            <input
              type="text"
              value={clienteBusqueda}
              onChange={(e) => setClienteBusqueda(e.target.value)}
              placeholder="Buscar por nombre de cliente..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Rango de Fechas */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiCalendar className="w-4 h-4" />
              Rango de Fechas
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
              Filtros Rápidos
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  setFechaDesde(lastWeek.toISOString().split('T')[0]);
                  setFechaHasta(today.toISOString().split('T')[0]);
                }}
                className="w-full text-left px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                Última semana
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                  setFechaDesde(lastMonth.toISOString().split('T')[0]);
                  setFechaHasta(today.toISOString().split('T')[0]);
                }}
                className="w-full text-left px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                Último mes
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  setFechaDesde(thisMonth.toISOString().split('T')[0]);
                  setFechaHasta(today.toISOString().split('T')[0]);
                }}
                className="w-full text-left px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                Este mes
              </button>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div 
          className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t space-y-3"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
        >
          <button
            onClick={handleAplicarFiltros}
            className="w-full btn-primary"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={handleLimpiarFiltros}
            className="w-full px-4 py-2 border rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
