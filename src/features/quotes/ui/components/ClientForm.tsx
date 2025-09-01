"use client";

import React from 'react';
import { FiUser, FiMapPin, FiPhone, FiMail, FiBriefcase } from 'react-icons/fi';
import { ClientInfo } from '@/core/domain/quote/Quote';

interface ClientFormProps {
  data: Partial<ClientInfo>;
  onChange: (data: Partial<ClientInfo>) => void;
  errors?: string[];
}

export function ClientForm({ data, onChange }: ClientFormProps) {
  const handleInputChange = (field: keyof ClientInfo, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const formatRUT = (rut: string) => {
    // Remover caracteres no numéricos excepto K/k
    const cleaned = rut.replace(/[^\dKk]/g, '');
    
    // Limitar a 9 caracteres
    if (cleaned.length > 9) return data.rut || '';
    
    // Formatear RUT
    if (cleaned.length > 1) {
      const body = cleaned.slice(0, -1);
      const dv = cleaned.slice(-1);
      return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
    }
    
    return cleaned;
  };

  const handleRUTChange = (value: string) => {
    const formattedRUT = formatRUT(value);
    handleInputChange('rut', formattedRUT);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiUser className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Información del Cliente
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ingrese los datos básicos del cliente para la cotización
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Razón Social */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Razón Social <span style={{ color: 'var(--danger-text)' }}>*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiBriefcase className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              value={data.razonSocial || ''}
              onChange={(e) => handleInputChange('razonSocial', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Ej: CONSTRUCTORA EXAMPLE SPA"
            />
          </div>
        </div>

        {/* RUT */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            RUT <span style={{ color: 'var(--danger-text)' }}>*</span>
          </label>
          <input
            type="text"
            value={data.rut || ''}
            onChange={(e) => handleRUTChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            placeholder="12.345.678-9"
            maxLength={12}
          />
        </div>

        {/* Nombre Fantasía */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Nombre Fantasía
          </label>
          <input
            type="text"
            value={data.nombreFantasia || ''}
            onChange={(e) => handleInputChange('nombreFantasia', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            placeholder="Nombre comercial (opcional)"
          />
        </div>

        {/* Giro Comercial */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Giro Comercial
          </label>
          <input
            type="text"
            value={data.giro || ''}
            onChange={(e) => handleInputChange('giro', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            placeholder="Ej: CONSTRUCCION, INMOBILIARIA"
          />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Dirección <span style={{ color: 'var(--danger-text)' }}>*</span>
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
              placeholder="Dirección completa"
            />
          </div>
        </div>

        {/* Comuna */}
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
            placeholder="Comuna"
          />
        </div>

        {/* Ciudad */}
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
            placeholder="Ciudad"
          />
        </div>
      </div>

      {/* Información de Contacto */}
      <div 
        className="border-t pt-6"
        style={{ borderColor: 'var(--border)' }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Información de Contacto
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Nombre del Contacto */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Nombre del Contacto
            </label>
            <input
              type="text"
              value={data.nombreContacto || ''}
              onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Nombre de la persona de contacto"
            />
          </div>

          {/* Teléfono Empresa */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Teléfono Empresa
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="tel"
                value={data.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="+56 2 2345 6789"
              />
            </div>
          </div>

          {/* Teléfono Contacto */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Teléfono Contacto
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="tel"
                value={data.telefonoContacto || ''}
                onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="+56 9 8765 4321"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="contacto@empresa.cl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--info-text)' }}>
          <strong>Tip:</strong> Los campos marcados con (*) son obligatorios. La información del cliente será utilizada para generar la cotización y los documentos relacionados.
        </p>
      </div>
    </div>
  );
}
