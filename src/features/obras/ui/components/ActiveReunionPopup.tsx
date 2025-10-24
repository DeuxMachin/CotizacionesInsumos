"use client";

import React from 'react';
import { FiClock, FiX, FiMapPin } from 'react-icons/fi';

interface ActiveReunion {
  id: number;
  obraId: number;
  obraNombre: string;
  startTime: string;
}

interface ActiveReunionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onEndReunion: () => void;
  activeReunion: ActiveReunion | null;
  isLoading?: boolean;
}

export function ActiveReunionPopup({ isOpen, onClose, onEndReunion, activeReunion, isLoading }: ActiveReunionPopupProps) {
  if (!isOpen || !activeReunion) return null;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl shadow-xl"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Reunión activa encontrada
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
              <FiClock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Ya tienes una reunión activa
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Debes finalizar la reunión actual antes de iniciar una nueva.
            </p>
          </div>

          {/* Active reunion details */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                <FiMapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {activeReunion.obraNombre}
                </h5>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Iniciada el {formatDate(activeReunion.startTime)} a las {formatTime(activeReunion.startTime)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors order-2 sm:order-1"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onEndReunion}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors order-1 sm:order-2"
            style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
          >
            {isLoading ? 'Finalizando...' : 'Cerrar reunión'}
          </button>
        </div>
      </div>
    </div>
  );
}