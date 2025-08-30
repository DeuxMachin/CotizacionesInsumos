"use client";

import React, { useState } from 'react';
import { 
  FiX, 
  FiSave,
  FiUser,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiSearch
} from 'react-icons/fi';
import { 
  Quote, 
  ClientInfo, 
  QuoteItem, 
  CommercialTerms, 
  DeliveryInfo,
  QuoteAmountCalculator
} from '@/core/domain/quote/Quote';
import { useQuotes } from '../model/useQuotes';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Productos de ejemplo para el autocompletado
const sampleProducts = [
  { codigo: 'CEM-001', descripcion: 'Cemento Portland 25kg', unidad: 'Saco', precio: 8500 },
  { codigo: 'ARE-001', descripcion: 'Arena Lavada m3', unidad: 'm3', precio: 15000 },
  { codigo: 'LAD-001', descripcion: 'Ladrillo Princesa 18x14x29cm', unidad: 'Unidad', precio: 450 },
  { codigo: 'GRA-001', descripcion: 'Gravilla 20mm m3', unidad: 'm3', precio: 18000 },
  { codigo: 'FIE-001', descripcion: 'Fierro 8mm x 6mts', unidad: 'Varilla', precio: 12500 },
  { codigo: 'BLO-001', descripcion: 'Bloque 20x20x40cm', unidad: 'Unidad', precio: 1200 },
];

export function CreateQuoteModal({ isOpen, onClose }: CreateQuoteModalProps) {
  const { crearCotizacion, userId, userName } = useQuotes();
  
  // Estado del formulario
  const [clienteData, setClienteData] = useState<ClientInfo>({
    razonSocial: '',
    rut: '',
    nombreFantasia: '',
    giro: '',
    direccion: '',
    ciudad: '',
    comuna: '',
    telefono: '',
    email: '',
    nombreContacto: '',
    telefonoContacto: ''
  });

  const [items, setItems] = useState<QuoteItem[]>([]);
  
  const [despachoData, setDespachoData] = useState<DeliveryInfo>({
    direccion: '',
    ciudad: '',
    comuna: '',
    fechaEstimada: '',
    costoDespacho: 0,
    observaciones: ''
  });

  const [condicionesData, setCondicionesData] = useState<CommercialTerms>({
    validezOferta: 30,
    formaPago: '30 días fecha factura',
    tiempoEntrega: '15 días hábiles',
    garantia: '',
    observaciones: ''
  });

  const [notas, setNotas] = useState('');
  const [currentTab, setCurrentTab] = useState<'cliente' | 'items' | 'despacho' | 'condiciones'>('cliente');
  const [isLoading, setIsLoading] = useState(false);

  // Estado para agregar items
  const [newItem, setNewItem] = useState({
    codigo: '',
    descripcion: '',
    unidad: '',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0
  });
  const [showProductSearch, setShowProductSearch] = useState(false);

  if (!isOpen) return null;

  // Calcular totales
  const calcularTotales = () => {
    return QuoteAmountCalculator.calculateQuoteTotals(items, despachoData.costoDespacho);
  };

  const totales = calcularTotales();

  // Manejar cambios en cliente
  const handleClienteChange = (field: keyof ClientInfo, value: string) => {
    setClienteData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambios en despacho
  const handleDespachoChange = (field: keyof DeliveryInfo, value: string | number) => {
    setDespachoData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambios en condiciones
  const handleCondicionesChange = (field: keyof CommercialTerms, value: string | number) => {
    setCondicionesData(prev => ({ ...prev, [field]: value }));
  };

  // Agregar item
  const handleAgregarItem = () => {
    if (!newItem.codigo || !newItem.descripcion || !newItem.unidad || newItem.cantidad <= 0 || newItem.precioUnitario <= 0) {
      alert('Por favor complete todos los campos obligatorios del item');
      return;
    }

    const subtotal = QuoteAmountCalculator.calculateItemSubtotal(
      newItem.cantidad, 
      newItem.precioUnitario, 
      newItem.descuento
    );

    const item: QuoteItem = {
      id: `item-${Date.now()}`,
      ...newItem,
      subtotal
    };

    setItems(prev => [...prev, item]);
    
    // Limpiar formulario
    setNewItem({
      codigo: '',
      descripcion: '',
      unidad: '',
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0
    });
    setShowProductSearch(false);
  };

  // Eliminar item
  const handleEliminarItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Seleccionar producto del catálogo
  const handleSeleccionarProducto = (producto: typeof sampleProducts[0]) => {
    setNewItem({
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      unidad: producto.unidad,
      cantidad: 1,
      precioUnitario: producto.precio,
      descuento: 0
    });
    setShowProductSearch(false);
  };

  // Guardar cotización
  const handleGuardar = async () => {
    // Validaciones básicas
    if (!clienteData.razonSocial || !clienteData.rut) {
      alert('Por favor complete la información básica del cliente');
      setCurrentTab('cliente');
      return;
    }

    if (items.length === 0) {
      alert('Debe agregar al menos un item a la cotización');
      setCurrentTab('items');
      return;
    }

    if (!userId || !userName) {
      alert('Error: información de usuario no disponible');
      return;
    }

    setIsLoading(true);
    
    try {
      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + condicionesData.validezOferta);

      const nuevaCotizacion: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'> = {
        cliente: clienteData,
        estado: 'borrador',
        vendedorId: userId,
        vendedorNombre: userName,
        items,
        despacho: despachoData.direccion ? despachoData : undefined,
        condicionesComerciales: condicionesData,
        subtotal: totales.subtotal,
        descuentoTotal: totales.descuentoTotal,
        iva: totales.iva,
        total: totales.total,
        notas: notas || undefined,
        fechaExpiracion: fechaExpiracion.toISOString().split('T')[0]
      };

      const success = await crearCotizacion(nuevaCotizacion);
      
      if (success) {
        onClose();
        // Reset form
        setClienteData({
          razonSocial: '',
          rut: '',
          nombreFantasia: '',
          giro: '',
          direccion: '',
          ciudad: '',
          comuna: '',
          telefono: '',
          email: '',
          nombreContacto: '',
          telefonoContacto: ''
        });
        setItems([]);
        setDespachoData({
          direccion: '',
          ciudad: '',
          comuna: '',
          fechaEstimada: '',
          costoDespacho: 0,
          observaciones: ''
        });
        setNotas('');
        setCurrentTab('cliente');
      } else {
        alert('Error al crear la cotización');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear la cotización');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount: number): string => {
    return QuoteAmountCalculator.formatCurrency(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <div 
          className="inline-block w-full max-w-6xl my-8 text-left align-middle transition-all transform shadow-xl rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)' }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Nueva Cotización
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Crear una nueva cotización para un cliente
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGuardar}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {isLoading ? 'Guardando...' : 'Guardar Cotización'}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiX className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div 
            className="flex border-b"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
          >
            {[
              { id: 'cliente', label: 'Cliente', icon: FiUser },
              { id: 'items', label: 'Items', icon: FiPackage },
              { id: 'despacho', label: 'Despacho', icon: FiMapPin },
              { id: 'condiciones', label: 'Condiciones', icon: FiSave }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                    isActive ? 'border-blue-500' : 'border-transparent'
                  }`}
                  style={{
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--primary-bg)' : 'transparent'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'items' && items.length > 0 && (
                    <span 
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    >
                      {items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Información del Cliente */}
            {currentTab === 'cliente' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Información del Cliente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      value={clienteData.razonSocial}
                      onChange={(e) => handleClienteChange('razonSocial', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Ingrese la razón social"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      RUT *
                    </label>
                    <input
                      type="text"
                      value={clienteData.rut}
                      onChange={(e) => handleClienteChange('rut', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="12.345.678-9"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Nombre Fantasía
                    </label>
                    <input
                      type="text"
                      value={clienteData.nombreFantasia}
                      onChange={(e) => handleClienteChange('nombreFantasia', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Nombre comercial"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Giro
                    </label>
                    <input
                      type="text"
                      value={clienteData.giro}
                      onChange={(e) => handleClienteChange('giro', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Actividad económica"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={clienteData.direccion}
                      onChange={(e) => handleClienteChange('direccion', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={clienteData.ciudad}
                      onChange={(e) => handleClienteChange('ciudad', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Ciudad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Comuna
                    </label>
                    <input
                      type="text"
                      value={clienteData.comuna}
                      onChange={(e) => handleClienteChange('comuna', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Comuna"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={clienteData.telefono}
                      onChange={(e) => handleClienteChange('telefono', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={clienteData.email}
                      onChange={(e) => handleClienteChange('email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="email@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Nombre Contacto
                    </label>
                    <input
                      type="text"
                      value={clienteData.nombreContacto}
                      onChange={(e) => handleClienteChange('nombreContacto', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Teléfono Contacto
                    </label>
                    <input
                      type="text"
                      value={clienteData.telefonoContacto}
                      onChange={(e) => handleClienteChange('telefonoContacto', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            {currentTab === 'items' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Items de la Cotización
                  </h3>
                  <button
                    onClick={() => setShowProductSearch(!showProductSearch)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Agregar Item
                  </button>
                </div>

                {/* Búsqueda de productos */}
                {showProductSearch && (
                  <div 
                    className="p-4 rounded-lg border"
                    style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                  >
                    <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                      Buscar Producto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                      {sampleProducts.map(producto => (
                        <button
                          key={producto.codigo}
                          onClick={() => handleSeleccionarProducto(producto)}
                          className="p-3 text-left rounded border hover:bg-blue-50 transition-colors"
                          style={{ 
                            backgroundColor: 'var(--bg-primary)', 
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <div className="font-medium text-sm">{producto.codigo}</div>
                          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                            {producto.descripcion}
                          </div>
                          <div className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                            {formatMoney(producto.precio)} / {producto.unidad}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      O ingrese manualmente el producto en el formulario inferior
                    </div>
                  </div>
                )}

                {/* Formulario para agregar item */}
                <div 
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Código *
                      </label>
                      <input
                        type="text"
                        value={newItem.codigo}
                        onChange={(e) => setNewItem(prev => ({ ...prev, codigo: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="CEM-001"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Descripción *
                      </label>
                      <input
                        type="text"
                        value={newItem.descripcion}
                        onChange={(e) => setNewItem(prev => ({ ...prev, descripcion: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Descripción del producto"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={newItem.cantidad}
                        onChange={(e) => setNewItem(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Unidad *
                      </label>
                      <input
                        type="text"
                        value={newItem.unidad}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unidad: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Unidad"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Precio Unit. *
                      </label>
                      <input
                        type="number"
                        value={newItem.precioUnitario}
                        onChange={(e) => setNewItem(prev => ({ ...prev, precioUnitario: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Descuento (%)
                      </label>
                      <input
                        type="number"
                        value={newItem.descuento}
                        onChange={(e) => setNewItem(prev => ({ ...prev, descuento: parseInt(e.target.value) || 0 }))}
                        className="w-24 px-3 py-2 border rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                        min="0"
                        max="100"
                      />
                    </div>
                    
                    <button
                      onClick={handleAgregarItem}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Lista de items */}
                {items.length > 0 && (
                  <div 
                    className="rounded-lg overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead style={{ backgroundColor: 'var(--bg-primary)' }}>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Código
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Descripción
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Cant.
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Unidad
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Precio
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Desc.
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Subtotal
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {item.codigo}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                                {item.descripcion}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                                {item.cantidad.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center" style={{ color: 'var(--text-primary)' }}>
                                {item.unidad}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right" style={{ color: 'var(--text-primary)' }}>
                                {formatMoney(item.precioUnitario)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600">
                                {item.descuento ? `${item.descuento}%` : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
                                {formatMoney(item.subtotal)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleEliminarItem(item.id)}
                                  className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Eliminar item"
                                >
                                  <FiTrash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totales */}
                    <div 
                      className="px-4 py-3 border-t"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <div className="flex justify-end">
                        <div className="text-right space-y-1">
                          <div className="flex justify-between gap-8">
                            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatMoney(totales.subtotal)}
                            </span>
                          </div>
                          {totales.descuentoTotal > 0 && (
                            <div className="flex justify-between gap-8 text-green-600">
                              <span>Descuento:</span>
                              <span>-{formatMoney(totales.descuentoTotal)}</span>
                            </div>
                          )}
                          <div className="flex justify-between gap-8">
                            <span style={{ color: 'var(--text-secondary)' }}>IVA (19%):</span>
                            <span style={{ color: 'var(--text-primary)' }}>{formatMoney(totales.iva)}</span>
                          </div>
                          <div className="flex justify-between gap-8 text-lg font-bold pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                            <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{formatMoney(totales.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Información de Despacho */}
            {currentTab === 'despacho' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Información de Despacho (Opcional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Dirección de Despacho
                    </label>
                    <input
                      type="text"
                      value={despachoData.direccion}
                      onChange={(e) => handleDespachoChange('direccion', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Dirección de entrega"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={despachoData.ciudad}
                      onChange={(e) => handleDespachoChange('ciudad', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Ciudad"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Comuna
                    </label>
                    <input
                      type="text"
                      value={despachoData.comuna}
                      onChange={(e) => handleDespachoChange('comuna', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Comuna"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Fecha Estimada de Entrega
                    </label>
                    <input
                      type="date"
                      value={despachoData.fechaEstimada}
                      onChange={(e) => handleDespachoChange('fechaEstimada', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Costo de Despacho
                    </label>
                    <input
                      type="number"
                      value={despachoData.costoDespacho}
                      onChange={(e) => handleDespachoChange('costoDespacho', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Observaciones de Despacho
                    </label>
                    <textarea
                      value={despachoData.observaciones}
                      onChange={(e) => handleDespachoChange('observaciones', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Instrucciones especiales para el despacho"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Condiciones Comerciales */}
            {currentTab === 'condiciones' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Condiciones Comerciales
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Forma de Pago
                    </label>
                    <select
                      value={condicionesData.formaPago}
                      onChange={(e) => handleCondicionesChange('formaPago', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="Contado">Contado</option>
                      <option value="30 días fecha factura">30 días fecha factura</option>
                      <option value="60 días fecha factura">60 días fecha factura</option>
                      <option value="90 días fecha factura">90 días fecha factura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Tiempo de Entrega
                    </label>
                    <input
                      type="text"
                      value={condicionesData.tiempoEntrega}
                      onChange={(e) => handleCondicionesChange('tiempoEntrega', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="15 días hábiles"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Validez de la Oferta (días)
                    </label>
                    <input
                      type="number"
                      value={condicionesData.validezOferta}
                      onChange={(e) => handleCondicionesChange('validezOferta', parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Garantía
                    </label>
                    <input
                      type="text"
                      value={condicionesData.garantia}
                      onChange={(e) => handleCondicionesChange('garantia', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="6 meses por defectos de fabricación"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Observaciones Comerciales
                    </label>
                    <textarea
                      value={condicionesData.observaciones}
                      onChange={(e) => handleCondicionesChange('observaciones', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Condiciones adicionales o aclaraciones"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Notas Adicionales
                    </label>
                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Notas adicionales para la cotización"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con resumen de totales */}
          {items.length > 0 && (
            <div 
              className="px-6 py-4 border-t"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex justify-between items-center">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {items.length} item{items.length !== 1 ? 's' : ''} agregado{items.length !== 1 ? 's' : ''}
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Total de la cotización:
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatMoney(totales.total)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
