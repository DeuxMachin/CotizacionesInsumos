"use client";

import React from 'react';
import { FiTruck, FiMapPin, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { DeliveryInfo } from '@/core/domain/quote/Quote';

interface DeliveryFormProps {
  data: Partial<DeliveryInfo>;
  onChange: (data: Partial<DeliveryInfo>) => void;
  errors?: string[];
}

export function DeliveryForm({ data, onChange }: DeliveryFormProps) {
  const handleInputChange = (field: keyof DeliveryInfo, value: string | number) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // Obtener fecha mínima (mañana)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiTruck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Información de Despacho
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configure los detalles de entrega (opcional)
          </p>
        </div>
      </div>

      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--info-text)' }}>
          <strong>Nota:</strong> Esta información es opcional. Si no se especifica, se utilizará la dirección del cliente como dirección de entrega por defecto.
        </p>
      </div>

      <div className="space-y-6">
        {/* Dirección de entrega */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Dirección de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Dirección de Despacho
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="text"
                  value={data.direccion || ''}
                  onChange={(e) => handleInputChange('direccion', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Dirección completa de entrega (opcional)"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Si no se especifica, se utilizará la dirección del cliente
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Comuna
              </label>
              <input
                type="text"
                value={data.comuna || ''}
                onChange={(e) => handleInputChange('comuna', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Comuna de entrega"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Ciudad
              </label>
              <input
                type="text"
                value={data.ciudad || ''}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Ciudad de entrega"
              />
            </div>
          </div>
        </div>

        {/* Detalles de entrega */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Detalles de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Fecha Estimada de Entrega
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="date"
                  value={data.fechaEstimada || ''}
                  min={getMinDate()}
                  onChange={(e) => handleInputChange('fechaEstimada', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Costo de Despacho
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={data.costoDespacho || ''}
                  onChange={(e) => handleInputChange('costoDespacho', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="0"
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Costo adicional por despacho (opcional)
              </p>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Observaciones de Despacho
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Instrucciones Especiales
            </label>
            <textarea
              value={data.observaciones || ''}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2 resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Instrucciones especiales para la entrega, horarios preferenciales, contacto en obra, etc."
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Información adicional que pueda ser útil para la entrega
            </p>
          </div>
        </div>

        {/* Opciones predefinidas */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Opciones Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => onChange({
                ...data,
                costoDespacho: 0,
                observaciones: 'Despacho sin costo adicional'
              })}
              className="p-3 text-left rounded-lg border transition-colors hover:shadow-sm"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="font-medium text-sm">Despacho Gratis</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Sin costo adicional
              </div>
            </button>

            <button
              onClick={() => onChange({
                ...data,
                costoDespacho: 25000,
                observaciones: 'Despacho estándar en horario hábil'
              })}
              className="p-3 text-left rounded-lg border transition-colors hover:shadow-sm"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="font-medium text-sm">Despacho Estándar</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                $25.000 - Horario hábil
              </div>
            </button>

            <button
              onClick={() => onChange({
                ...data,
                costoDespacho: 45000,
                observaciones: 'Despacho urgente en 24-48 horas'
              })}
              className="p-3 text-left rounded-lg border transition-colors hover:shadow-sm"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <div className="font-medium text-sm">Despacho Urgente</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                $45.000 - 24-48 hrs
              </div>
            </button>
          </div>
        </div>

        {/* Resumen del despacho */}
        {(data.direccion || data.costoDespacho || data.fechaEstimada) && (
          <div 
            className="p-4 rounded-lg border-t"
            style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }}
          >
            <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--success-text)' }}>
              Resumen del Despacho
            </h4>
            <div className="text-sm space-y-1" style={{ color: 'var(--success-text)' }}>
              {data.direccion && (
                <div>📍 {data.direccion}{data.comuna && `, ${data.comuna}`}{data.ciudad && `, ${data.ciudad}`}</div>
              )}
              {data.fechaEstimada && (
                <div>📅 Fecha estimada: {new Date(data.fechaEstimada).toLocaleDateString('es-CL')}</div>
              )}
              {data.costoDespacho && data.costoDespacho > 0 && (
                <div>💰 Costo: ${data.costoDespacho.toLocaleString('es-CL')}</div>
              )}
              {data.observaciones && (
                <div>📝 {data.observaciones}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryForm;
