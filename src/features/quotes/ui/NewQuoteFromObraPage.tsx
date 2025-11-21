"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiSave, 
  FiSend, 
  FiUser, 
  FiTruck, 
  FiPackage, 
  FiDollarSign,

  FiAlertCircle,
  FiCheck,
  FiTool
} from 'react-icons/fi';
import { useQuotes } from '../model/useQuotes';
import { useObras } from '@/features/obras/model/useObras';
import { Quote, QuoteStatus, ClientInfo, QuoteItem, DeliveryInfo, CommercialTerms } from '@/core/domain/quote/Quote';
import { Obra } from '@/features/obras/types/obras';
import { useAuthHeaders } from '@/hooks/useAuthHeaders';
import dynamic from 'next/dynamic';

// Cargar componentes de formulario dinámicamente en cliente para evitar referencias
// de módulo como 'object' en desarrollo y garantizar su renderizado.
const ClientForm = dynamic(() => import('@/features/quotes/ui/components/ClientFormNew').then(m => m.ClientForm), { ssr: false });
const ProductsForm = dynamic(() => import('@/features/quotes/ui/components/ProductsForm').then(m => m.ProductsForm), { ssr: false });
const DeliveryForm = dynamic(() => import('@/features/quotes/ui/components/DeliveryForm').then(m => m.DeliveryForm), { ssr: false });
const QuoteSummary = dynamic(() => import('@/features/quotes/ui/components/QuoteSummary').then(m => m.QuoteSummary), { ssr: false });

type FormStep = 'client' | 'products' | 'delivery' | 'summary';

interface FormData {
  cliente: Partial<ClientInfo>;
  items: QuoteItem[];
  despacho: Partial<DeliveryInfo>;
  condicionesComerciales: Partial<CommercialTerms>;
  notas?: string;
  estado: QuoteStatus;
}

const STEPS = [
  { id: 'client', label: 'Cliente', description: 'Selecciona o ingresa los datos del cliente', icon: FiUser, required: true },
  { id: 'products', label: 'Productos', description: 'Agrega los productos y servicios a cotizar', icon: FiPackage, required: true },
  { id: 'delivery', label: 'Despacho', description: 'Configura la dirección y costo de envío (opcional)', icon: FiTruck, required: false },
  { id: 'summary', label: 'Resumen', description: 'Revisa y confirma la cotización completa', icon: FiDollarSign, required: true }
];

export function NewQuoteFromObraPage() {
  const router = useRouter();
  const params = useParams();
  const obraId = params.id as string;
  
  const { crearCotizacion, formatMoney } = useQuotes();
  const { obtenerObra } = useObras();
  const { createHeaders } = useAuthHeaders();
  
  const [obra, setObra] = useState<Obra | null>(null);
  const [loadingObra, setLoadingObra] = useState(true);
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
    estado: 'borrador'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['client']));
  const [showSendModal, setShowSendModal] = useState(false);
  const [contactEmails, setContactEmails] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  // Cargar datos de la obra y precompletar el formulario
  useEffect(() => {
    if (!obraId) {
      router.push('/dashboard/cotizaciones/nueva');
      return;
    }

    const fetchObra = async () => {
      try {
        // obtenerObra es asíncrona -> esperamos su resolución
        const obraData = await obtenerObra(obraId);
        if (!obraData) {
          // No encontrada: redirigimos y abortamos
            router.push('/dashboard/cotizaciones/nueva');
            return;
        }

        setObra(obraData);

        // Precompletar los datos del cliente basado en la obra
        // NOTE: Estos valores son placeholders mientras se conecta la persistencia real (no usar ANY)
        const clienteData: Partial<ClientInfo> = {
          razonSocial: obraData.constructora.nombre,
          rut: obraData.constructora.rut,
          giro: 'Construcción', // placeholder
          direccion: obraData.constructora.direccion || obraData.direccionObra,
          ciudad: obraData.ciudad || 'Santiago', // placeholder
          comuna: obraData.comuna || 'Santiago', // placeholder
          telefono: obraData.constructora.telefono,
          email: obraData.constructora.email,
          nombreContacto: obraData.constructora.contactoPrincipal.nombre,
          telefonoContacto: obraData.constructora.contactoPrincipal.telefono
        };

        // Precompletar datos de despacho si tenemos dirección de obra
        const despachoData: Partial<DeliveryInfo> = obraData.direccionObra ? {
          direccion: obraData.direccionObra,
          ciudad: obraData.ciudad || 'Santiago', // placeholder
          comuna: obraData.comuna || 'Santiago', // placeholder
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

  const handleSendQuote = () => {
    if (obra?.contactos) {
      const emails: Record<string, string> = {};
      obra.contactos.forEach((contacto, index) => {
        emails[`contacto_${index}`] = contacto.email || '';
      });
      setContactEmails(emails);
    }
    setShowSendModal(true);
  };

  const handleConfirmSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      // Guardar cotización como enviada
      const success = await handleSave('enviada');
      if (!success) return;

      // Enviar emails a contactos válidos
      const emailsToSend = Object.values(contactEmails).filter(email => email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
      
      let sentCount = 0;
      for (const email of emailsToSend) {
        try {
          const response = await fetch('/api/cotizaciones/send-email', {
            method: 'POST',
            headers: createHeaders(),
            body: JSON.stringify({
              quoteData: {
                cliente: formData.cliente,
                items: formData.items,
                despacho: formData.despacho,
                condicionesComerciales: formData.condicionesComerciales,
                estado: 'enviada',
                vendedorId: 'USER001',
                vendedorNombre: 'Usuario Actual',
                subtotal: calculateTotals().subtotal,
                descuentoTotal: calculateTotals().descuentoTotal,
                iva: calculateTotals().iva,
                total: calculateTotals().total,
                notas: formData.notas,
                fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
                  new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                  undefined
              },
              recipientEmail: email,
              recipientName: obra?.contactos?.find(c => c.email === email)?.nombre || 'Contacto',
              message: `Adjunto encontrarás la cotización solicitada para la obra ${obra?.nombreEmpresa}. Si tienes alguna pregunta, no dudes en contactarnos.`
            }),
          });
          const result = await response.json();
          if (result.success) {
            sentCount++;
          }
        } catch (error) {
          console.error(`Error sending to ${email}:`, error);
        }
      }

      alert(`Cotización enviada a ${sentCount} de ${emailsToSend.length} contacto(s)`);

      // Mostrar popup
      alert('Cotización hecha');

      // Volver a la obra
      router.push(`/dashboard/obras/${obraId}`);
    } catch (error) {
      console.error('Error sending quote:', error);
      alert('Error al enviar la cotización');
    } finally {
      setSending(false);
      setShowSendModal(false);
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
      // Para borradores permitimos guardar con datos incompletos.
      // Solo cuando se envía/guarda como "enviada" validamos todo el resumen.
      if (status !== 'borrador') {
        const finalErrors = validateStep('summary');
        if (finalErrors.length > 0) {
          setErrors({ summary: finalErrors });
          setLoading(false);
          return false;
        }
      }

      const { subtotal, descuentoTotal, iva, total } = calculateTotals();

      const newQuote: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'> = {
        cliente: formData.cliente as ClientInfo,
        items: formData.items,
        despacho: Object.keys(formData.despacho).length > 0 ? formData.despacho as DeliveryInfo : undefined,
        condicionesComerciales: formData.condicionesComerciales as CommercialTerms,
        estado: status,
        // vendedorId y vendedorNombre se completan en useQuotes usando el usuario autenticado
        vendedorId: '' as any,
        vendedorNombre: '',
        subtotal,
        descuentoTotal,
        iva,
        total,
        obraId: Number(obraId),
        notas: formData.notas ? `${formData.notas}\n\nCotización generada para obra: ${obra?.nombreEmpresa}` : `Cotización generada para obra: ${obra?.nombreEmpresa}`,
        fechaExpiracion: formData.condicionesComerciales.validezOferta ? 
          new Date(Date.now() + formData.condicionesComerciales.validezOferta * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          undefined
      };

      const success = await crearCotizacion(newQuote);
      if (success) {
        return true;
      } else {
        alert('Error al crear la cotización');
        return false;
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear la cotización');
      return false;
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
        <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
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
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate" style={{ color: 'var(--text-primary)' }}>
                  <FiTool className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-primary)' }} />
                  Nueva Cotización para Obra
                </h1>
                {obra && (
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    {obra.nombreEmpresa} • {obra.constructora.nombre}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={async () => {
                  const ok = await handleSave('borrador');
                  if (ok) {
                    router.push(`/dashboard/obras/${obraId}`);
                  }
                }}
                disabled={loading}
                className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar Borrador</span>
                <span className="inline sm:hidden">Guardar</span>
              </button>
              
              {currentStep === 'summary' && (
                <button
                  onClick={handleSendQuote}
                  disabled={loading || !isStepValid('summary')}
                  className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <FiSend className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar Cotización</span>
                  <span className="inline sm:hidden">Enviar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="w-full max-w-none mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
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
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {step.description}
                          </p>
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
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
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
                            <FiCheck className="w-3 h-3 sm:w-5 sm:h-5" />
                          ) : hasErrors ? (
                            <FiAlertCircle className="w-3 h-3 sm:w-5 sm:h-5" style={{ color: 'var(--danger-text)' }} />
                          ) : (
                            <Icon className="w-3 h-3 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <span 
                          className="text-xs font-medium text-center leading-tight max-w-[50px] sm:max-w-none truncate"
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
                          className="w-4 sm:w-6 h-0.5 rounded flex-shrink-0 mx-1 sm:mx-2"
                          style={{ backgroundColor: isStepCompleted(STEPS[index].id as FormStep) ? 'var(--accent-primary)' : 'var(--border-subtle)' }}
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
              className="rounded-lg p-4 sm:p-6 mb-4 sm:mb-6"
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 'client'}
                className="btn-secondary flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm"
              >
                <FiArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Anterior</span>
                <span className="inline sm:hidden">←</span>
              </button>

              <div className="text-xs sm:text-sm text-center sm:text-left" style={{ color: 'var(--text-secondary)' }}>
                Paso {STEPS.findIndex(s => s.id === currentStep) + 1} de {STEPS.length}
              </div>

              <button
                onClick={currentStep === 'summary' ? handleSendQuote : handleNext}
                disabled={currentStep === 'summary' ? (loading || !isStepValid('summary')) : false}
                className="btn-primary flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm"
              >
                {currentStep === 'summary' ? (
                  <>
                    <FiSend className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Enviar Cotización</span>
                    <span className="inline sm:hidden">Enviar</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Siguiente</span>
                    <span className="inline sm:hidden">→</span>
                    <FiArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de envío de cotización */}
      {showSendModal && obra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Enviar Cotización</h3>
            <p className="text-sm text-gray-600 mb-4">
              Confirma los correos electrónicos de los contactos de la obra para enviar la cotización.
            </p>
            <div className="space-y-3 mb-6">
              {(obra.contactos || []).map((contacto, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-1">
                    {contacto.cargo}: {contacto.nombre}
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={contactEmails[`contacto_${index}`] || ''}
                    onChange={(e) => setContactEmails(prev => ({ ...prev, [`contacto_${index}`]: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={sending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
