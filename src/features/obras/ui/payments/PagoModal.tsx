import React, { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { SupabaseObrasService } from '../../services/SupabaseObrasService';

interface PagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  onPagoAdded: () => void;
  pendienteActual?: number;
}

export const PagoModal: React.FC<PagoModalProps> = ({
  isOpen,
  onClose,
  obraId,
  onPagoAdded,
  pendienteActual = 0,
}) => {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setDescripcion('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    const montoNum = Number(monto);
    
    // Validación adicional: verificar que pendienteActual sea un número válido
    if (typeof pendienteActual !== 'number' || isNaN(pendienteActual)) {
      alert('Error: No se pudo determinar el monto pendiente. Por favor recargue la página.');
      return;
    }
    
    if (montoNum > pendienteActual) {
      alert(`El monto del pago ($${montoNum.toLocaleString()}) no puede ser mayor al pendiente actual ($${pendienteActual.toLocaleString()})`);
      return;
    }

    setLoading(true);

    try {
      const obrasService = new SupabaseObrasService();
      await obrasService.registrarPago(obraId, montoNum, descripcion || 'Pago registrado desde el sistema');

      setSuccess(true);
      setTimeout(() => {
        onPagoAdded();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar el pago';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
        {success ? (
          // Success state
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Pago Registrado!</h2>
            <p className="text-gray-600 mb-4">El pago se ha registrado correctamente en el sistema.</p>
            <p className="text-sm text-gray-500">Cerrando automáticamente...</p>
          </div>
        ) : (
          // Form state
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                  <FiDollarSign className="w-6 h-6 text-green-600" />
                  Registrar Pago
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Información del pendiente actual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiInfo className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Información del Pendiente</span>
                </div>
                <p className="text-sm text-blue-800">
                  Pendiente actual: <span className="font-semibold">${pendienteActual.toLocaleString()}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Registra un pago para reducir el monto pendiente de esta obra.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del Pago *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir campo vacío
                      if (value === '') {
                        setMonto('');
                        return;
                      }
                      
                      const numValue = Number(value);
                      
                      // Validar que sea un número válido
                      if (isNaN(numValue)) {
                        return;
                      }
                      
                      // Si el valor es mayor al pendiente, limitar al máximo
                      if (numValue > pendienteActual && pendienteActual > 0) {
                        setMonto(pendienteActual.toString());
                        return;
                      }
                      
                      // Si el valor es negativo, no permitir
                      if (numValue < 0) {
                        return;
                      }
                      
                      setMonto(value);
                    }}
                    onBlur={(e) => {
                      // Al perder el foco, validar y corregir si es necesario
                      const numValue = Number(e.target.value);
                      if (!isNaN(numValue) && numValue > pendienteActual) {
                        setMonto(pendienteActual.toString());
                      }
                    }}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="0"
                    min="0"
                    max={pendienteActual}
                    step="0.01"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  {pendienteActual > 0 && (
                    <button
                      type="button"
                      onClick={() => setMonto(pendienteActual.toString())}
                      className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      Pagar todo (${pendienteActual.toLocaleString()})
                    </button>
                  )}
                  {monto && Number(monto) > pendienteActual && (
                    <p className="text-sm text-red-600">
                      El monto no puede ser mayor al pendiente actual
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Pago
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Ej: Pago parcial, Pago completo, etc."
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional: Describe el tipo de pago realizado
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  disabled={loading || !monto || Number(monto) <= 0 || Number(monto) > pendienteActual}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      Registrar Pago
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};