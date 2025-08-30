'use client';

import { useState } from 'react';
import { Quote } from '@/core/domain/quote/Quote';

type QuoteFormProps = {
  quote?: Quote;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string } | unknown>;
  submitButtonText?: string;
};

export function QuoteForm({ quote, onSubmit, submitButtonText = 'Guardar' }: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const result = await onSubmit(formData);
      
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        setErrorMessage(
          ('error' in result && typeof result.error === 'string') 
            ? result.error 
            : 'Error al procesar la cotización'
        );
      }
    } catch (error) {
      setErrorMessage('Ocurrió un error inesperado');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form action={handleSubmit}>
      {/* ID oculto para actualizaciones */}
      {quote && <input type="hidden" name="id" value={quote.id} />}
      
      {/* Mensaje de error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
            Cliente
          </label>
          <input
            type="text"
            id="client"
            name="client"
            required
            defaultValue={quote?.client || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            defaultValue={quote?.date || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        {quote && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              name="status"
              required
              defaultValue={quote.status}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
            </select>
          </div>
        )}
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Monto Total
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            required
            min="0"
            step="1"
            defaultValue={quote?.amount || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Procesando...' : submitButtonText}
          </button>
        </div>
      </div>
    </form>
  );
}
