import React from 'react';
import { 
  FiX, 
  FiDownload, 
  FiEdit2, 
  FiFileText, 
  FiUser, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiCalendar, 
  FiTruck, 
  FiClock, 
  FiDollarSign, 
  FiInfo,
  FiPackage,
  FiShield,
  FiCreditCard,
  FiAlertCircle
} from 'react-icons/fi';
import { Quote, QuoteStatus } from '@/core/domain/quote/Quote';

interface QuoteDetailModalProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (quote: Quote) => void;
  onExport?: (quote: Quote) => void;
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
}

export function QuoteDetailModal({ 
  quote, 
  isOpen, 
  onClose, 
  onEdit, 
  onExport,
  formatMoney, 
  getStatusColor 
}: QuoteDetailModalProps) {
  if (!isOpen) return null;

  const statusColor = getStatusColor(quote.estado);

  // Calcular días restantes para expiración
  const getDaysUntilExpiration = () => {
    if (!quote.fechaExpiracion) return null;
    const today = new Date();
    const expiration = new Date(quote.fechaExpiracion);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="rounded-xl shadow-2xl w-full max-w-6xl my-8 max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiFileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Cotización {quote.numero}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span 
                  className="px-3 py-1 text-sm font-medium rounded-full"
                  style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                >
                  {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
                </span>
                {daysUntilExpiration !== null && (
                  <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <FiClock className="w-4 h-4" />
                    {daysUntilExpiration > 0 
                      ? `Expira en ${daysUntilExpiration} días`
                      : daysUntilExpiration === 0 
                        ? 'Expira hoy'
                        : `Expiró hace ${Math.abs(daysUntilExpiration)} días`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={() => onExport(quote)}
                className="btn-secondary flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Exportar
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(quote)}
                className="btn-primary flex items-center gap-2"
              >
                <FiEdit2 className="w-4 h-4" />
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Información del cliente */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información del Cliente */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Razón Social
                    </label>
                    <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.razonSocial}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      RUT
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.rut}
                    </p>
                  </div>
                  {quote.cliente.nombreFantasia && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Nombre Fantasía
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.nombreFantasia}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Giro Comercial
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.giro}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiMapPin className="w-4 h-4" />
                      Dirección
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.direccion}, {quote.cliente.comuna}, {quote.cliente.ciudad}
                    </p>
                  </div>
                  {quote.cliente.nombreContacto && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Contacto
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.nombreContacto}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiPhone className="w-4 h-4" />
                      Teléfono
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.telefonoContacto || quote.cliente.telefono || 'No especificado'}
                    </p>
                  </div>
                  {quote.cliente.email && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <FiMail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle de Productos */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiPackage className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Detalle de Productos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr 
                        className="border-b text-left"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <th className="pb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Código</th>
                        <th className="pb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Descripción</th>
                        <th className="pb-3 font-medium text-center" style={{ color: 'var(--text-secondary)' }}>Unidad</th>
                        <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Cantidad</th>
                        <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Precio Unit.</th>
                        <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Desc.</th>
                        <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item, index) => (
                        <tr 
                          key={item.id}
                          className={index !== quote.items.length - 1 ? 'border-b' : ''}
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <td className="py-3">
                            <span className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                              {item.codigo}
                            </span>
                          </td>
                          <td className="py-3">
                            <span style={{ color: 'var(--text-primary)' }}>
                              {item.descripcion}
                            </span>
                          </td>
                          <td className="py-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                            {item.unidad}
                          </td>
                          <td className="py-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.cantidad.toLocaleString('es-CL')}
                          </td>
                          <td className="py-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                            {formatMoney(item.precioUnitario)}
                          </td>
                          <td className="py-3 text-right" style={{ color: item.descuento ? 'var(--success-text)' : 'var(--text-muted)' }}>
                            {item.descuento ? `${item.descuento}%` : '-'}
                          </td>
                          <td className="py-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatMoney(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Información de Despacho */}
              {quote.despacho && (
                <div 
                  className="rounded-lg p-6"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FiTruck className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    Información de Despacho
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Dirección de Entrega
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                        {quote.despacho.direccion}, {quote.despacho.comuna}, {quote.despacho.ciudad}
                      </p>
                    </div>
                    {quote.despacho.fechaEstimada && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Fecha Estimada
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(quote.despacho.fechaEstimada)}
                        </p>
                      </div>
                    )}
                    {quote.despacho.costoDespacho && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Costo de Despacho
                        </label>
                        <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(quote.despacho.costoDespacho)}
                        </p>
                      </div>
                    )}
                    {quote.despacho.observaciones && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Observaciones de Despacho
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {quote.despacho.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Resumen y condiciones */}
            <div className="space-y-6">
              {/* Resumen Financiero */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiDollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Resumen Financiero
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatMoney(quote.subtotal)}
                    </span>
                  </div>
                  {quote.descuentoTotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--text-secondary)' }}>Descuento:</span>
                      <span className="font-medium" style={{ color: 'var(--success-text)' }}>
                        -{formatMoney(quote.descuentoTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatMoney(quote.iva)}
                    </span>
                  </div>
                  <div 
                    className="border-t pt-3 flex justify-between items-center"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Total:
                    </span>
                    <span className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {formatMoney(quote.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información de Fechas */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiCalendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Fechas Importantes
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Fecha de Creación
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(quote.fechaCreacion)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Última Modificación
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(quote.fechaModificacion)}
                    </p>
                  </div>
                  {quote.fechaExpiracion && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Fecha de Expiración
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <p style={{ color: daysUntilExpiration && daysUntilExpiration <= 5 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                          {formatDate(quote.fechaExpiracion)}
                        </p>
                        {daysUntilExpiration !== null && daysUntilExpiration <= 5 && (
                          <FiAlertCircle className="w-4 h-4" style={{ color: 'var(--danger-text)' }} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Condiciones Comerciales */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Condiciones Comerciales
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiClock className="w-4 h-4" />
                      Validez de la Oferta
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.condicionesComerciales.validezOferta} días
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiCreditCard className="w-4 h-4" />
                      Forma de Pago
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.condicionesComerciales.formaPago}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiTruck className="w-4 h-4" />
                      Tiempo de Entrega
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.condicionesComerciales.tiempoEntrega}
                    </p>
                  </div>
                  {quote.condicionesComerciales.garantia && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <FiShield className="w-4 h-4" />
                        Garantía
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                        {quote.condicionesComerciales.garantia}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendedor */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Información del Vendedor
                </h3>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Vendedor Responsable
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.vendedorNombre}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    ID: {quote.vendedorId}
                  </p>
                </div>
              </div>

              {/* Notas Adicionales */}
              {(quote.notas || quote.condicionesComerciales.observaciones) && (
                <div 
                  className="rounded-lg p-6"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    Notas y Observaciones
                  </h3>
                  <div className="space-y-3">
                    {quote.notas && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Notas Internas
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {quote.notas}
                        </p>
                      </div>
                    )}
                    {quote.condicionesComerciales.observaciones && (
                      <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Observaciones Comerciales
                        </label>
                        <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                          {quote.condicionesComerciales.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
