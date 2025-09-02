"use client";

import React, { useState, useMemo } from 'react';
import type { IconType } from 'react-icons';
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
  FiTrendingUp,
  FiTrendingDown,
  FiChevronDown,
  FiCopy
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
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div 
        className={`px-6 py-4 flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
          >
            {icon}
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>
        {collapsible && (
          <FiChevronDown 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
      </div>
      {(!collapsible || isExpanded) && (
        <div className="p-6">
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
        return val.toString().replace(/(\d{2})(\d{4})(\d{4})/, '+56 $1 $2 $3');
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
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-right" style={{ color: 'var(--text-primary)' }}>
          {formatValue(value)}
        </span>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="p-1 rounded transition-colors opacity-60 hover:opacity-100"
            style={{ color: 'var(--text-secondary)' }}
            title="Copiar"
          >
            <FiCopy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  type: 'success' | 'warning' | 'danger' | 'neutral';
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ label, value, type, icon, trend }: StatCardProps) {
  const colors = {
    success: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    warning: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
    danger: { bg: 'var(--danger-bg)', text: 'var(--danger-text)' },
    neutral: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
  };

  return (
    <div 
      className="rounded-xl p-4 border"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: colors[type].bg, color: colors[type].text }}
        >
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend.isPositive ? (
              <FiTrendingUp className="w-3 h-3" style={{ color: 'var(--success-text)' }} />
            ) : (
              <FiTrendingDown className="w-3 h-3" style={{ color: 'var(--danger-text)' }} />
            )}
            <span style={{ color: trend.isPositive ? 'var(--success-text)' : 'var(--danger-text)' }}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {formatCLP(value)}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ClientExtended['status'] }) {
  const colors: Record<ClientExtended['status'], { bg: string; text: string; icon: IconType }> = {
    vigente: { bg: 'var(--success-bg)', text: 'var(--success-text)', icon: FiCheck },
    moroso: { bg: 'var(--warning-bg)', text: 'var(--warning-text)', icon: FiAlertCircle },
    inactivo: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)', icon: FiX }
  };

  const config = colors[status];
  const IconComponent = config.icon;

  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <IconComponent className="w-4 h-4" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}

function ClientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { canEdit, canDelete } = useActionAuthorization();

  const clientId = params.id;
  const client = clientsExtended.find((c: ClientExtended) => c.id === clientId);

  // Filtrar cotizaciones del cliente
  const clientQuotes = useMemo(() => {
    if (!client) return [];
    return quotesData.filter(quote => 
      quote.cliente.razonSocial.toLowerCase().includes(client.razonSocial.toLowerCase().split(' ')[0]) ||
      quote.cliente.rut === client.rut
    );
  }, [client]);

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/clientes')}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'var(--accent-bg)')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <FiBriefcase className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {client.razonSocial}
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    RUT: {client.rut}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={client.status} />
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas Financieras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Total Pagado"
            value={client.paid}
            type="success"
            icon={<FiCheck className="w-5 h-5" />}
          />
          <StatCard 
            label="Pendiente de Pago"
            value={client.pending}
            type="warning"
            icon={<FiClock className="w-5 h-5" />}
          />
          <StatCard 
            label="Pagos Parciales"
            value={client.partial}
            type="neutral"
            icon={<FiDollarSign className="w-5 h-5" />}
          />
          <StatCard 
            label="Pagos Vencidos"
            value={client.overdue}
            type="danger"
            icon={<FiAlertCircle className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información Básica */}
            <InfoCard 
              title="Información Básica" 
              icon={<FiBriefcase className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <InfoRow label="Tipo" value={client.tipoEmpresa || 'Empresa'} />
                  <InfoRow label="Nombre/Razón Social" value={client.razonSocial} />
                  <InfoRow label="Nombre Fantasía" value={client.fantasyName || '-'} />
                  <InfoRow label="RUT" value={client.rut} copyable />
                  <InfoRow label="Giro" value={client.giro || '-'} />
                </div>
                <div>
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
              icon={<FiPhone className="w-5 h-5" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-4 h-4" />
                    Contacto Principal
                  </h4>
                  <InfoRow label="Nombre" value={client.contactoNombre || client.contactName || '-'} />
                  <InfoRow label="Teléfono" value={client.contactoTelefono || client.contactPhone || '-'} type="phone" copyable />
                  <InfoRow label="Email" value={client.contactoEmail || client.email || '-'} type="email" copyable />
                  <InfoRow label="Móvil" value={client.mobile || '-'} type="phone" copyable />
                </div>
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FiCreditCard className="w-4 h-4" />
                    Responsable de Pagos
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
              icon={<FiFileText className="w-5 h-5" />}
            >
              {clientQuotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr 
                        className="border-b"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <th className="text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Número</th>
                        <th className="text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Fecha</th>
                        <th className="text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                        <th className="text-right pb-3" style={{ color: 'var(--text-secondary)' }}>Total</th>
                        <th className="text-center pb-3" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientQuotes.map((quote, index) => (
                        <tr 
                          key={quote.id}
                          className={`border-b last:border-b-0 hover:bg-opacity-50 transition-colors ${
                            index % 2 === 0 ? '' : ''
                          }`}
                          style={{ 
                            borderColor: 'var(--border)',
                            backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                          }}
                        >
                          <td className="py-3">
                            <div className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                              {quote.numero}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {quote.id}
                            </div>
                          </td>
                          <td className="py-3" style={{ color: 'var(--text-primary)' }}>
                            {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                          </td>
                          <td className="py-3">
                            <Badge status={quote.estado} />
                          </td>
                          <td className="py-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatCLP(quote.total)}
                          </td>
                          <td className="py-3 text-center">
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
              ) : (
                <div className="text-center py-8">
                  <FiFileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
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

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Información de Crédito */}
            <InfoCard 
              title="Información de Crédito" 
              icon={<FiCreditCard className="w-5 h-5" />}
            >
              <div className="space-y-3">
                <InfoRow label="Crédito Actual" value={client.credit} type="currency" />
                <InfoRow label="Línea de Crédito" value={client.creditLine} type="currency" />
                <InfoRow label="Días Adicionales" value={`${client.additionalDays} días`} />
                <InfoRow label="Descuento" value={client.discount} type="percentage" />
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Restricción al Vencido
                  </span>
                  <div className="flex items-center gap-2">
                    {client.retention === 'SI' ? (
                      <div className="flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                        <FiCheck className="w-4 h-4" />
                        <span className="font-medium">SÍ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1" style={{ color: 'var(--success-text)' }}>
                        <FiX className="w-4 h-4" />
                        <span className="font-medium">NO</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Resumen Financiero */}
            <InfoCard 
              title="Resumen Financiero" 
              icon={<FiDollarSign className="w-5 h-5" />}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Movimientos</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(totalMovimientos)}
                  </span>
                </div>
                <div 
                  className="border-t pt-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm" style={{ color: 'var(--success-text)' }}>Pagado</span>
                    <span className="font-medium" style={{ color: 'var(--success-text)' }}>
                      {formatCLP(client.paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm" style={{ color: 'var(--warning-text)' }}>Por Cobrar</span>
                    <span className="font-medium" style={{ color: 'var(--warning-text)' }}>
                      {formatCLP(totalPendiente)}
                    </span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Otra Información */}
            <InfoCard 
              title="Otra Información" 
              icon={<FiFileText className="w-5 h-5" />}
            >
              <div className="space-y-3">
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
