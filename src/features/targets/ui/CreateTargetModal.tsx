'use client'

import { useState } from "react";
import { FiX, FiMapPin, FiSearch, FiLoader, FiCheckCircle, FiMap, FiUser, FiCalendar, FiFileText, FiPhone, FiMail, FiHome, FiClock, FiAlertTriangle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Modal } from "../../../shared/ui/Modal";
import { useTargets } from "../model/useTargets";

interface CreateTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationDetails {
  lat: number;
  lng: number;
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
}

export default function CreateTargetModal({ isOpen, onClose }: CreateTargetModalProps) {
  const { createTarget } = useTargets();
  
  const [currentStep, setCurrentStep] = useState<'location' | 'basic' | 'contact' | 'additional'>('location');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    direccion: "",
    lat: 0,
    lng: 0,
    ciudad: "",
    region: "",
    contactoNombre: "",
    contactoTelefono: "",
    contactoEmail: "",
    contactoEmpresa: "",
    prioridad: "media" as 'baja' | 'media' | 'alta',
    tipoObra: "",
    fechaEstimadaInicio: "",
    observaciones: ""
  });
  // const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 'location', label: 'Ubicación', icon: FiMapPin },
    { id: 'basic', label: 'Info Básica', icon: FiFileText },
    { id: 'contact', label: 'Contacto', icon: FiUser },
    { id: 'additional', label: 'Adicional', icon: FiClock }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const isStepCompleted = (stepId: string) => {
    switch (stepId) {
      case 'location':
        return !!selectedLocation;
      case 'basic':
        return !!(formData.titulo && formData.descripcion);
      case 'contact':
        return !!(formData.contactoNombre || formData.contactoTelefono || formData.contactoEmail);
      case 'additional':
        return true; // Paso opcional
      default:
        return false;
    }
  };

  // Simulación de búsqueda de Google Places API
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setSearchingLocation(true);
    
    // Simulación de resultados - en producción usar Google Places API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockSuggestions: LocationSuggestion[] = [
      {
        place_id: "1",
        description: "Las Condes, Santiago, Chile",
        structured_formatting: {
          main_text: "Las Condes",
          secondary_text: "Santiago, Chile"
        }
      },
      {
        place_id: "2", 
        description: "Av. Las Condes 12345, Las Condes, Santiago, Chile",
        structured_formatting: {
          main_text: "Av. Las Condes 12345",
          secondary_text: "Las Condes, Santiago, Chile"
        }
      },
      {
        place_id: "3",
        description: "Providencia, Santiago, Chile", 
        structured_formatting: {
          main_text: "Providencia",
          secondary_text: "Santiago, Chile"
        }
      }
    ].filter(s => 
      s.description.toLowerCase().includes(query.toLowerCase())
    );

    setLocationSuggestions(mockSuggestions);
    setSearchingLocation(false);
  };

  const selectLocation = async (suggestion: LocationSuggestion) => {
    setSearchingLocation(true);
    
    // Simulación de obtener detalles de la ubicación - en producción usar Google Places API Details
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockLocationDetails: LocationDetails = {
      lat: -33.4091 + (Math.random() - 0.5) * 0.1,
      lng: -70.5459 + (Math.random() - 0.5) * 0.1,
      formatted_address: suggestion.description,
      address_components: [
        {
          long_name: suggestion.structured_formatting.main_text,
          short_name: suggestion.structured_formatting.main_text,
          types: ["route"]
        },
        {
          long_name: "Santiago",
          short_name: "Santiago", 
          types: ["locality"]
        },
        {
          long_name: "Región Metropolitana",
          short_name: "RM",
          types: ["administrative_area_level_1"]
        }
      ]
    };

    setSelectedLocation(mockLocationDetails);
    setFormData(prev => ({
      ...prev,
      direccion: mockLocationDetails.formatted_address,
      lat: mockLocationDetails.lat,
      lng: mockLocationDetails.lng,
      ciudad: mockLocationDetails.address_components.find(c => c.types.includes("locality"))?.long_name || "Santiago",
      region: mockLocationDetails.address_components.find(c => c.types.includes("administrative_area_level_1"))?.long_name || "Región Metropolitana"
    }));
    
    setLocationSearch("");
    setLocationSuggestions([]);
    setSearchingLocation(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está disponible en este navegador");
      return;
    }

    setSearchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Simulación de reverse geocoding
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockAddress = `Ubicación actual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        
        const locationDetails: LocationDetails = {
          lat: latitude,
          lng: longitude,
          formatted_address: mockAddress,
          address_components: [
            {
              long_name: "Santiago",
              short_name: "Santiago",
              types: ["locality"]
            },
            {
              long_name: "Región Metropolitana", 
              short_name: "RM",
              types: ["administrative_area_level_1"]
            }
          ]
        };

        setSelectedLocation(locationDetails);
        setFormData(prev => ({
          ...prev,
          direccion: mockAddress,
          lat: latitude,
          lng: longitude,
          ciudad: "Santiago",
          region: "Región Metropolitana"
        }));
        
        setSearchingLocation(false);
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error);
        setSearchingLocation(false);
        alert("Error al obtener la ubicación actual");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      alert("Por favor selecciona una ubicación");
      return;
    }

    if (!formData.titulo || !formData.descripcion) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    try {
      await createTarget({
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        direccion: formData.direccion,
        lat: formData.lat,
        lng: formData.lng,
        ciudad: formData.ciudad,
        region: formData.region,
        contactoNombre: formData.contactoNombre,
        contactoTelefono: formData.contactoTelefono,
        contactoEmail: formData.contactoEmail,
        contactoEmpresa: formData.contactoEmpresa,
        prioridad: formData.prioridad,
        tipoObra: formData.tipoObra,
        fechaEstimadaInicio: formData.fechaEstimadaInicio || undefined,
        observaciones: formData.observaciones
      });
      
      onClose();
      
      // Reset form
      setFormData({
        titulo: "",
        descripcion: "",
        direccion: "",
        lat: 0,
        lng: 0,
        ciudad: "",
        region: "",
        contactoNombre: "",
        contactoTelefono: "",
        contactoEmail: "",
        contactoEmpresa: "",
        prioridad: "media",
        tipoObra: "",
        fechaEstimadaInicio: "",
        observaciones: ""
      });
      setCurrentStep('location');
      setSelectedLocation(null);
    } catch (error) {
      console.error("Error creating target:", error);
      alert("Error al crear el target. Por favor intenta de nuevo.");
    }
  };

  const openInMaps = () => {
    if (selectedLocation) {
      const url = `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
        {/* Header con indicador de pasos mejorado */}
        <div className="mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
            <div className="mb-2 sm:mb-0">
              <h2 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Nuevo Posible Target
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Registra una nueva oportunidad de negocio encontrada
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)' }}
              className="absolute top-2 right-2 sm:static transition-colors hover:scale-110 p-1"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Indicador de progreso visual */}
          <div className="flex items-center justify-between px-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = isStepCompleted(step.id);
              const isAccessible = index <= getCurrentStepIndex() || isCompleted;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isAccessible ? setCurrentStep(step.id as 'location' | 'basic' | 'contact' | 'additional') : null}
                    disabled={!isAccessible}
                    className={`relative flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 lg:p-4 rounded-lg transition-all ${
                      isAccessible ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'
                    }`}
                    style={{
                      backgroundColor: isActive 
                        ? 'var(--accent-primary)' 
                        : isCompleted 
                          ? 'var(--success-bg)'
                          : 'var(--bg-secondary)',
                      color: isActive || isCompleted ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all">
                      {isCompleted ? (
                        <FiCheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-center">
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{index + 1}</span>
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                    )}
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div 
                      className="h-px flex-1 mx-1 sm:mx-2"
                      style={{ 
                        backgroundColor: isCompleted ? 'var(--success)' : 'var(--border)'
                      }} 
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido dinámico por paso */}
        <div className="min-h-[250px] sm:min-h-[300px]">
          {/* Paso 1: Ubicación */}
          {currentStep === 'location' && (
            <div className="space-y-3 sm:space-y-4">
              <div 
                className="rounded-xl p-3 sm:p-4 lg:p-5"
                style={{ 
                  backgroundColor: 'var(--info-bg)',
                  border: '1px solid var(--info-border)'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--info-text)' }} />
                  <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--info-text)' }}>
                    ¿Dónde encontraste esta oportunidad?
                  </h3>
                </div>
                <p className="text-sm" style={{ color: 'var(--info-text)' }}>
                  Busca la dirección exacta donde se encuentra el proyecto o usa tu ubicación actual para registrar el posible target.
                </p>
              </div>

              {/* Buscador de ubicación mejorado */}
              <div className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <div className="relative">
                    <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar dirección, comuna, calle o punto de referencia..."
                      value={locationSearch}
                      onChange={(e) => {
                        setLocationSearch(e.target.value);
                        searchLocation(e.target.value);
                      }}
                      className="form-input pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-base sm:text-lg w-full min-h-[48px] sm:min-h-[56px]"
                    />
                    {searchingLocation && (
                      <FiLoader className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    )}
                  </div>

                  {/* Sugerencias de ubicación mejoradas */}
                  {locationSuggestions.length > 0 && (
                    <div 
                      className="absolute top-full left-0 right-0 z-20 mt-2 rounded-xl shadow-2xl max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto"
                      style={{ 
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          onClick={() => selectLocation(suggestion)}
                          className="w-full text-left px-3 sm:px-6 py-3 sm:py-4 transition-colors border-b last:border-b-0 hover:scale-[1.01]"
                          style={{ borderColor: 'var(--border)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: 'var(--accent-bg)' }}
                            >
                              <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold mb-1 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                                {suggestion.structured_formatting.main_text}
                              </div>
                              <div className="text-xs sm:text-sm opacity-75" style={{ color: 'var(--text-secondary)' }}>
                                {suggestion.structured_formatting.secondary_text}
                              </div>
                            </div>
                            <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón de ubicación actual mejorado */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={searchingLocation}
                    className="btn-secondary flex items-center gap-2 sm:gap-3 mx-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                  >
                    {searchingLocation ? (
                      <FiLoader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                    <span className="font-medium">Usar mi ubicación actual</span>
                  </button>
                </div>

                {/* Ubicación seleccionada mejorada */}
                {selectedLocation && (
                  <div 
                    className="rounded-xl p-4 sm:p-6 lg:p-8 animate-fadeIn"
                    style={{ 
                      backgroundColor: 'var(--success-bg)',
                      border: '2px solid var(--success)'
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 mb-4 sm:mb-0">
                        <div 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--success)' }}
                        >
                          <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg lg:text-xl font-semibold mb-2" style={{ color: 'var(--success-text)' }}>
                            Ubicación Confirmada
                          </h4>
                          <p className="mb-2 sm:mb-3 font-medium text-sm sm:text-base" style={{ color: 'var(--success-text)' }}>
                            {selectedLocation.formatted_address}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm" style={{ color: 'var(--success-text)' }}>
                            <div>
                              <strong>Latitud:</strong> {selectedLocation.lat.toFixed(6)}
                            </div>
                            <div>
                              <strong>Longitud:</strong> {selectedLocation.lng.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openInMaps}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all w-full sm:w-auto sm:ml-4 flex-shrink-0 hover:scale-105"
                        style={{ 
                          backgroundColor: 'var(--success)',
                          color: '#ffffff'
                        }}
                      >
                        <FiMap className="w-4 h-4" />
                        <span>Abrir en Maps</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Información Básica */}
          {currentStep === 'basic' && selectedLocation && (
            <div className="space-y-6 sm:space-y-8">
              <div 
                className="rounded-xl p-4 sm:p-6 lg:p-8"
                style={{ 
                  backgroundColor: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)'
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" style={{ color: 'var(--warning-text)' }} />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold" style={{ color: 'var(--warning-text)' }}>
                    Describe lo que encontraste
                  </h3>
                </div>
                <p className="text-sm sm:text-base lg:text-lg" style={{ color: 'var(--warning-text)' }}>
                  Proporciona detalles sobre el proyecto, su estado actual y el tipo de oportunidad que representa.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      Título del Target *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ej: Construcción residencial en Las Condes"
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                    />
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiHome className="w-4 h-4 sm:w-5 sm:h-5" />
                      Tipo de Obra
                    </label>
                    <select
                      value={formData.tipoObra}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipoObra: e.target.value }))}
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                    >
                      <option value="">Selecciona el tipo de proyecto...</option>
                      <option value="Residencial">🏠 Residencial</option>
                      <option value="Comercial">🏢 Comercial</option>
                      <option value="Industrial">🏭 Industrial</option>
                      <option value="Infraestructura">🛤️ Infraestructura</option>
                      <option value="Remodelación">🔨 Remodelación</option>
                      <option value="Otro">⚙️ Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                      Prioridad del Target *
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-2">
                      {(['baja', 'media', 'alta'] as const).map((prioridad) => (
                        <button
                          key={prioridad}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, prioridad }))}
                          className={`p-2 sm:p-3 lg:p-4 rounded-lg text-center transition-all font-medium text-sm sm:text-base ${
                            formData.prioridad === prioridad ? 'ring-2 scale-105' : 'hover:scale-102'
                          }`}
                          style={{
                            backgroundColor: formData.prioridad === prioridad 
                              ? prioridad === 'alta' ? 'var(--error-bg)' : prioridad === 'media' ? 'var(--warning-bg)' : 'var(--success-bg)'
                              : 'var(--bg-secondary)',
                            color: formData.prioridad === prioridad 
                              ? prioridad === 'alta' ? 'var(--error-text)' : prioridad === 'media' ? 'var(--warning-text)' : 'var(--success-text)'
                              : 'var(--text-secondary)',
                            borderColor: formData.prioridad === prioridad 
                              ? prioridad === 'alta' ? 'var(--error)' : prioridad === 'media' ? 'var(--warning)' : 'var(--success)'
                              : 'transparent'
                          }}
                        >
                          {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      Descripción *
                    </label>
                    <textarea
                      required
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Describe detalladamente lo que observaste:&#10;• Estado actual del proyecto&#10;• Actividad en el sitio&#10;• Oportunidad identificada&#10;• Cualquier detalle relevante..."
                      className="form-input mt-2 text-base sm:text-lg min-h-[120px] sm:min-h-[150px] lg:min-h-[180px]"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      Fecha Estimada de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.fechaEstimadaInicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaEstimadaInicio: e.target.value }))}
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Información de Contacto */}
          {currentStep === 'contact' && selectedLocation && isStepCompleted('basic') && (
            <div className="space-y-6 sm:space-y-8">
              <div 
                className="rounded-xl p-4 sm:p-6 lg:p-8"
                style={{ 
                  backgroundColor: 'var(--accent-bg)',
                  border: '1px solid var(--accent-primary)'
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <FiUser className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold" style={{ color: 'var(--accent-primary)' }}>
                    Información de Contacto
                  </h3>
                </div>
                <p className="text-sm sm:text-base lg:text-lg" style={{ color: 'var(--accent-primary)' }}>
                  Si lograste obtener información de contacto durante tu visita, regístrala aquí. Esto facilitará el seguimiento posterior.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                      Nombre de Contacto
                    </label>
                    <input
                      type="text"
                      value={formData.contactoNombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactoNombre: e.target.value }))}
                      placeholder="Nombre y apellido del contacto"
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                    />
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiPhone className="w-4 h-4 sm:w-5 sm:h-5" />
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={formData.contactoTelefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactoTelefono: e.target.value }))}
                      placeholder="+56 9 XXXX XXXX"
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiMail className="w-4 h-4 sm:w-5 sm:h-5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactoEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactoEmail: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                    />
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2 text-base sm:text-lg font-medium">
                      <FiHome className="w-4 h-4 sm:w-5 sm:h-5" />
                      Empresa/Constructora
                    </label>
                    <input
                      type="text"
                      value={formData.contactoEmpresa}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactoEmpresa: e.target.value }))}
                      placeholder="Nombre de la empresa o constructora"
                      className="form-input mt-2 py-2 sm:py-3 text-base sm:text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 4: Información Adicional */}
          {currentStep === 'additional' && selectedLocation && isStepCompleted('basic') && (
            <div className="space-y-3 sm:space-y-4">
              <div 
                className="rounded-xl p-3 sm:p-4"
                style={{ 
                  backgroundColor: 'var(--success-bg)',
                  border: '1px solid var(--success)'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FiClock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--success-text)' }} />
                  <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--success-text)' }}>
                    Observaciones y Notas Adicionales
                  </h3>
                </div>
                <p className="text-sm" style={{ color: 'var(--success-text)' }}>
                  Agrega cualquier información adicional que consideres relevante para el seguimiento de este target.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="form-label flex items-center gap-2 text-sm sm:text-base font-medium">
                    <FiFileText className="w-4 h-4" />
                    Observaciones Adicionales
                  </label>
                  <textarea
                    rows={4}
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Agrega observaciones adicionales:&#10;• Detalles del proyecto&#10;• Condiciones del sitio&#10;• Próximos pasos&#10;• Información relevante..."
                    className="form-input mt-2 py-2 text-sm sm:text-base resize-none"
                  />
                </div>

                {/* Resumen visual del target */}
                <div 
                  className="rounded-xl p-3 sm:p-4"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
                    Resumen del Target
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-3 h-3" style={{ color: 'var(--success)' }} />
                        <span className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Ubicación:</span>
                      </div>
                      <p className="text-xs ml-4" style={{ color: 'var(--text-secondary)' }}>
                        {selectedLocation.formatted_address}
                      </p>
                      
                      {formData.titulo && (
                        <>
                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            <FiFileText className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                            <span className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Proyecto:</span>
                          </div>
                          <p className="text-xs ml-4" style={{ color: 'var(--text-secondary)' }}>
                            {formData.titulo}
                          </p>
                        </>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {formData.tipoObra && (
                        <>
                          <div className="flex items-center gap-2">
                            <FiHome className="w-3 h-3" style={{ color: 'var(--warning)' }} />
                            <span className="font-medium text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Tipo:</span>
                          </div>
                          <p className="text-xs ml-4" style={{ color: 'var(--text-secondary)' }}>
                            {formData.tipoObra}
                          </p>
                        </>
                      )}
                      
                      <div className="flex items-center gap-2 mt-4">
                        <FiAlertTriangle className="w-4 h-4" style={{ color: 'var(--error)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Prioridad:</span>
                      </div>
                      <div className="ml-6">
                        <span 
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: formData.prioridad === 'alta' ? 'var(--error-bg)' : formData.prioridad === 'media' ? 'var(--warning-bg)' : 'var(--success-bg)',
                            color: formData.prioridad === 'alta' ? 'var(--error-text)' : formData.prioridad === 'media' ? 'var(--warning-text)' : 'var(--success-text)'
                          }}
                        >
                          {formData.prioridad.charAt(0).toUpperCase() + formData.prioridad.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4 sm:pt-5 mt-4 sm:mt-5" style={{ borderTop: '2px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => {
              const currentIndex = getCurrentStepIndex();
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1].id as 'location' | 'basic' | 'contact' | 'additional');
              }
            }}
            disabled={getCurrentStepIndex() === 0}
            className={`btn-secondary flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base min-h-[40px] sm:min-h-[44px] ${
              getCurrentStepIndex() === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            <FiChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Atrás</span>
          </button>

          <div className="text-center order-first sm:order-none">
            <span className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full" 
                  style={{ 
                    color: 'var(--text-secondary)', 
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
              Paso {getCurrentStepIndex() + 1} de {steps.length}
            </span>
          </div>

          {getCurrentStepIndex() < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const currentIndex = getCurrentStepIndex();
                if (isStepCompleted(currentStep)) {
                  setCurrentStep(steps[currentIndex + 1].id as 'location' | 'basic' | 'contact' | 'additional');
                }
              }}
              disabled={!isStepCompleted(currentStep)}
              className={`btn-primary flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base min-h-[40px] sm:min-h-[44px] ${
                isStepCompleted(currentStep) ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">Sigue</span>
              <FiChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedLocation || !formData.titulo || !formData.descripcion}
              className={`btn-primary flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base min-h-[40px] sm:min-h-[44px] ${
                selectedLocation && formData.titulo && formData.descripcion 
                  ? 'hover:scale-105' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Crear Target</span>
              <span className="sm:hidden">Crear</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
