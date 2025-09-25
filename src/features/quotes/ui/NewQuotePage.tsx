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

} from 'react-icons/fi';
import { useQuotes } from '../model/useQuotes';
import { Quote, QuoteStatus, ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import { useAuth } from '@/contexts/AuthContext';

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

  const persistQuote = async (status: QuoteStatus) => {
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
  vendedorId: user?.id || 'desconocido',
  vendedorNombre: user?.name || 'Usuario',
        subtotal,
        descuentoTotal,
        iva,
        total,
        notas: formData.notas,
        fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
          new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined
      };

      const success = await crearCotizacion(newQuote, {
        globalDiscountPct: globalPct,
        globalDiscountAmount,
        lineDiscountTotal
      });
      if (success) {
        router.push('/dashboard/cotizaciones');
      } else {
        alert('Error al crear la cotización');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear la cotización');
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
    await persistQuote(status);
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
      await persistQuote('enviada');
      
      // Luego enviar por email
      await sendQuoteByEmail();
      
    } catch (error) {
      console.error('Error en el proceso de envío:', error);
      alert('Error al procesar el envío de la cotización');
      setSendingEmail(false);
    }
  };

  const sendQuoteByEmail = async () => {
    try {
      const { subtotal, descuentoTotal, iva, total } = calculateTotals();
      
      // Preparar los datos de la cotización para envío
      const quoteData: Quote = {
        id: 'temp-' + Date.now(), // ID temporal
        numero: `COT-${Date.now()}`, // Número temporal
        cliente: formData.cliente as ClientInfo,
        items: formData.items,
        despacho: Object.keys(formData.despacho).length > 0 ? formData.despacho as DeliveryInfo : undefined,
        condicionesComerciales: formData.condicionesComerciales as CommercialTerms,
        estado: 'enviada',
        vendedorId: user?.id || 'desconocido',
  vendedorNombre: user?.name || 'Usuario',
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
    // Diagnóstico detallado para cada componente (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('ClientForm type:', typeof ClientForm);
      console.log('ProductsForm type:', typeof ProductsForm);
      console.log('DeliveryForm type:', typeof DeliveryForm);
      console.log('QuoteSummary type:', typeof QuoteSummary);
    }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/cotizaciones')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Volver a cotizaciones"
              >
                <FiArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Nueva Cotización
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Crea una cotización paso a paso
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave('borrador')}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ 
                  color: 'var(--text-primary)', 
                  backgroundColor: 'var(--card-bg)', 
                  border: '1px solid var(--border-subtle)' 
                }}
              >
                <FiSave className="w-4 h-4" />
                Guardar Borrador
              </button>
              <button
                onClick={() => handleSave('enviada')}
                disabled={loading || !isStepValid('summary')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend className="w-4 h-4" />
                Enviar Cotización
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Moderno */}
          <div className="lg:w-80">
            <div className="rounded-xl shadow-sm p-6 sticky top-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                Progreso de la Cotización
              </h3>

              <div className="space-y-4">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id as FormStep);
                  const hasErrors = errors[step.id]?.length > 0;
                  const isAccessible = index === 0 || isStepCompleted(STEPS[index - 1].id as FormStep);

                  return (
                    <div key={step.id} className="relative">
                      {/* Conector entre pasos */}
                      {index < STEPS.length - 1 && (
                        <div
                          className="absolute left-6 top-12 w-0.5 h-8 transition-colors"
                          style={{
                            backgroundColor: isCompleted ? step.color : '#E5E7EB'
                          }}
                        />
                      )}

                      <button
                        onClick={() => isAccessible && handleStepChange(step.id as FormStep)}
                        disabled={!isAccessible}
                        className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          border: '2px solid',
                          borderColor: isActive
                            ? 'var(--info)'
                            : isCompleted
                            ? 'var(--success)'
                            : 'var(--border-subtle)',
                          backgroundColor: isActive
                            ? 'var(--info-bg)'
                            : isCompleted
                            ? 'var(--success-bg)'
                            : 'var(--bg-secondary)'
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isActive
                                ? 'bg-blue-500 text-white'
                                : hasErrors
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isCompleted ? (
                              <FiCheck className="w-6 h-6" />
                            ) : hasErrors ? (
                              <FiAlertCircle className="w-6 h-6" />
                            ) : (
                              <Icon className="w-6 h-6" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {step.label}
                              </span>
                              {step.required && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                              {!isAccessible && (
                                <FiClock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {step.description}
                            </p>
                            {hasErrors && (
                              <div className="flex items-center gap-1 mt-2">
                                <FiAlertCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs" style={{ color: 'var(--danger-text)' }}>
                                  {errors[step.id]?.length} error(es)
                                </span>
                              </div>
                            )}
                          </div>

                          <FiChevronRight className={`w-5 h-5 transition-transform ${
                            isActive ? 'rotate-90 text-blue-500' : 'text-slate-400'
                          }`} />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Resumen del progreso */}
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Progreso</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {STEPS.filter(step => isStepCompleted(step.id as FormStep)).length} de {STEPS.length}
                  </span>
                </div>
                <div className="mt-2 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(STEPS.filter(step => isStepCompleted(step.id as FormStep)).length / STEPS.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="flex-1">
            <div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
              {/* Header del paso actual */}
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: STEPS.find(s => s.id === currentStep)?.color + '20' }}
                  >
                    {React.createElement(STEPS.find(s => s.id === currentStep)?.icon || FiPackage, {
                      className: "w-5 h-5",
                      style: { color: STEPS.find(s => s.id === currentStep)?.color }
                    })}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {STEPS.find(s => s.id === currentStep)?.label}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {STEPS.find(s => s.id === currentStep)?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del formulario */}
              <div className="p-6">
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
                <div className="min-h-[400px]">
                  {renderStepContent()}
                </div>
              </div>

              {/* Navegación inferior */}
              <div className="px-6 py-4 border-t" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 'client'}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      color: 'var(--text-primary)', 
                      backgroundColor: 'var(--card-bg)', 
                      border: '1px solid var(--border-subtle)' 
                    }}
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Anterior
                  </button>

                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Paso {STEPS.findIndex(s => s.id === currentStep) + 1} de {STEPS.length}
                  </div>

                  {currentStep === 'summary' ? (
                    <div className="flex items-center gap-3">
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
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Siguiente
                      <FiChevronRight className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl shadow-xl p-6 mx-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
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

            <div className="flex justify-end gap-3 mt-6">
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
              <button
                onClick={handleConfirmSend}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
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
      )}
    </div>
  );
}

export default NewQuotePage;
