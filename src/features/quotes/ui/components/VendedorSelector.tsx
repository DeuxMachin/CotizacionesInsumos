"use client";

import React, { useState } from 'react';
import { FiUser, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useVendedores, User } from '@/hooks/useVendedores';

interface VendedorSelectorProps {
  selectedVendedorId?: string;
  selectedVendedorNombre?: string;
  onVendedorChange: (vendedorId: string, vendedorNombre: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VendedorSelector({
  selectedVendedorId,
  selectedVendedorNombre,
  onVendedorChange,
  disabled = false,
  className = ""
}: VendedorSelectorProps) {
  const { vendedores, loading, error } = useVendedores();
  const [isOpen, setIsOpen] = useState(false);

  const selectedVendedor = vendedores.find(v => v.id === selectedVendedorId);

  const handleSelectVendedor = (vendedor: User) => {
    onVendedorChange(vendedor.id, vendedor.name || vendedor.email);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <span style={{ color: 'var(--text-secondary)' }}>Cargando vendedores...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--danger)' }}>
          <FiUser className="w-4 h-4" style={{ color: 'var(--danger)' }} />
          <span style={{ color: 'var(--danger)' }}>Error al cargar vendedores</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        style={{
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FiUser className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <span className="truncate">
            {selectedVendedor?.name || selectedVendedorNombre || 'Seleccionar vendedor'}
          </span>
        </div>
        <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {vendedores.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No hay vendedores disponibles
            </div>
          ) : (
            vendedores.map((vendedor) => (
              <button
                key={vendedor.id}
                type="button"
                onClick={() => handleSelectVendedor(vendedor)}
                className="w-full px-4 py-3 text-left border-b last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{
                    backgroundColor: selectedVendedorId === vendedor.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: selectedVendedorId === vendedor.id ? 'white' : 'var(--text-secondary)'
                  }}>
                    {selectedVendedorId === vendedor.id ? (
                      <FiCheck className="w-3 h-3" />
                    ) : (
                      <FiUser className="w-3 h-3" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">
                      {vendedor.name || vendedor.email}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {vendedor.rol || 'Vendedor'}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}