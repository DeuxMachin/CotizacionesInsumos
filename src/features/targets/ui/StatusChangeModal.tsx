"use client";

import { Modal } from "@/shared/ui/Modal";
import { useState } from "react";
import { FiCheckCircle, FiClock, FiPhone, FiTrendingUp, FiXCircle, FiRotateCcw, FiX } from "react-icons/fi";
import { useTargets } from "../model/useTargets";
import type { PosibleTarget } from "../model/types";

interface StatusChangeModalProps {
  target: PosibleTarget;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

const statusOptions = [
  {
    value: 'pendiente' as const,
    label: 'Pendiente',
    description: 'Target identificado pero sin contacto inicial',
    icon: FiClock,
    color: 'var(--text-muted)',
    bgColor: 'var(--bg-secondary)'
  },
  {
    value: 'contactado' as const,
    label: 'Contactado',
    description: 'Primer contacto establecido con el cliente potencial',
    icon: FiPhone,
    color: 'var(--info-text)',
    bgColor: 'var(--info-bg)'
  },
  {
    value: 'gestionando' as const,
    label: 'Gestionando',
    description: 'En proceso de negociación y desarrollo del proyecto',
    icon: FiTrendingUp,
    color: 'var(--warning-text)',
    bgColor: 'var(--warning-bg)'
  },
  {
    value: 'descartado' as const,
    label: 'Descartado',
    description: 'Proyecto no viable o perdido',
    icon: FiXCircle,
    color: 'var(--danger-text)',
    bgColor: 'var(--danger-bg)'
  }
];

export function StatusChangeModal({ target, isOpen, onClose, onStatusUpdated }: StatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<PosibleTarget['estado']>(target.estado);
  const [loading, setLoading] = useState(false);
  const { updateTarget } = useTargets();

  const handleStatusChange = async () => {
    if (selectedStatus === target.estado) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await updateTarget(target.id, { estado: selectedStatus });
      onStatusUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating target status:', error);
      alert('Error al actualizar el estado del target. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const currentStatusOption = statusOptions.find(option => option.value === target.estado);
  const selectedStatusOption = statusOptions.find(option => option.value === selectedStatus);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 sm:p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Cambiar Estado del Target
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {target.titulo}
              </p>
            </div>
            
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              title="Cerrar"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-4 sm:p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Estado Actual:
            </span>
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: currentStatusOption?.bgColor,
                color: currentStatusOption?.color
              }}
            >
              {currentStatusOption && <currentStatusOption.icon className="w-4 h-4" />}
              {currentStatusOption?.label}
            </div>
          </div>
        </div>

        {/* Status Options */}
        <div className="p-4 sm:p-6">
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Seleccionar Nuevo Estado
          </h3>

          <div className="space-y-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;
              const isCurrent = target.estado === option.value;

              return (
                <div
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-opacity-100 shadow-md' : 'border-opacity-50 hover:border-opacity-75'
                  }`}
                  style={{
                    borderColor: isSelected ? option.color : 'var(--border)',
                    backgroundColor: isSelected ? option.bgColor : 'var(--card-bg)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full flex-shrink-0 ${
                        isSelected ? 'opacity-100' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: option.color + '20' }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: option.color }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {option.label}
                        </h4>
                        {isCurrent && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: 'var(--accent-primary)',
                              color: 'white'
                            }}
                          >
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {option.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      >
                        <FiCheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="btn-secondary flex-1 text-sm"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleStatusChange}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            disabled={loading || selectedStatus === target.estado}
          >
            {loading ? (
              <>
                <FiRotateCcw className="w-4 h-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4" />
                Cambiar Estado
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}