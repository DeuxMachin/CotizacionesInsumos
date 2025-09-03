"use client";

import React from 'react';
import { 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiBriefcase, 
  FiDollarSign,
  FiCheck,
  FiInfo,
  FiAlertTriangle
} from 'react-icons/fi';

interface ClientSummaryData {
  // Información básica (requerida)
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  region: string;
  ciudad: string;
  comuna: string;
  tipoEmpresa: "Ltda." | "S.A." | "SpA" | "E.I.R.L." | "Otra";
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  
  // Información opcional
  fantasyName?: string;
  business?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  contactName?: string;
  contactPhone?: string;
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

interface ClientSummaryProps {
  formData: ClientSummaryData;
  errors?: string[];
}

export function ClientSummary({ formData, errors = [] }: ClientSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  type IconType = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  const SectionCard = ({ 
    title, 
    icon: Icon, 
    children, 
    isEmpty = false 
  }: { 
    title: string; 
    icon: IconType; 
    children: React.ReactNode;
    isEmpty?: boolean;
  }) => (
    <div 
      className="p-6 rounded-lg border"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--border)',
        opacity: isEmpty ? 0.6 : 1
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {isEmpty && (
          <span 
            className="text-xs px-2 py-1 rounded-full ml-auto"
            style={{ backgroundColor: 'var(--neutral-bg)', color: 'var(--neutral-text)' }}
          >
            No configurado
          </span>
        )}
      </div>
      {children}
    </div>
  );

  const DataField = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="flex justify-between items-start py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}:
      </span>
      <span className="text-sm text-right max-w-[60%]" style={{ color: 'var(--text-primary)' }}>
        {value || 'No especificado'}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
        >
          <FiCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Resumen del Cliente
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Revisa toda la información antes de guardar el cliente
          </p>
        </div>
      </div>

      {/* Mensaje de errores */}
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
            <FiAlertTriangle className="w-5 h-5" />
            <span className="font-medium">Errores que deben corregirse:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Información Básica */}
        <SectionCard title="Información Básica" icon={FiBriefcase}>
          <div className="space-y-1">
            <DataField label="RUT" value={formData.rut} />
            <DataField label="Razón Social" value={formData.razonSocial} />
            {formData.fantasyName && (
              <DataField label="Nombre de Fantasía" value={formData.fantasyName} />
            )}
            <DataField label="Tipo de Empresa" value={formData.tipoEmpresa} />
            <DataField label="Giro Comercial" value={formData.giro} />
          </div>
          {formData.business && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Descripción del Negocio:
              </span>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {formData.business}
              </p>
            </div>
          )}
        </SectionCard>

        {/* Ubicación */}
        <SectionCard title="Ubicación" icon={FiMapPin}>
          <div className="space-y-1">
            <DataField label="Dirección" value={formData.direccion} />
            <DataField label="Comuna" value={formData.comuna} />
            <DataField label="Ciudad" value={formData.ciudad} />
            <DataField label="Región" value={formData.region} />
          </div>
        </SectionCard>

        {/* Contacto Principal */}
        <SectionCard title="Contacto Principal" icon={FiUser}>
          <div className="space-y-1">
            <DataField label="Nombre" value={formData.contactoNombre} />
            <DataField label="Email" value={formData.contactoEmail} />
            <DataField label="Teléfono" value={formData.contactoTelefono} />
          </div>
        </SectionCard>

        {/* Contactos Adicionales */}
        <SectionCard 
          title="Contactos Adicionales" 
          icon={FiPhone}
          isEmpty={!formData.email && !formData.phone && !formData.mobile && !formData.contactName}
        >
          {formData.email || formData.phone || formData.mobile || formData.contactName ? (
            <div className="space-y-1">
              {formData.email && <DataField label="Email General" value={formData.email} />}
              {formData.phone && <DataField label="Teléfono General" value={formData.phone} />}
              {formData.mobile && <DataField label="Teléfono Móvil" value={formData.mobile} />}
              {formData.contactName && <DataField label="Contacto Alternativo" value={formData.contactName} />}
              {formData.contactPhone && <DataField label="Teléfono Alternativo" value={formData.contactPhone} />}
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No se configuraron contactos adicionales
            </p>
          )}
        </SectionCard>

        {/* Información de Pagos */}
        <SectionCard 
          title="Responsable de Pagos" 
          icon={FiMail}
          isEmpty={!formData.paymentResponsible && !formData.paymentEmail && !formData.paymentPhone}
        >
          {formData.paymentResponsible || formData.paymentEmail || formData.paymentPhone ? (
            <div className="space-y-1">
              {formData.paymentResponsible && (
                <DataField label="Responsable" value={formData.paymentResponsible} />
              )}
              {formData.paymentEmail && (
                <DataField label="Email Facturación" value={formData.paymentEmail} />
              )}
              {formData.paymentPhone && (
                <DataField label="Teléfono" value={formData.paymentPhone} />
              )}
            </div>
          ) : (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
              No se configuró responsable de pagos
            </p>
          )}
          {formData.transferInfo && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Información Transferencias:
              </span>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {formData.transferInfo}
              </p>
            </div>
          )}
        </SectionCard>

        {/* Condiciones Comerciales */}
        <SectionCard 
          title="Condiciones Comerciales" 
          icon={FiDollarSign}
          isEmpty={
            !formData.credit && 
            !formData.creditLine && 
            !formData.discount && 
            !formData.additionalDays &&
            formData.retention === 'NO'
          }
        >
          {formData.credit || formData.creditLine || formData.discount || formData.additionalDays || formData.retention === 'SI' ? (
            <div className="space-y-1">
              {(formData.credit || 0) > 0 && (
                <DataField label="Crédito Otorgado" value={formatCurrency(formData.credit || 0)} />
              )}
              {(formData.creditLine || 0) > 0 && (
                <DataField label="Línea de Crédito" value={formatCurrency(formData.creditLine || 0)} />
              )}
              {(formData.discount || 0) > 0 && (
                <DataField label="Descuento" value={`${formData.discount}%`} />
              )}
              {(formData.additionalDays || 0) > 0 && (
                <DataField label="Días Adicionales" value={`${formData.additionalDays} días`} />
              )}
              <DataField label="Retención" value={formData.retention === 'SI' ? 'Sí' : 'No'} />
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Condiciones comerciales estándar
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Sin retención, sin descuentos especiales
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Información Final */}
      <div 
        className="p-6 rounded-lg border"
        style={{ 
          backgroundColor: 'var(--info-bg)', 
          borderColor: 'var(--info-border)',
          color: 'var(--info-text)'
        }}
      >
        <div className="flex items-start gap-3">
          <FiInfo className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold mb-2">¿Todo está correcto?</h4>
            <div className="text-sm space-y-2">
              <p>
                Revisa cuidadosamente toda la información antes de guardar el cliente. 
                Una vez guardado, podrás modificar estos datos desde la página de gestión de clientes.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <FiCheck className="w-3 h-3" style={{ color: 'var(--success-text)' }} />
                  <span>Datos básicos: Completos</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCheck className="w-3 h-3" style={{ color: 'var(--success-text)' }} />
                  <span>Contacto: Configurado</span>
                </div>
                {formData.paymentResponsible && (
                  <div className="flex items-center gap-1">
                    <FiCheck className="w-3 h-3" style={{ color: 'var(--success-text)' }} />
                    <span>Pagos: Configurado</span>
                  </div>
                )}
                {(formData.credit || formData.creditLine) && (
                  <div className="flex items-center gap-1">
                    <FiCheck className="w-3 h-3" style={{ color: 'var(--success-text)' }} />
                    <span>Crédito: Configurado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientSummary;
