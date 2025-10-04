import React, { useState, useEffect } from 'react';
import { FiX, FiPackage, FiCheck } from 'react-icons/fi';
import { SalesNoteItemRow } from '@/services/notasVentaService';

interface InvoiceItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SalesNoteItemRow[];
  onConfirm: (itemQuantities: Record<number, number>) => Promise<void>;
  formatMoney: (amount: number) => string;
}

export function InvoiceItemsModal({ 
  isOpen, 
  onClose, 
  items, 
  onConfirm, 
  formatMoney 
}: InvoiceItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar items seleccionados y cantidades
  useEffect(() => {
    if (isOpen) {
      const initialQuantities: Record<number, number> = {};
      const pendingItems = new Set<number>();
      
      items.forEach(item => {
        const alreadyInvoiced = item.cantidad_facturada || 0;
        const remaining = item.cantidad - alreadyInvoiced;
        
        // Solo incluir items que tengan algo pendiente
        if (remaining > 0) {
          // Inicializar con todo lo pendiente facturado (cantidad total)
          initialQuantities[item.id] = item.cantidad;
          pendingItems.add(item.id);
        } else if (alreadyInvoiced > 0) {
          // Si ya está completamente facturado, guardar ese valor para referencia
          initialQuantities[item.id] = alreadyInvoiced;
        }
      });
      
      setQuantities(initialQuantities);
      setSelectedItems(pendingItems);
    }
  }, [isOpen, items]);

  const toggleItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
      // Cuando se selecciona, establecer la cantidad al máximo por defecto
      const item = items.find(i => i.id === itemId);
      if (item && !quantities[itemId]) {
        setQuantities(prev => ({
          ...prev,
          [itemId]: item.cantidad
        }));
      }
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    const pendingItems = items.filter(item => (item.cantidad_facturada || 0) < item.cantidad);
    
    if (selectedItems.size === pendingItems.length) {
      setSelectedItems(new Set());
    } else {
      const newSelected = new Set<number>();
      const newQuantities: Record<number, number> = {};
      
      pendingItems.forEach(item => {
        newSelected.add(item.id);
        newQuantities[item.id] = item.cantidad;
      });
      
      setSelectedItems(newSelected);
      setQuantities(prev => ({ ...prev, ...newQuantities }));
    }
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const alreadyInvoiced = item.cantidad_facturada || 0;
    const maxQuantity = item.cantidad;
    
    // La cantidad debe estar entre lo ya facturado y el máximo
    const clampedQuantity = Math.max(alreadyInvoiced, Math.min(newQuantity, maxQuantity));
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: clampedQuantity
    }));
  };

  const handleConfirm = async () => {
    if (selectedItems.size === 0) {
      alert('Debe seleccionar al menos un producto para facturar');
      return;
    }

    // Filtrar solo items seleccionados con cantidad > cantidad ya facturada
    const itemsToUpdate: Record<number, number> = {};
    let hasChanges = false;

    for (const itemId of selectedItems) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const alreadyInvoiced = item.cantidad_facturada || 0;
        const newQuantity = quantities[itemId] || item.cantidad;
        
        if (newQuantity > alreadyInvoiced) {
          itemsToUpdate[itemId] = newQuantity;
          hasChanges = true;
        }
      }
    }

    if (!hasChanges) {
      alert('Debe aumentar la cantidad facturada de al menos un producto');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(itemsToUpdate);
      onClose();
    } catch (error) {
      console.error('Error al actualizar items facturados:', error);
      alert('Error al actualizar los items facturados');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allSelected = selectedItems.size === items.filter(i => (i.cantidad_facturada || 0) < i.cantidad).length;
  const someSelected = selectedItems.size > 0 && !allSelected;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] overflow-y-auto pointer-events-none">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <FiPackage className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Seleccionar Productos Facturados
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 flex-shrink-0"
              >
                <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex-1 overflow-y-auto">
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
              Seleccione los productos facturados y ajuste las cantidades si es necesario.
              Si todos los productos están completamente facturados, la nota pasará a <strong>&quot;Facturada&quot;</strong>.
            </p>

            {/* Select All */}
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-300 cursor-pointer text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <span className="ml-2 sm:ml-3 font-medium text-gray-900 text-sm sm:text-base">
                  Seleccionar todos los productos pendientes
                </span>
              </label>
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay productos en esta nota de venta</p>
                </div>
              ) : (
                items.map((item) => {
                  const alreadyInvoiced = item.cantidad_facturada || 0;
                  const remaining = item.cantidad - alreadyInvoiced;
                  const isFullyInvoiced = alreadyInvoiced >= item.cantidad;
                  const isSelected = selectedItems.has(item.id);
                  const currentQuantity = quantities[item.id] || item.cantidad;
                  
                  // No mostrar items ya completamente facturados
                  if (isFullyInvoiced) return null;

                  return (
                  <div
                    key={item.id}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                      {/* Checkbox */}
                      <div className="relative mt-1 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-300 cursor-pointer text-blue-600 focus:ring-blue-500"
                        />
                        {isSelected && (
                          <FiCheck className="absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none text-blue-600" />
                        )}
                      </div>

                      {/* Contenido del item */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {item.descripcion}
                            </p>
                            <p className="text-xs sm:text-sm mt-1 text-gray-600">
                              {formatMoney(item.precio_unitario_neto)} × {item.unidad}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-blue-600 text-sm sm:text-base">
                              {formatMoney(item.subtotal_neto)}
                            </p>
                          </div>
                        </div>

                        {/* Controles de cantidad (solo si está seleccionado) */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <label className="text-xs text-gray-600 font-medium flex-shrink-0">Cantidad a facturar:</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, currentQuantity - 1)}
                                    disabled={currentQuantity <= alreadyInvoiced}
                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-lg font-bold"
                                    title={currentQuantity <= alreadyInvoiced ? "No puede reducir cantidades ya facturadas" : "Reducir cantidad"}
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={alreadyInvoiced}
                                    max={item.cantidad}
                                    value={currentQuantity}
                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || alreadyInvoiced)}
                                    className="w-12 sm:w-16 px-2 py-1 border border-gray-300 rounded-lg text-center text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <button
                                    onClick={() => updateQuantity(item.id, currentQuantity + 1)}
                                    disabled={currentQuantity >= item.cantidad}
                                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-lg font-bold"
                                    title={currentQuantity >= item.cantidad ? "Cantidad máxima alcanzada" : "Aumentar cantidad"}
                                  >
                                    +
                                  </button>
                                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                                    / {item.cantidad}
                                  </span>
                                </div>
                              </div>
                              {alreadyInvoiced > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
                                    ✓ Mínimo: {alreadyInvoiced}
                                  </div>
                                  {remaining > 0 && (
                                    <div className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium border border-orange-200">
                                      Pendiente: {remaining}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {alreadyInvoiced > 0 && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                💡 No puede reducir por debajo de {alreadyInvoiced} (ya facturadas)
                              </p>
                            )}
                          </div>
                        )}

                        {/* Info de estado (si no está seleccionado) */}
                        {!isSelected && alreadyInvoiced > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <div className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
                              ✓ {alreadyInvoiced} ya facturadas
                            </div>
                            {remaining > 0 && (
                              <div className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium border border-orange-200">
                                {remaining} pendientes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                })
              )}
            </div>

            {/* Summary */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <span className="font-medium text-gray-700 text-sm sm:text-base">
                  Productos seleccionados:
                </span>
                <span className="font-bold text-lg text-blue-600">
                  {selectedItems.size} de {items.filter(i => (i.cantidad_facturada || 0) < i.cantidad).length}
                </span>
              </div>
              {selectedItems.size > 0 && selectedItems.size < items.filter(i => (i.cantidad_facturada || 0) < i.cantidad).length && (
                <p className="mt-2 text-xs sm:text-sm text-orange-600">
                  ⚠️ La nota de venta quedará como &quot;Factura Parcial&quot;
                </p>
              )}
              {selectedItems.size === items.filter(i => (i.cantidad_facturada || 0) < i.cantidad).length && selectedItems.size > 0 && (
                <p className="mt-2 text-xs sm:text-sm text-green-600">
                  ✓ La nota de venta quedará como &quot;Facturada&quot;
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg transition-colors border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 order-1 sm:order-2"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Facturación'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
