"use client";

import React, { useState } from 'react';
import { FiUser, FiMapPin, FiPhone, FiMail, FiBriefcase, FiInfo, FiEdit3 } from 'react-icons/fi';
import { ClientInfo } from '@/core/domain/quote/Quote';
import { ClientAutocomplete } from './ClientAutocomplete';
import { AddressAutocomplete } from './AddressAutocomplete';

interface ClientFormProps {
  data: Partial<ClientInfo>;
  onChange: (data: Partial<ClientInfo>) => void;
  errors?: string[];
}

export function ClientForm({ data, onChange }: ClientFormProps) {
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
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
    setShowManualForm(false);
    setRutSearch('');
    setRazonSocialSearch('');
  };

  const handleManualInput = () => {
    setIsExistingClient(false);
    setShowManualForm(true);
    if (!data.razonSocial && !data.rut) {
      onChange({});
    }
  };

  const handleChangeClient = () => {
    // Volver a búsqueda de cliente
    setIsExistingClient(false);
    setShowManualForm(false);
    onChange({});
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

  const handleAddressSelect = (addressData: {
    direccion: string;
    ciudad?: string;
    comuna?: string;
    region?: string;
    lat?: number;
    lng?: number;
  }) => {
    onChange({
      ...data,
      direccion: addressData.direccion,
      ciudad: addressData.ciudad || data.ciudad,
      comuna: addressData.comuna || data.comuna
    });
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

  {/* Autocompletado de clientes existentes */}
  {!isExistingClient && !showManualForm && !data.razonSocial && !data.rut && (
        <div 
          className="p-6 rounded-xl border-2 border-dashed transition-all duration-200 hover:border-solid"
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            borderColor: 'var(--accent-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-bg)' }}
            >
              <FiUser className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                ¿Es un cliente existente?
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Busca por RUT o razón social para autocompletar automáticamente
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                🔍 Buscar por RUT
              </label>
              <div className="relative">
                <ClientAutocomplete
                  value={rutSearch}
                  field="rut"
                  placeholder="Ej: 12.345.678-9"
                  onClientSelect={handleClientSelect}
                  onValueChange={setRutSearch}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                🔍 Buscar por Razón Social
              </label>
              <div className="relative">
                <ClientAutocomplete
                  value={razonSocialSearch}
                  field="razonSocial"
                  placeholder="Ej: Constructora ABC Ltda"
                  onClientSelect={handleClientSelect}
                  onValueChange={setRazonSocialSearch}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <FiInfo className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                ¿No encuentras al cliente en la base de datos?
              </span>
            </div>
            <button
              type="button"
              onClick={handleManualInput}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: 'var(--card-bg)', 
                color: 'var(--text-primary)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <FiEdit3 className="w-4 h-4" />
              Ingresar datos manualmente
            </button>
          </div>
        </div>
      )}

      {/* Mostrar datos del cliente seleccionado */}
  {isExistingClient && data.razonSocial && (
        <div 
          className="p-4 rounded-lg border-2"
          style={{ 
            backgroundColor: 'var(--success-bg)', 
            borderColor: 'var(--success)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--success)' }}
              >
                <FiUser className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--success-text)' }}>
                  ✓ Cliente seleccionado: {data.razonSocial}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Los datos han sido autocompletados automáticamente
                </p>
              </div>
            </div>
            <button
              type="button"
      onClick={handleChangeClient}
      className="text-sm underline hover:no-underline transition-all duration-200 px-3 py-1 rounded"
      style={{ color: 'var(--success-text)', backgroundColor: 'transparent' }}
            >
              Cambiar cliente
            </button>
          </div>
        </div>
      )}

      {/* Formulario principal */}
  {(isExistingClient || showManualForm || data.razonSocial || data.rut) && (
       <div>
         {/* Indicador de modo manual */}
         {showManualForm && !isExistingClient && (
           <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: 'var(--warning)', backgroundColor: 'var(--warning-bg)', boxShadow: 'var(--shadow-sm)' }}>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
               <div className="flex items-center gap-3">
                 <div 
                   className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: 'var(--warning)' }}
                 >
                   <FiEdit3 className="w-4 h-4 text-white" />
                 </div>
                 <div>
                   <span className="text-sm font-semibold" style={{ color: 'var(--warning-text)' }}>
                     ✏️ Ingresando datos manualmente
                   </span>
                   <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                     Completa todos los campos requeridos
                   </p>
                 </div>
               </div>
               <button
                 type="button"
                 onClick={handleChangeClient}
                 className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all duration-200 hover:shadow-md"
                 style={{
                   backgroundColor: 'var(--card-bg)',
                   color: 'var(--text-primary)',
                   borderColor: 'var(--border)',
                   boxShadow: 'var(--shadow-sm)'
                 }}
               >
                 <FiUser className="w-4 h-4" />
                 Buscar cliente existente
               </button>
             </div>
           </div>
         )}
         
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Razón Social */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Razón Social <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="text"
                value={data.razonSocial || ''}
                onChange={(e) => handleInputChange('razonSocial', e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Nombre comercial (opcional)"
            />
          </div>

          {/* Giro Comercial */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Giro Comercial
            </label>
            <input
              type="text"
              value={data.giro || ''}
              onChange={(e) => handleInputChange('giro', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Ej: CONSTRUCCION, INMOBILIARIA"
            />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Dirección <span style={{ color: 'var(--danger-text)' }}>*</span>
            </label>
            <AddressAutocomplete
              value={data.direccion || ''}
              onChange={(value) => handleInputChange('direccion', value)}
              onAddressSelect={handleAddressSelect}
              placeholder="Ej: Av. Providencia 1234, Oficina 567"
              showCurrentLocation={true}
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
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
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Providencia"
            />
          </div>

          {/* Información de Contacto */}
          <div className="md:col-span-2 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Información de Contacto
            </h3>
          </div>

          {/* Nombre Contacto */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Nombre de Contacto
            </label>
            <input
              type="text"
              value={data.nombreContacto || ''}
              onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Juan Pérez"
            />
          </div>

          {/* Teléfono Contacto */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Teléfono de Contacto
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="tel"
                value={data.telefonoContacto || ''}
                onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          {/* Teléfono Principal */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Teléfono Principal
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="tel"
                value={data.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                placeholder="+56 2 2777 8899"
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
                <FiMail className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
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
      )}

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
