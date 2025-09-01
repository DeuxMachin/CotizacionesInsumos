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
import { 
  ClientForm, 
  ProductsForm, 
  DeliveryForm, 
  CommercialTermsForm, 
  QuoteSummary 
} from './components';

type FormStep = 'client' | 'products' | 'delivery' | 'terms' | 'summary';

interface FormData {
  cliente: Partial<ClientInfo>;
  items: QuoteItem[];
  despacho: Partial<DeliveryInfo>;
  condicionesComerciales: Partial<CommercialTerms>;
  notas?: string;
  estado: QuoteStatus;
}

const STEPS = [
  { id: 'client', label: 'Cliente', icon: FiUser, required: true },
  { id: 'products', label: 'Productos', icon: FiPackage, required: true },
  { id: 'delivery', label: 'Despacho', icon: FiTruck, required: false },
  { id: 'terms', label: 'Condiciones', icon: FiInfo, required: false },
  { id: 'summary', label: 'Resumen', icon: FiDollarSign, required: true }
];

export function NewQuotePage() {
  const router = useRouter();
  const { crearCotizacion, formatMoney } = useQuotes();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('client');
  const [formData, setFormData] = useState<FormData>({
    cliente: {},
    items: [],
    despacho: {},
    condicionesComerciales: {},
    estado: 'borrador'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['client'])); // Marcar el primer paso como visitado

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
    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = formData.items.reduce((sum, item) => sum + (item.descuento || 0) * item.precioUnitario * item.cantidad / 100, 0);
    const iva = (subtotal - descuentoTotal) * 0.19;
    const total = subtotal - descuentoTotal + iva + (formData.despacho.costoDespacho || 0);
    
    return { subtotal, descuentoTotal, iva, total };
  };

  const handleSave = async (status: QuoteStatus = 'borrador') => {
    setLoading(true);
    try {
      const finalErrors = validateStep('summary');
      if (finalErrors.length > 0) {
        setErrors({ summary: finalErrors });
        setLoading(false);
        return;
      }

      const { subtotal, descuentoTotal, iva, total } = calculateTotals();
      
      const newQuote: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'> = {
        cliente: formData.cliente as ClientInfo,
        items: formData.items,
        despacho: Object.keys(formData.despacho).length > 0 ? formData.despacho as DeliveryInfo : undefined,
        condicionesComerciales: formData.condicionesComerciales as CommercialTerms,
        estado: status,
        vendedorId: 'USER001', // Esto se obtendrá del usuario autenticado
        vendedorNombre: 'Usuario Actual', // Esto se obtendrá del usuario autenticado
        subtotal,
        descuentoTotal,
        iva,
        total,
        notas: formData.notas,
        fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
          new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined
      };

      const success = await crearCotizacion(newQuote);
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
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
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Nueva Cotización
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave('borrador')}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 px-3 sm:px-4 py-2"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar Borrador</span>
              </button>
              <button
                onClick={() => handleSave('enviada')}
                disabled={loading || !isStepValid('summary')}
                className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2"
              >
                <FiSend className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div 
        className="border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = isStepCompleted(step.id as FormStep);
              const hasBeenVisited = visitedSteps.has(step.id as FormStep);
              const hasErrors = hasBeenVisited && errors[step.id]?.length > 0;
              
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => handleStepChange(step.id as FormStep)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                      border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent'
                    }}
                  >
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        hasErrors ? 'animate-pulse' : ''
                      }`}
                      style={{
                        backgroundColor: hasErrors 
                          ? 'var(--danger-bg)' 
                          : isCompleted 
                            ? 'var(--success-bg)' 
                            : isActive 
                              ? 'var(--accent-primary)' 
                              : 'var(--bg-secondary)',
                        color: hasErrors 
                          ? 'var(--danger-text)' 
                          : isCompleted 
                            ? 'var(--success-text)' 
                            : isActive 
                              ? 'white' 
                              : 'var(--text-secondary)'
                      }}
                    >
                      {hasErrors ? (
                        <FiAlertCircle className="w-4 h-4" />
                      ) : isCompleted ? (
                        <FiCheck className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="hidden sm:block font-medium">
                      {step.label}
                      {step.required && <span style={{ color: 'var(--danger-text)' }}>*</span>}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div 
                      className="w-8 sm:w-12 h-px mx-2"
                      style={{ backgroundColor: 'var(--border)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 'client'}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                  Enviar Cotización
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="btn-primary flex items-center gap-2"
              >
                Siguiente
                <FiArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
