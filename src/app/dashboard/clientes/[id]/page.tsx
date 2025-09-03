"use client";

import React, { useState, useMemo } from 'react';

import { useRouter, useParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiEdit3, 
  FiTrash2, 
  FiPhone,  
  FiUser, 
  FiDollarSign,  
  FiCreditCard, 
  FiClock, 
  FiBriefcase, 
  FiFileText,
  FiCheck,
  FiX,
  FiAlertCircle,

  FiChevronDown,
  FiCopy,
  FiMapPin
} from 'react-icons/fi';
import { clientsExtended, type ClientExtended } from '@/features/clients/model/clientsExtended';
import { quotesData } from '@/features/quotes/model/mock';
import { Badge } from '@/shared/ui/Badge';
import { Toast } from '@/shared/ui/Toast';
import { useActionAuthorization } from '@/middleware/AuthorizationMiddleware';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0 
  }).format(amount);
}

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

function InfoCard({ title, icon, children, collapsible = false, defaultExpanded = true }: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div 
      className="rounded-lg border overflow-hidden w-full mb-4 sm:mb-6"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div 
        className={`px-4 py-3 flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div 
            className="p-2 rounded flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
          >
            {icon}
          </div>
          <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>
        {collapsible && (
          <FiChevronDown 
            className={`w-5 h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
      </div>
      {(!collapsible || isExpanded) && (
        <div className="p-3 sm:p-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number;
  type?: 'text' | 'currency' | 'percentage' | 'phone' | 'email';
  copyable?: boolean;
}

function InfoRow({ label, value, type = 'text', copyable = false }: InfoRowProps) {
  const formatValue = (val: string | number) => {
    if (!val && val !== 0) return '-';
    
    switch (type) {
      case 'currency':
        return formatCLP(Number(val));
      case 'percentage':
        return `${val}%`;
      case 'phone':
        const phoneStr = val.toString();
        if (phoneStr.length === 9) {
          return phoneStr.replace(/(\d{1})(\d{4})(\d{4})/, '+56 $1 $2 $3');
        }
        return phoneStr;
      case 'email':
        return val.toString();
      default:
        return val.toString();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value.toString());
    Toast.success('Copiado al portapapeles');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="text-sm mb-1 sm:mb-0" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="flex items-center gap-2 max-w-full sm:max-w-[60%]">
        <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {formatValue(value)}
        </span>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="p-1 rounded opacity-60 hover:opacity-100 flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            title="Copiar"
          >
            <FiCopy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface StatCardSimpleProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCardSimple({ label, value, icon, color, bgColor }: StatCardSimpleProps) {
  return (
    <div 
      className="p-4 rounded-lg border flex items-center gap-3"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div 
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-grow">
        <div className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ClientExtended['status'] }) {
  const colors: Record<ClientExtended['status'], { bg: string; text: string }> = {
    vigente: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    moroso: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
    inactivo: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
  };

  const labels: Record<ClientExtended['status'], string> = {
    vigente: 'Vigente',
    moroso: 'Moroso',
    inactivo: 'Inactivo'
  };

  const config = colors[status];

  return (
    <span 
      className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap inline-flex items-center justify-center"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {labels[status]}
    </span>
  );
}

function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { canEdit, canDelete } = useActionAuthorization();
  
  // Obtener cliente por ID
  const client = useMemo(() => {
    const clientId = params.id;
    return clientsExtended.find(c => c.id === clientId) || null;
  }, [params.id]);
  
  // Obtener cotizaciones del cliente
  const clientQuotes = useMemo(() => {
    if (!client) return [];
    const normalizeRut = (rut: string | undefined) => (rut || '').replace(/\./g, '').replace(/\s+/g, '').toUpperCase();
    const clientRut = normalizeRut(client.rut);
    return quotesData.filter(q => normalizeRut(q.cliente?.rut) === clientRut);
  }, [client]);

  // Si el cliente no existe, mostrar página de error
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <FiUser className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Cliente no encontrado
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            El cliente que buscas no existe o ha sido eliminado
          </p>
          <button 
            onClick={() => router.push('/dashboard/clientes')}
            className="btn-primary"
          >
            Volver a Clientes
          </button>
        </div>
      </div>
    );
  }

  const totalMovimientos = client.paid + client.pending + client.partial + client.overdue;
  const totalPendiente = client.pending + client.partial + client.overdue;

  return (
    <div className="animate-fadeIn pb-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-1 sm:mr-2">
              <button
                onClick={() => router.push('/dashboard/clientes')}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
                aria-label="Volver a clientes"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1 w-full">
                <h1 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {client.razonSocial}
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  RUT: {client.rut}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 gap-y-2 flex-shrink-0 flex-wrap justify-end">
              <StatusBadge status={client.status} />
              
              {/* Botones de escritorio */}
              <div className="hidden md:flex items-center gap-2">
                {canEdit('clients') && (
                  <button className="btn-secondary flex items-center gap-2">
                    <FiEdit3 className="w-4 h-4" />
                    Editar
                  </button>
                )}
                {canDelete('clients') && (
                  <button className="btn-secondary text-red-600 flex items-center gap-2">
                    <FiTrash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
              
              {/* Botones móviles */}
              <div className="flex md:hidden items-center gap-1">
                {canEdit('clients') && (
                  <button 
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    title="Editar cliente"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                )}
                {canDelete('clients') && (
                  <button 
                    className="p-2 rounded-lg transition-colors text-red-600"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    title="Eliminar cliente"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Estadísticas Financieras */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6" role="region" aria-label="Resumen financiero del cliente">
          <StatCardSimple 
            label="Total Pagado"
            value={formatCLP(client.paid)}
            icon={<FiCheck className="w-4 h-4" />}
            color="var(--success-text)"
            bgColor="var(--success-bg)"
          />
          <StatCardSimple 
            label="Pendiente de Pago"
            value={formatCLP(client.pending)}
            icon={<FiClock className="w-4 h-4" />}
            color="var(--warning-text)"
            bgColor="var(--warning-bg)"
          />
          <StatCardSimple 
            label="Pagos Parciales"
            value={formatCLP(client.partial)}
            icon={<FiDollarSign className="w-4 h-4" />}
            color="var(--neutral-text)"
            bgColor="var(--neutral-bg)"
          />
          <StatCardSimple 
            label="Pagos Vencidos"
            value={formatCLP(client.overdue)}
            icon={<FiAlertCircle className="w-4 h-4" />}
            color="var(--danger-text)"
            bgColor="var(--danger-bg)"
          />
        </div>

        {/* Layout de dos columnas */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            {/* Información Básica */}
            <InfoCard 
              title="Información Básica" 
              icon={<FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="w-full">
                  <InfoRow label="Tipo" value={client.tipoEmpresa || 'Empresa'} />
                  <InfoRow label="Nombre/Razón Social" value={client.razonSocial} />
                  <InfoRow label="Nombre Fantasía" value={client.fantasyName || '-'} />
                  <InfoRow label="RUT" value={client.rut} copyable />
                  <InfoRow label="Giro" value={client.giro || '-'} />
                </div>
                <div className="w-full">
                  <InfoRow label="Región" value={client.region || '-'} />
                  <InfoRow label="Ciudad" value={client.ciudad || '-'} />
                  <InfoRow label="Comuna" value={client.comuna || '-'} />
                  <InfoRow label="Dirección" value={client.direccion || '-'} />
                </div>
              </div>
            </InfoCard>

            {/* Información de Contacto */}
            <InfoCard 
              title="Información de Contacto" 
              icon={<FiPhone className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 w-full">
                <div className="w-full">
                  <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base truncate" 
                      style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Contacto Principal</span>
                  </h4>
                  <InfoRow label="Nombre" value={client.contactoNombre || client.contactName || '-'} />
                  <InfoRow label="Teléfono" value={client.contactoTelefono || client.contactPhone || '-'} type="phone" copyable />
                  <InfoRow label="Email" value={client.contactoEmail || client.email || '-'} type="email" copyable />
                  <InfoRow label="Móvil" value={client.mobile || '-'} type="phone" copyable />
                </div>
                <div className="w-full">
                  <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base truncate"
                      style={{ color: 'var(--text-primary)' }}>
                    <FiCreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Responsable de Pagos</span>
                  </h4>
                  <InfoRow label="Nombre" value={client.paymentResponsible || '-'} />
                  <InfoRow label="Teléfono" value={client.paymentPhone || '-'} type="phone" copyable />
                  <InfoRow label="Email" value={client.paymentEmail || '-'} type="email" copyable />
                  <InfoRow label="Medio de Pago" value={client.transferInfo || '-'} />
                </div>
              </div>
            </InfoCard>

            {/* Historial de Cotizaciones */}
            <InfoCard 
              title={`Historial de Cotizaciones (${clientQuotes.length})`}
              icon={<FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              {clientQuotes.length > 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para desktop */}
      <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Número</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Fecha</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                          <th className="text-right pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Total</th>
                          <th className="text-center pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientQuotes.map((quote, index) => (
                          <tr 
                            key={quote.id}
                            className="border-b last:border-b-0 hover:bg-opacity-50 transition-colors"
                            style={{ 
                              borderColor: 'var(--border)',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                            }}
                          >
                            <td className="py-3 px-2">
                              <div className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                                {quote.numero}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {quote.id.substring(0, 8)}...
                              </div>
                            </td>
                            <td className="py-3 px-2" style={{ color: 'var(--text-primary)' }}>
                              {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                            </td>
                            <td className="py-3 px-2">
                              <Badge status={quote.estado} />
                            </td>
                            <td className="py-3 px-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatCLP(quote.total)}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button 
                                onClick={() => router.push(`/dashboard/cotizaciones/${quote.id}`)}
                                className="btn-secondary text-xs px-3 py-1"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de tarjetas para móvil */}
      <div className="md:hidden grid grid-cols-1 gap-2.5 w-full">
                    {clientQuotes.map((quote) => (
                      <div 
                        key={quote.id}
        className="p-3 rounded-lg border"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-start justify-between mb-3 w-full">
                          <div className="min-w-0 flex-grow mr-2">
                            <div className="font-medium text-sm truncate" style={{ color: 'var(--accent-primary)' }}>
                              {quote.numero}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {quote.id.substring(0, 8)}...
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge status={quote.estado} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3 w-full">
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                          </span>
                          <span className="font-medium text-sm truncate ml-2" style={{ color: 'var(--text-primary)' }}>
                            {formatCLP(quote.total)}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => router.push(`/dashboard/cotizaciones/${quote.id}`)}
                          className="btn-secondary text-xs px-3 py-2 w-full"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 w-full">
                  <FiFileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Sin cotizaciones
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Este cliente aún no tiene cotizaciones registradas
                  </p>
                </div>
              )}
            </InfoCard>
          </div>

          {/* Columna lateral */}
          <div>
            {/* Información de Crédito */}
            <InfoCard 
              title="Información de Crédito" 
              icon={<FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="space-y-2.5 sm:space-y-3 w-full">
                <InfoRow label="Crédito Actual" value={client.credit} type="currency" />
                <InfoRow label="Línea de Crédito" value={client.creditLine} type="currency" />
                <InfoRow label="Días Adicionales" value={`${client.additionalDays} días`} />
                <InfoRow label="Descuento" value={client.discount} type="percentage" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-3 border-b" 
                     style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs sm:text-sm font-medium mb-1 sm:mb-0" style={{ color: 'var(--text-secondary)' }}>
                    Restricción al Vencido
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {client.retention === 'SI' ? (
                      <div className="flex items-center gap-0.5 sm:gap-1" style={{ color: 'var(--danger-text)' }}>
                        <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">SÍ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 sm:gap-1" style={{ color: 'var(--success-text)' }}>
                        <FiX className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">NO</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Resumen Financiero */}
            <InfoCard 
              title="Resumen Financiero" 
              icon={<FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="space-y-2 sm:space-y-3 w-full">
                <div className="flex items-center justify-between py-1 sm:py-2 w-full">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Total Movimientos</span>
                  <span className="font-bold text-base sm:text-lg truncate ml-2" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(totalMovimientos)}
                  </span>
                </div>
                <div className="border-t pt-2 sm:pt-3 w-full" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between py-0.5 sm:py-1 w-full">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--success-text)' }}>Pagado</span>
                    <span className="font-medium text-xs sm:text-sm truncate ml-2" style={{ color: 'var(--success-text)' }}>
                      {formatCLP(client.paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 sm:py-1 w-full">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--warning-text)' }}>Por Cobrar</span>
                    <span className="font-medium text-xs sm:text-sm truncate ml-2" style={{ color: 'var(--warning-text)' }}>
                      {formatCLP(totalPendiente)}
                    </span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Otra Información */}
            <InfoCard 
              title="Otra Información" 
              icon={<FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="space-y-2.5 sm:space-y-3 w-full">
                <InfoRow label="Estado" value={client.status} />
                <InfoRow label="Correo(s) Electrónico(s)" value={client.email || client.contactoEmail || '-'} type="email" copyable />
                <InfoRow label="Teléfono" value={client.phone || client.contactoTelefono || '-'} type="phone" copyable />
                <InfoRow label="Celular" value={client.mobile || '-'} type="phone" copyable />
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetailPageWrapper() {
  return (
    <ProtectedRoute resource="clients" action="read">
      <ClientDetailPage />
    </ProtectedRoute>
  );
}
