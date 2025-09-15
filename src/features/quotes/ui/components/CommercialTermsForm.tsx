"use client";

import React from 'react';
import { FiInfo, FiClock, FiCreditCard, FiShield, FiFileText } from 'react-icons/fi';
import { CommercialTerms } from '@/core/domain/quote/Quote';

interface CommercialTermsFormProps {
  data: Partial<CommercialTerms>;
  onChange: (data: Partial<CommercialTerms>) => void;
  notes?: string;
  onNotesChange: (notes: string) => void;
  errors?: string[];
}

export function CommercialTermsForm({ data, onChange, notes, onNotesChange }: CommercialTermsFormProps) {
  const handleInputChange = (field: keyof CommercialTerms, value: string | number) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // Opciones predefinidas para diferentes campos
  const paymentOptions = [
    { value: 'Contado contra entrega', label: 'Contado contra entrega' },
    { value: '30 días fecha factura', label: '30 días fecha factura' },
    { value: '60 días fecha factura', label: '60 días fecha factura' },
    { value: '50% anticipo, 50% contra entrega', label: '50% anticipo, 50% contra entrega' },
    { value: '30% anticipo, 70% contra entrega', label: '30% anticipo, 70% contra entrega' },
    { value: 'Transferencia bancaria', label: 'Transferencia bancaria' },
    { value: 'Cheque al día', label: 'Cheque al día' },
    { value: 'Otro', label: 'Personalizado' }
  ];

  const deliveryOptions = [
    { value: '3-5 días hábiles', label: '3-5 días hábiles' },
    { value: '7-10 días hábiles', label: '7-10 días hábiles' },
    { value: '15 días hábiles', label: '15 días hábiles' },
    { value: '30 días hábiles', label: '30 días hábiles' },
    { value: 'Inmediata', label: 'Inmediata (stock disponible)' },
    { value: 'Sujeto a disponibilidad', label: 'Sujeto a disponibilidad' },
    { value: 'Otro', label: 'Personalizado' }
  ];

  const warrantyOptions = [
    { value: '6 meses por defectos de fabricación', label: '6 meses por defectos de fabricación' },
    { value: '1 año por defectos de fabricación', label: '1 año por defectos de fabricación' },
    { value: '2 años por defectos de fabricación', label: '2 años por defectos de fabricación' },
    { value: 'Según fabricante', label: 'Según especificaciones del fabricante' },
    { value: 'Sin garantía', label: 'Sin garantía' },
    { value: 'Otro', label: 'Personalizada' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiInfo className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Condiciones Comerciales
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configure los términos y condiciones de la cotización
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Validez de la oferta */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiClock className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Validez de la Oferta
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[15, 30, 45, 60].map((days) => (
              <button
                key={days}
                onClick={() => handleInputChange('validezOferta', days)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  data.validezOferta === days ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: data.validezOferta === days 
                    ? 'var(--accent-bg)' 
                    : 'var(--card-bg)',
                  color: data.validezOferta === days 
                    ? 'var(--accent-text)' 
                    : 'var(--text-secondary)',
                  borderColor: data.validezOferta === days 
                    ? 'var(--accent-primary)' 
                    : 'var(--border)'
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">{days}</div>
                  <div className="text-xs">días</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              O personalizar:
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={data.validezOferta || ''}
              onChange={(e) => handleInputChange('validezOferta', parseFloat(e.target.value) || 30)}
              className="w-20 px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="30"
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>días</span>
          </div>
        </div>

        {/* Forma de pago */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiCreditCard className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Forma de Pago
          </h3>
          <div className="space-y-3">
            {paymentOptions.map((option, index) => (
              <label key={index} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-50"
                style={{ 
                  backgroundColor: data.formaPago === option.value ? 'var(--accent-bg)' : 'var(--card-bg)',
                  borderColor: data.formaPago === option.value ? 'var(--accent-primary)' : 'var(--border)'
                }}
              >
                <input
                  type="radio"
                  name="formaPago"
                  value={option.value}
                  checked={data.formaPago === option.value}
                  onChange={(e) => handleInputChange('formaPago', e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span className="flex-1" style={{ 
                  color: data.formaPago === option.value ? 'var(--accent-text)' : 'var(--text-primary)' 
                }}>
                  {option.label}
                </span>
              </label>
            ))}
            
            {data.formaPago === 'Otro' && (
              <input
                type="text"
                placeholder="Especificar forma de pago personalizada"
                className="w-full px-4 py-3 rounded-lg border mt-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                onChange={(e) => handleInputChange('formaPago', e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Tiempo de entrega */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Tiempo de Entrega
          </h3>
          <div className="space-y-3">
            {deliveryOptions.map((option, index) => (
              <label key={index} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-50"
                style={{ 
                  backgroundColor: data.tiempoEntrega === option.value ? 'var(--accent-bg)' : 'var(--card-bg)',
                  borderColor: data.tiempoEntrega === option.value ? 'var(--accent-primary)' : 'var(--border)'
                }}
              >
                <input
                  type="radio"
                  name="tiempoEntrega"
                  value={option.value}
                  checked={data.tiempoEntrega === option.value}
                  onChange={(e) => handleInputChange('tiempoEntrega', e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span className="flex-1" style={{ 
                  color: data.tiempoEntrega === option.value ? 'var(--accent-text)' : 'var(--text-primary)' 
                }}>
                  {option.label}
                </span>
              </label>
            ))}
            
            {data.tiempoEntrega === 'Otro' && (
              <input
                type="text"
                placeholder="Especificar tiempo de entrega personalizado"
                className="w-full px-4 py-3 rounded-lg border mt-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                onChange={(e) => handleInputChange('tiempoEntrega', e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Garantía */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiShield className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Garantía
          </h3>
          <div className="space-y-3">
            {warrantyOptions.map((option, index) => (
              <label key={index} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-50"
                style={{ 
                  backgroundColor: data.garantia === option.value ? 'var(--accent-bg)' : 'var(--card-bg)',
                  borderColor: data.garantia === option.value ? 'var(--accent-primary)' : 'var(--border)'
                }}
              >
                <input
                  type="radio"
                  name="garantia"
                  value={option.value}
                  checked={data.garantia === option.value}
                  onChange={(e) => handleInputChange('garantia', e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                <span className="flex-1" style={{ 
                  color: data.garantia === option.value ? 'var(--accent-text)' : 'var(--text-primary)' 
                }}>
                  {option.label}
                </span>
              </label>
            ))}
            
            {data.garantia === 'Otro' && (
              <input
                type="text"
                placeholder="Especificar garantía personalizada"
                className="w-full px-4 py-3 rounded-lg border mt-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                onChange={(e) => handleInputChange('garantia', e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Observaciones generales */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Observaciones Generales
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Términos y Condiciones Adicionales
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
              placeholder="Ej: Precios no incluyen IVA, Descuentos por volumen disponibles, Condiciones especiales de pago, etc."
            />
          </div>
        </div>

        {/* Notas internas */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiFileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            Notas de la Cotización
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Notas Internas (visible en el documento final)
            </label>
            <textarea
              value={notes || ''}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2 resize-none"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Notas adicionales sobre la cotización, observaciones del vendedor, etc."
            />
          </div>
        </div>

        {/* Opciones predefinidas rápidas */}
        <div 
          className="border-t pt-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Configuraciones Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Configuración estándar */}
            <div 
              className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
              onClick={() => onChange({
                validezOferta: 30,
                formaPago: '30 días fecha factura',
                tiempoEntrega: '7-10 días hábiles',
                garantia: '6 meses por defectos de fabricación',
                observaciones: 'Precios no incluyen IVA'
              })}
            >
              <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                Estándar
              </h4>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• 30 días de validez</li>
                <li>• 30 días fecha factura</li>
                <li>• 7-10 días entrega</li>
                <li>• 6 meses garantía</li>
              </ul>
            </div>

            {/* Configuración express */}
            <div 
              className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
              onClick={() => onChange({
                validezOferta: 15,
                formaPago: 'Contado contra entrega',
                tiempoEntrega: '3-5 días hábiles',
                garantia: '6 meses por defectos de fabricación',
                observaciones: 'Oferta express - Precios no incluyen IVA'
              })}
            >
              <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                Express
              </h4>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• 15 días de validez</li>
                <li>• Contado contra entrega</li>
                <li>• 3-5 días entrega</li>
                <li>• 6 meses garantía</li>
              </ul>
            </div>

            {/* Configuración personalizada */}
            <div 
              className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
              onClick={() => onChange({
                validezOferta: 45,
                formaPago: '50% anticipo, 50% contra entrega',
                tiempoEntrega: '15 días hábiles',
                garantia: '1 año por defectos de fabricación',
                observaciones: 'Proyecto especial - Condiciones preferenciales'
              })}
            >
              <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                Proyecto
              </h4>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• 45 días de validez</li>
                <li>• 50% anticipo</li>
                <li>• 15 días entrega</li>
                <li>• 1 año garantía</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resumen de condiciones */}
        {(data.validezOferta || data.formaPago || data.tiempoEntrega || data.garantia) && (
          <div 
            className="p-4 rounded-lg border-t"
            style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-border)' }}
          >
            <h4 className="font-medium text-sm mb-3" style={{ color: 'var(--info-text)' }}>
              📋 Resumen de Condiciones
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ color: 'var(--info-text)' }}>
              {data.validezOferta && (
                <div>⏱️ Validez: {data.validezOferta} días</div>
              )}
              {data.formaPago && (
                <div>💳 Pago: {data.formaPago}</div>
              )}
              {data.tiempoEntrega && (
                <div>🚚 Entrega: {data.tiempoEntrega}</div>
              )}
              {data.garantia && (
                <div>🛡️ Garantía: {data.garantia}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommercialTermsForm;
