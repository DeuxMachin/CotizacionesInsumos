"use client";

import { ReactNode } from "react";
import { FiX, FiFilter } from "react-icons/fi";

interface UnifiedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  onClear: () => void;
  title?: string;
  children: ReactNode;
  showApplyButton?: boolean;
}

export function UnifiedFilters({
  isOpen,
  onClose,
  onApply,
  onClear,
  title = "Filtros Avanzados",
  children,
  showApplyButton = false
}: UnifiedFiltersProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Panel de Filtros - Responsive */}
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 animate-slideInRight overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header - Fijo */}
          <div 
            className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
              >
                <FiFilter className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-secondary)' 
              }}
              aria-label="Cerrar filtros"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido - Scrolleable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {children}
          </div>

          {/* Footer - Fijo */}
          <div 
            className="p-4 sm:p-6 border-t flex flex-col sm:flex-row gap-3 flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              Cerrar
            </button>
            <button
              onClick={onClear}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
              }}
            >
              Limpiar Filtros
            </button>
            {showApplyButton && onApply && (
              <button
                onClick={onApply}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                Aplicar Filtros
              </button>
            )}
            {!showApplyButton && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Componente para secciones de filtros
interface FilterSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function FilterSection({ title, children, className = "" }: FilterSectionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

// Componente para checkboxes de filtros
interface FilterCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  color?: { bg: string; text: string };
}

export function FilterCheckbox({ checked, onChange, label, count, color }: FilterCheckboxProps) {
  return (
    <label className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-opacity-50 ${
      checked ? 'filter-checkbox-checked' : ''
    }`}
           style={{ 
             backgroundColor: checked ? 'var(--accent-bg)' : 'transparent'
           }}
           onMouseEnter={(e) => {
             if (!checked) {
               e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
             }
           }}
           onMouseLeave={(e) => {
             if (!checked) {
               e.currentTarget.style.backgroundColor = 'transparent';
             }
           }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="filter-checkbox"
      />
      <div className="flex items-center justify-between flex-1 min-w-0">
        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {count !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full" 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-muted)' 
                  }}>
              {count}
            </span>
          )}
          {color && (
            <div 
              className="w-3 h-3 rounded-full border"
              style={{ 
                backgroundColor: color.bg,
                borderColor: 'var(--border)'
              }}
            />
          )}
        </div>
      </div>
    </label>
  );
}

// Componente para rangos de fecha
interface FilterDateRangeProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
}

export function FilterDateRange({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  label = "Rango de Fechas"
}: FilterDateRangeProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="space-y-2">
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          placeholder="Fecha inicio"
        />
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          placeholder="Fecha fin"
        />
      </div>
    </div>
  );
}

// Componente para selects
interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
  placeholder?: string;
}

export function FilterSelect({ 
  value, 
  onChange, 
  options, 
  label, 
  placeholder = "Seleccionar..." 
}: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
