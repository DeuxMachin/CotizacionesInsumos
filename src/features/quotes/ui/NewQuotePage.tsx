"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiSave,
  FiSend,
  FiUser,
  FiTruck,
  FiPackage,
  FiDollarSign,
  FiCheck,
  FiChevronRight,
  FiAlertCircle,
  FiClock,
  FiChevronLeft,

} from 'react-icons/fi';
import { useQuotes } from '../model/useQuotes';
import { Quote, QuoteStatus, ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import { useAuth } from '@/contexts/AuthContext';
import { useVendedores } from '@/hooks/useVendedores';

import dynamic from 'next/dynamic';

const ClientForm = dynamic(() => import('@/features/quotes/ui/components/ClientFormNew').then(m => m.ClientForm), { ssr: false });
const ProductsForm = dynamic(() => import('@/features/quotes/ui/components/ProductsForm').then(m => m.ProductsForm), { ssr: false });
const DeliveryForm = dynamic(() => import('@/features/quotes/ui/components/DeliveryForm').then(m => m.DeliveryForm), { ssr: false });
const QuoteSummary = dynamic(() => import('@/features/quotes/ui/components/QuoteSummary').then(m => m.QuoteSummary), { ssr: false });

type FormStep = 'client' | 'products' | 'delivery' | 'summary';

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
  notas?: string;
  estado: QuoteStatus;
  descuentoGlobalPct?: number;
}

const STEPS: StepConfig[] = [
  {
    id: 'client',
    label: 'Cliente',
    description: 'Selecciona o ingresa los datos del cliente',
    icon: FiUser,
    required: true,
    color: '#2563EB' // blue-600 - mejor contraste en ambos temas
  },
  {
    id: 'products',
    label: 'Productos',
    description: 'Agrega los productos y servicios a cotizar',
    icon: FiPackage,
    required: true,
    color: '#059669' // emerald-600 - mejor contraste
  },
  {
    id: 'delivery',
    label: 'Despacho',
    description: 'Configura la dirección y costo de envío (opcional)',
    icon: FiTruck,
    required: false,
    color: '#D97706' // amber-600 - mejor contraste
  },
  {
    id: 'summary',
    label: 'Resumen',
    description: 'Revisa y confirma la cotización completa',
    icon: FiDollarSign,
    required: true,
    color: '#7C3AED' // violet-600 - mejor contraste
  }
];

export function NewQuotePage() {
  const router = useRouter();
  const { crearCotizacion, formatMoney } = useQuotes();
  const { createHeaders } = useAuthHeaders();
  const { user } = useAuth(); // user.role (alias of DB rol) and user.name already normalized
  const { vendedores } = useVendedores();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('client');
  const [formData, setFormData] = useState<FormData>({
    cliente: {},
    items: [],
    despacho: {},
    condicionesComerciales: {
      validezOferta: 30, // 30 días por defecto
      formaPago: 'Transferencia bancaria',
      tiempoEntrega: '7 días hábiles',
      garantia: '1 año'
    },
    estado: 'borrador',
    descuentoGlobalPct: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['client'])); // Marcar el primer paso como visitado
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendEmailError, setSendEmailError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Estado para asignación de vendedor
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>('');
  const [selectedVendedorNombre, setSelectedVendedorNombre] = useState<string>('');

  // Inicializar vendedor seleccionado con el usuario actual
  React.useEffect(() => {
    if (user && vendedores.length > 0) {
      const currentUserAsVendedor = vendedores.find(v => v.id === user.id);
      if (currentUserAsVendedor) {
        setSelectedVendedorId(user.id);
        setSelectedVendedorNombre(user.name || user.email);
      }
    }
  }, [user, vendedores]);

  // Handler para cambiar vendedor
  const handleVendedorChange = (vendedorId: string, vendedorNombre: string) => {
    setSelectedVendedorId(vendedorId);
    setSelectedVendedorNombre(vendedorNombre);
  };

  // Validación de pasos
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
      case 'summary':
        // Validación final
        const clientErrors = validateStep('client');
        const productErrors = validateStep('products');
        stepErrors.push(...clientErrors, ...productErrors);
        break;
    }
    
    return stepErrors;
  };

  const isStepValid = (step: FormStep): boolean => {
    return validateStep(step).length === 0;
  };

  const isStepCompleted = (step: FormStep): boolean => {
    // Solo marcar como completado si el paso ha sido visitado y tiene datos válidos
    if (!visitedSteps.has(step)) return false;
    
    switch (step) {
      case 'client':
        return !!(formData.cliente.razonSocial && formData.cliente.rut && formData.cliente.direccion);
      case 'products':
        return formData.items.length > 0;
      case 'delivery':
        // Opcional - se marca como completado si se visitó (aunque esté vacío)
        return true;
      case 'summary':
        return isStepValid('client') && isStepValid('products');
      default:
        return false;
    }
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

  const calculateTotals = () => {
    const lineDiscountTotal = formData.items.reduce((sum, item) => sum + (item.descuento || 0) * item.precioUnitario * item.cantidad / 100, 0);
    const rawItemsTotal = formData.items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
    const baseAfterLine = rawItemsTotal - lineDiscountTotal;
    const globalPct = formData.descuentoGlobalPct ? Math.min(Math.max(formData.descuentoGlobalPct, 0), 100) : 0;
    const globalDiscountAmount = Math.round(baseAfterLine * (globalPct / 100));
    const subtotal = baseAfterLine - globalDiscountAmount; // neto antes de IVA y despacho
    const iva = (subtotal + (formData.despacho.costoDespacho || 0)) * 0.19;
    const total = subtotal + iva + (formData.despacho.costoDespacho || 0);
    const descuentoTotal = lineDiscountTotal + globalDiscountAmount; // total mostrado al usuario
    return { subtotal, descuentoTotal, iva, total, lineDiscountTotal, globalDiscountAmount, globalPct };
  };

  const persistQuote = async (status: QuoteStatus, options?: { redirect?: boolean }) => {
    setLoading(true);
    try {
      const finalErrors = validateStep('summary');
      if (finalErrors.length > 0) {
        setErrors({ summary: finalErrors });
        setLoading(false);
        return;
      }

  const { subtotal, descuentoTotal, iva, total, lineDiscountTotal, globalDiscountAmount, globalPct } = calculateTotals();
      
      const newQuote: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'> = {
        cliente: formData.cliente as ClientInfo,
        items: formData.items,
        despacho: Object.keys(formData.despacho).length > 0 ? formData.despacho as DeliveryInfo : undefined,
        condicionesComerciales: formData.condicionesComerciales as CommercialTerms,
  estado: status,
  vendedorId: selectedVendedorId || user?.id || 'desconocido',
  vendedorNombre: selectedVendedorNombre || user?.name || 'Usuario',
        subtotal,
        descuentoTotal,
        iva,
        total,
        notas: formData.notas,
        fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
          new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined
      };

      const result = await crearCotizacion(newQuote, {
        globalDiscountPct: globalPct,
        globalDiscountAmount,
        lineDiscountTotal
      });
      if (result.success) {
        if (options?.redirect !== false) {
          router.push('/dashboard/cotizaciones');
        }
        return result.folio || null;
      } else {
        alert('Error al crear la cotización');
        return null;
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear la cotización');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (status: QuoteStatus = 'borrador') => {
    if (status === 'enviada') {
      // Pre-llenar el email del cliente si está disponible
      if (formData.cliente.email && !sendEmail) {
        setSendEmail(formData.cliente.email);
      }
      setShowSendModal(true);
      return;
    }
    await persistQuote(status, { redirect: true });
  };

  const handleConfirmSend = async () => {
    // Validar email simple
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(sendEmail)) {
      setSendEmailError('Email no válido');
      return;
    }
    
    setSendingEmail(true);
    setShowSendModal(false);
    
    try {
      // Primero persistir la cotización como enviada
      const folio = await persistQuote('enviada', { redirect: false });
      if (!folio) {
        throw new Error('No se pudo obtener el folio de la cotización');
      }
      
      // Luego enviar por email
      await sendQuoteByEmail(folio);

      // Finalmente redirigir al listado
      router.push('/dashboard/cotizaciones');
      
    } catch (error) {
      console.error('Error en el proceso de envío:', error);
      alert('Error al procesar el envío de la cotización');
      setSendingEmail(false);
    }
  };

  const handleMarkAsSent = async () => {
    setShowSendModal(false);
    await persistQuote('enviada');
  };

  const sendQuoteByEmail = async (folio: string) => {
    try {
      const { subtotal, descuentoTotal, iva, total } = calculateTotals();
      
      // Preparar los datos de la cotización para envío
      const quoteData: Quote = {
        id: folio,
        numero: folio,
        cliente: formData.cliente as ClientInfo,
        items: formData.items,
        despacho: Object.keys(formData.despacho).length > 0 ? formData.despacho as DeliveryInfo : undefined,
        condicionesComerciales: formData.condicionesComerciales as CommercialTerms,
        estado: 'enviada',
        vendedorId: selectedVendedorId || user?.id || 'desconocido',
  vendedorNombre: selectedVendedorNombre || user?.name || 'Usuario',
        subtotal,
        descuentoTotal,
        iva,
        total,
        notas: formData.notas,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString(),
        fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
          new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined
      };

      // Crear headers con información de usuario
      const headers = createHeaders();

      const response = await fetch('/api/cotizaciones/send-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quoteData,
          recipientEmail: sendEmail,
          recipientName: formData.cliente.nombreContacto || formData.cliente.razonSocial,
          message: `Adjunto encontrarás la cotización solicitada. Si tienes alguna pregunta, no dudes en contactarnos.`
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEmailSent(true);
        alert(`✅ Cotización enviada exitosamente a ${sendEmail}`);
      } else {
        throw new Error(result.error || 'Error al enviar el email');
      }
    } catch (error) {
      console.error('Error enviando email:', error);
      alert(`❌ Error al enviar el email: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const updateFormData = (
    section: keyof FormData, 
    data: Partial<ClientInfo> | QuoteItem[] | Partial<DeliveryInfo> | Partial<CommercialTerms> | string
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
    
    // Limpiar errores del paso actual si los datos son válidos
    setTimeout(() => {
      if (validateStep(currentStep).length === 0) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[currentStep];
          return newErrors;
        });
      }
    }, 100);
  };

  const renderStepContent = () => {
    // Nota: En Next.js (App Router) los Client Components pueden llegar como
    // referencias de cliente (objetos) durante el desarrollo. Evitamos bloquear
    // el render por el tipo y dejamos que React/Next maneje el client reference.
    switch (currentStep) {
      case 'client':
        return (
          <ClientForm
            data={formData.cliente}
            onChange={(data: Partial<ClientInfo>) => updateFormData('cliente', data)}
            errors={errors.client}
          />
        );
      case 'products':
        return (
          <ProductsForm
            items={formData.items}
            onChange={(items: QuoteItem[]) => updateFormData('items', items)}
            errors={errors.products}
          />
        );
      case 'delivery':
        return (
          <DeliveryForm
            data={formData.despacho}
            onChange={(data: Partial<DeliveryInfo>) => updateFormData('despacho', data)}
            errors={errors.delivery}
          />
        );
      case 'summary':
        return (
          <QuoteSummary
            formData={formData}
            totals={calculateTotals()}
            formatMoney={formatMoney}
            errors={errors.summary}
            onChangeGlobalDiscountPct={(pct:number)=> setFormData(prev=>({...prev, descuentoGlobalPct:pct}))}
            onChangeCommercialTerms={(terms: Partial<CommercialTerms>) => updateFormData('condicionesComerciales', terms)}
            selectedVendedorId={selectedVendedorId}
            selectedVendedorNombre={selectedVendedorNombre}
            onVendedorChange={handleVendedorChange}
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
                onClick={() => router.push('/dashboard/cotizaciones')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Volver a cotizaciones"
              >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  Nueva Cotización
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Crea una cotización paso a paso
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleSave('borrador')}
                disabled={loading}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <FiSave className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Guardar Borrador</span>
                <span className="inline sm:hidden">Guardar</span>
              </button>
              <button
                onClick={() => handleSave('enviada')}
                disabled={loading || !isStepValid('summary')}
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Enviar Cotización</span>
                <span className="inline sm:hidden">Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Progreso horizontal y compacto */}
        <div className="px-1 sm:px-2">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Pasos de cotización</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sigue el proceso para completar la cotización</p>
          </div>

          <div className="rounded-xl shadow-sm p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto max-w-full px-1 sm:px-2 pb-2">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id as FormStep);
                  const hasErrors = errors[step.id]?.length > 0;
                  const isAccessible = index === 0 || isStepCompleted(STEPS[index - 1].id as FormStep);

                  return (
                    <div key={step.id} className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => isAccessible && handleStepChange(step.id as FormStep)}
                        disabled={!isAccessible}
                        className={`flex flex-col items-center justify-center px-1 sm:px-2 py-1 rounded-md text-xs transition-all ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
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
          <div className="px-1 sm:px-2">
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
              {/* Header del paso actual */}
              <div className="px-5 sm:px-7 py-3 sm:py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
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
              <div className="min-h-[50vh] sm:min-h-[400px] px-1 sm:px-2">
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
                    disabled={currentStep === 'client'}
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

                  {currentStep === 'summary' ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => handleSave('borrador')}
                        disabled={loading || sendingEmail}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        style={{ 
                          color: 'var(--text-primary)', 
                          backgroundColor: 'var(--card-bg)', 
                          border: '1px solid var(--border-subtle)' 
                        }}
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--text-secondary)' }}></div>
                        ) : (
                          <FiSave className="w-4 h-4" />
                        )}
                        Guardar Borrador
                      </button>
                      <button
                        onClick={() => handleSave('enviada')}
                        disabled={loading || sendingEmail || !isStepValid('summary')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Enviando...
                          </>
                        ) : loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Guardando...
                          </>
                        ) : emailSent ? (
                          <>
                            <FiCheck className="w-4 h-4" />
                            Enviada ✓
                          </>
                        ) : (
                          <>
                            <FiSend className="w-4 h-4" />
                            Enviar Cotización
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleNext}
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
      {/* Modal de envío */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl shadow-xl p-5 sm:p-7 mx-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--info-bg)' }}>
                <FiSend className="w-5 h-5" style={{ color: 'var(--info-text)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Enviar Cotización por Email
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Se generará y enviará automáticamente un PDF
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Correo destinatario
                </label>
                <input
                  type="email"
                  value={sendEmail}
                  onChange={(e) => {
                    setSendEmail(e.target.value);
                    setSendEmailError('');
                  }}
                  className="w-full px-3 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ 
                    border: '1px solid var(--border-subtle)', 
                    backgroundColor: 'var(--card-bg)', 
                    color: 'var(--text-primary)' 
                  }}
                  placeholder="destinatario@empresa.cl"
                  disabled={sendingEmail}
                />
                {sendEmailError && (
                  <p className="text-xs mt-1" style={{ color: 'var(--danger-text)' }}>
                    {sendEmailError}
                  </p>
                )}
              </div>

              {sendingEmail && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info)' }}>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--info-text)' }}></div>
                    <span className="text-sm" style={{ color: 'var(--info-text)' }}>
                      Enviando cotización...
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--info-text)' }}>
                    Generando PDF y enviando por email
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'var(--bg-secondary)' 
                }}
                disabled={sendingEmail}
              >
                Cancelar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleMarkAsSent}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  disabled={sendingEmail}
                >
                  <FiCheck className="w-4 h-4" />
                  Enviada Sin correo
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="px-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  disabled={sendingEmail || !sendEmail}
                >
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Enviar Cotización
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewQuotePage;
