"use client";

import React from 'react';
import { 
  FiArrowLeft, 
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
import { useParams, useRouter } from 'next/navigation';
import { useQuotes } from '@/features/quotes/model/useQuotes';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getQuoteById, formatMoney, getStatusColor, loading } = useQuotes();
  
  const quoteId = params.id as string;
  const quote = getQuoteById ? getQuoteById(quoteId) : null;

  // Si está cargando, mostrar un indicador de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Cargando cotización...
          </h3>
        </div>
      </div>
    );
  }

  // Si no está cargando y no hay cotización, mostrar mensaje de no encontrado
  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiFileText className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Cotización no encontrada
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            La cotización que buscas no existe o ha sido eliminada.
          </p>
          <button 
            onClick={() => router.push('/dashboard/cotizaciones')}
            className="btn-primary"
          >
            Volver a Cotizaciones
          </button>
        </div>
      </div>
    );
  }

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

  const handleExport = () => {
    // Funcionalidad de exportación será implementada después
    alert('Funcionalidad de exportación en desarrollo');
  };

  const handleEdit = () => {
    // Funcionalidad de edición será implementada después
    alert('Funcionalidad de edición en desarrollo');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div 
        className="p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <button
            onClick={() => router.push('/dashboard/cotizaciones')}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
            aria-label="Volver a cotizaciones"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div 
            className="p-2 sm:p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
          >
            <FiFileText className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              Cotización {quote.numero}
            </h1>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1">
              <span 
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap"
                style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
              >
                {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
              </span>
              {daysUntilExpiration !== null && (
                <span className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  <FiClock className="w-3 sm:w-4 h-3 sm:h-4" />
                  {daysUntilExpiration > 0 
                    ? `Expira en ${daysUntilExpiration} días`
                    : daysUntilExpiration === 0 
                      ? 'Expira hoy'
                      : `Expiró hace ${Math.abs(daysUntilExpiration)} días`
                  }
                  {daysUntilExpiration !== null && daysUntilExpiration <= 5 && (
                    <FiAlertCircle className="w-3 sm:w-4 h-3 sm:h-4 ml-1" style={{ color: 'var(--danger-text)' }} />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
          >
            <FiDownload className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Exportar</span>
          </button>
          <button
            onClick={handleEdit}
            className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-sm"
          >
            <FiEdit2 className="w-3 sm:w-4 h-3 sm:h-4" />
            <span className="hidden xs:inline">Editar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna izquierda - Información del cliente y productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div 
            className="rounded-lg p-6 w-full"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Razón Social
                </label>
                <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.razonSocial || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  RUT
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.rut || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Nombre Fantasía
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.nombreFantasia || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Giro Comercial
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.giro || 'No especificado'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiMapPin className="w-4 h-4" />
                  Dirección
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.direccion ? 
                    `${quote.cliente.direccion}, ${quote.cliente.comuna || ''}, ${quote.cliente.ciudad || ''}` : 
                    'No especificada'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Contacto
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.nombreContacto || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiPhone className="w-4 h-4" />
                  Teléfono
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.telefonoContacto || quote.cliente.telefono || 'No especificado'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiMail className="w-4 h-4" />
                  Email
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {quote.cliente.email || 'No especificado'}
                </p>
              </div>
            </div>
          </div>

          {/* Detalle de Productos */}
          <div 
            className="rounded-lg p-4 sm:p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiPackage className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Detalle de Productos ({quote.items?.length || 0} ítems)
            </h3>
            {quote.items && quote.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr 
                      className="border-b text-left"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <th className="pb-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Código</th>
                      <th className="pb-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Descripción</th>
                      <th className="pb-3 font-medium text-center hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Unidad</th>
                      <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Cantidad</th>
                      <th className="pb-3 font-medium text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Precio Unit.</th>
                      <th className="pb-3 font-medium text-right hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>Desc.</th>
                      <th className="pb-3 font-medium text-right" style={{ color: 'var(--text-secondary)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr 
                        key={item.id || index}
                        className={index !== quote.items.length - 1 ? 'border-b' : ''}
                        style={{ borderColor: 'var(--border)' }}
                      >
                          <td className="py-3 sm:py-4 whitespace-nowrap">
                          <span className="font-mono text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.codigo}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4">
                          <span className="font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                            {item.descripcion}
                          </span>
                          <span className="text-xs block sm:hidden mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {item.unidad} | {formatMoney(item.precioUnitario)}
                            {item.descuento ? ` | -${item.descuento}%` : ''}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 text-center hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                          {item.unidad}
                        </td>
                        <td className="py-3 sm:py-4 text-right whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 sm:py-4 text-right hidden md:table-cell whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(item.precioUnitario)}
                        </td>
                        <td className="py-3 sm:py-4 text-right hidden md:table-cell whitespace-nowrap" style={{ color: item.descuento ? 'var(--success-text)' : 'var(--text-muted)' }}>
                          {item.descuento ? `${item.descuento}%` : '-'}
                        </td>
                        <td className="py-3 sm:py-4 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(item.subtotal)}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p style={{ color: 'var(--text-secondary)' }}>No hay productos agregados a esta cotización</p>
              </div>
            )}
          </div>

          {/* Información de Despacho */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiTruck className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Información de Despacho
            </h3>
            {quote.despacho ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Dirección de Entrega
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.direccion ? 
                      `${quote.despacho.direccion}, ${quote.despacho.comuna || ''}, ${quote.despacho.ciudad || ''}` : 
                      'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Fecha Estimada
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.fechaEstimada ? formatDate(quote.despacho.fechaEstimada) : 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Costo de Despacho
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.costoDespacho ? formatMoney(quote.despacho.costoDespacho) : 'No especificado'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Observaciones de Despacho
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {quote.despacho.observaciones || 'Sin observaciones'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p style={{ color: 'var(--text-secondary)' }}>No hay información de despacho disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha - Resumen y condiciones */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div 
            className="rounded-lg p-4 sm:p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiDollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Resumen Financiero
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center py-1 sm:py-2">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span className="font-medium text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                  {formatMoney(quote.subtotal)}
                </span>
              </div>
              {quote.descuentoTotal > 0 && (
                <div className="flex justify-between items-center py-1 sm:py-2">
                  <span style={{ color: 'var(--text-secondary)' }}>Descuento:</span>
                  <span className="font-medium text-base sm:text-lg" style={{ color: 'var(--success-text)' }}>
                    -{formatMoney(quote.descuentoTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 sm:py-2">
                <span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span>
                <span className="font-medium text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
                  {formatMoney(quote.iva)}
                </span>
              </div>
              <div 
                className="border-t pt-3 sm:pt-4 flex justify-between items-center"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total:
                </span>
                <span className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {formatMoney(quote.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Información de Fechas */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiCalendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Fechas Importantes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Fecha de Creación
                </label>
                <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(quote.fechaCreacion)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Última Modificación
                </label>
                <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(quote.fechaModificacion)}
                </p>
              </div>
              {quote.fechaExpiracion && (
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Fecha de Expiración
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-medium" style={{ color: daysUntilExpiration && daysUntilExpiration <= 5 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                      {formatDate(quote.fechaExpiracion)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Condiciones Comerciales */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Condiciones Comerciales
            </h3>
            {quote.condicionesComerciales ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiClock className="w-4 h-4" />
                    Validez de la Oferta
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.validezOferta ? `${quote.condicionesComerciales.validezOferta} días` : 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiCreditCard className="w-4 h-4" />
                    Forma de Pago
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.formaPago || 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiTruck className="w-4 h-4" />
                    Tiempo de Entrega
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.tiempoEntrega || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiShield className="w-4 h-4" />
                    Garantía
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {quote.condicionesComerciales.garantia || 'No especificada'}
                  </p>
                </div>
                {quote.condicionesComerciales.observaciones && (
                  <div>
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiInfo className="w-4 h-4" />
                      Observaciones
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quote.condicionesComerciales.observaciones}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p style={{ color: 'var(--text-secondary)' }}>No hay condiciones comerciales definidas</p>
              </div>
            )}
          </div>

          {/* Vendedor */}
          <div 
            className="rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Información del Vendedor
            </h3>
            {quote.vendedorNombre ? (
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Vendedor Responsable
                </label>
                <p className="mt-1 font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
                  {quote.vendedorNombre}
                </p>
                {quote.vendedorId && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    ID: {quote.vendedorId}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <p style={{ color: 'var(--text-secondary)' }}>Vendedor no asignado</p>
              </div>
            )}
          </div>

          {/* Notas Adicionales */}
          {(quote.notas || quote.condicionesComerciales.observaciones) && (
            <div 
              className="rounded-lg p-6"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                Notas y Observaciones
              </h3>
              <div className="space-y-4">
                {quote.notas && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Notas Internas
                    </label>
                    <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {quote.notas}
                    </p>
                  </div>
                )}
                {quote.condicionesComerciales.observaciones && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Observaciones Comerciales
                    </label>
                    <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
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
  );
}
