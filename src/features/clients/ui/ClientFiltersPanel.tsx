"use client";

import { useState } from 'react';
import { UnifiedFilters, FilterSection, FilterCheckbox, FilterDateRange, FilterSelect } from '@/shared/ui/UnifiedFilters';

// Tipos para los filtros de clientes
export type ClientStatus = 'vigente' | 'moroso' | 'inactivo';

export interface ClientFilters {
  estado?: ClientStatus[];
  region?: string[];
  fechaDesde?: Date;
  fechaHasta?: Date;
}

interface ClientFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStates: ClientStatus[];
  setSelectedStates: (states: ClientStatus[]) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  regiones: string[];
  onClear: () => void;
}

export function ClientFiltersPanel({
  isOpen,
  onClose,
  selectedStates,
  setSelectedStates,
  selectedRegions,
  setSelectedRegions,
  regiones,
  onClear
}: ClientFiltersPanelProps) {
  const estados: ClientStatus[] = ['vigente', 'moroso', 'inactivo'];
  
  const getEstadoLabel = (estado: ClientStatus) => {
    const labels: Record<ClientStatus, string> = {
      vigente: 'Vigente',
      moroso: 'Moroso',
      inactivo: 'Inactivo'
    };
    return labels[estado];
  };

  const getEstadoColor = (estado: ClientStatus) => {
    const colors: Record<ClientStatus, { bg: string; text: string }> = {
      vigente: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      moroso: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      inactivo: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
    };
    return colors[estado];
  };

  const handleStateChange = (state: ClientStatus, checked: boolean) => {
    setSelectedStates(
      checked
        ? [...selectedStates, state]
        : selectedStates.filter(s => s !== state)
    );
  };

  const handleRegionChange = (region: string, checked: boolean) => {
    setSelectedRegions(
      checked
        ? [...selectedRegions, region]
        : selectedRegions.filter(r => r !== region)
    );
  };

  return (
    <UnifiedFilters
      isOpen={isOpen}
      onClose={onClose}
      onApply={onClose}
      onClear={onClear}
      title="Filtros de Clientes"
      showApplyButton={true}
    >
      {/* Estados de Clientes */}
      <FilterSection title="Estado del Cliente">
        {estados.map((estado) => (
          <FilterCheckbox
            key={estado}
            checked={selectedStates.includes(estado)}
            onChange={(checked) => handleStateChange(estado, checked)}
            label={getEstadoLabel(estado)}
            color={getEstadoColor(estado)}
          />
        ))}
      </FilterSection>

      {/* Regiones */}
      {regiones && regiones.length > 0 && (
        <FilterSection title="Región">
          <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {regiones.map((region) => (
              <FilterCheckbox
                key={region}
                checked={selectedRegions.includes(region)}
                onChange={(checked) => handleRegionChange(region, checked)}
                label={region}
              />
            ))}
          </div>
        </FilterSection>
      )}
    </UnifiedFilters>
  );
}
