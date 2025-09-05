"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FiCheck,
  FiTool
} from 'react-icons/fi';
import { useQuotes } from '../model/useQuotes';
import { useObras } from '@/features/obras/model/useObras';
import { Quote, QuoteStatus, ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';
import { Obra } from '@/features/obras/types/obras';
import dynamic from 'next/dynamic';

// Cargar componentes de formulario dinámicamente en cliente para evitar referencias
// de módulo como 'object' en desarrollo y garantizar su renderizado.
const ClientForm = dynamic(() => import('@/features/quotes/ui/components/ClientFormNew').then(m => m.ClientForm), { ssr: false });
const ProductsForm = dynamic(() => import('@/features/quotes/ui/components/ProductsForm').then(m => m.ProductsForm), { ssr: false });
const DeliveryForm = dynamic(() => import('@/features/quotes/ui/components/DeliveryForm').then(m => m.DeliveryForm), { ssr: false });
const CommercialTermsForm = dynamic(() => import('@/features/quotes/ui/components/CommercialTermsForm').then(m => m.CommercialTermsForm), { ssr: false });
const QuoteSummary = dynamic(() => import('@/features/quotes/ui/components/QuoteSummary').then(m => m.QuoteSummary), { ssr: false });

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

export function NewQuoteFromObraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obraId');
  
  const { crearCotizacion, formatMoney } = useQuotes();
  const { obtenerObra } = useObras();
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [loadingObra, setLoadingObra] = useState(true);
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
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['client']));

  // Cargar datos de la obra y precompletar el formulario
  useEffect(() => {
    if (!obraId) {
      router.push('/dashboard/cotizaciones/nueva');
      return;
    }

    const fetchObra = () => {
      try {
        const obraData = obtenerObra(obraId);
        if (!obraData) {
          router.push('/dashboard/cotizaciones/nueva');
          return;
        }
        
        setObra(obraData);
        
        // Precompletar los datos del cliente basado en la obra
        const clienteData: Partial<ClientInfo> = {
          razonSocial: obraData.constructora.nombre,
          rut: obraData.constructora.rut,
          giro: "Construcción", // Valor por defecto para constructoras
          direccion: obraData.constructora.direccion || obraData.direccionObra,
          ciudad: "Santiago", // Valor por defecto, podría extraerse de la dirección
          comuna: "Santiago", // Valor por defecto, podría extraerse de la dirección
          telefono: obraData.constructora.telefono,
          email: obraData.constructora.email,
          nombreContacto: obraData.constructora.contactoPrincipal.nombre,
          telefonoContacto: obraData.constructora.contactoPrincipal.telefono,
        };

        // Precompletar datos de despacho si tenemos dirección de obra
        const despachoData: Partial<DeliveryInfo> = obraData.direccionObra ? {
          direccion: obraData.direccionObra,
          ciudad: "Santiago", // Valor por defecto
          comuna: "Santiago", // Valor por defecto
          observaciones: `Entrega en obra: ${obraData.nombreEmpresa}`
        } : {};

        setFormData(prev => ({
          ...prev,
          cliente: clienteData,
          despacho: despachoData
        }));
        
      } catch (error) {
        console.error('Error al cargar la obra:', error);
        router.push('/dashboard/cotizaciones/nueva');
      } finally {
        setLoadingObra(false);
      }
    };

    fetchObra();
  }, [obraId, obtenerObra, router]);

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
    if (!visitedSteps.has(step)) return false;
    
    switch (step) {
      case 'client':
        return !!(formData.cliente.razonSocial && formData.cliente.rut && formData.cliente.direccion);
      case 'products':
        return formData.items.length > 0;
      case 'delivery':
        return true;
      case 'terms':
        return true;
      case 'summary':
        return isStepValid('client') && isStepValid('products');
      default:
        return false;
    }
  };

  const handleStepChange = (step: FormStep) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    const targetIndex = STEPS.findIndex(s => s.id === step);
    
    if (targetIndex > currentIndex) {
      const currentErrors = validateStep(currentStep);
      if (currentErrors.length > 0 && STEPS.find(s => s.id === currentStep)?.required) {
        setErrors(prev => ({ ...prev, [currentStep]: currentErrors }));
        return;
      }
    }
    
    if (validateStep(currentStep).length === 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentStep];
        return newErrors;
      });
    }
    
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
        vendedorId: 'USER001',
        vendedorNombre: 'Usuario Actual',
        subtotal,
        descuentoTotal,
        iva,
        total,
        notas: formData.notas ? `${formData.notas}\n\nCotización generada para obra: ${obra?.nombreEmpresa}` : `Cotización generada para obra: ${obra?.nombreEmpresa}`,
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

  if (loadingObra) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Cargando datos de la obra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => router.push(`/dashboard/obras/${obraId}`)}
                className="p-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
                aria-label="Volver a detalle de obra"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiTool className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  Nueva Cotización para Obra
                </h1>
                {obra && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {obra.nombreEmpresa} • {obra.constructora.nombre}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleSave('borrador')}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar Borrador</span>
                <span className="inline sm:hidden">Guardar</span>
              </button>
              
              <button
                onClick={() => handleSave('enviada')}
                disabled={loading || !isStepValid('summary')}
                className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
              >
                <FiSend className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar Cotización</span>
                <span className="inline sm:hidden">Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
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
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>
                                Req.
                              </span>
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
                          className="text-xs font-medium"
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
              className="rounded-lg p-6 mb-6"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
            >
              {obra && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <FiTool className="w-5 h-5" style={{ color: 'var(--info-text)' }} />
                    <div>
                      <h4 className="font-medium" style={{ color: 'var(--info-text)' }}>
                        Cotización para obra: {obra.nombreEmpresa}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Los datos del cliente han sido precompletos basados en la información de la obra
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {renderStepContent()}
            </div>

            {/* Navegación de pasos */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
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

              <button
                onClick={handleNext}
                disabled={currentStep === 'summary'}
                className="btn-primary flex items-center gap-2 w-full sm:w-auto"
              >
                Siguiente
                <FiArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
