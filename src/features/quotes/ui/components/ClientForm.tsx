"use client";

import React, { useState } from 'react';
import { FiUser, FiMapPin, FiPhone, FiMail, FiBriefcase, FiInfo } from 'react-icons/fi';
import { ClientInfo } from '@/core/domain/quote/Quote';
import { ClientAutocomplete } from './ClientAutocomplete';

interface ClientFormProps {
  data: Partial<ClientInfo>;
  onChange: (data: Partial<ClientInfo>) => void;
  errors?: string[];
}

export function ClientForm({ data, onChange }: ClientFormProps) {
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(true);
  const [rutSearch, setRutSearch] = useState('');
  const [razonSocialSearch, setRazonSocialSearch] = useState('');

  const handleInputChange = (field: keyof ClientInfo, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const handleClientSelect = (clientData: Partial<ClientInfo>) => {
    onChange(clientData);
    setIsExistingClient(true);
    setShowClientSearch(false);
  };

  const handleManualInput = () => {
    setIsExistingClient(false);
    setShowClientSearch(false);
  };

  const toggleClientSearch = () => {
    setShowClientSearch(!showClientSearch);
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

      {/* Botón para mostrar/ocultar búsqueda de clientes */}
      <div className="mb-4">
        <button
          type="button"
          onClick={toggleClientSearch}
          className="inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium"
          style={{ 
            backgroundColor: 'var(--accent-bg)', 
            color: 'var(--accent-text)',
            borderColor: 'var(--accent-primary)'
          }}
        >
          <FiUser className="mr-2 -ml-1 h-5 w-5" />
          {showClientSearch ? 'Ocultar búsqueda de clientes' : 'Buscar cliente existente'}
        </button>
      </div>

      {/* Autocompletado de clientes existentes */}
      {showClientSearch && (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--info-bg)', 
            borderColor: 'var(--border)',
            borderStyle: 'dashed'
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FiInfo className="w-5 h-5" style={{ color: 'var(--info-text)' }} />
            <h3 className="font-medium" style={{ color: 'var(--info-text)' }}>
              ¿Es un cliente existente?
            </h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Busque por RUT o razón social para autocompletar los datos del cliente
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Buscar por RUT
              </label>
              <ClientAutocomplete
                value={rutSearch}
                field="rut"
                placeholder="Ej: 12.345.678-9"
                onClientSelect={handleClientSelect}
                onValueChange={setRutSearch}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Buscar por Razón Social
              </label>
              <ClientAutocomplete
                value={razonSocialSearch}
                field="razonSocial"
                placeholder="Ej: Constructora ABC Ltda"
                onClientSelect={handleClientSelect}
                onValueChange={setRazonSocialSearch}
              />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={handleManualInput}
              className="text-sm underline"
              style={{ color: 'var(--accent-primary)' }}
            >
              O ingrese los datos manualmente
            </button>
          </div>
        </div>
      )}

      {/* Mostrar datos del cliente seleccionado */}
      {isExistingClient && data.razonSocial && (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--success-bg)', 
            borderColor: 'var(--border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUser className="w-5 h-5" style={{ color: 'var(--success-text)' }} />
              <h3 className="font-medium" style={{ color: 'var(--success-text)' }}>
                Cliente seleccionado: {data.razonSocial}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsExistingClient(false);
                setShowClientSearch(true);
              }}
              className="text-sm underline"
              style={{ color: 'var(--success-text)' }}
            >
              Cambiar cliente
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Los datos han sido autocompletados. Puede modificarlos si es necesario.
          </p>
        </div>
      )}

      {/* Formulario principal */}
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
              placeholder="Ej: Av. Providencia 1234, Oficina 567"
            />
          </div>
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
            placeholder="Santiago"
          />
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
            placeholder="Providencia"
          />
        </div>

        {/* Contacto - Nombre */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Nombre de Contacto
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiUser className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              value={data.nombreContacto || ''}
              onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Ej: Juan Pérez"
            />
          </div>
        </div>

        {/* Contacto - Email */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Email de Contacto
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
              placeholder="ejemplo@dominio.cl"
            />
          </div>
        </div>

        {/* Contacto - Teléfono */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Teléfono de Contacto
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
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--info-text)' }}>
          <strong>Tip:</strong> Los campos marcados con (*) son obligatorios. La información del cliente será utilizada para generar la cotización y los documentos relacionados.
        </p>
      </div>
    </div>
  );
}

export default ClientForm;
