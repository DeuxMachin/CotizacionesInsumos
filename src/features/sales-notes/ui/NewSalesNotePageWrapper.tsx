"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiTruck,
  FiPackage,
  FiDollarSign,
  FiChevronRight,
  FiAlertCircle,
  FiChevronLeft,
  FiPlus,
  FiCopy
} from 'react-icons/fi';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import { useAuth } from '@/contexts/AuthContext';
import { NotasVentaService } from '@/services/notasVentaService';
import dynamic from 'next/dynamic';

const ClientForm = dynamic(() => import('@/features/quotes/ui/components/ClientFormNew').then(m => m.ClientForm), { ssr: false });
const ProductsForm = dynamic(() => import('@/features/quotes/ui/components/ProductsForm').then(m => m.ProductsForm), { ssr: false });
const DeliveryForm = dynamic(() => import('@/features/quotes/ui/components/DeliveryForm').then(m => m.DeliveryForm), { ssr: false });

import { ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';

type FormStep = 'client' | 'products' | 'delivery' | 'commercial' | 'summary';

type StepConfig = {
  id: FormStep;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  required: boolean;
  color: string;
};

interface FormData {
  cliente: Partial<ClientInfo>;
  items: QuoteItem[];
  despacho: Partial<DeliveryInfo>;
  condicionesComerciales: Partial<CommercialTerms>;
  numeroOrdenCompra?: string;
  observacionesComerciales?: string;
  estado: 'creada' | 'factura_parcial' | 'facturada' | 'cancelada';
}

const STEPS: StepConfig[] = [
  {
    id: 'client',
    label: 'Cliente',
    description: 'Selecciona o ingresa los datos del cliente',
    icon: FiUser,
    required: true,
    color: '#2563EB'
  },
  {
    id: 'products',
    label: 'Productos',
    description: 'Agrega los productos a la nota',
    icon: FiPackage,
    required: true,
    color: '#059669'
  },
  {
    id: 'commercial',
    label: 'Condiciones',
    description: 'Configura condiciones comerciales y orden de compra',
    icon: FiDollarSign,
    required: true,
    color: '#D97706'
  },
  {
    id: 'delivery',
    label: 'Despacho',
    description: 'Configura la dirección y costo de envío (opcional)',
    icon: FiTruck,
    required: false,
    color: '#7C3AED'
  },
  {
    id: 'summary',
    label: 'Resumen',
    description: 'Revisa y confirma la nota de venta completa',
    icon: FiDollarSign,
    required: true,
    color: '#F59E0B'
  }
];

export function NewSalesNotePageWrapper() {
  const router = useRouter();
  const { formatMoney } = useQuotes();
  const { createHeaders } = useAuthHeaders();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<FormStep>('client');
  const [formData, setFormData] = useState<FormData>({
    cliente: {},
    items: [],
    despacho: {},
    condicionesComerciales: {
      validezOferta: 30,
      formaPago: 'Transferencia bancaria',
      tiempoEntrega: '7 días hábiles',
      garantia: '1 año'
    },
    numeroOrdenCompra: '',
    observacionesComerciales: '',
    estado: 'creada'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['client']));
  const [showExistingOrdersModal, setShowExistingOrdersModal] = useState(false);
  const [existingOrders, setExistingOrders] = useState<Array<{ numero: string; id: number }>>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Calcular totales
  const calculateTotals = useCallback(() => {
    let subtotal = 0;
    let totalDescuento = 0;

    formData.items.forEach(item => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      subtotal += itemSubtotal;
      const descuentoItem = (itemSubtotal * (item.descuento || 0)) / 100;
      totalDescuento += descuentoItem;
    });

    const subtotalNeto = subtotal - totalDescuento;
    const iva = subtotalNeto * 0.19;
    const total = subtotalNeto + iva;

    return { subtotal, totalDescuento, subtotalNeto, iva, total };
  }, [formData.items]);

  const validateStep = (step: FormStep): string[] => {
    const stepErrors: string[] = [];

    switch (step) {
      case 'client':
        if (!formData.cliente.razonSocial) stepErrors.push('Razón social es requerida');
        if (!formData.cliente.rut) stepErrors.push('RUT es requerido');
        if (!formData.cliente.direccion) stepErrors.push('Dirección es requerida');
        break;
      case 'products':
        if (formData.items.length === 0) stepErrors.push('Debe agregar al menos un producto');
        break;
      case 'commercial':
        if (!formData.numeroOrdenCompra) stepErrors.push('Número de orden de compra es requerido');
        if (!formData.condicionesComerciales.formaPago) stepErrors.push('Forma de pago es requerida');
        break;
      case 'summary':
        const clientErrors = validateStep('client');
        const productErrors = validateStep('products');
        const commercialErrors = validateStep('commercial');
        stepErrors.push(...clientErrors, ...productErrors, ...commercialErrors);
        break;
    }

    return stepErrors;
  };

  const isStepValid = (step: FormStep): boolean => {
    return validateStep(step).length === 0;
  };

  const isStepCompleted = (step: FormStep): boolean => {
    if (!visitedSteps.has(step)) return false;
    return isStepValid(step);
  };

  const goToStep = (step: FormStep) => {
    if (validateStep(currentStep).length === 0) {
      setCurrentStep(step);
      setVisitedSteps(prev => new Set(prev).add(step));
    } else {
      setError(`Por favor completa el paso actual antes de continuar`);
    }
  };

  const handleLoadExistingOrders = async () => {
    try {
      setLoadingOrders(true);
      const notes = await NotasVentaService.getAll();
      const orders = notes
        .filter(note => note.Numero_Serie)
        .map(note => ({
          numero: note.Numero_Serie || '',
          id: note.id
        }))
        .filter((order, index, self) => self.findIndex(o => o.numero === order.numero) === index);

      setExistingOrders(orders);
      setShowExistingOrdersModal(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar órdenes existentes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCopyOrderNumber = (numero: string) => {
    setFormData(prev => ({
      ...prev,
      numeroOrdenCompra: numero
    }));
    setShowExistingOrdersModal(false);
  };

  const handleCreateSalesNote = async () => {
    try {
      setLoading(true);
      setError(null);

      const errors = validateStep('summary');
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      const totals = calculateTotals();

      const salesNoteData = {
        Numero_Serie: formData.numeroOrdenCompra,
        cliente_rut: formData.cliente.rut,
        cliente_razon_social: formData.cliente.razonSocial,
        cliente_giro: formData.cliente.giro,
        cliente_direccion: formData.cliente.direccion,
        cliente_comuna: formData.cliente.comuna,
        cliente_ciudad: formData.cliente.ciudad,
        subtotal: totals.subtotal,
        descuento_lineas_monto: 0,
        descuento_global_monto: totals.totalDescuento,
        descuento_total: totals.totalDescuento,
        subtotal_neto_post_desc: totals.subtotalNeto,
        iva_pct: 19,
        iva_monto: totals.iva,
        total: totals.total,
        forma_pago_final: formData.condicionesComerciales.formaPago,
        plazo_pago: formData.condicionesComerciales.tiempoEntrega,
        observaciones_comerciales: formData.observacionesComerciales,
        direccion_despacho: formData.despacho.direccion,
        comuna_despacho: formData.despacho.comuna,
        ciudad_despacho: formData.despacho.ciudad,
        costo_despacho: formData.despacho.costoDespacho || 0,
        fecha_estimada_entrega: formData.despacho.fechaEstimada,
        fecha_emision: new Date().toISOString().split('T')[0],
        estado: formData.estado as 'creada' | 'factura_parcial' | 'facturada' | 'cancelada',
        vendedor_id: user?.id,
        cotizacion_id: null
      };

      const items = formData.items.map(item => ({
        producto_id: item.productId || null,
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precio_unitario_neto: item.precioUnitario,
        descuento_pct: item.descuento || 0,
        descuento_monto: (item.cantidad * item.precioUnitario * (item.descuento || 0)) / 100,
        iva_aplicable: true,
        subtotal_neto: item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100),
        total_neto: item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100),
        cantidad_facturada: 0
      }));

      await NotasVentaService.create(salesNoteData, items);
      router.push('/dashboard/notas-venta');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const renderStepContent = () => {
    switch (currentStep) {
      case 'client':
        return (
          <ClientForm
            data={formData.cliente}
            onChange={(cliente) => setFormData(prev => ({ ...prev, cliente }))}
          />
        );

      case 'products':
        return (
          <ProductsForm
            items={formData.items}
            onChange={(items) => setFormData(prev => ({ ...prev, items }))}
          />
        );

      case 'commercial':
        return (
          <div className="space-y-6">
            {/* Número de Orden de Compra */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Número de Orden de Compra
                </h3>
                <button
                  onClick={handleLoadExistingOrders}
                  disabled={loadingOrders}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'white'
                  }}
                >
                  <FiCopy className="w-4 h-4" />
                  {loadingOrders ? 'Cargando...' : 'Copiar Existente'}
                </button>
              </div>
              <input
                type="text"
                value={formData.numeroOrdenCompra || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroOrdenCompra: e.target.value }))}
                placeholder="Ej: OC-2025-001"
                className="w-full px-4 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Condiciones Comerciales */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Condiciones Comerciales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Forma de Pago
                  </label>
                  <input
                    type="text"
                    value={formData.condicionesComerciales.formaPago || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, formaPago: e.target.value }
                    }))}
                    placeholder="Ej: Transferencia bancaria"
                    className="w-full px-4 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Plazo de Pago
                  </label>
                  <input
                    type="text"
                    value={formData.condicionesComerciales.tiempoEntrega || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, tiempoEntrega: e.target.value }
                    }))}
                    placeholder="Ej: 7 días hábiles"
                    className="w-full px-4 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Validez de Oferta (días)
                  </label>
                  <input
                    type="number"
                    value={formData.condicionesComerciales.validezOferta || 30}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, validezOferta: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Garantía
                  </label>
                  <input
                    type="text"
                    value={formData.condicionesComerciales.garantia || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, garantia: e.target.value }
                    }))}
                    placeholder="Ej: 1 año"
                    className="w-full px-4 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Observaciones Comerciales
              </label>
              <textarea
                value={formData.observacionesComerciales || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observacionesComerciales: e.target.value }))}
                placeholder="Agregar observaciones si es necesario..."
                className="w-full px-4 py-2 rounded border"
                rows={4}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        );

      case 'delivery':
        return (
          <DeliveryForm
            data={formData.despacho}
            onChange={(despacho) => setFormData(prev => ({ ...prev, despacho }))}
          />
        );

      case 'summary':
        return (
          <div className="space-y-6">
            {/* Resumen Cliente */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Razón Social</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.cliente.razonSocial}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>RUT</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.cliente.rut}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Dirección</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formData.cliente.direccion}</p>
                </div>
              </div>
            </div>

            {/* Resumen Productos */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Productos ({formData.items.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                        Producto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                        Precio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{item.descripcion}</td>
                        <td className="px-4 py-3 text-center" style={{ color: 'var(--text-primary)' }}>{item.cantidad}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-primary)' }}>
                          {formatMoney(item.precioUnitario)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--primary)' }}>
                          {formatMoney(item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen Totales */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Resumen Financiero
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatMoney(totals.subtotal)}</span>
                </div>
                {totals.totalDescuento > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Descuento</span>
                    <span style={{ color: 'var(--error)' }}>-{formatMoney(totals.totalDescuento)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal Neto</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatMoney(totals.subtotalNeto)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>IVA (19%)</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatMoney(totals.iva)}</span>
                </div>
                <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between font-semibold text-lg">
                    <span style={{ color: 'var(--text-primary)' }}>Total</span>
                    <span style={{ color: 'var(--primary)' }}>{formatMoney(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:opacity-70 transition"
              >
                <FiArrowLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
              </button>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Crear Nota de Venta
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Crea una nueva nota de venta sin necesidad de una cotización
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div
            className="mb-6 p-4 rounded-lg flex items-start gap-3 border"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'var(--error)',
              color: 'var(--error)'
            }}
          >
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Pasos */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h3 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--text-secondary)' }}>
                Pasos
              </h3>
              <div className="space-y-3">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id);
                  const canAccess = index === 0 || visitedSteps.has(STEPS[index - 1].id);

                  return (
                    <button
                      key={step.id}
                      onClick={() => canAccess && goToStep(step.id)}
                      disabled={!canAccess}
                      className="w-full text-left p-4 rounded-lg transition border"
                      style={{
                        backgroundColor: isActive ? 'var(--primary)' : isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'var(--card-bg)',
                        borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                        opacity: canAccess ? 1 : 0.5,
                        cursor: canAccess ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className="w-5 h-5 mt-1 flex-shrink-0"
                          style={{ color: isActive ? 'white' : 'var(--text-primary)' }}
                        />
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: isActive ? 'white' : 'var(--text-primary)' }}
                          >
                            {step.label}
                            {step.required && <span className="ml-1" style={{ color: 'var(--error)' }}>*</span>}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 mt-8">
              <button
                onClick={() => {
                  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
                  if (currentIndex > 0) {
                    goToStep(STEPS[currentIndex - 1].id);
                  }
                }}
                disabled={currentStep === STEPS[0].id}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)'
                }}
              >
                <FiChevronLeft className="w-5 h-5" />
                Anterior
              </button>

              {currentStep === STEPS[STEPS.length - 1].id ? (
                <button
                  onClick={handleCreateSalesNote}
                  disabled={loading || !isStepValid('summary')}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  style={{
                    backgroundColor: 'var(--success)',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FiSave className="w-5 h-5" />
                  {loading ? 'Creando...' : 'Crear Nota de Venta'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
                    if (currentIndex < STEPS.length - 1) {
                      goToStep(STEPS[currentIndex + 1].id);
                    }
                  }}
                  disabled={!isStepValid(currentStep)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  style={{
                    backgroundColor: !isStepValid(currentStep) ? 'var(--bg-secondary)' : 'var(--primary)',
                    cursor: !isStepValid(currentStep) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Siguiente
                  <FiChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Órdenes Existentes */}
      {showExistingOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-lg shadow-lg max-w-md w-full p-6"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Órdenes de Compra Existentes
            </h2>
            {existingOrders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No hay órdenes de compra disponibles</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {existingOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleCopyOrderNumber(order.numero)}
                    className="w-full text-left p-3 rounded border hover:bg-opacity-50 transition"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{order.numero}</span>
                      <FiCopy className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowExistingOrdersModal(false)}
              className="w-full mt-4 px-4 py-2 rounded font-medium"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
