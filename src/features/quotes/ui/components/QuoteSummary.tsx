"use client";

import React from 'react';
import type { ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';
import { 
  FiDollarSign, 
  FiUser, 
  FiPackage, 
  FiTruck, 
  FiInfo, 
  FiFileText,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiMail
} from 'react-icons/fi';

interface FormData {
  cliente: Partial<ClientInfo>;
  items: QuoteItem[];
  despacho: Partial<DeliveryInfo>;
  condicionesComerciales: Partial<CommercialTerms>;
  notas?: string;
  estado: string;
}

interface QuoteSummaryProps {
  formData: FormData;
  totals: {
    subtotal: number;
    descuentoTotal: number;
    iva: number;
    total: number;
  };
  formatMoney: (amount: number) => string;
  errors?: string[];
}

export function QuoteSummary({ formData, totals, formatMoney }: QuoteSummaryProps) {
  const { cliente, items, despacho, condicionesComerciales, notas } = formData;
  const { subtotal, descuentoTotal, iva, total } = totals;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiFileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Resumen de la Cotización
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Revise todos los detalles antes de guardar o enviar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información detallada */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div 
            className="rounded-lg p-4 sm:p-6 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
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
                  {cliente.razonSocial || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  RUT
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {cliente.rut || 'No especificado'}
                </p>
              </div>
              {cliente.nombreFantasia && (
                <div>
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Nombre Fantasía
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {cliente.nombreFantasia}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Giro
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {cliente.giro || 'No especificado'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiMapPin className="w-4 h-4" />
                  Dirección
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {cliente.direccion || 'No especificada'}
                  {cliente.comuna && `, ${cliente.comuna}`}
                  {cliente.ciudad && `, ${cliente.ciudad}`}
                </p>
              </div>
              {(cliente.telefono || cliente.telefonoContacto) && (
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiPhone className="w-4 h-4" />
                    Teléfono
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {cliente.telefonoContacto || cliente.telefono}
                  </p>
                </div>
              )}
              {cliente.email && (
                <div>
                  <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiMail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {cliente.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div 
            className="rounded-lg p-4 sm:p-6 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiPackage className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Productos ({items.length} ítems)
            </h3>
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="text-left pb-2" style={{ color: 'var(--text-secondary)' }}>Producto</th>
                      <th className="text-center pb-2 hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>Cantidad</th>
                      <th className="text-right pb-2" style={{ color: 'var(--text-secondary)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {item.descripcion}
                            </p>
                            <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                              {item.codigo}
                            </p>
                            <div className="sm:hidden text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {item.cantidad} {item.unidad} × {formatMoney(item.precioUnitario)}
                              {(item.descuento ?? 0) > 0 && ` (-${item.descuento}%)`}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center hidden sm:table-cell" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad} {item.unidad}
                          <br />
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {formatMoney(item.precioUnitario)}
                            {(item.descuento ?? 0) > 0 && ` (-${item.descuento}%)`}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                No hay productos agregados
              </p>
            )}
          </div>

          {/* Información de Despacho */}
          {(despacho.direccion || despacho.costoDespacho || despacho.fechaEstimada || despacho.observaciones) && (
            <div 
              className="rounded-lg p-4 sm:p-6 border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiTruck className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                Información de Despacho
              </h3>
              <div className="space-y-3">
                {despacho.direccion && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Dirección de Entrega
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {despacho.direccion}
                      {despacho.comuna && `, ${despacho.comuna}`}
                      {despacho.ciudad && `, ${despacho.ciudad}`}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {despacho.fechaEstimada && (
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <FiCalendar className="w-4 h-4" />
                        Fecha Estimada
                      </label>
                      <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                        {new Date(despacho.fechaEstimada).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  )}
                  {despacho.costoDespacho && (
                    <div>
                      <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Costo de Despacho
                      </label>
                      <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatMoney(despacho.costoDespacho)}
                      </p>
                    </div>
                  )}
                </div>
                {despacho.observaciones && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Observaciones
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {despacho.observaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Condiciones Comerciales */}
          {(condicionesComerciales.validezOferta || condicionesComerciales.formaPago || condicionesComerciales.tiempoEntrega || condicionesComerciales.garantia) && (
            <div 
              className="rounded-lg p-4 sm:p-6 border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                Condiciones Comerciales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {condicionesComerciales.validezOferta && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Validez de la Oferta
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {condicionesComerciales.validezOferta} días
                    </p>
                  </div>
                )}
                {condicionesComerciales.formaPago && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Forma de Pago
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {condicionesComerciales.formaPago}
                    </p>
                  </div>
                )}
                {condicionesComerciales.tiempoEntrega && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Tiempo de Entrega
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {condicionesComerciales.tiempoEntrega}
                    </p>
                  </div>
                )}
                {condicionesComerciales.garantia && (
                  <div>
                    <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Garantía
                    </label>
                    <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                      {condicionesComerciales.garantia}
                    </p>
                  </div>
                )}
              </div>
              {condicionesComerciales.observaciones && (
                <div className="mt-4">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Observaciones Adicionales
                  </label>
                  <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                    {condicionesComerciales.observaciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          {notas && (
            <div 
              className="rounded-lg p-4 sm:p-6 border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Notas de la Cotización
              </h3>
              <p style={{ color: 'var(--text-primary)' }}>
                {notas}
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha - Resumen financiero */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div 
            className="sticky top-4 rounded-lg p-4 sm:p-6 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiDollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Resumen Financiero
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatMoney(subtotal)}
                </span>
              </div>
              {descuentoTotal > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span style={{ color: 'var(--text-secondary)' }}>Descuento:</span>
                  <span className="font-medium" style={{ color: 'var(--success-text)' }}>
                    -{formatMoney(descuentoTotal)}
                  </span>
                </div>
              )}
              {(despacho.costoDespacho ?? 0) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span style={{ color: 'var(--text-secondary)' }}>Despacho:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatMoney(despacho.costoDespacho ?? 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatMoney(iva)}
                </span>
              </div>
              <div 
                className="border-t pt-3 flex justify-between items-center"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total:
                </span>
                <span className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div 
            className="rounded-lg p-4 border"
            style={{ backgroundColor: 'var(--info-bg)', borderColor: 'var(--info-border)' }}
          >
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--info-text)' }}>
              📊 Estadísticas
            </h4>
            <div className="space-y-2 text-sm" style={{ color: 'var(--info-text)' }}>
              <div className="flex justify-between">
                <span>Productos únicos:</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Cantidad total:</span>
                <span className="font-medium">
                  {items.reduce((sum, item) => sum + item.cantidad, 0).toLocaleString('es-CL')}
                </span>
              </div>
              {descuentoTotal > 0 && (
                <div className="flex justify-between">
                  <span>Descuento promedio:</span>
                  <span className="font-medium">
                    {Math.round((descuentoTotal / subtotal) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recordatorios */}
          <div 
            className="rounded-lg p-4 border"
            style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning-border)' }}
          >
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--warning-text)' }}>
              ⚠️ Recordatorios
            </h4>
            <ul className="text-xs space-y-1" style={{ color: 'var(--warning-text)' }}>
              <li>• Revise todos los datos antes de enviar</li>
              <li>• Los precios pueden cambiar sin previo aviso</li>
              <li>• Confirme disponibilidad de productos</li>
              {!condicionesComerciales.validezOferta && (
                <li>• Considere agregar validez a la oferta</li>
              )}
              {!condicionesComerciales.formaPago && (
                <li>• Defina condiciones de pago</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
