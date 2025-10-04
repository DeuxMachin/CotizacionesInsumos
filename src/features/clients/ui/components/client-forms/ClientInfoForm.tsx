"use client";

import React, { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiBriefcase, FiAlertCircle, FiHelpCircle } from 'react-icons/fi';

interface ClientInfoFormData {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  region: string;
  ciudad: string;
  comuna: string;
  tipoEmpresa: "Ltda." | "S.A." | "SpA" | "E.I.R.L." | "Otra";
  fantasyName?: string;
  // Nuevo: Tipo de Cliente (FK a cliente_tipos.id)
  clientTypeId?: number | null;
}

interface ClientInfoFormProps {
  data: ClientInfoFormData;
  onChange: (updates: Partial<ClientInfoFormData>) => void;
  errors?: string[];
  formatRUT: (rut: string) => string;
  validateRUT: (rut: string) => boolean;
  regiones: string[];
  tiposEmpresa: Array<{ value: string; label: string }>;
  // Lista de tipos de cliente desde la BD
  clientTypes?: Array<{ id: number; nombre: string }>;
}

export function ClientInfoForm({
  data,
  onChange,
  errors = [],
  formatRUT,
  validateRUT,
  regiones,
  tiposEmpresa,
  clientTypes = []
}: ClientInfoFormProps) {
  const [rutError, setRutError] = useState<string>('');
  const [showRutHelp, setShowRutHelp] = useState(false);

  // Validar RUT en tiempo real
  useEffect(() => {
    if (data.rut && data.rut.length > 1) {
      if (!validateRUT(data.rut)) {
        setRutError('RUT no es válido');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  }, [data.rut, validateRUT]);

  const handleInputChange = (field: keyof ClientInfoFormData, value: string | number | undefined | null) => {
    onChange({ [field]: value });
  };

  const handleRutChange = (value: string) => {
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
          <FiBriefcase className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Información Básica de la Empresa
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Datos fundamentales de la empresa para su registro en el sistema
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--danger-bg)', 
            borderColor: 'var(--danger-border)',
            color: 'var(--danger-text)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-medium">Errores a corregir:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RUT */}
        <div className="lg:col-span-1">
          <label className="form-label flex items-center gap-2">
            <FiUser className="w-4 h-4" />
            RUT de la Empresa*
            <button
              type="button"
              onClick={() => setShowRutHelp(!showRutHelp)}
              className="ml-auto text-xs p-1 rounded"
              style={{ color: 'var(--text-muted)' }}
              title="Ayuda sobre el RUT"
            >
              <FiHelpCircle className="w-4 h-4" />
            </button>
          </label>
          <input
            type="text"
            value={data.rut}
            onChange={(e) => handleRutChange(e.target.value)}
            placeholder="77.352.551-5"
            className={`form-input ${rutError ? 'border-red-500' : ''}`}
            maxLength={14}
          />
          {showRutHelp && (
            <div 
              className="mt-2 p-3 text-xs rounded-lg border"
              style={{ 
                backgroundColor: 'var(--info-bg)', 
                borderColor: 'var(--info-border)',
                color: 'var(--info-text)'
              }}
            >
              <strong>Formato RUT:</strong> Puedes ingresar RUT de empresa o persona. Escribe sin puntos ni guión; el sistema lo formateará automáticamente.
              Ejemplo: 773525515 se convertirá en 77.352.551-5
            </div>
          )}
          {rutError && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--danger-text)' }}>
              <FiAlertCircle className="w-3 h-3" />
              {rutError}
            </div>
          )}
        </div>

        {/* Razón Social */}
        <div className="lg:col-span-1">
          <label className="form-label">
            Razón Social*
          </label>
          <input
            type="text"
            value={data.razonSocial}
            onChange={(e) => handleInputChange('razonSocial', e.target.value)}
            placeholder="Nombre oficial de la empresa"
            className="form-input"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Nombre legal registrado en el SII
          </p>
        </div>

        {/* Nombre de Fantasía */}
        <div className="lg:col-span-1">
          <label className="form-label">
            Nombre de Fantasía
          </label>
          <input
            type="text"
            value={data.fantasyName || ''}
            onChange={(e) => handleInputChange('fantasyName', e.target.value)}
            placeholder="Nombre comercial (opcional)"
            className="form-input"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Nombre comercial o marca por la que es conocida
          </p>
        </div>

        {/* Tipo de Empresa */}
        <div className="lg:col-span-1">
          <label className="form-label">
            Tipo de Empresa*
          </label>
          <select
            value={data.tipoEmpresa}
            onChange={(e) =>
              handleInputChange(
                'tipoEmpresa',
                e.target.value as ClientInfoFormData['tipoEmpresa']
              )
            }
            className="form-input"
          >
            {tiposEmpresa.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Cliente (desde catálogo) */}
        {clientTypes.length > 0 && (
          <div className="lg:col-span-1">
            <label className="form-label">
              Tipo de Cliente
            </label>
            <select
              value={data.clientTypeId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                handleInputChange('clientTypeId', val === '' ? null : Number(val));
              }}
              className="form-input"
            >
              <option value="">Seleccionar tipo (opcional)</option>
              {clientTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Clasificación del cliente (por ejemplo: Constructoras, Particulares, etc.)
            </p>
          </div>
        )}

        {/* Giro Comercial */}
        <div className="lg:col-span-2">
          <label className="form-label">
            Giro Comercial*
          </label>
          <input
            type="text"
            value={data.giro}
            onChange={(e) => handleInputChange('giro', e.target.value)}
            placeholder="Descripción de la actividad comercial"
            className="form-input"
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Actividad principal de la empresa (ej: &quot;Construcción&quot;, &quot;Comercialización de productos&quot;)
          </p>
        </div>
      </div>

      {/* Sección de Ubicación */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <FiMapPin className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ubicación de la Empresa
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dirección */}
          <div className="lg:col-span-2">
            <label className="form-label">
              Dirección*
            </label>
            <input
              type="text"
              value={data.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              placeholder="Calle, número, departamento, oficina"
              className="form-input"
            />
          </div>

          {/* Región */}
          <div>
            <label className="form-label">
              Región*
            </label>
            <select
              value={data.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className="form-input"
            >
              <option value="">Selecciona una región</option>
              {regiones.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Ciudad */}
          <div>
            <label className="form-label">
              Ciudad*
            </label>
            <input
              type="text"
              value={data.ciudad}
              onChange={(e) => handleInputChange('ciudad', e.target.value)}
              placeholder="Ciudad"
              className="form-input"
            />
          </div>

          {/* Comuna */}
          <div className="lg:col-span-2">
            <label className="form-label">
              Comuna*
            </label>
            <input
              type="text"
              value={data.comuna}
              onChange={(e) => handleInputChange('comuna', e.target.value)}
              placeholder="Comuna"
              className="form-input"
            />
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
              <li>El RUT debe incluir el dígito verificador</li>
              <li>La razón social debe coincidir exactamente con los documentos oficiales</li>
              <li>La dirección será utilizada para envíos y documentos oficiales</li>
              <li>El giro comercial ayuda a categorizar mejor al cliente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientInfoForm;
