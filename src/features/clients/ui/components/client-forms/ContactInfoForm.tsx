"use client";

import React, { useState, useEffect } from 'react';
import { FiPhone, FiMail, FiUser, FiAlertCircle, FiHelpCircle, FiCheck } from 'react-icons/fi';

interface ContactInfoFormData {
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
}

interface ContactInfoFormProps {
  data: ContactInfoFormData;
  onChange: (updates: Partial<ContactInfoFormData>) => void;
  errors?: string[];
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
  formatPhone: (phone: string) => string;
}

export function ContactInfoForm({
  data,
  onChange,
  validateEmail,
  validatePhone,
  formatPhone
}: ContactInfoFormProps) {
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [showEmailHelp, setShowEmailHelp] = useState(false);
  const [showPhoneHelp, setShowPhoneHelp] = useState(false);

  // Validaciones en tiempo real
  useEffect(() => {
    if (data.contactoEmail && data.contactoEmail.length > 0) {
      if (!validateEmail(data.contactoEmail)) {
        setEmailError('Email no es válido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [data.contactoEmail, validateEmail]);

  useEffect(() => {
    if (data.contactoTelefono && data.contactoTelefono.length > 0) {
      if (!validatePhone(data.contactoTelefono)) {
        setPhoneError('Teléfono no es válido');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  }, [data.contactoTelefono, validatePhone]);

  const handleInputChange = (field: keyof ContactInfoFormData, value: string) => {
    onChange({ [field]: value });
  };

  const handlePhoneChange = (value: string) => {
    const formattedPhone = formatPhone(value);
    handleInputChange('contactoTelefono', formattedPhone);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiPhone className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Información de Contacto Principal
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Datos de la persona principal para comunicaciones con la empresa
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Nombre del Contacto */}
        <div>
          <label className="form-label flex items-center gap-2">
            <FiUser className="w-4 h-4" />
            Nombre del Contacto Principal*
          </label>
          <input
            type="text"
            value={data.contactoNombre}
            onChange={(e) => handleInputChange('contactoNombre', e.target.value)}
            placeholder="Nombre completo de la persona de contacto"
            className="form-input"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Nombre y apellido de la persona responsable de las comunicaciones
          </p>
        </div>

        {/* Email de Contacto */}
        <div>
          <label className="form-label flex items-center gap-2">
            <FiMail className="w-4 h-4" />
            Email de Contacto*
            <button
              type="button"
              onClick={() => setShowEmailHelp(!showEmailHelp)}
              className="ml-auto text-xs p-1 rounded"
              style={{ color: 'var(--text-muted)' }}
              title="Ayuda sobre el email"
            >
              <FiHelpCircle className="w-4 h-4" />
            </button>
            {!emailError && data.contactoEmail && validateEmail(data.contactoEmail) && (
              <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
            )}
          </label>
          <input
            type="email"
            value={data.contactoEmail}
            onChange={(e) => handleInputChange('contactoEmail', e.target.value)}
            placeholder="contacto@empresa.com"
            className={`form-input ${emailError ? 'border-red-500' : ''}`}
          />
          {showEmailHelp && (
            <div 
              className="mt-2 p-3 text-xs rounded-lg border"
              style={{ 
                backgroundColor: 'var(--info-bg)', 
                borderColor: 'var(--info-border)',
                color: 'var(--info-text)'
              }}
            >
              <strong>Email de contacto:</strong> Este será el email principal para enviar cotizaciones, 
              facturas y comunicaciones oficiales. Asegúrate de que sea un email activo y monitoreado.
            </div>
          )}
          {emailError && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
              <FiAlertCircle className="w-3 h-3" />
              {emailError}
            </div>
          )}
          {!emailError && data.contactoEmail && validateEmail(data.contactoEmail) && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--success-text)' }}>
              <FiCheck className="w-3 h-3" />
              Email válido
            </div>
          )}
        </div>

        {/* Teléfono de Contacto */}
        <div>
          <label className="form-label flex items-center gap-2">
            <FiPhone className="w-4 h-4" />
            Teléfono de Contacto*
            <button
              type="button"
              onClick={() => setShowPhoneHelp(!showPhoneHelp)}
              className="ml-auto text-xs p-1 rounded"
              style={{ color: 'var(--text-muted)' }}
              title="Ayuda sobre el teléfono"
            >
              <FiHelpCircle className="w-4 h-4" />
            </button>
            {!phoneError && data.contactoTelefono && validatePhone(data.contactoTelefono) && (
              <FiCheck className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
            )}
          </label>
          <input
            type="tel"
            value={data.contactoTelefono}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="+56 9 1234 5678"
            className={`form-input ${phoneError ? 'border-red-500' : ''}`}
          />
          {showPhoneHelp && (
            <div 
              className="mt-2 p-3 text-xs rounded-lg border"
              style={{ 
                backgroundColor: 'var(--info-bg)', 
                borderColor: 'var(--info-border)',
                color: 'var(--info-text)'
              }}
            >
              <strong>Formatos aceptados:</strong>
              <ul className="list-disc list-inside mt-1 ml-2">
                <li>Celular: +56 9 1234 5678 o 9 1234 5678</li>
                <li>Fijo Santiago: +56 2 2234 5678 o 2 2234 5678</li>
                <li>Fijo regiones: +56 XX 234 5678</li>
              </ul>
            </div>
          )}
          {phoneError && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
              <FiAlertCircle className="w-3 h-3" />
              {phoneError}
            </div>
          )}
          {!phoneError && data.contactoTelefono && validatePhone(data.contactoTelefono) && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--success-text)' }}>
              <FiCheck className="w-3 h-3" />
              Teléfono válido
            </div>
          )}
        </div>
      </div>

      {/* Información Adicional */}
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
          <div className="text-sm">
            <p><strong>Información Importante:</strong></p>
            <p className="mt-1">
              Estos datos de contacto serán utilizados para todas las comunicaciones oficiales, 
              incluidas cotizaciones, facturas y seguimientos comerciales. Asegúrate de que 
              sean correctos y estén actualizados.
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
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
          <div className="text-sm space-y-1">
            <p><strong>Consejos:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Usa el email que el contacto revisa frecuentemente</li>
              <li>Incluye el código de país (+56) en el teléfono</li>
              <li>Verifica que los datos sean correctos antes de continuar</li>
              <li>Puedes agregar contactos adicionales en la siguiente sección</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactInfoForm;
