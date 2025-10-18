'use client';

import React, { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { SalesNoteRecord } from '@/services/notasVentaService';
import { Modal } from '@/shared/ui/Modal';

interface CancelSalesNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesNote: SalesNoteRecord | null;
  onConfirm: () => Promise<void>;
}

export function CancelSalesNoteModal({ isOpen, onClose, salesNote, onConfirm }: CancelSalesNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error al cancelar nota de venta:', error);
      alert(error instanceof Error ? error.message : 'Error al cancelar la nota de venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!salesNote) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      contentStyle={{
        width: 'min(92vw, 420px)',
        maxHeight: '70vh',
        overflowY: 'auto'
      }}
    >
      <div className="p-3 sm:p-4 w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 pb-2 border-b gap-2" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base sm:text-lg font-semibold flex items-center flex-1" style={{ color: 'var(--text-primary)' }}>
            <FiAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" style={{ color: 'var(--error)' }} />
            <span className="break-words">Cancelar Nota de Venta</span>
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <FiX className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2 mb-1">
          {/* Warning Box */}
          <div
            className="p-2.5 rounded-lg border text-xs"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              borderColor: 'rgba(220, 38, 38, 0.3)'
            }}
          >
            <p className="font-medium mb-1 text-xs sm:text-sm" style={{ color: 'var(--error)' }}>
              ¡Advertencia!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }} className="leading-tight">
              Al cancelar esta nota de venta, no será posible realizar ninguna operación sobre ella.
              Esta acción no se puede deshacer.
            </p>
          </div>

          {/* Note Details */}
          <div
            className="p-2.5 rounded-lg text-xs"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-1">
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs flex-shrink-0">
                  Folio:
                </span>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium text-xs text-right break-all">
                  {salesNote.folio || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center gap-1">
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs flex-shrink-0">
                  Cliente:
                </span>
                <span style={{ color: 'var(--text-primary)' }} className="font-medium text-xs text-right break-words">
                  {salesNote.cliente_razon_social || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center gap-1">
                <span style={{ color: 'var(--text-secondary)' }} className="text-xs flex-shrink-0">
                  Estado:
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{
                  backgroundColor: 'var(--warning-bg)',
                  color: 'var(--warning-text)'
                }}>
                  {salesNote.estado || 'desconocido'}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Text */}
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }} className="leading-tight">
              Por favor, confirma que deseas cancelar esta nota de venta escribiendo su folio:
            </p>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            Conservar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium transition-colors text-xs sm:text-sm whitespace-nowrap"
            style={{
              backgroundColor: isSubmitting ? 'var(--bg-secondary)' : '#dc2626',
              color: 'white',
              opacity: isSubmitting ? 0.7 : 1,
              border: '1px solid #dc2626'
            }}
          >
            {isSubmitting ? 'Cancelando...' : 'Cancelar Nota'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
