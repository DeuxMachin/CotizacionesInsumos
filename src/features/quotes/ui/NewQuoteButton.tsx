'use client';

import { useState } from 'react';
import { createQuote } from '@/app/actions/quotes';

// Componente de botón para abrir el modal de nueva cotización
export function NewQuoteButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  return (
    <>
      <button 
        onClick={openModal}
        className="btn-primary text-xs sm:text-sm"
      >
        Nueva Cotización
      </button>
      
      {isOpen && <NewQuoteModal onClose={closeModal} />}
    </>
  );
}

// Componente de modal para crear una nueva cotización
function NewQuoteModal({ onClose }: { onClose: () => void }) {
  const [errorMessage, setErrorMessage] = useState('');
  
  // Manejador de errores en la acción del servidor
  const handleActionError = async (formData: FormData) => {
    const result = await createQuote(formData);
    
    // Si hay un error, mostrarlo
    if (result && !result.success) {
      setErrorMessage(result.error || 'Error al crear la cotización');
      return;
    }
    
    // Si no hay error, cerrar el modal
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nueva Cotización</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}
        
        <form action={handleActionError}>
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
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Crear Cotización
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
