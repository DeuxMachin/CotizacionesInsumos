"use client";

import React, { useState } from 'react';
import { FiX, FiMail, FiSend } from 'react-icons/fi';
import type { Quote } from '@/core/domain/quote/Quote';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onSend: (email: string, name: string, message?: string) => Promise<void>;
}

export function SendEmailModal({ isOpen, onClose, quote, onSend }: SendEmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(quote.cliente.email || '');
  const [sending, setSending] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Pre-llenar con el email del cliente si existe
      const clientEmail = quote.cliente.email || '';
      setRecipientEmail(clientEmail);
    }
  }, [isOpen, quote]);

  const handleSend = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }

    setSending(true);
    try {
      const recipientName = quote.cliente.nombreContacto || quote.cliente.razonSocial;
      await onSend(recipientEmail, recipientName, undefined);
      onClose();
    } catch (error) {
      console.error('Error enviando email:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[199999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-lg shadow-2xl my-8 animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiMail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Enviar Cotización por Email
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cotización {quote.numero}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={sending}
          >
            <FiX className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Email del destinatario */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <FiMail className="inline w-4 h-4 mr-1" />
              Email del Destinatario *
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              disabled={sending}
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Se enviará el PDF de la cotización a este correo
            </p>
          </div>

          {/* Preview del cliente */}
          <div 
            className="p-4 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Información de la Cotización
            </h4>
            <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p><strong>Cliente:</strong> {quote.cliente.razonSocial || 'N/A'}</p>
              {quote.cliente.nombreFantasia && (
                <p><strong>Nombre Fantasía:</strong> {quote.cliente.nombreFantasia}</p>
              )}
              <p><strong>Cotización:</strong> {quote.numero}</p>
              <p><strong>Total:</strong> {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(quote.total)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-end gap-3 p-6 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={sending}
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !recipientEmail}
            className="btn-primary flex items-center gap-2"
          >
            <FiSend className="w-4 h-4" />
            {sending ? 'Enviando...' : 'Enviar Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
