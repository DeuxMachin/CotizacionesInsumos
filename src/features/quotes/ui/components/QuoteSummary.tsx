"use client";

import React from 'react';
import { useAuth } from '@/features/auth/model/useAuth';
import type { ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms, Quote } from '@/core/domain/quote/Quote';
import { PDFDownloadButton } from '@/features/reports/ui/pdf/PDFDownloadButton';
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
  descuentoGlobalPct?: number;
}

interface QuoteSummaryProps {
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
  onChangeGlobalDiscountPct?: (pct: number) => void;
  onChangeCommercialTerms?: (terms: Partial<CommercialTerms>) => void;
}

export function QuoteSummary({ formData, totals, formatMoney, onChangeGlobalDiscountPct, onChangeCommercialTerms }: QuoteSummaryProps) {
  const { user } = useAuth();
  const { cliente, items, despacho, condicionesComerciales, notas } = formData;
  const {
    subtotal,
    descuentoTotal,
    iva,
    total,
    lineDiscountTotal = 0,
    globalDiscountAmount = (descuentoTotal - lineDiscountTotal),
    globalPct = formData.descuentoGlobalPct || totals.globalPct || 0
  } = totals;

  // Función helper para crear un objeto Quote compatible con PDF generator
  const createQuoteFromFormData = (
    formData: FormData,
    totalsCalc: { subtotal: number; descuentoTotal: number; iva: number; total: number; lineDiscountTotal?: number; globalDiscountAmount?: number }
  ): Quote => {
    const vendedorNombre = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || 'Usuario';
    return {
      id: 'preview',
      numero: `PREV-${Date.now()}`,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
        new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString() : 
        undefined,
      cliente: formData.cliente as ClientInfo,
      items: formData.items,
      despacho: Object.keys(formData.despacho).length > 0 ? formData.despacho as DeliveryInfo : undefined,
      condicionesComerciales: formData.condicionesComerciales as CommercialTerms,
      estado: formData.estado as Quote['estado'],
  vendedorId: user?.id || 'desconocido',
  vendedorNombre,
      subtotal: totalsCalc.subtotal,
      descuentoTotal: totalsCalc.descuentoTotal,
      descuentoLineasMonto: totalsCalc.lineDiscountTotal ?? 0,
      descuentoGlobalMonto: totalsCalc.globalDiscountAmount ?? (totalsCalc.descuentoTotal - (totalsCalc.lineDiscountTotal ?? 0)),
      iva: totalsCalc.iva,
      total: totalsCalc.total,
      notas: formData.notas
    };
  };

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
          <div 
            className="rounded-lg p-4 sm:p-6 border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Condiciones Comerciales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Validez de la Oferta
                </label>
                <select
                  value={formData.condicionesComerciales.validezOferta || 30}
                  onChange={(e) => onChangeCommercialTerms?.({ ...formData.condicionesComerciales, validezOferta: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ 
                    borderColor: 'var(--border-subtle)', 
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--text-primary)' 
                  }}
                >
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                  <option value={45}>45 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Forma de Pago
                </label>
                <select
                  value={formData.condicionesComerciales.formaPago || 'Transferencia bancaria'}
                  onChange={(e) => onChangeCommercialTerms?.({ ...formData.condicionesComerciales, formaPago: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ 
                    borderColor: 'var(--border-subtle)', 
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--text-primary)' 
                  }}
                >
                  <option value="Transferencia bancaria">Transferencia bancaria</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Información de Despacho
                </label>
                <textarea
                  value={formData.condicionesComerciales.tiempoEntrega || ''}
                  onChange={(e) => onChangeCommercialTerms?.({ ...formData.condicionesComerciales, tiempoEntrega: e.target.value })}
                  placeholder="Ej: Despacho inmediato, sujeto a confirmación de stock..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  style={{ 
                    borderColor: 'var(--border-subtle)', 
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--text-primary)' 
                  }}
                />
              </div>
            </div>
          </div>

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

        
        {/* Nueva columna derecha sustituye a la anterior */}
        <div className="space-y-6 min-w-0">
          <div
            className="sticky top-4 rounded-lg border flex flex-col gap-4 p-4 sm:p-5"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiDollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                Resumen Financiero
              </h3>
              <div className="flex items-center gap-2 ml-auto w-full xs:w-auto sm:w-auto">
                <label className="text-xs font-medium whitespace-nowrap" style={{ color:'var(--text-secondary)' }} htmlFor="global-discount-input">Desc.Global (%)</label>
                <input
                  id="global-discount-input"
                  aria-label="Descuento global"
                  type="number"
                  min={0}
                  max={100}
                  value={globalPct}
                  onChange={e => onChangeGlobalDiscountPct && onChangeGlobalDiscountPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="px-2 py-1 rounded border text-right text-sm w-full max-w-[90px]"
                  style={{ background:'var(--input-bg)', borderColor:'var(--border)', color:'var(--text-primary)' }}
                />
              </div>
            </div>
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
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <PDFDownloadButton
                quote={createQuoteFromFormData(formData, {
                  subtotal,
                  descuentoTotal,
                  iva,
                  total,
                  lineDiscountTotal,
                  globalDiscountAmount
                })}
                className="w-full flex-wrap"
                showPreview={true}
              />
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
                {lineDiscountTotal > 0 && (
                  <div className="flex flex-col min-w-0">
                    <span style={{ color:'var(--text-secondary)' }}>Desc. líneas</span>
                    <span className="font-medium" style={{ color:'var(--danger-text)' }}>-{formatMoney(lineDiscountTotal)}</span>
                  </div>
                )}
                {globalDiscountAmount > 0 && (
                  <div className="flex flex-col min-w-0">
                    <span style={{ color:'var(--text-secondary)' }}>Desc. global</span>
                    <span className="font-medium" style={{ color:'var(--danger-text)' }}>-{formatMoney(globalDiscountAmount)}</span>
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

export default QuoteSummary;
