import React from 'react';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { SalesNoteItemRow } from '@/services/notasVentaService';

interface InvoicedProductsTableProps {
  items: SalesNoteItemRow[];
  formatMoney: (value: number) => string;
}

export const InvoicedProductsTable: React.FC<InvoicedProductsTableProps> = ({
  items,
  formatMoney,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
            <FiCheckCircle className="w-5 h-5 mr-2" />
            Productos Facturados y No Facturados
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>No hay productos en esta nota de venta.</p>
        </div>
      </div>
    );
  }

  // Calcular totales
  const totalCantidad = items.reduce((sum, item) => sum + item.cantidad, 0);
  const totalCantidadFacturada = items.reduce((sum, item) => sum + (item.cantidad_facturada || 0), 0);
  const totalCantidadPendiente = totalCantidad - totalCantidadFacturada;

  const totalMontoFacturado = items.reduce((sum, item) => {
    const cantidadFacturada = item.cantidad_facturada || 0;
    return sum + (cantidadFacturada * item.precio_unitario_neto);
  }, 0);

  const totalMontoPendiente = items.reduce((sum, item) => {
    const cantidadPendiente = item.cantidad - (item.cantidad_facturada || 0);
    return sum + (cantidadPendiente * item.precio_unitario_neto);
  }, 0);

  // Determinar estado del item
  const getItemStatus = (item: SalesNoteItemRow) => {
    const cantidadFacturada = item.cantidad_facturada || 0;
    if (cantidadFacturada >= item.cantidad) {
      return { status: 'facturado', label: 'Facturado Completamente', icon: FiCheckCircle, color: 'var(--success)', bgColor: 'rgba(34, 197, 94, 0.1)' };
    } else if (cantidadFacturada > 0) {
      return { status: 'parcial', label: 'Facturado Parcialmente', icon: FiClock, color: 'var(--warning)', bgColor: 'rgba(234, 179, 8, 0.1)' };
    } else {
      return { status: 'pendiente', label: 'Pendiente de Facturar', icon: FiAlertCircle, color: 'var(--error)', bgColor: 'rgba(239, 68, 68, 0.1)' };
    }
  };

  return (
    <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center" style={{ color: 'var(--text-primary)' }}>
          <FiCheckCircle className="w-5 h-5 mr-2" />
          Productos Facturados y No Facturados
        </h2>

        {/* Resumen de Totales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total Cantidad */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Total de Unidades
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalCantidad}
            </p>
          </div>

          {/* Facturado */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--success)' }}>
              Unidades Facturadas
            </p>
            <p className="text-2xl font-bold mb-1" style={{ color: 'var(--success)' }}>
              {totalCantidadFacturada}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {formatMoney(totalMontoFacturado)}
            </p>
          </div>

          {/* Pendiente */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--error)' }}>
              Unidades Pendientes
            </p>
            <p className="text-2xl font-bold mb-1" style={{ color: 'var(--error)' }}>
              {totalCantidadPendiente}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {formatMoney(totalMontoPendiente)}
            </p>
          </div>
        </div>

        {/* Tabla de Detalle */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Producto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Facturado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Pendiente
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {items.map((item) => {
                const cantidadFacturada = item.cantidad_facturada || 0;
                const cantidadPendiente = item.cantidad - cantidadFacturada;
                const montoFacturado = cantidadFacturada * item.precio_unitario_neto;
                const montoPendiente = cantidadPendiente * item.precio_unitario_neto;
                const itemStatus = getItemStatus(item);
                const IconComponent = itemStatus.icon;

                return (
                  <tr key={item.id} style={{ backgroundColor: 'var(--card-bg)' }}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.descripcion}
                        </p>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {item.unidad} • ${formatMoney(item.precio_unitario_neto)}/unidad
                        </p>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 text-center">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(item.cantidad * item.precio_unitario_neto)}
                        </p>
                      </div>
                    </td>

                    {/* Facturado */}
                    <td className="px-4 py-4">
                      <div className="text-center rounded-lg p-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                        <p className="font-semibold" style={{ color: 'var(--success)' }}>
                          {cantidadFacturada}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(montoFacturado)}
                        </p>
                      </div>
                    </td>

                    {/* Pendiente */}
                    <td className="px-4 py-4">
                      <div className="text-center rounded-lg p-2" style={{ backgroundColor: cantidadPendiente > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}>
                        <p className="font-semibold" style={{ color: cantidadPendiente > 0 ? 'var(--error)' : 'var(--success)' }}>
                          {cantidadPendiente}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {formatMoney(montoPendiente)}
                        </p>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" style={{ color: itemStatus.color }} />
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{
                              backgroundColor: itemStatus.bgColor,
                              color: itemStatus.color,
                            }}
                          >
                            {itemStatus.label}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Barra de Progreso General */}
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Progreso General de Facturación
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${totalCantidad > 0 ? (totalCantidadFacturada / totalCantidad) * 100 : 0}%`,
                backgroundColor: 'var(--success)',
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {totalCantidad > 0 ? Math.round((totalCantidadFacturada / totalCantidad) * 100) : 0}% Completado
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {totalCantidadFacturada} de {totalCantidad} unidades
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
