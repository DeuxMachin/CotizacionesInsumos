import React from 'react';
import { FiDollarSign } from 'react-icons/fi';
import { SalesNoteRecord } from '@/services/notasVentaService';

interface SalesNoteSummaryProps {
  salesNote: SalesNoteRecord;
  formatMoney: (amount: number) => string;
}

export function SalesNoteSummary({ salesNote, formatMoney }: SalesNoteSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: 'var(--border)' }}>
      <div className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
          <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Resumen
        </h2>
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