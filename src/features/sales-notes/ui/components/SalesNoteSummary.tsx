"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms, Quote } from '@/core/domain/quote/Quote';
import { VendedorSelector } from '@/features/quotes/ui/components/VendedorSelector';
import {
  FiDollarSign,
  FiUser,
  FiPackage,
  FiTruck,
  FiInfo,
  FiFileText,
  FiCalendar,
  FiMapPin
} from 'react-icons/fi';

interface FormData {
  cliente: Partial<ClientInfo>;
  items: QuoteItem[];
  despacho: Partial<DeliveryInfo>;
  condicionesComerciales: Partial<CommercialTerms>;
  numeroOrdenCompra?: string;
  observacionesComerciales?: string;
  estado: string;
}

interface SalesNoteSummaryProps {
  formData: FormData;
  totals: {
    subtotal: number;
    descuentoTotal: number;
    iva: number;
    total: number;
    lineDiscountTotal?: number;
    globalDiscountAmount?: number;
    globalPct?: number;
  };
  formatMoney: (amount: number) => string;
  errors?: string[];
  selectedVendedorId?: string;
  selectedVendedorNombre?: string;
  onVendedorChange?: (vendedorId: string, vendedorNombre: string) => void;
}

export function SalesNoteSummary({
  formData,
  totals,
  formatMoney,
  selectedVendedorId,
  selectedVendedorNombre,
  onVendedorChange
}: SalesNoteSummaryProps) {
  const { user } = useAuth();
  const { cliente, items, despacho } = formData;
  const {
    subtotal,
    descuentoTotal,
    iva,
    total,
    lineDiscountTotal = 0,
    globalDiscountAmount = (descuentoTotal - lineDiscountTotal)
  } = totals;

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
            Resumen de la Nota de Venta
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Revise todos los detalles antes de crear la nota
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        {/* Columna izquierda - Información detallada */}
        <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          {/* Información del Cliente */}
          <div
            className="rounded-lg p-3 sm:p-4 xl:p-6 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-primary)' }} />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div
            className="rounded-lg p-4 sm:p-6 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Condiciones Comerciales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.numeroOrdenCompra && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Número de Orden de Compra
                  </label>
                  <p className="mt-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formData.numeroOrdenCompra}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Forma de Pago
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {formData.condicionesComerciales.formaPago || 'Transferencia bancaria'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Tiempo de Entrega
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {formData.condicionesComerciales.tiempoEntrega || '7 días hábiles'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Validez de la Oferta
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {formData.condicionesComerciales.validezOferta ? `${formData.condicionesComerciales.validezOferta} días` : '30 días'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Garantía
                </label>
                <p className="mt-1" style={{ color: 'var(--text-primary)' }}>
                  {formData.condicionesComerciales.garantia || '3 meses'}
                </p>
              </div>
              {formData.condicionesComerciales.observaciones && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Observaciones
                  </label>
                  <p className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                    {formData.condicionesComerciales.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones Comerciales */}
          {formData.observacionesComerciales && (
            <div
              className="rounded-lg p-4 sm:p-6 border"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Observaciones Comerciales
              </h3>
              <p style={{ color: 'var(--text-primary)' }}>
                {formData.observacionesComerciales}
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha - Resumen Financiero */}
        <div className="xl:col-span-1 space-y-4 xl:space-y-6 min-w-0">
          {/* Asignación de Vendedor - Solo para Admin/Dueño */}
          {user?.isAdmin && onVendedorChange && (
            <div className="rounded-lg border p-3 sm:p-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Asignar Vendedor
              </h3>
              <VendedorSelector
                selectedVendedorId={selectedVendedorId}
                selectedVendedorNombre={selectedVendedorNombre}
                onVendedorChange={onVendedorChange}
              />
            </div>
          )}

          <div
            className="sticky top-4 rounded-lg border flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 xl:p-5"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-primary)' }} />
              Resumen Financiero
            </h3>
            <div className="divide-y text-sm" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between py-2">
                <span style={{ color:'var(--text-secondary)' }}>Subtotal</span>
                <span className="font-medium" style={{ color:'var(--text-primary)' }}>{formatMoney(subtotal)}</span>
              </div>
              {lineDiscountTotal > 0 && (
                <div className="flex justify-between py-2">
                  <span style={{ color:'var(--text-secondary)' }}>Desc. líneas</span>
                  <span className="font-medium" style={{ color:'var(--danger-text)' }}>-{formatMoney(lineDiscountTotal)}</span>
                </div>
              )}
              {globalDiscountAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span style={{ color:'var(--text-secondary)' }}>Desc. global</span>
                  <span className="font-medium" style={{ color:'var(--danger-text)' }}>-{formatMoney(globalDiscountAmount)}</span>
                </div>
              )}
              {(despacho.costoDespacho ?? 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span style={{ color:'var(--text-secondary)' }}>Despacho</span>
                  <span className="font-medium" style={{ color:'var(--text-primary)' }}>{formatMoney(despacho.costoDespacho ?? 0)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span style={{ color:'var(--text-secondary)' }}>IVA (19%)</span>
                <span className="font-medium" style={{ color:'var(--text-primary)' }}>{formatMoney(iva)}</span>
              </div>
              <div className="flex justify-between py-3 items-center">
                <span className="text-base font-semibold" style={{ color:'var(--text-primary)' }}>Total</span>
                <span className="text-xl font-bold tracking-tight" style={{ color:'var(--accent-primary)' }}>{formatMoney(total)}</span>
              </div>
            </div>
            <div className="rounded-md border p-3 sm:p-4 flex flex-col gap-2" style={{ background:'var(--info-bg)', borderColor:'var(--info-border)' }}>
              <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color:'var(--info-text)' }}>Indicadores</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:text-xs" style={{ color:'var(--info-text)' }}>
                <div className="flex flex-col min-w-0">
                  <span style={{ color:'var(--text-secondary)' }}>Prod. únicos</span>
                  <span className="font-medium" style={{ color:'var(--info-text)' }}>{items.length}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span style={{ color:'var(--text-secondary)' }}>Cant. total</span>
                  <span className="font-medium" style={{ color:'var(--info-text)' }}>{items.reduce((s,i)=>s+i.cantidad,0).toLocaleString('es-CL')}</span>
                </div>
                {descuentoTotal > 0 && (
                  <div className="flex flex-col min-w-0">
                    <span style={{ color:'var(--text-secondary)' }}>Desc. promedio</span>
                    <span className="font-medium" style={{ color:'var(--info-text)' }}>{Math.round((descuentoTotal / subtotal) * 100)}%</span>
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

export default SalesNoteSummary;