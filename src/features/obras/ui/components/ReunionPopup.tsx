"use client";

import React, { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiPlay, FiX } from 'react-icons/fi';
import { getCurrentLocation } from '@/lib/geolocation';
import { useAuth } from '@/contexts/AuthContext';

interface ReunionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (location?: any) => void;
  obraName: string;
  isLoading?: boolean;
}

export function ReunionPopup({ isOpen, onClose, onStart, obraName, isLoading }: ReunionPopupProps) {
  const { user } = useAuth();
  const [location, setLocation] = useState<any>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const isOwner = user?.role === 'dueño';

  useEffect(() => {
    if (isOpen) {
      setLocation(null);
      setLocationError(null);
      setGettingLocation(false);
      // No obtener ubicación automáticamente al abrir el popup
    }
  }, [isOpen]);

  const handleGetLocation = async () => {
    setGettingLocation(true);
    setLocationError(null);

    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
      } else {
        // Don't show error for non-owners, just silently fail
        if (isOwner) {
          setLocationError('No se pudo obtener la ubicación. Verifica permisos de GPS.');
        }
      }
    } catch (error) {
      // Don't show error for non-owners, just silently fail
      if (isOwner) {
        setLocationError('Error al obtener ubicación.');
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleStart = async () => {
    // Obtener ubicación actual justo antes de iniciar la reunión (transparente)
    let currentLocation = location;
    if (!currentLocation) {
      try {
        currentLocation = await getCurrentLocation();
      } catch (error) {
        // Silently fail - la reunión se puede iniciar sin ubicación
        console.log('No se pudo obtener ubicación para la reunión:', error);
      }
    }
    
    onStart(currentLocation);
  };

  if (!isOpen) return null;

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
            Iniciar reunión en obra
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
            <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
              <FiClock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              ¿Iniciar reunión en {obraName}?
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Registra tu llegada a la obra y comienza a trackear el tiempo de la reunión.
            </p>
          </div>

          {/* Location section - only visible to owners if there's an error */}
          {isOwner && locationError && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Ubicación
                </span>
              </div>
              
              <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-text)' }}>
                <p className="text-sm" style={{ color: 'var(--warning-text)' }}>
                  {locationError}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Puedes iniciar la reunión sin registrar ubicación.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            Ahora no
          </button>
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {isLoading ? 'Iniciando...' : 'Iniciar reunión'}
          </button>
        </div>
      </div>
    </div>
  );
}