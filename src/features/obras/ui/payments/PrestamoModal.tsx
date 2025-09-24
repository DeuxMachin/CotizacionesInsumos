import React, { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiInfo, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import { SupabaseObrasService } from '../../services/SupabaseObrasService';

interface PrestamoModalProps {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  onPrestamoAdded: () => void;
  pendienteActual?: number;
}

export const PrestamoModal: React.FC<PrestamoModalProps> = ({
  isOpen,
  onClose,
  obraId,
  onPrestamoAdded,
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

    setLoading(true);

    try {
      const obrasService = new SupabaseObrasService();
      await obrasService.registrarPrestamo(obraId, Number(monto), descripcion || 'Préstamo registrado desde el sistema');

      setSuccess(true);
      setTimeout(() => {
        onPrestamoAdded();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar el préstamo');
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Préstamo Registrado!</h2>
            <p className="text-gray-600 mb-4">El préstamo se ha registrado correctamente en el sistema.</p>
            <p className="text-sm text-gray-500">Cerrando automáticamente...</p>
          </div>
        ) : (
          // Form state
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900">
                  <FiTrendingUp className="w-6 h-6 text-blue-600" />
                  Registrar Préstamo
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
                  Registra un préstamo para aumentar el monto pendiente de esta obra.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del Préstamo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Préstamo
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Ej: Anticipo de materiales, Préstamo para compra de equipos, etc."
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional: Describe el propósito del préstamo
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
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  disabled={loading || !monto || Number(monto) <= 0}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      Registrar Préstamo
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