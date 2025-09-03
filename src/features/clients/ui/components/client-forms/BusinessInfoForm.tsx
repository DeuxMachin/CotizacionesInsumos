"use client";

import React, { useState, useEffect } from 'react';
import { FiBriefcase, FiMail, FiPhone, FiAlertCircle, FiHelpCircle, FiCheck } from 'react-icons/fi';

interface BusinessInfoFormData {
  business?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contactName?: string;
  contactPhone?: string;
}

interface BusinessInfoFormProps {
  data: BusinessInfoFormData;
  onChange: (updates: Partial<BusinessInfoFormData>) => void;
  errors?: string[];
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
  formatPhone: (phone: string) => string;
}

export function BusinessInfoForm({
  data,
  onChange,
 
  validateEmail,
  validatePhone,
  formatPhone
}: BusinessInfoFormProps) {
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [mobileError, setMobileError] = useState<string>('');
  const [contactPhoneError, setContactPhoneError] = useState<string>('');

  // Validaciones en tiempo real
  useEffect(() => {
    if (data.email && data.email.length > 0) {
      if (!validateEmail(data.email)) {
        setEmailError('Email no es válido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [data.email, validateEmail]);

  useEffect(() => {
    if (data.phone && data.phone.length > 0) {
      if (!validatePhone(data.phone)) {
        setPhoneError('Teléfono no es válido');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  }, [data.phone, validatePhone]);

  useEffect(() => {
    if (data.mobile && data.mobile.length > 0) {
      if (!validatePhone(data.mobile)) {
        setMobileError('Teléfono móvil no es válido');
      } else {
        setMobileError('');
      }
    } else {
      setMobileError('');
    }
  }, [data.mobile, validatePhone]);

  useEffect(() => {
    if (data.contactPhone && data.contactPhone.length > 0) {
      if (!validatePhone(data.contactPhone)) {
        setContactPhoneError('Teléfono de contacto no es válido');
      } else {
        setContactPhoneError('');
      }
    } else {
      setContactPhoneError('');
    }
  }, [data.contactPhone, validatePhone]);

  const handleInputChange = (field: keyof BusinessInfoFormData, value: string | undefined) => {
    onChange({ [field]: value });
  };

  const handlePhoneChange = (field: keyof BusinessInfoFormData, value: string) => {
    const formattedPhone = formatPhone(value);
    handleInputChange(field, formattedPhone);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiBriefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Información Comercial Adicional
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Detalles opcionales que pueden ser útiles para la gestión comercial
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
            <p><strong>Sección Opcional:</strong> Estos campos son opcionales pero pueden ayudar a tener información más completa del cliente para futuras gestiones comerciales.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Descripción del Negocio */}
        <div>
          <label className="form-label flex items-center gap-2">
            <FiBriefcase className="w-4 h-4" />
            Descripción Detallada del Negocio
          </label>
          <textarea
            value={data.business || ''}
            onChange={(e) => handleInputChange('business', e.target.value)}
            placeholder="Descripción más detallada de la actividad comercial, productos o servicios que ofrece la empresa..."
            className="form-input min-h-[100px] resize-y"
            rows={4}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Información adicional sobre el negocio que pueda ser útil para entender mejor las necesidades del cliente
          </p>
        </div>

        {/* Información de Contacto Adicional */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <FiPhone className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Contactos Adicionales
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Email General */}
            <div>
              <label className="form-label flex items-center gap-2">
                <FiMail className="w-4 h-4" />
                Email General de la Empresa
                {!emailError && data.email && validateEmail(data.email) && (
                  <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                )}
              </label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@empresa.com"
                className={`form-input ${emailError ? 'border-red-500' : ''}`}
              />
              {emailError && (
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
                  <FiAlertCircle className="w-3 h-3" />
                  {emailError}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Email general de la empresa (diferente al de contacto principal)
              </p>
            </div>

            {/* Teléfono General */}
            <div>
              <label className="form-label flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Teléfono General
                {!phoneError && data.phone && validatePhone(data.phone) && (
                  <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                )}
              </label>
              <input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => handlePhoneChange('phone', e.target.value)}
                placeholder="+56 2 2345 6789"
                className={`form-input ${phoneError ? 'border-red-500' : ''}`}
              />
              {phoneError && (
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
                  <FiAlertCircle className="w-3 h-3" />
                  {phoneError}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Teléfono principal de la empresa
              </p>
            </div>

            {/* Teléfono Móvil */}
            <div>
              <label className="form-label flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Teléfono Móvil
                {!mobileError && data.mobile && validatePhone(data.mobile) && (
                  <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                )}
              </label>
              <input
                type="tel"
                value={data.mobile || ''}
                onChange={(e) => handlePhoneChange('mobile', e.target.value)}
                placeholder="+56 9 8765 4321"
                className={`form-input ${mobileError ? 'border-red-500' : ''}`}
              />
              {mobileError && (
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
                  <FiAlertCircle className="w-3 h-3" />
                  {mobileError}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Móvil corporativo o del contacto principal
              </p>
            </div>

            {/* Nombre de Contacto Alternativo */}
            <div>
              <label className="form-label">
                Contacto Alternativo
              </label>
              <input
                type="text"
                value={data.contactName || ''}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="Nombre del contacto secundario"
                className="form-input"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Persona de contacto alternativa
              </p>
            </div>

            {/* Teléfono del Contacto Alternativo */}
            <div className="lg:col-span-2">
              <label className="form-label flex items-center gap-2">
                <FiPhone className="w-4 h-4" />
                Teléfono del Contacto Alternativo
                {!contactPhoneError && data.contactPhone && validatePhone(data.contactPhone) && (
                  <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                )}
              </label>
              <input
                type="tel"
                value={data.contactPhone || ''}
                onChange={(e) => handlePhoneChange('contactPhone', e.target.value)}
                placeholder="+56 9 1111 2222"
                className={`form-input ${contactPhoneError ? 'border-red-500' : ''}`}
              />
              {contactPhoneError && (
                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
                  <FiAlertCircle className="w-3 h-3" />
                  {contactPhoneError}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Teléfono del contacto alternativo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div 
        className="p-4 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--success-bg)', 
          borderColor: 'var(--success-border)',
          color: 'var(--success-text)'
        }}
      >
        <div className="flex items-start gap-2">
          <FiCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p><strong>¡Bien hecho!</strong></p>
            <p>
              Esta información adicional ayudará a tener múltiples canales de comunicación 
              con el cliente y una mejor comprensión de su negocio. Puedes continuar al siguiente 
              paso o saltar directamente al resumen si no necesitas configurar opciones de pago.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessInfoForm;
