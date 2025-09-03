"use client";

import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiMail, FiPhone, FiUser, FiAlertCircle, FiHelpCircle, FiCheck } from 'react-icons/fi';

interface PaymentInfoFormData {
  paymentResponsible?: string;
  paymentPhone?: string;
  paymentEmail?: string;
  transferInfo?: string;
  credit?: number;
  additionalDays?: number;
  creditLine?: number;
  retention?: "SI" | "NO";
  discount?: number;
}

interface PaymentInfoFormProps {
  data: PaymentInfoFormData;
  onChange: (updates: Partial<PaymentInfoFormData>) => void;
  errors?: string[];
  validatePhone: (phone: string) => boolean;
  formatPhone: (phone: string) => string;
}

export function PaymentInfoForm({
  data,
  onChange,

  validatePhone,
  formatPhone
}: PaymentInfoFormProps) {
  const [paymentPhoneError, setPaymentPhoneError] = useState<string>('');
  const [showCreditHelp, setShowCreditHelp] = useState(false);
  const [showRetentionHelp, setShowRetentionHelp] = useState(false);

  // Validaciones en tiempo real
  useEffect(() => {
    if (data.paymentPhone && data.paymentPhone.length > 0) {
      if (!validatePhone(data.paymentPhone)) {
        setPaymentPhoneError('Teléfono no es válido');
      } else {
        setPaymentPhoneError('');
      }
    } else {
      setPaymentPhoneError('');
    }
  }, [data.paymentPhone, validatePhone]);

  const handleInputChange = (field: keyof PaymentInfoFormData, value: string | number | undefined) => {
    onChange({ [field]: value });
  };

  const handlePhoneChange = (value: string) => {
    const formattedPhone = formatPhone(value);
    handleInputChange('paymentPhone', formattedPhone);
  };

  const handleNumberChange = (field: keyof PaymentInfoFormData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      handleInputChange(field, numValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiDollarSign className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Configuración de Pagos y Crédito
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Configuración avanzada para facturación, pagos y condiciones comerciales
          </p>
        </div>
      </div>

      {/* Nota informativa */}
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--info-bg)', 
          borderColor: 'var(--info-border)',
          color: 'var(--info-text)'
        }}
      >
        <div className="flex items-start gap-2">
          <FiHelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p><strong>Configuración Avanzada:</strong> Esta sección permite configurar condiciones comerciales específicas. Todos los campos son opcionales y pueden modificarse posteriormente.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Responsable de Pagos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Responsable de Pagos
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Nombre del Responsable */}
            <div className="lg:col-span-2">
              <label className="form-label">
                Nombre del Responsable de Pagos
              </label>
              <input
                type="text"
                value={data.paymentResponsible || ''}
                onChange={(e) => handleInputChange('paymentResponsible', e.target.value)}
                placeholder="Nombre de la persona encargada de pagos"
                className="form-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Persona específica encargada de aprobar y procesar pagos
              </p>
            </div>

            {/* Teléfono del Responsable */}
            <div>
              <label className="form-label flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Teléfono del Responsable
                {!paymentPhoneError && data.paymentPhone && validatePhone(data.paymentPhone) && (
                  <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                )}
              </label>
              <input
                type="tel"
                value={data.paymentPhone || ''}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+56 9 1234 5678"
                className={`form-input ${paymentPhoneError ? 'border-red-500' : ''}`}
              />
              {paymentPhoneError && (
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
                  <FiAlertCircle className="w-3 h-3" />
                  {paymentPhoneError}
                </div>
              )}
            </div>

            {/* Email para Facturación */}
            <div>
              <label className="form-label flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                Email para Facturación
              </label>
              <input
                type="email"
                value={data.paymentEmail || ''}
                onChange={(e) => handleInputChange('paymentEmail', e.target.value)}
                placeholder="facturacion@empresa.com"
                className="form-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Email específico para envío de facturas y documentos tributarios
              </p>
            </div>
          </div>

          {/* Información para Transferencias */}
          <div>
            <label className="form-label">
              Información para Transferencias
            </label>
            <textarea
              value={data.transferInfo || ''}
              onChange={(e) => handleInputChange('transferInfo', e.target.value)}
              placeholder="Instrucciones especiales para transferencias bancarias, datos de cuenta preferida, etc."
              className="form-input min-h-[80px] resize-y"
              rows={3}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Instrucciones especiales o información adicional para procesar transferencias
            </p>
          </div>
        </div>

        {/* Condiciones Comerciales */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <FiDollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Condiciones Comerciales
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Crédito Otorgado */}
            <div>
              <label className="form-label flex items-center gap-2">
                Crédito Otorgado (CLP)
                <button
                  type="button"
                  onClick={() => setShowCreditHelp(!showCreditHelp)}
                  className="text-xs p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                  title="Ayuda sobre el crédito"
                >
                  <FiHelpCircle className="w-4 h-4" />
                </button>
              </label>
              <input
                type="number"
                value={data.credit || 0}
                onChange={(e) => handleNumberChange('credit', e.target.value)}
                placeholder="0"
                className="form-input"
                min="0"
                step="1000"
              />
              {showCreditHelp && (
                <div 
                  className="mt-2 p-3 text-xs rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--info-bg)', 
                    borderColor: 'var(--info-border)',
                    color: 'var(--info-text)'
                  }}
                >
                  Monto de crédito comercial otorgado al cliente. Esto afectará las condiciones de pago y límites de compra.
                </div>
              )}
            </div>

            {/* Días Adicionales */}
            <div>
              <label className="form-label">
                Días Adicionales de Pago
              </label>
              <input
                type="number"
                value={data.additionalDays || 0}
                onChange={(e) => handleNumberChange('additionalDays', e.target.value)}
                placeholder="0"
                className="form-input"
                min="0"
                max="365"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Días adicionales otorgados sobre el plazo estándar de pago
              </p>
            </div>

            {/* Línea de Crédito */}
            <div>
              <label className="form-label">
                Línea de Crédito (CLP)
              </label>
              <input
                type="number"
                value={data.creditLine || 0}
                onChange={(e) => handleNumberChange('creditLine', e.target.value)}
                placeholder="0"
                className="form-input"
                min="0"
                step="10000"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Línea de crédito máxima autorizada
              </p>
            </div>

            {/* Descuento */}
            <div>
              <label className="form-label">
                Descuento Aplicable (%)
              </label>
              <input
                type="number"
                value={data.discount || 0}
                onChange={(e) => handleNumberChange('discount', e.target.value)}
                placeholder="0"
                className="form-input"
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Porcentaje de descuento comercial aplicable
              </p>
            </div>
          </div>

          {/* Retención */}
          <div>
            <label className="form-label flex items-center gap-2">
              Aplica Retención
              <button
                type="button"
                onClick={() => setShowRetentionHelp(!showRetentionHelp)}
                className="text-xs p-1 rounded"
                style={{ color: 'var(--text-muted)' }}
                title="Ayuda sobre retención"
              >
                <FiHelpCircle className="w-4 h-4" />
              </button>
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="retention"
                  value="NO"
                  checked={(data.retention || 'NO') === 'NO'}
                  onChange={(e) => handleInputChange('retention', e.target.value as "SI" | "NO")}
                  className="text-blue-600"
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>No</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="retention"
                  value="SI"
                  checked={(data.retention || 'NO') === 'SI'}
                  onChange={(e) => handleInputChange('retention', e.target.value as "SI" | "NO")}
                  className="text-blue-600"
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Sí</span>
              </label>
            </div>
            {showRetentionHelp && (
              <div 
                className="mt-2 p-3 text-xs rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--info-bg)', 
                  borderColor: 'var(--info-border)',
                  color: 'var(--info-text)'
                }}
              >
                Indica si el cliente debe aplicar retención de impuestos en sus pagos según la legislación tributaria vigente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--warning-bg)', 
          borderColor: 'var(--warning-border)',
          color: 'var(--warning-text)'
        }}
      >
        <div className="flex items-start gap-2">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p><strong>Importante:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Las condiciones comerciales deben ser aprobadas por el área comercial</li>
              <li>Los cambios en crédito y descuentos pueden requerir autorización especial</li>
              <li>Verifica la información tributaria antes de configurar retenciones</li>
              <li>Todos estos campos pueden modificarse posteriormente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentInfoForm;
