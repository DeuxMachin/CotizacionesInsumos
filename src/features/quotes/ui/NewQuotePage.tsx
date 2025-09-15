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
  FiInfo,
  FiAlertCircle,
  FiCheck
} from 'react-icons/fi';
import { useQuotes } from '../model/useQuotes';
import { Quote, QuoteStatus, ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';

import dynamic from 'next/dynamic';


const ClientForm = dynamic(() => import('@/features/quotes/ui/components/ClientFormNew').then(m => m.ClientForm), { ssr: false });
const ProductsForm = dynamic(() => import('@/features/quotes/ui/components/ProductsForm').then(m => m.ProductsForm), { ssr: false });
const DeliveryForm = dynamic(() => import('@/features/quotes/ui/components/DeliveryForm').then(m => m.DeliveryForm), { ssr: false });
const CommercialTermsForm = dynamic(() => import('@/features/quotes/ui/components/CommercialTermsForm').then(m => m.CommercialTermsForm), { ssr: false });
const QuoteSummary = dynamic(() => import('@/features/quotes/ui/components/QuoteSummary').then(m => m.QuoteSummary), { ssr: false });

type FormStep = 'client' | 'products' | 'delivery' | 'terms' | 'summary';

type StepConfig = {
  id: FormStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
};

interface FormData {
  cliente: Partial<ClientInfo>;
  items: QuoteItem[];
  despacho: Partial<DeliveryInfo>;
  condicionesComerciales: Partial<CommercialTerms>;
  notas?: string;
  estado: QuoteStatus;
  descuentoGlobalPct?: number; // porcentaje de descuento global
}

const STEPS: StepConfig[] = [
  { id: 'client', label: 'Cliente', icon: FiUser, required: true },
  { id: 'products', label: 'Productos', icon: FiPackage, required: true },
  { id: 'delivery', label: 'Despacho', icon: FiTruck, required: false },
  { id: 'terms', label: 'Condiciones', icon: FiInfo, required: false },
  { id: 'summary', label: 'Resumen', icon: FiDollarSign, required: true }
];

export function NewQuotePage() {
  const router = useRouter();
  const { crearCotizacion, formatMoney, userId, userName } = useQuotes();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('client');
  const [formData, setFormData] = useState<FormData>({
    cliente: {},
    items: [],
    despacho: {},
    condicionesComerciales: {},
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
      case 'terms':
        // Opcional - se marca como completado si se visitó
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
  vendedorId: userId || 'desconocido',
  vendedorNombre: userName || 'Usuario',
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
        vendedorId: userId || 'desconocido',
        vendedorNombre: userName || 'Usuario',
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

      const response = await fetch('/api/cotizaciones/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.log('CommercialTermsForm type:', typeof CommercialTermsForm);
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
      case 'terms':
        return (
          <CommercialTermsForm
            data={formData.condicionesComerciales}
            onChange={(data: Partial<CommercialTerms>) => updateFormData('condicionesComerciales', data)}
            errors={errors.terms}
            onNotesChange={(notas: string) => updateFormData('notas', notas)}
            notes={formData.notas}
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => router.push('/dashboard/cotizaciones')}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
                aria-label="Volver a cotizaciones"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Nueva Cotización
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleSave('borrador')}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar Borrador</span>
                <span className="inline sm:hidden">Guardar</span>
              </button>
              <button
                onClick={() => handleSave('enviada')}
                disabled={loading || !isStepValid('summary')}
                className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 text-sm"
              >
                <FiSend className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar Cotización</span>
                <span className="inline sm:hidden">Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar and Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Sidebar de pasos - Visible solo en lg y superiores */}
          <div className="hidden lg:block lg:w-1/4">
            <div 
              className="sticky top-24 rounded-lg p-6"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Pasos
              </h3>
              
              <div className="space-y-2">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id as FormStep);
                  const hasErrors = errors[step.id]?.length > 0;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepChange(step.id as FormStep)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isActive ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? 'var(--accent-bg)' : isCompleted ? 'var(--success-bg)' : 'var(--bg-secondary)',
                        color: isActive ? 'var(--accent-text)' : isCompleted ? 'var(--success-text)' : 'var(--text-secondary)',
                        borderColor: hasErrors ? 'var(--danger)' : 'transparent',
                        borderWidth: hasErrors ? '1px' : '0'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isCompleted ? 'bg-current bg-opacity-20' : 'bg-current bg-opacity-10'
                        }`}>
                          {isCompleted ? (
                            <FiCheck className="w-4 h-4" />
                          ) : hasErrors ? (
                            <FiAlertCircle className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{step.label}</span>
                            {step.required && (
                              <span style={{ color: 'var(--danger-text)' }}>*</span>
                            )}
                          </div>
                          {hasErrors && (
                            <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                              {errors[step.id]?.length} error(es)
                            </p>
                          )}
                        </div>
                        
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
                          {index + 1}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progress Steps para móviles - Visible solo en pantallas hasta lg */}
          <div className="lg:hidden w-full mb-4">
            <div 
              className="overflow-x-auto py-2 rounded-lg"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center min-w-max px-4">
                {STEPS.map((step, index) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepCompleted(step.id as FormStep);
                  const hasErrors = errors[step.id]?.length > 0;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => handleStepChange(step.id as FormStep)}
                        className="flex flex-col items-center gap-1 px-3 py-2"
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: isActive ? 'var(--accent-primary)' : 
                                           isCompleted ? 'var(--success-bg)' : 
                                           'var(--bg-secondary)',
                            color: isActive ? 'white' : 
                                   isCompleted ? 'var(--success-text)' : 
                                   'var(--text-secondary)'
                          }}
                        >
                          {isCompleted ? (
                            <FiCheck className="w-5 h-5" />
                          ) : hasErrors ? (
                            <FiAlertCircle className="w-5 h-5" style={{ color: 'var(--danger-text)' }} />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <span 
                          className="text-xs font-medium max-w-[90px] truncate"
                          title={step.label}
                          style={{ 
                            color: isActive ? 'var(--accent-primary)' : 
                                  'var(--text-secondary)'
                          }}
                        >
                          {step.label}
                        </span>
                      </button>
                      {index < STEPS.length - 1 && (
                        <div 
                          className="w-6 h-px"
                          style={{ backgroundColor: 'var(--border)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contenido del formulario */}
          <div className="lg:w-3/4 w-full">
            <div 
              className="rounded-lg p-4 sm:p-6"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              {/* Error Messages */}
              {visitedSteps.has(currentStep) && errors[currentStep] && errors[currentStep].length > 0 && (
                <div 
                  className="mb-6 p-4 rounded-lg border"
                  style={{ 
                    backgroundColor: 'var(--danger-bg)', 
                    borderColor: 'var(--danger-border)',
                    color: 'var(--danger-text)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FiAlertCircle className="w-5 h-5" />
                    <span className="font-medium">Errores en este paso:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors[currentStep].map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step Content */}
              {renderStepContent()}

              {/* Navegación de pasos */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 'client'}
                  className="btn-secondary flex items-center gap-2 w-full sm:w-auto"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                  Paso {STEPS.findIndex(s => s.id === currentStep) + 1} de {STEPS.length}
                </div>

                {currentStep === 'summary' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleSave('borrador')}
                      disabled={loading || sendingEmail}
                      className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      ) : (
                        <FiSave className="w-4 h-4" />
                      )}
                      Guardar Borrador
                    </button>
                    <button
                      onClick={() => handleSave('enviada')}
                      disabled={loading || sendingEmail}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {sendingEmail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                          Enviando...
                        </>
                      ) : loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
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
                    className="btn-primary flex items-center gap-2 w-full sm:w-auto"
                  >
                    Siguiente
                    <FiArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg p-6" style={{background:'var(--card-bg)', border:'1px solid var(--border)'}}>
            <h3 className="text-lg font-semibold mb-2" style={{color:'var(--text-primary)'}}>Enviar Cotización por Email</h3>
            <p className="text-sm mb-4" style={{color:'var(--text-secondary)'}}>
              Se generará y enviará automáticamente un PDF con la cotización al destinatario junto con un mensaje de agradecimiento.
            </p>
            <label className="block text-sm font-medium mb-1" style={{color:'var(--text-secondary)'}}>Correo destinatario</label>
            <input
              type="email"
              value={sendEmail}
              onChange={(e)=>{setSendEmail(e.target.value); setSendEmailError('');}}
              className="w-full mb-2 px-3 py-2 rounded border"
              style={{background:'var(--input-bg)', borderColor:'var(--border)', color:'var(--text-primary)'}}
              placeholder="destinatario@empresa.cl"
              disabled={sendingEmail}
            />
            {sendEmailError && <p className="text-xs mb-2" style={{color:'var(--danger)'}}>{sendEmailError}</p>}
            
            {sendingEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm text-blue-800">Enviando cotización...</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Generando PDF y enviando por email</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={()=>{setShowSendModal(false);}} 
                className="btn-secondary px-4 py-2 text-sm"
                disabled={sendingEmail}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmSend} 
                className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                disabled={sendingEmail || !sendEmail}
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
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
