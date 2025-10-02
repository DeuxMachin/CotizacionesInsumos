"use client";

import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiPackage, FiTruck, FiSave, FiSearch } from 'react-icons/fi';
import type { Quote, QuoteItem, DeliveryInfo } from '@/core/domain/quote/Quote';
import { useProducts, Product } from '../../model/useProducts';

interface EditQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onSave: (items: QuoteItem[], despacho: DeliveryInfo) => Promise<boolean>;
}

export function EditQuoteModal({
  isOpen,
  onClose,
  quote,
  onSave
}: EditQuoteModalProps) {
  const [items, setItems] = useState<QuoteItem[]>(quote.items);
  const [despacho, setDespacho] = useState<DeliveryInfo>(quote.despacho || {
    direccion: '',
    ciudad: '',
    comuna: ''
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'productos' | 'despacho'>('productos');
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { products, loading: loadingProducts } = useProducts();

  if (!isOpen) return null;

  const handleAddItem = () => {
    setShowProductModal(true);
  };

  const handleAddProductFromCatalog = (product: Product) => {
    const newItem: QuoteItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      codigo: product.sku || '',
      descripcion: product.nombre,
      unidad: product.unidad || 'UND',
      cantidad: 1,
      precioUnitario: product.precio_venta_neto || 0,
      descuento: 0,
      subtotal: product.precio_venta_neto || 0
    };
    setItems([...items, newItem]);
    setShowProductModal(false);
    setSearchTerm('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Recalcular subtotal con descuento como porcentaje
    const item = newItems[index];
    const descuentoPorcentaje = Math.max(0, Math.min(100, item.descuento || 0));
    const subtotal = (item.cantidad * item.precioUnitario) * (1 - descuentoPorcentaje / 100);
    newItems[index].subtotal = subtotal;
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const success = await onSave(items, despacho);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error guardando cambios:', error);
    } finally {
      setSaving(false);
    }
  };

  const calcularTotales = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    // descuento is a percentage on each item, so compute money amount discounted per item
    const descuentoTotal = items.reduce((sum, item) => {
      const porcentaje = Math.max(0, Math.min(100, item.descuento || 0));
      const montoOriginal = (item.cantidad || 0) * (item.precioUnitario || 0);
      const montoDescontado = montoOriginal * (porcentaje / 100);
      return sum + montoDescontado;
    }, 0);
    return { subtotal, descuentoTotal };
  };

  const { subtotal, descuentoTotal } = calcularTotales();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-5xl rounded-lg shadow-xl animate-slideUp my-8"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 4rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 z-10" 
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Editar Cotización {quote.numero}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Modifica los productos y la información de despacho
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            disabled={saving}
          >
            <FiX className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'productos' 
                ? 'border-b-2 border-orange-500 text-orange-500' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiPackage className="w-4 h-4" />
            Productos
          </button>
          <button
            onClick={() => setActiveTab('despacho')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'despacho' 
                ? 'border-b-2 border-orange-500 text-orange-500' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FiTruck className="w-4 h-4" />
            Despacho
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          {activeTab === 'productos' ? (
            <div className="space-y-4">
              {/* Lista de productos */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-lg border"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="lg:col-span-2">
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                          className="input w-full"
                          placeholder="Descripción del producto"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          Cantidad
                        </label>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border-2 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          min="0"
                          step="1"
                          placeholder="0"
                          style={{ 
                            backgroundColor: '#ffffff',
                            color: '#1f2937',
                            borderColor: 'var(--border)'
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          Precio Unit.
                        </label>
                        <input
                          type="number"
                          value={item.precioUnitario}
                          onChange={(e) => handleItemChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border-2 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          min="0"
                          step="1"
                          placeholder="0"
                          style={{ 
                            backgroundColor: '#ffffff',
                            color: '#1f2937',
                            borderColor: 'var(--border)'
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                          Descuento %
                        </label>
                        <input
                          type="number"
                          value={item.descuento === undefined || item.descuento === null || item.descuento === 0 ? '' : item.descuento}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const parsed = raw === '' ? undefined : (parseFloat(raw) || 0);
                            handleItemChange(index, 'descuento', parsed);
                          }}
                          className="w-full px-3 py-2 rounded-lg border-2 transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          min="0"
                          step="1"
                          placeholder="0"
                          style={{ 
                            backgroundColor: '#ffffff',
                            color: '#1f2937',
                            borderColor: 'var(--border)'
                          }}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                            Subtotal
                          </label>
                          <input
                            type="text"
                            value={`$${item.subtotal.toLocaleString('es-CL')}`}
                            className="input w-full"
                            style={{ backgroundColor: 'var(--input-bg-disabled)', color: 'var(--text-primary)' }}
                            disabled
                            readOnly
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          title="Eliminar producto"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón agregar producto */}
              <button
                onClick={handleAddItem}
                className="w-full p-3 rounded-lg border-2 border-dashed hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <FiPlus className="w-4 h-4" />
                Agregar Producto
              </button>

              {/* Resumen */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      ${subtotal.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Descuentos:</span>
                    <span className="font-medium text-red-500">
                      -${descuentoTotal.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    Dirección de Despacho
                  </label>
                  <input
                    type="text"
                    value={despacho.direccion}
                    onChange={(e) => setDespacho({ ...despacho, direccion: e.target.value })}
                    className="input w-full"
                    placeholder="Ingrese la dirección de despacho"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={despacho.ciudad}
                    onChange={(e) => setDespacho({ ...despacho, ciudad: e.target.value })}
                    className="input w-full"
                    placeholder="Ciudad"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    Comuna
                  </label>
                  <input
                    type="text"
                    value={despacho.comuna}
                    onChange={(e) => setDespacho({ ...despacho, comuna: e.target.value })}
                    className="input w-full"
                    placeholder="Comuna"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    Fecha Estimada
                  </label>
                  <input
                    type="date"
                    value={despacho.fechaEstimada || ''}
                    onChange={(e) => setDespacho({ ...despacho, fechaEstimada: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    Costo Despacho
                  </label>
                  <input
                    type="number"
                    value={despacho.costoDespacho || 0}
                    onChange={(e) => setDespacho({ ...despacho, costoDespacho: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                    min="0"
                    step="1000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    Observaciones
                  </label>
                  <textarea
                    value={despacho.observaciones || ''}
                    onChange={(e) => setDespacho({ ...despacho, observaciones: e.target.value })}
                    className="input w-full"
                    rows={3}
                    placeholder="Observaciones adicionales del despacho"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t sticky bottom-0 z-10" 
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: 'var(--text-primary)',
              opacity: saving ? 0.5 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            style={{ 
              opacity: saving || items.length === 0 ? 0.5 : 1,
              cursor: saving || items.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Product Selector Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowProductModal(false)}>
          <div 
            className="relative w-full max-w-4xl max-h-[80vh] rounded-lg shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 z-10" 
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FiPackage className="w-5 h-5" />
                Seleccionar Producto del Catálogo
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiX className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4">
              {loadingProducts ? (
                <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  Cargando productos...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products
                    .filter(p => 
                      searchTerm === '' || 
                      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleAddProductFromCatalog(product)}
                        className="p-4 rounded-lg border text-left hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
                        style={{ 
                          borderColor: 'var(--border)', 
                          backgroundColor: 'var(--bg-secondary)' 
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {product.nombre}
                            </h4>
                            {product.sku && (
                              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                SKU: {product.sku}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 rounded" 
                                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                                {product.unidad}
                              </span>
                              {product.tipo?.nombre && (
                                <span className="text-xs px-2 py-1 rounded"
                                  style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}>
                                  {product.tipo.nombre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600">
                              ${(product.precio_venta_neto || 0).toLocaleString('es-CL')}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              + IVA
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
              
              {!loadingProducts && products.filter(p => 
                searchTerm === '' || 
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
              ).length === 0 && (
                <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  No se encontraron productos
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
