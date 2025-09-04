"use client";

import React, { useState } from 'react';
import { UnifiedFilters, FilterSection, FilterCheckbox, FilterDateRange, FilterSelect } from '@/shared/ui/UnifiedFilters';
import { QuoteFilters, QuoteStatus } from '@/core/domain/quote/Quote';

interface QuoteFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: QuoteFilters;
  onFiltrosChange: (filtros: QuoteFilters) => void;
  vendedores: Array<{ id: string; nombre: string }>;
}

const estadosOptions: { value: QuoteStatus; label: string; color: { bg: string; text: string } }[] = [
  { value: 'borrador', label: 'Borrador', color: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' } },
  { value: 'enviada', label: 'Enviada', color: { bg: 'var(--info-bg)', text: 'var(--info-text)' } },
  { value: 'aceptada', label: 'Aceptada', color: { bg: 'var(--success-bg)', text: 'var(--success-text)' } },
  { value: 'rechazada', label: 'Rechazada', color: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' } },
  { value: 'expirada', label: 'Expirada', color: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' } }
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

  // Manejar cambio de estado
  const handleEstadoChange = (estado: QuoteStatus, checked: boolean) => {
    const newSelectedEstados = checked
      ? [...selectedEstados, estado]
      : selectedEstados.filter(e => e !== estado);
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
    <UnifiedFilters
      isOpen={isOpen}
      onClose={onClose}
      onClear={handleLimpiarFiltros}
      onApply={handleAplicarFiltros}
      title="Filtros de Cotizaciones"
      showApplyButton={true}
    >
      {/* Estados */}
      <FilterSection title="Estado de la Cotización">
        <div className="space-y-1">
          {estadosOptions.map((estado) => (
            <FilterCheckbox
              key={estado.value}
              checked={selectedEstados.includes(estado.value)}
              onChange={(checked) => handleEstadoChange(estado.value, checked)}
              label={estado.label}
              color={estado.color}
            />
          ))}
        </div>
      </FilterSection>

      {/* Vendedor */}
      <FilterSection title="Vendedor">
        <FilterSelect
          value={selectedVendedor}
          onChange={setSelectedVendedor}
          options={vendedores.map(v => ({ value: v.id, label: v.nombre }))}
          label="Asignado a"
          placeholder="Todos los vendedores"
        />
      </FilterSection>

      {/* Fechas */}
      <FilterSection title="Fechas">
        <FilterDateRange
          startDate={fechaDesde}
          endDate={fechaHasta}
          onStartDateChange={setFechaDesde}
          onEndDateChange={setFechaHasta}
          label="Fecha de creación"
        />
      </FilterSection>

      {/* Cliente */}
      <FilterSection title="Cliente">
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Buscar por cliente
          </label>
          <input
            type="text"
            value={clienteBusqueda}
            onChange={(e) => setClienteBusqueda(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder="Nombre del cliente"
          />
        </div>
      </FilterSection>
    </UnifiedFilters>
  );
}
