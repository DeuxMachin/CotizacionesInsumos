"use client";

import React, { useState } from 'react';
import { 
  FiX, 
  FiDownload, 
  FiEdit2, 
  FiSave, 
  FiMail,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiPhone,
  FiDollarSign,
  FiPackage
} from 'react-icons/fi';
import { Quote } from '@/core/domain/quote/Quote';

interface QuoteDetailModalProps {
  quote: Quote;
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  formatMoney: (amount: number) => string;
  getStatusColor: (status: string) => { bg: string; text: string };
}

export function QuoteDetailModal({
  quote,
  isOpen,
  onClose,
  isEditMode,
  formatMoney,
  getStatusColor
}: QuoteDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isEditMode);
  
  if (!isOpen) return null;

  const statusColor = getStatusColor(quote.estado);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <div 
          className="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform shadow-xl rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Cotización {quote.numero}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Creada el {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                </p>
              </div>
              <span
                className="px-3 py-1 text-sm font-medium rounded-full"
                style={{
                  backgroundColor: statusColor.bg,
                  color: statusColor.text
                }}
              >
                {quote.estado.charAt(0).toUpperCase() + quote.estado.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                {isEditing ? <FiSave className="w-4 h-4" /> : <FiEdit2 className="w-4 h-4" />}
                {isEditing ? 'Guardar' : 'Editar'}
              </button>
              
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <FiDownload className="w-4 h-4" />
                PDF
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <FiMail className="w-4 h-4" />
                Enviar
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Información del Cliente */}
              <div 
                className="lg:col-span-2 p-6 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-5 h-5" />
                  Información del Cliente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Razón Social
                    </label>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.razonSocial}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      RUT
                    </label>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.rut}
                    </p>
                  </div>

                  {quote.cliente.nombreFantasia && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Nombre Fantasía
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.nombreFantasia}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Giro
                    </label>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.giro}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <FiMapPin className="w-4 h-4 inline mr-1" />
                      Dirección
                    </label>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {quote.cliente.direccion}, {quote.cliente.comuna}, {quote.cliente.ciudad}
                    </p>
                  </div>

                  {quote.cliente.telefono && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <FiPhone className="w-4 h-4 inline mr-1" />
                        Teléfono
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.telefono}
                      </p>
                    </div>
                  )}

                  {quote.cliente.email && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Email
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.cliente.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen */}
              <div className="space-y-6">
                {/* Información General */}
                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Resumen
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Vendedor:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{quote.vendedorNombre}</span>
                    </div>

                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Items:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{quote.items.length}</span>
                    </div>

                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Válida hasta:</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {quote.fechaExpiracion ? new Date(quote.fechaExpiracion).toLocaleDateString('es-CL') : 'N/A'}
                      </span>
                    </div>

                    <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                        <span style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.subtotal)}</span>
                      </div>

                      {quote.descuentoTotal > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Descuento:</span>
                          <span>-{formatMoney(quote.descuentoTotal)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span>
                        <span style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.iva)}</span>
                      </div>

                      <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                        <span style={{ color: 'var(--text-primary)' }}>{formatMoney(quote.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Condiciones Comerciales */}
                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Condiciones Comerciales
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Forma de Pago:
                      </span>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.condicionesComerciales.formaPago}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Tiempo de Entrega:
                      </span>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.condicionesComerciales.tiempoEntrega}
                      </p>
                    </div>

                    <div>
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Validez de Oferta:
                      </span>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.condicionesComerciales.validezOferta} días
                      </p>
                    </div>

                    {quote.condicionesComerciales.garantia && (
                      <div>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Garantía:
                        </span>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {quote.condicionesComerciales.garantia}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items de la Cotización */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiPackage className="w-5 h-5" />
                Items de la Cotización
              </h3>

              <div 
                className="overflow-hidden rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'var(--bg-primary)' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Código
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Unidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Precio Unit.
                        </th>
                        {quote.items.some(item => item.descuento && item.descuento > 0) && (
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            Desc.
                          </th>
                        )}
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                      {quote.items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.codigo}
                          </td>
                          <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                            {item.descripcion}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                            {item.cantidad.toLocaleString('es-CL')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                            {item.unidad}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right" style={{ color: 'var(--text-primary)' }}>
                            {formatMoney(item.precioUnitario)}
                          </td>
                          {quote.items.some(item => item.descuento && item.descuento > 0) && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-green-600">
                              {item.descuento ? `${item.descuento}%` : '-'}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
                            {formatMoney(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Información de Despacho */}
            {quote.despacho && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiMapPin className="w-5 h-5" />
                  Información de Despacho
                </h3>

                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Dirección de Despacho
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.despacho.direccion}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Comuna y Ciudad
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {quote.despacho.comuna}, {quote.despacho.ciudad}
                      </p>
                    </div>

                    {quote.despacho.fechaEstimada && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          <FiCalendar className="w-4 h-4 inline mr-1" />
                          Fecha Estimada
                        </label>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {new Date(quote.despacho.fechaEstimada).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    )}

                    {quote.despacho.costoDespacho && quote.despacho.costoDespacho > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          <FiDollarSign className="w-4 h-4 inline mr-1" />
                          Costo de Despacho
                        </label>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(quote.despacho.costoDespacho)}
                        </p>
                      </div>
                    )}

                    {quote.despacho.observaciones && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Observaciones
                        </label>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {quote.despacho.observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notas Adicionales */}
            {quote.notas && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Notas Adicionales
                </h3>
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <p style={{ color: 'var(--text-primary)' }}>
                    {quote.notas}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
