"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiSave, 

  FiUser, 

  FiPhone, 

  FiBriefcase,
  FiDollarSign,

  FiAlertCircle,
  FiCheck,
  FiHelpCircle
} from 'react-icons/fi';
import { useClients, NewClientData } from '../model/useClients';
import ClientInfoForm from './components/client-forms/ClientInfoForm';
import ContactInfoForm from './components/client-forms/ContactInfoForm';
import BusinessInfoForm from './components/client-forms/BusinessInfoForm';
import PaymentInfoForm from './components/client-forms/PaymentInfoForm';
import ClientSummary from './components/client-forms/ClientSummary';

type FormStep = 'info' | 'contact' | 'business' | 'payment' | 'summary';

interface FormData extends Partial<NewClientData> {
  // Campos requeridos siempre están presentes
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  region: string;
  ciudad: string;
  comuna: string;
  tipoEmpresa: "Ltda." | "S.A." | "SpA" | "E.I.R.L." | "Otra";
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
}

const STEPS = [
  { id: 'info', label: 'Información Básica', icon: FiUser, required: true, description: 'Datos generales de la empresa' },
  { id: 'contact', label: 'Contacto', icon: FiPhone, required: true, description: 'Información de contacto principal' },
  { id: 'business', label: 'Negocio', icon: FiBriefcase, required: false, description: 'Detalles comerciales adicionales' },
  { id: 'payment', label: 'Pagos', icon: FiDollarSign, required: false, description: 'Configuración de facturación y pagos' },
  { id: 'summary', label: 'Resumen', icon: FiCheck, required: true, description: 'Verificar información antes de guardar' }
];

export function NewClientPage() {
  const router = useRouter();
  const { 
    loading, 
    crearCliente, 
    formatRUT, 
    validateRUT, 
    validateEmail, 
    validatePhone,
    formatPhone,
    getRegiones,
    getTiposEmpresa,
    fetchClientTypes,
    clientTypes
  } = useClients();
  
  const [currentStep, setCurrentStep] = useState<FormStep>('info');
  const [formData, setFormData] = useState<FormData>({
    rut: '',
    razonSocial: '',
    giro: '',
    direccion: '',
    region: '',
    ciudad: '',
    comuna: '',
    tipoEmpresa: 'Ltda.',
    contactoNombre: '',
    contactoEmail: '',
    contactoTelefono: '',
    retention: 'NO',
    credit: 0,
    additionalDays: 0,
    creditLine: 0,
    discount: 0
  });

  // Cargar tipos de cliente al montar
  React.useEffect(() => {
    fetchClientTypes();
  }, [fetchClientTypes]);
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['info']));

  // Validación de pasos
  const validateStep = (step: FormStep): string[] => {
    const stepErrors: string[] = [];
    
    switch (step) {
      case 'info':
        if (!formData.rut?.trim()) stepErrors.push('RUT es requerido');
        else if (!validateRUT(formData.rut)) stepErrors.push('RUT no es válido');
        
        if (!formData.razonSocial?.trim()) stepErrors.push('Razón social es requerida');
        if (!formData.giro?.trim()) stepErrors.push('Giro comercial es requerido');
        if (!formData.direccion?.trim()) stepErrors.push('Dirección es requerida');
        if (!formData.region?.trim()) stepErrors.push('Región es requerida');
        if (!formData.ciudad?.trim()) stepErrors.push('Ciudad es requerida');
        if (!formData.comuna?.trim()) stepErrors.push('Comuna es requerida');
        if (!formData.tipoEmpresa) stepErrors.push('Tipo de empresa es requerido');
        break;
        
      case 'contact':
        if (!formData.contactoNombre?.trim()) stepErrors.push('Nombre de contacto es requerido');
        
        if (!formData.contactoEmail?.trim()) {
          stepErrors.push('Email de contacto es requerido');
        } else if (!validateEmail(formData.contactoEmail)) {
          stepErrors.push('Email de contacto no es válido');
        }
        
        if (!formData.contactoTelefono?.trim()) {
          stepErrors.push('Teléfono de contacto es requerido');
        } else if (!validatePhone(formData.contactoTelefono)) {
          stepErrors.push('Teléfono de contacto no es válido (formato: +56 9 XXXX XXXX)');
        }
        break;
        
      case 'business':
        // Solo validaciones opcionales o de formato
        if (formData.email && !validateEmail(formData.email)) {
          stepErrors.push('Email general no es válido');
        }
        if (formData.paymentEmail && !validateEmail(formData.paymentEmail)) {
          stepErrors.push('Email de facturación no es válido');
        }
        if (formData.phone && !validatePhone(formData.phone)) {
          stepErrors.push('Teléfono general no es válido');
        }
        if (formData.mobile && !validatePhone(formData.mobile)) {
          stepErrors.push('Teléfono móvil no es válido');
        }
        break;
        
      case 'payment':
        // Validaciones de formato para campos de pago
        if (formData.paymentPhone && !validatePhone(formData.paymentPhone)) {
          stepErrors.push('Teléfono del responsable de pagos no es válido');
        }
        break;
        
      case 'summary':
        // Validación final de todos los pasos requeridos
        const infoErrors = validateStep('info');
        const contactErrors = validateStep('contact');
        stepErrors.push(...infoErrors, ...contactErrors);
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
      case 'info':
        return !!(
          formData.rut && 
          formData.razonSocial && 
          formData.giro && 
          formData.direccion && 
          formData.region && 
          formData.ciudad && 
          formData.comuna && 
          formData.tipoEmpresa &&
          validateRUT(formData.rut)
        );
      case 'contact':
        return !!(
          formData.contactoNombre && 
          formData.contactoEmail && 
          formData.contactoTelefono &&
          validateEmail(formData.contactoEmail) &&
          validatePhone(formData.contactoTelefono)
        );
      case 'business':
        return true; // Opcional
      case 'payment':
        return true; // Opcional
      case 'summary':
        return isStepValid('info') && isStepValid('contact');
      default:
        return false;
    }
  };

  const handleStepChange = (step: FormStep) => {
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

  const handleSave = async () => {
    if (!isStepValid('summary')) {
      const finalErrors = validateStep('summary');
      setErrors({ summary: finalErrors });
      return;
    }

    console.log('🔍 NewClientPage.handleSave - formData completo:', formData);
    console.log('🔍 Campos de contacto:', {
      contactoNombre: formData.contactoNombre,
      contactoEmail: formData.contactoEmail,
      contactoTelefono: formData.contactoTelefono,
      paymentResponsible: formData.paymentResponsible,
      paymentEmail: formData.paymentEmail,
      paymentPhone: formData.paymentPhone,
      contactName: formData.contactName,
      email: formData.email,
      contactPhone: formData.contactPhone
    });

    const success = await crearCliente(formData as NewClientData);
    if (success) {
      router.push('/dashboard/clientes');
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
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
      case 'info':
        return (
          <ClientInfoForm
            data={formData}
            onChange={updateFormData}
            errors={errors.info}
            formatRUT={formatRUT}
            validateRUT={validateRUT}
            regiones={getRegiones()}
            tiposEmpresa={getTiposEmpresa()}
            clientTypes={clientTypes}
          />
        );
      case 'contact':
        return (
          <ContactInfoForm
            data={formData}
            onChange={updateFormData}
            errors={errors.contact}
            validateEmail={validateEmail}
            validatePhone={validatePhone}
            formatPhone={formatPhone}
          />
        );
      case 'business':
        return (
          <BusinessInfoForm
            data={formData}
            onChange={updateFormData}
            errors={errors.business}
            validateEmail={validateEmail}
            validatePhone={validatePhone}
            formatPhone={formatPhone}
          />
        );
      case 'payment':
        return (
          <PaymentInfoForm
            data={formData}
            onChange={updateFormData}
            errors={errors.payment}
            validatePhone={validatePhone}
            formatPhone={formatPhone}
          />
        );
      case 'summary':
        return (
          <ClientSummary
            formData={formData}
            errors={errors.summary}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden w-full max-w-[100vw]" style={{ backgroundColor: 'var(--bg-primary)', maxWidth: '100vw' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b w-full overflow-x-hidden box-border"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full max-w-[100vw]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 sm:py-3 min-w-0 w-full box-border">
            <div className="flex items-center gap-3 min-w-0 w-full sm:flex-1">
              <button
                onClick={() => router.push('/dashboard/clientes')}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
                aria-label="Volver a clientes"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  Nuevo Cliente
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Agregar un nuevo cliente al sistema
                </p>
              </div>
            </div>
            
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end max-w-full">
              <button
                onClick={handleSave}
                disabled={loading || !isStepValid('summary')}
        className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Guardar Cliente</span>
                <span className="sm:hidden">Guardar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div 
        className="border-b w-full overflow-x-hidden"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
  <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 w-full max-w-[100vw]">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pr-1 snap-x snap-mandatory touch-pan-x min-w-0 w-full" role="tablist" aria-label="Progreso de creación de cliente">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = isStepCompleted(step.id as FormStep);
              const hasBeenVisited = visitedSteps.has(step.id as FormStep);
              const hasErrors = hasBeenVisited && errors[step.id]?.length > 0;
              
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => handleStepChange(step.id as FormStep)}
                    className={`flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap snap-start ${
                      isActive ? 'shadow-sm' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                      border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent'
                    }}
                    title={step.description}
                  >
                    <div 
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
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
                    <div className="hidden sm:block">
                      <div className="font-medium text-left text-xs sm:text-sm">
                        {step.label}
                        {step.required && <span style={{ color: 'var(--danger-text)' }}>*</span>}
                      </div>
                      <div className="text-[10px] sm:text-xs opacity-75 text-left">
                        {step.description}
                      </div>
                    </div>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div 
                      className="w-4 sm:w-8 h-px mx-2"
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
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div 
      className="rounded-lg p-3 sm:p-6 overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', maxWidth: '100%' }}
        >
          {/* Error Messages */}
          {visitedSteps.has(currentStep) && errors[currentStep] && errors[currentStep].length > 0 && (
            <div 
              className="mb-6 p-3 sm:p-4 rounded-lg border text-xs sm:text-sm"
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
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Help Text */}
          <div 
            className="mb-6 p-3 sm:p-4 rounded-lg border text-xs sm:text-sm"
            style={{ 
              backgroundColor: 'var(--info-bg)', 
              borderColor: 'var(--info-border)',
              color: 'var(--info-text)'
            }}
          >
            <div className="flex items-start gap-2">
              <FiHelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong>¿Necesitas ayuda?</strong> {STEPS.find(s => s.id === currentStep)?.description}
                {currentStep === 'info' && (
                  <span> Los campos marcados con (*) son obligatorios.</span>
                )}
                {currentStep === 'contact' && (
                  <span> Esta información será utilizada para comunicarnos contigo.</span>
                )}
                {(currentStep === 'business' || currentStep === 'payment') && (
                  <span> Esta sección es opcional pero puede ser útil para configuraciones avanzadas.</span>
                )}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-full overflow-x-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {renderStepContent()}
          </div>

          {/* Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 'info'}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            <div className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="font-medium">
                Paso {STEPS.findIndex(s => s.id === currentStep) + 1} de {STEPS.length}
              </div>
              <div className="text-xs mt-1">
                {STEPS.find(s => s.id === currentStep)?.label}
              </div>
            </div>
            
            {currentStep === 'summary' ? (
              <button
                onClick={handleSave}
                disabled={loading || !isStepValid('summary')}
        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Guardar Cliente</span>
                <span className="sm:hidden">Guardar</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
        className="btn-primary flex items-center gap-2"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <FiArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewClientPage;
