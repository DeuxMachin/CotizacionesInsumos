import React from 'react';
import { FiDollarSign, FiEdit2, FiX } from 'react-icons/fi';
import { SalesNoteRecord } from '@/services/notasVentaService';

interface SalesNoteSummaryProps {
  salesNote: SalesNoteRecord;
  formatMoney: (amount: number) => string;
  onEdit?: () => void;
  onCancel?: () => void;
}

export function SalesNoteSummary({ salesNote, formatMoney, onEdit, onCancel }: SalesNoteSummaryProps) {
  // Determina si se pueden editar o cancelar
  const canEdit = salesNote.estado && ['creada', 'borrador'].includes(salesNote.estado);
  const canCancel = salesNote.estado && ['creada', 'borrador'].includes(salesNote.estado);

  return (
    <div className="rounded-lg shadow-sm border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center" style={{ color: 'var(--text-primary)' }}>
            <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Resumen
          </h2>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 rounded-lg transition-colors text-sm flex items-center gap-1"
                style={{
                  color: 'white',
                  backgroundColor: 'var(--primary)',
                  border: '1px solid var(--primary)'
                }}
                title="Editar nota de venta"
              >
                <FiEdit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded-lg transition-colors text-sm flex items-center gap-1"
                style={{
                  color: 'white',
                  backgroundColor: 'var(--error)',
                  border: '1px solid var(--error)'
                }}
                title="Cancelar nota de venta"
              >
                <FiX className="w-4 h-4" />
                <span className="hidden sm:inline">Cancelar</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatMoney(salesNote.subtotal)}</span>
          </div>
          {salesNote.descuento_total > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Descuento</span>
              <span style={{ color: 'var(--error)' }}>-{formatMoney(salesNote.descuento_total)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: 'var(--text-secondary)' }}>IVA ({salesNote.iva_pct}%)</span>
            <span style={{ color: 'var(--text-primary)' }}>{formatMoney(salesNote.iva_monto)}</span>
          </div>
          <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between font-semibold">
              <span style={{ color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatMoney(salesNote.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}