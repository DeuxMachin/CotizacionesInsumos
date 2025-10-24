"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  FiCopy,
  FiX,
  FiXCircle,
  FiEdit3,
  FiInfo,
  FiCheck,
  FiTool
} from 'react-icons/fi';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import { useAuth } from '@/contexts/AuthContext';
import { NotasVentaService } from '@/services/notasVentaService';
import { useObras } from '@/features/obras/model/useObras';
import { Obra } from '@/features/obras/types/obras';
import dynamic from 'next/dynamic';

import { AddressAutocomplete } from '@/features/quotes/ui/components/AddressAutocomplete';
import { ClientAutocomplete } from '@/features/quotes/ui/components/ClientAutocomplete';

const ProductsForm = dynamic(() => import('@/features/quotes/ui/components/ProductsForm').then(m => m.ProductsForm), { ssr: false });
const SalesNoteSummary = dynamic(() => import('@/features/sales-notes/ui/components/SalesNoteSummary').then(m => m.SalesNoteSummary), { ssr: false });

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
  sinOrdenCompra?: boolean;
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

export function NewSalesNotePage({ obraId }: { obraId?: string } = {}) {
  const router = useRouter();
  const { formatMoney } = useQuotes();
  const { } = useAuthHeaders();
  const { user } = useAuth();
  const { obtenerObra } = useObras();

  // Estado para obra cuando viene desde una obra específica
  const [obra, setObra] = useState<Obra | null>(null);

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
    sinOrdenCompra: false,
    observacionesComerciales: '',
    estado: 'creada'
  });

  const [loading, setLoading] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['client']));
  const [showExistingOrdersModal, setShowExistingOrdersModal] = useState(false);
  const [existingOrders, setExistingOrders] = useState<Array<{ numero: string; id: number }>>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingObra, setLoadingObra] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<FormStep, string[]>>({ client: [], products: [], commercial: [], delivery: [], summary: [] });

  // Cargar datos de la obra si obraId está presente
  useEffect(() => {
    if (!obraId) return;

    const fetchObra = async () => {
      try {
        setLoadingObra(true);
        const obraData = await obtenerObra(obraId);
        if (!obraData) {
          console.error('Obra no encontrada');
          router.push('/dashboard/notas-venta/crear');
          return;
        }

        setObra(obraData);

        // Pre-llenar datos del cliente basado en la obra
        const clienteData: Partial<ClientInfo> = {
          razonSocial: obraData.constructora.nombre,
          rut: obraData.constructora.rut,
          giro: 'Construcción',
          direccion: obraData.constructora.direccion || obraData.direccionObra,
          ciudad: obraData.ciudad || 'Santiago',
          comuna: obraData.comuna || 'Santiago',
          telefono: obraData.constructora.telefono,
          email: obraData.constructora.email,
          nombreContacto: obraData.constructora.contactoPrincipal.nombre,
          telefonoContacto: obraData.constructora.contactoPrincipal.telefono
        };

        // Pre-llenar datos de despacho si tenemos dirección de obra
        const despachoData: Partial<DeliveryInfo> = obraData.direccionObra ? {
          direccion: obraData.direccionObra,
          ciudad: obraData.ciudad || 'Santiago',
          comuna: obraData.comuna || 'Santiago',
          observaciones: `Entrega en obra: ${obraData.nombreEmpresa}`
        } : {};

        setFormData(prev => ({
          ...prev,
          cliente: clienteData,
          despacho: despachoData
        }));

      } catch (error) {
        console.error('Error al cargar la obra:', error);
        router.push('/dashboard/notas-venta/crear');
      } finally {
        setLoadingObra(false);
      }
    };

    fetchObra();
  }, [obraId, obtenerObra, router]);

  // Estado para autocompletado de clientes
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [rutSearch, setRutSearch] = useState('');
  const [razonSocialSearch, setRazonSocialSearch] = useState('');

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

    return { 
      subtotal, 
      descuentoTotal: totalDescuento, 
      subtotalNeto, 
      iva, 
      total,
      lineDiscountTotal: totalDescuento,
      globalDiscountAmount: 0
    };
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
        if (!formData.sinOrdenCompra && !formData.numeroOrdenCompra) stepErrors.push('Número de orden de compra es requerido');
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
      numeroOrdenCompra: numero,
      sinOrdenCompra: false
    }));
    setShowExistingOrdersModal(false);
  };

  const handleSinOrdenCompra = () => {
    setFormData(prev => ({
      ...prev,
      numeroOrdenCompra: 'SIN OC',
      sinOrdenCompra: true
    }));
  };

  // Funciones para autocompletado de clientes
  const handleClientSelect = (clientData: Partial<ClientInfo>) => {
    setFormData(prev => ({ ...prev, cliente: clientData }));
    setIsExistingClient(true);
    setShowManualForm(false);
    setRutSearch('');
    setRazonSocialSearch('');
  };

  const handleManualInput = () => {
    setIsExistingClient(false);
    setShowManualForm(true);
    if (!formData.cliente.razonSocial && !formData.cliente.rut) {
      setFormData(prev => ({ ...prev, cliente: {} }));
    }
  };

  const handleChangeClient = () => {
    // Volver a búsqueda de cliente
    setIsExistingClient(false);
    setShowManualForm(false);
    setFormData(prev => ({ ...prev, cliente: {} }));
  };

  const handleStepChange = (step: FormStep) => {
    // Solo validar si el usuario está tratando de avanzar a un paso posterior
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    const targetIndex = STEPS.findIndex(s => s.id === step);
    
    if (targetIndex > currentIndex) {
      // Validar paso actual antes de avanzar
      const currentErrors = validateStep(currentStep);
      if (currentErrors.length > 0 && STEPS.find(s => s.id === currentStep)?.required) {
        setErrors(prev => ({ ...prev, [currentStep]: currentErrors }));
        return;
      }
    }
    
    // Limpiar errores del paso anterior si es válido
    if (validateStep(currentStep).length === 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentStep];
        return newErrors;
      });
    }
    
    // Marcar el nuevo paso como visitado
    setVisitedSteps(prev => new Set([...prev, step]));
    setCurrentStep(step);
  };

  const handleNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      handleStepChange(STEPS[currentIndex + 1].id as FormStep);
    }
  };

  const handlePrevious = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      handleStepChange(STEPS[currentIndex - 1].id as FormStep);
    }
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
        descuento_global_monto: totals.descuentoTotal,
        descuento_total: totals.descuentoTotal,
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
        obra_id: obraId ? parseInt(obraId) : null,
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
          <div className="space-y-6">
     

            {/* Autocompletado de clientes existentes */}
            {!isExistingClient && !showManualForm && !formData.cliente.razonSocial && !formData.cliente.rut && (
              <div 
                className="p-6 rounded-xl border-2 border-dashed transition-all duration-200 hover:border-solid"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  borderColor: 'var(--accent-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--accent-bg)' }}
                  >
                    <FiUser className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ¿Es un cliente existente?
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Busca por RUT o razón social para autocompletar automáticamente
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      🔍 Buscar por RUT
                    </label>
                    <div className="relative">
                      <ClientAutocomplete
                        value={rutSearch}
                        field="rut"
                        placeholder="Ej: 12.345.678-9"
                        onClientSelect={handleClientSelect}
                        onValueChange={setRutSearch}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      🔍 Buscar por Razón Social
                    </label>
                    <div className="relative">
                      <ClientAutocomplete
                        value={razonSocialSearch}
                        field="razonSocial"
                        placeholder="Ej: Constructora ABC Ltda"
                        onClientSelect={handleClientSelect}
                        onValueChange={setRazonSocialSearch}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <FiInfo className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      ¿No encuentras al cliente en la base de datos?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleManualInput}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:shadow-md"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Ingresar datos manualmente
                  </button>
                </div>
              </div>
            )}

            {/* Mostrar datos del cliente seleccionado */}
            {isExistingClient && formData.cliente.razonSocial && (
              <div 
                className="p-4 rounded-lg border-2"
                style={{ 
                  backgroundColor: 'var(--success-bg)', 
                  borderColor: 'var(--success)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--success)' }}
                    >
                      <FiUser className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--success-text)' }}>
                        ✓ Cliente seleccionado: {formData.cliente.razonSocial}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Los datos han sido autocompletados automáticamente
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeClient}
                    className="text-sm underline hover:no-underline transition-all duration-200 px-3 py-1 rounded"
                    style={{ color: 'var(--success-text)', backgroundColor: 'transparent' }}
                  >
                    Cambiar cliente
                  </button>
                </div>
              </div>
            )}

            {/* Indicador de obra cuando viene desde una obra específica */}
            {obra && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <FiTool className="w-5 h-5" style={{ color: 'var(--info-text)' }} />
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--info-text)' }}>
                      Nota de venta para obra: {obra.nombreEmpresa}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Los datos del cliente han sido precompletos basados en la información de la obra
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario principal */}
            {(isExistingClient || showManualForm || formData.cliente.razonSocial || formData.cliente.rut) && (
              <div>
                {/* Indicador de modo manual */}
                {showManualForm && !isExistingClient && (
                  <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: 'var(--warning)', backgroundColor: 'var(--warning-bg)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--warning)' }}
                        >
                          <FiEdit3 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--warning-text)' }}>
                            ✏️ Ingresando datos manualmente
                          </span>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Completa todos los campos requeridos
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleChangeClient}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all duration-200 hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <FiUser className="w-4 h-4" />
                        Buscar cliente existente
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Razón Social */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Razón Social <span style={{ color: 'var(--danger-text)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cliente.razonSocial || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, razonSocial: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Ej: CONSTRUCTORA EXAMPLE SPA"
                    />
                  </div>

                  {/* RUT */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      RUT <span style={{ color: 'var(--danger-text)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cliente.rut || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, rut: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="12.345.678-9"
                    />
                  </div>

                  {/* Giro Comercial */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Giro Comercial
                    </label>
                    <input
                      type="text"
                      value={formData.cliente.giro || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, giro: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Ej: CONSTRUCCION"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Dirección <span style={{ color: 'var(--danger-text)' }}>*</span>
                    </label>
                    <AddressAutocomplete
                      value={formData.cliente.direccion || ''}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, direccion: value }
                      }))}
                      onAddressSelect={(addressData) => setFormData(prev => ({
                        ...prev,
                        cliente: {
                          ...prev.cliente,
                          direccion: addressData.direccion,
                          ciudad: addressData.ciudad || prev.cliente.ciudad,
                          comuna: addressData.comuna || prev.cliente.comuna
                        }
                      }))}
                      placeholder="Ej: Av. Providencia 1234, Oficina 567"
                      showCurrentLocation={true}
                    />
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.cliente.ciudad || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, ciudad: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Santiago"
                    />
                  </div>

                  {/* Comuna */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Comuna
                    </label>
                    <input
                      type="text"
                      value={formData.cliente.comuna || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, comuna: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Providencia"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Referencia de Orden de Compra
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Especifique el número de orden de compra del cliente o indique si no aplica
                  </p>
                </div>
              </div>

              {/* Opciones rápidas */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button
                    onClick={handleSinOrdenCompra}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200"
                    style={{
                      borderColor: formData.sinOrdenCompra ? 'var(--success)' : 'var(--border)',
                      backgroundColor: formData.sinOrdenCompra ? 'var(--success-bg)' : 'var(--card-bg)',
                      color: formData.sinOrdenCompra ? 'var(--success-text)' : 'var(--text-primary)'
                    }}
                  >
                    <FiX className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium">
                        Sin Orden de Compra
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Usar formato estándar
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleLoadExistingOrders}
                    disabled={loadingOrders}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200"
                    style={{
                      borderColor: 'var(--accent-primary)',
                      backgroundColor: formData.sinOrdenCompra ? 'var(--bg-secondary)' : 'var(--accent-bg)',
                      color: 'var(--accent-primary)',
                      opacity: formData.sinOrdenCompra ? 0.5 : 1
                    }}
                  >
                    <FiCopy className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium">
                        {loadingOrders ? 'Cargando...' : 'Copiar Existente'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Referenciar OC previa
                      </div>
                    </div>
                  </button>
                </div>

                {formData.sinOrdenCompra && (
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                    <div className="flex items-center gap-2">
                      <FiInfo className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--success-text)' }}>
                        ✓ Se usará el formato estándar &quot;SIN OC&quot; para esta nota de venta
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input manual */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Número de Orden de Compra <span className="text-xs text-gray-500">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.numeroOrdenCompra || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroOrdenCompra: e.target.value, sinOrdenCompra: false }))}
                    placeholder="Ej: OC-2025-001, PO-12345, etc."
                    className="w-full px-4 py-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    disabled={formData.sinOrdenCompra}
                  />
                  {formData.numeroOrdenCompra && !formData.sinOrdenCompra && formData.numeroOrdenCompra !== 'SIN OC' && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, numeroOrdenCompra: '', sinOrdenCompra: false }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:opacity-70 transition"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <FiXCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Ingrese el número de orden de compra proporcionado por el cliente
                </p>
              </div>
            </div>

            {/* Condiciones Comerciales */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Condiciones Comerciales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Forma de Pago <span style={{ color: 'var(--danger-text)' }}>*</span>
                  </label>
                  <select
                    value={formData.condicionesComerciales.formaPago || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, formaPago: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Seleccionar forma de pago</option>
                    <option value="Transferencia bancaria">Transferencia bancaria</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de débito">Tarjeta de débito</option>
                    <option value="30 días">Credito 30 días</option>
                    <option value="45 días">Credito 45 días</option>
                    <option value="60 días">Credito 60 días</option>
                    <option value="90 días">Credito 90 días</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Plazo de Entrega
                  </label>
                  <select
                    value={formData.condicionesComerciales.tiempoEntrega || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, tiempoEntrega: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Seleccionar plazo</option>
                    <option value="Inmediato">Inmediato</option>
                    <option value="24 horas">24 horas</option>
                    <option value="48 horas">48 horas</option>
                    <option value="3 días hábiles">3 días hábiles</option>
                    <option value="7 días hábiles">7 días hábiles</option>
                    <option value="15 días hábiles">15 días hábiles</option>
                    <option value="30 días hábiles">30 días hábiles</option>
                    <option value="A convenir">A convenir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Validez de Oferta (días)
                  </label>
                  <select
                    value={formData.condicionesComerciales.validezOferta || 30}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, validezOferta: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value={7}>7 días</option>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                    <option value={90}>90 días</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Garantía
                  </label>
                  <select
                    value={formData.condicionesComerciales.garantia || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      condicionesComerciales: { ...prev.condicionesComerciales, garantia: e.target.value }
                    }))}
                    className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Sin garantía</option>
                    <option value="3 meses">3 meses</option>
                    <option value="6 meses">6 meses</option>
                    <option value="1 año">1 año</option>
                    <option value="2 años">2 años</option>
                    <option value="3 años">3 años</option>
                    <option value="5 años">5 años</option>
                    <option value="A convenir">A convenir</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Observaciones Comerciales */}
            <div className="rounded-lg shadow-sm border p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-4">
                <FiInfo className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Observaciones y Notas Adicionales
                </h3>
              </div>
              <div>
                <textarea
                  value={formData.observacionesComerciales || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacionesComerciales: e.target.value }))}
                  placeholder="Agregue cualquier observación comercial relevante, condiciones especiales, términos específicos del cliente, etc."
                  className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2 resize-none"
                  rows={4}
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Estas observaciones aparecerán en la nota de venta final y pueden incluir términos especiales, condiciones particulares o información adicional relevante.
                </p>
              </div>
            </div>
          </div>
        );

      case 'delivery':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
              >
                <FiTruck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Información de Despacho
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Configure los detalles de entrega (opcional)
                </p>
              </div>
            </div>

            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--info-text)' }}>
                <strong>Nota:</strong> Esta información es opcional. Si no se especifica, se utilizará la dirección del cliente como dirección de entrega por defecto.
              </p>
            </div>

            <div className="space-y-6">
              {/* Dirección de entrega */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Dirección de Entrega
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Dirección de Despacho
                    </label>
                    <AddressAutocomplete
                      value={formData.despacho.direccion || ''}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        despacho: { ...prev.despacho, direccion: value }
                      }))}
                      onAddressSelect={(addressData) => setFormData(prev => ({
                        ...prev,
                        despacho: {
                          ...prev.despacho,
                          direccion: addressData.direccion,
                          ciudad: addressData.ciudad || prev.despacho.ciudad,
                          comuna: addressData.comuna || prev.despacho.comuna
                        }
                      }))}
                      placeholder="Dirección completa de entrega (opcional)"
                      showCurrentLocation={true}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Si no se especifica, se utilizará la dirección del cliente
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Comuna
                    </label>
                    <input
                      type="text"
                      value={formData.despacho.comuna || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        despacho: { ...prev.despacho, comuna: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Comuna de entrega"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.despacho.ciudad || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        despacho: { ...prev.despacho, ciudad: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Ciudad de entrega"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles de entrega */}
              <div 
                className="border-t pt-6"
                style={{ borderColor: 'var(--border)' }}
              >
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Detalles de Entrega
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Fecha Estimada de Entrega
                    </label>
                    <input
                      type="date"
                      value={formData.despacho.fechaEstimada || ''}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        despacho: { ...prev.despacho, fechaEstimada: e.target.value }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
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
                      min="0"
                      step="1000"
                      value={formData.despacho.costoDespacho || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        despacho: { ...prev.despacho, costoDespacho: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                      placeholder="0"
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Costo adicional por despacho (opcional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div 
                className="border-t pt-6"
                style={{ borderColor: 'var(--border)' }}
              >
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Instrucciones Especiales
                </label>
                <textarea
                  value={formData.despacho.observaciones || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    despacho: { ...prev.despacho, observaciones: e.target.value }
                  }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-offset-2 resize-none"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Instrucciones especiales para la entrega, horarios preferenciales, contacto en obra, etc."
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Información adicional que pueda ser útil para la entrega
                </p>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <SalesNoteSummary
            formData={formData}
            totals={totals}
            formatMoney={formatMoney}
            errors={errors.summary}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header Moderno */}
      <div className="shadow-sm border-b" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => obraId ? router.push(`/dashboard/obras/${obraId}`) : router.back()}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={obraId ? "Volver al detalle de obra" : "Volver a notas de venta"}
              >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {obraId ? 'Nueva Nota de Venta para Obra' : 'Nueva Nota de Venta'}
                </h1>
                {obra && (
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    {obra.nombreEmpresa} • {obra.constructora.nombre}
                  </p>
                )}
                {!obraId && (
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Crea una nota de venta paso a paso
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCreateSalesNote}
                disabled={loading || !isStepValid('summary')}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Crear Nota de Venta</span>
                <span className="inline sm:hidden">Crear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Progreso horizontal y compacto */}
        <div className="px-2 sm:px-4 lg:px-6">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Pasos de nota de venta</h3>
          </div>

          <div className="rounded-xl shadow-sm p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto max-w-full px-2 sm:px-4 lg:px-6 pb-2">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id);
                  const hasErrors = errors[step.id]?.length > 0;
                  const isAccessible = index === 0 || visitedSteps.has(STEPS[index - 1].id as FormStep);

                  return (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => isAccessible && handleStepChange(step.id as FormStep)}
                        disabled={!isAccessible}
                        className={`flex flex-col items-center justify-center px-2 sm:px-4 lg:px-6 py-1 rounded-md text-xs transition-all ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                        title={step.description}
                      >
                        <div
                          className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-full border-2 transition-all ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : isActive
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : hasErrors
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isCompleted ? (
                            <FiCheck className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                          ) : hasErrors ? (
                            <FiAlertCircle className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                          ) : (
                            <Icon className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
                          )}
                        </div>
                        <span className="mt-1 font-medium text-center leading-tight max-w-[50px] sm:max-w-[60px] lg:max-w-none truncate text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                          {step.label}
                        </span>
                      </button>

                      {/* Conector horizontal */}
                      {index < STEPS.length - 1 && (
                        <div className="mx-0.5 sm:mx-1 lg:mx-2 h-0.5 w-2 sm:w-4 lg:w-6 xl:w-8 rounded flex-shrink-0" style={{ backgroundColor: isStepCompleted(STEPS[index].id as FormStep) ? step.color : 'var(--border-subtle)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido Principal (full width) */}
          <div className="p-5">
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
              {/* Header del paso actual */}
              <div className="px-5 sm:px-7 py-3 sm:py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0`}
                    style={{ backgroundColor: STEPS.find(s => s.id === currentStep)?.color + '20' }}
                  >
                    {React.createElement(STEPS.find(s => s.id === currentStep)?.icon || FiPackage, {
                      className: "w-4 h-4 sm:w-5 sm:h-5",
                      style: { color: STEPS.find(s => s.id === currentStep)?.color }
                    })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {STEPS.find(s => s.id === currentStep)?.label}
                    </h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {STEPS.find(s => s.id === currentStep)?.description}
                    </p>
                  </div>
                </div>
              </div>

                {/* Contenido del formulario */}
              <div className="min-h-[50vh] sm:min-h-[400px] p-5">
                {/* Mensajes de error */}
                {visitedSteps.has(currentStep) && errors[currentStep] && errors[currentStep].length > 0 && (
                  <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <FiAlertCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                      <span className="font-medium" style={{ color: 'var(--danger-text)' }}>
                        Errores en este paso:
                      </span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm" style={{ color: 'var(--danger-text)' }}>
                      {errors[currentStep].map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contenido del paso */}
                <div className="min-h-[40vh] sm:min-h-[300px]">
                  {renderStepContent()}
                </div>
              </div>

              {/* Navegación inferior */}
              <div className="px-5 sm:px-7 py-3 sm:py-4 border-t" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === STEPS[0].id}
                    className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    style={{
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <FiChevronLeft className="w-2 h-2 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">Anterior</span>
                    <span className="inline sm:hidden">Anterior</span>
                  </button>

                  <div className="text-xs sm:text-sm text-center sm:text-left" style={{ color: 'var(--text-secondary)' }}>
                    Paso {STEPS.findIndex(s => s.id === currentStep) + 1} de {STEPS.length}
                  </div>

                  {currentStep === STEPS[STEPS.length - 1].id ? (
                    <button
                      onClick={handleCreateSalesNote}
                      disabled={loading || !isStepValid('summary')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Crear Nota de Venta
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!isStepValid(currentStep)}
                      className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <span className="inline sm:hidden">Siguiente</span>
                      <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>
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
