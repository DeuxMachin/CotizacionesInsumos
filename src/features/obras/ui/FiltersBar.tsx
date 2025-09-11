"use client";

import { useState } from "react";
import { UnifiedFilters, FilterSection, FilterCheckbox, FilterDateRange, FilterSelect } from "@/shared/ui/UnifiedFilters";
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
  vendedores,
  
  onClearFilters 
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
    if (onClearFilters) {
      onClearFilters();
    }
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

  const getEstadoColor = (estado: EstadoObra) => {
    const colors = {
      planificacion: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      activa: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      pausada: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
      finalizada: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
      cancelada: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
      sin_contacto: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
    };
    return colors[estado];
  };

  const getEtapaColor = (etapa: EtapaObra) => {
    const colors = {
      fundacion: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      estructura: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
      albanileria: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      instalaciones: { bg: 'var(--accent-bg)', text: 'var(--accent-text)' },
      terminaciones: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      entrega: { bg: 'var(--info-bg)', text: 'var(--info-text)' }
    };
    return colors[etapa];
  };

  const handleEstadoChange = (estado: EstadoObra, checked: boolean) => {
    const currentEstados = tempFiltros.estado || [];
    const updatedEstados = checked 
      ? [...currentEstados, estado]
      : currentEstados.filter(e => e !== estado);
    
    setTempFiltros({
      ...tempFiltros,
      estado: updatedEstados.length > 0 ? updatedEstados : undefined
    });
  };

  const handleEtapaChange = (etapa: EtapaObra, checked: boolean) => {
    const currentEtapas = tempFiltros.etapa || [];
    const updatedEtapas = checked 
      ? [...currentEtapas, etapa]
      : currentEtapas.filter(e => e !== etapa);
    
    setTempFiltros({
      ...tempFiltros,
      etapa: updatedEtapas.length > 0 ? updatedEtapas : undefined
    });
  };

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
      title="Filtros de Obras"
      showApplyButton={true}
    >
      {/* Sección de Estados */}
      <FilterSection title="Estado de la Obra">
        {estados.map((estado) => (
          <FilterCheckbox
            key={estado}
            checked={tempFiltros.estado?.includes(estado) || false}
            onChange={(checked) => handleEstadoChange(estado, checked)}
            label={getEstadoLabel(estado)}
            color={getEstadoColor(estado)}
          />
        ))}
      </FilterSection>

      {/* Sección de Etapas */}
      <FilterSection title="Etapa Actual">
        {etapas.map((etapa) => (
          <FilterCheckbox
            key={etapa}
            checked={tempFiltros.etapa?.includes(etapa) || false}
            onChange={(checked) => handleEtapaChange(etapa, checked)}
            label={getEtapaLabel(etapa)}
            color={getEtapaColor(etapa)}
          />
        ))}
      </FilterSection>

      {/* Sección de Vendedores */}
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

      {/* Sección de Fechas */}
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
          label="Fecha de creación"
        />
      </FilterSection>
    </UnifiedFilters>
  );
}
