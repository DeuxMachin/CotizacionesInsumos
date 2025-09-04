"use client";

import { useState } from 'react';
import { UnifiedFilters, FilterSection, FilterCheckbox, FilterDateRange, FilterSelect } from '@/shared/ui/UnifiedFilters';

// Tipos de estados para filtros
export type TargetStatus = 'potencial' | 'contactado' | 'negociando' | 'cliente' | 'perdido';

export interface TargetFilters {
  estado?: TargetStatus[];
  region?: string[];
  fechaDesde?: Date;
  fechaHasta?: Date;
  vendedor?: string;
}

interface TargetFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: TargetFilters;
  onFiltrosChange: (filtros: TargetFilters) => void;
  regiones: string[];
  vendedores: Array<{ id: string; nombre: string }>;
}

const estadosOptions: { value: TargetStatus; label: string; color: { bg: string; text: string } }[] = [
  { value: 'potencial', label: 'Potencial', color: { bg: 'var(--info-bg)', text: 'var(--info-text)' } },
  { value: 'contactado', label: 'Contactado', color: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' } },
  { value: 'negociando', label: 'Negociando', color: { bg: 'var(--accent-bg)', text: 'var(--accent-text)' } },
  { value: 'cliente', label: 'Cliente', color: { bg: 'var(--success-bg)', text: 'var(--success-text)' } },
  { value: 'perdido', label: 'Perdido', color: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' } }
];

export function TargetFiltersPanel({
  isOpen,
  onClose,
  filtros,
  onFiltrosChange,
  regiones,
  vendedores
}: TargetFiltersPanelProps) {
  // Estados locales para los filtros
  const [tempFiltros, setTempFiltros] = useState<TargetFilters>(filtros);

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    onFiltrosChange(tempFiltros);
    onClose();
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    const filtrosVacios: TargetFilters = {};
    setTempFiltros(filtrosVacios);
    onFiltrosChange(filtrosVacios);
    onClose();
  };

  // Manejador para cambio de estado
  const handleEstadoChange = (estado: TargetStatus, checked: boolean) => {
    const currentEstados = tempFiltros.estado || [];
    const updatedEstados = checked
      ? [...currentEstados, estado]
      : currentEstados.filter(e => e !== estado);
    
    setTempFiltros({
      ...tempFiltros,
      estado: updatedEstados.length > 0 ? updatedEstados : undefined
    });
  };

  // Manejador para cambio de región
  const handleRegionChange = (region: string, checked: boolean) => {
    const currentRegiones = tempFiltros.region || [];
    const updatedRegiones = checked
      ? [...currentRegiones, region]
      : currentRegiones.filter(r => r !== region);
    
    setTempFiltros({
      ...tempFiltros,
      region: updatedRegiones.length > 0 ? updatedRegiones : undefined
    });
  };

  // Formateo de fechas para los inputs
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseDateFromInput = (dateString: string) => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };

  return (
    <UnifiedFilters
      isOpen={isOpen}
      onClose={onClose}
      onApply={aplicarFiltros}
      onClear={limpiarFiltros}
      title="Filtros de Posibles Targets"
      showApplyButton={true}
    >
      {/* Estados de Target */}
      <FilterSection title="Estado">
        {estadosOptions.map((estado) => (
          <FilterCheckbox
            key={estado.value}
            checked={(tempFiltros.estado || []).includes(estado.value)}
            onChange={(checked) => handleEstadoChange(estado.value, checked)}
            label={estado.label}
            color={estado.color}
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
                checked={(tempFiltros.region || []).includes(region)}
                onChange={(checked) => handleRegionChange(region, checked)}
                label={region}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Vendedores */}
      {vendedores && vendedores.length > 0 && (
        <FilterSection title="Vendedor Asignado">
          <FilterSelect
            value={tempFiltros.vendedor || ''}
            onChange={(value) => setTempFiltros({
              ...tempFiltros,
              vendedor: value || undefined
            })}
            options={vendedores.map(v => ({ value: v.id, label: v.nombre }))}
            label=""
            placeholder="Todos los vendedores"
          />
        </FilterSection>
      )}

      {/* Rango de Fechas */}
      <FilterSection title="Rango de Fechas">
        <FilterDateRange
          startDate={formatDateForInput(tempFiltros.fechaDesde)}
          endDate={formatDateForInput(tempFiltros.fechaHasta)}
          onStartDateChange={(date) => setTempFiltros({
            ...tempFiltros,
            fechaDesde: parseDateFromInput(date)
          })}
          onEndDateChange={(date) => setTempFiltros({
            ...tempFiltros,
            fechaHasta: parseDateFromInput(date)
          })}
          label="Fecha de contacto"
        />
      </FilterSection>
    </UnifiedFilters>
  );
}
