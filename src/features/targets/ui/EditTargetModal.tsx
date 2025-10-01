'use client'

import { useState, useEffect, useRef } from "react";
import { FiX, FiMapPin, FiSearch, FiLoader, FiCheckCircle, FiUser, FiFileText, FiClock, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Modal } from "../../../shared/ui/Modal";
import { useTargets } from "../model/useTargets";
import { supabase } from '@/lib/supabase';
import type { PosibleTarget } from "../model/types";

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: PosibleTarget;
  onUpdated: () => void;
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

export default function EditTargetModal({ isOpen, onClose, target, onUpdated }: EditTargetModalProps) {
  const { updateTarget } = useTargets();
  
  const [currentStep, setCurrentStep] = useState<'location' | 'basic' | 'contact' | 'additional'>('location');
  const [locationSearch, setLocationSearch] = useState('');
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    comuna: "",
    contactoNombre: "",
    contactoTelefono: "",
    contactoEmail: "",
    contactoEmpresa: "",
    prioridad: "media" as 'baja' | 'media' | 'alta',
    tipoObra: "",
    fechaEstimadaInicio: "",
    observaciones: ""
  });
  const [tipos, setTipos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('target_tipos').select('nombre').order('nombre');
      setTipos((data || []).map(t => t.nombre));
    })();
  }, []);

  // Initialize form data when target changes
  useEffect(() => {
    if (target && isOpen) {
      setFormData({
        titulo: target.titulo,
        descripcion: target.descripcion,
        direccion: target.ubicacion.direccion,
        lat: target.ubicacion.lat,
        lng: target.ubicacion.lng,
        ciudad: target.ubicacion.ciudad || "",
        region: target.ubicacion.region || "",
        comuna: target.ubicacion.comuna || "",
        contactoNombre: target.contacto.nombre || "",
        contactoTelefono: target.contacto.telefono || "",
        contactoEmail: target.contacto.email || "",
        contactoEmpresa: target.contacto.empresa || "",
        prioridad: target.prioridad,
        tipoObra: target.tipoObra || "",
        fechaEstimadaInicio: target.fechaEstimadaInicio || "",
        observaciones: target.observaciones || ""
      });
      setSelectedLocation({
        lat: target.ubicacion.lat,
        lng: target.ubicacion.lng,
        formatted_address: target.ubicacion.direccion,
        address_components: []
      });
      setCurrentStep('location');
    }
  }, [target, isOpen]);

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
        return true;
      default:
        return false;
    }
  };

  // Búsqueda de ubicaciones usando API interna (Nominatim)
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingLocation(true);
    try {
      abortCtrl?.abort();
      const controller = new AbortController();
      setAbortCtrl(controller);
      const res = await fetch(`/api/geocoding?action=search&q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (!res.ok) throw new Error('Fallo en búsqueda');
      const data = await res.json();
      type RawGeoResult = { place_id?: string; description?: string; structured_formatting?: { main_text?: string; secondary_text?: string } };
      const suggestions: LocationSuggestion[] = (data.results || []).map((r: RawGeoResult) => ({
        place_id: r.place_id || '',
        description: r.description || '',
        structured_formatting: r.structured_formatting as { main_text: string; secondary_text: string } || { main_text: r.description || '', secondary_text: '' },
      }));
      setLocationSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.name !== 'AbortError') console.error('searchLocation error', e);
      } else {
        console.error('searchLocation error (unknown):', e);
      }
      setLocationSuggestions([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    if (!locationSearch) return;
    const h = setTimeout(() => searchLocation(locationSearch), 350);
    return () => clearTimeout(h);
  }, [locationSearch, searchLocation]);

  // Close suggestions on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        abortCtrl?.abort();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [abortCtrl]);

  const selectLocation = async (suggestion: LocationSuggestion) => {
    setSearchingLocation(true);
    try {
      const res = await fetch(`/api/geocoding?action=search&q=${encodeURIComponent(suggestion.description)}`);
      if (!res.ok) throw new Error('Fallo al obtener detalles');
      const data = await res.json();
      type RawGeoResult = { lat?: string | number; lon?: string | number; lng?: string | number; description?: string; address?: Record<string, unknown>; place_id?: string };
      const match = (data.results || []).find((r: RawGeoResult) => r.description === suggestion.description) || (data.results || [])[0] as RawGeoResult;
      if (!match) throw new Error('Sin resultados');

      const details: LocationDetails = {
        lat: Number(match.lat),
        lng: Number(match.lng),
        formatted_address: match.description,
        address_components: (match.address && Object.keys(match.address).length)
          ? [
              ...(typeof match.address['road'] === 'string' ? [{ long_name: match.address['road'] as string, short_name: match.address['road'] as string, types: ['route'] as string[] }] : []),
              ...(typeof match.address['city'] === 'string' ? [{ long_name: match.address['city'] as string, short_name: match.address['city'] as string, types: ['locality'] as string[] }] : []),
              ...(typeof match.address['state'] === 'string' ? [{ long_name: match.address['state'] as string, short_name: match.address['state'] as string, types: ['administrative_area_level_1'] as string[] }] : []),
            ]
          : [],
      };

      setSelectedLocation(details);
      setFormData(prev => ({
        ...prev,
        direccion: details.formatted_address,
        lat: details.lat,
        lng: details.lng,
        ciudad: details.address_components.find(c => c.types.includes('locality'))?.long_name || '',
        region: details.address_components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
        comuna: (match.address?.municipality || match.address?.city_district || match.address?.county || match.address?.suburb || '')
      }));
      setLocationSearch('');
      setLocationSuggestions([]);
    } catch (e) {
      console.error('selectLocation error', e);
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSuccessMessage('');
    try {
      await updateTarget(target.id, {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        direccion: formData.direccion,
        lat: formData.lat,
        lng: formData.lng,
        ciudad: formData.ciudad,
        region: formData.region,
        comuna: formData.comuna,
        contactoNombre: formData.contactoNombre,
        contactoTelefono: formData.contactoTelefono,
        contactoEmail: formData.contactoEmail,
        contactoEmpresa: formData.contactoEmpresa,
        prioridad: formData.prioridad,
        tipoObra: formData.tipoObra,
        fechaEstimadaInicio: formData.fechaEstimadaInicio,
        observaciones: formData.observaciones
      });
      setSuccessMessage('¡Target actualizado exitosamente!');
      // Cerrar inmediatamente ya que el estado se actualiza localmente
      onUpdated();
    } catch (error) {
      console.error('Error updating target:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'location':
        return !!selectedLocation;
      case 'basic':
        return formData.titulo.trim() && formData.descripcion.trim();
      case 'contact':
        return formData.contactoNombre.trim() || formData.contactoTelefono.trim() || formData.contactoEmail.trim();
      case 'additional':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as typeof currentStep);
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as typeof currentStep);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editar Target</h2>
              <p className="text-sm text-gray-600 mt-1">Modifica la información del target potencial</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = isStepCompleted(step.id);
                const isCurrent = step.id === currentStep;
                const isPast = getCurrentStepIndex() > index;

                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted || isPast ? 'bg-blue-500 border-blue-500 text-white' :
                      isCurrent ? 'border-blue-500 text-blue-500' :
                      'border-gray-300 text-gray-300'
                    }`}>
                      {isCompleted || isPast ? <FiCheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted || isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 mt-1">
                          {step.id === 'location' && 'Busca y selecciona la ubicación del proyecto'}
                          {step.id === 'basic' && 'Ingresa el título y descripción del target'}
                          {step.id === 'contact' && 'Agrega información de contacto (opcional)'}
                          {step.id === 'additional' && 'Configura prioridad, tipo y fechas adicionales'}
                        </p>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-4 ${isPast ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'location' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ubicación del Target</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Busca la dirección exacta donde se realizará el proyecto. Puedes escribir el nombre de la calle, barrio o punto de referencia.
                </p>
                <div className="relative">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Ej: Av. Providencia 123, Santiago"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchingLocation && <FiLoader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />}
                  </div>

                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      <p className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">Selecciona una dirección de la lista:</p>
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectLocation(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{suggestion.structured_formatting.main_text}</div>
                          <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedLocation && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-green-800 font-medium">Ubicación seleccionada correctamente</span>
                    </div>
                    <p className="text-green-700 mt-1">{selectedLocation.formatted_address}</p>
                    <p className="text-green-600 text-sm mt-1">Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}</p>
                  </div>
                )}

                {!selectedLocation && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <FiMapPin className="w-5 h-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-blue-800 font-medium">¿No encuentras la dirección exacta?</p>
                        <p className="text-blue-700 text-sm mt-1">Puedes escribir una dirección aproximada o punto de referencia cercano.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    💡 Si no vas a hacer ningún cambio en esta sección, presiona &quot;Siguiente&quot; para continuar
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Información Básica</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Describe brevemente el proyecto potencial. Un buen título y descripción ayudarán a identificar rápidamente el tipo de obra.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Target <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Construcción casa habitación 3 pisos"
                />
                <p className="text-xs text-gray-500 mt-1">Sé específico sobre el tipo de proyecto</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe los detalles del proyecto, superficie aproximada, características especiales, etc."
                />
                <p className="text-xs text-gray-500 mt-1">Incluye detalles que ayuden a evaluar el potencial del proyecto</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData(prev => ({ ...prev, prioridad: e.target.value as 'baja' | 'media' | 'alta' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="baja">Baja - Proyecto de bajo interés</option>
                    <option value="media">Media - Proyecto interesante</option>
                    <option value="alta">Alta - Proyecto prioritario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Obra</label>
                  <select
                    value={formData.tipoObra}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoObra: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo de obra</option>
                    {tipos.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Categoriza el tipo de construcción</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  💡 Si no vas a hacer ningún cambio en esta sección, presiona &quot;Siguiente&quot; para continuar
                </p>
              </div>
            </div>
          )}

          {currentStep === 'contact' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Información de Contacto</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Agrega los datos de contacto del cliente potencial. Esta información es opcional pero muy útil para el seguimiento.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Contacto</label>
                <input
                  type="text"
                  value={formData.contactoNombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactoNombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre completo del cliente"
                />
                <p className="text-xs text-gray-500 mt-1">Persona de contacto principal</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.contactoTelefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactoTelefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+56 9 1234 5678"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número para llamadas y WhatsApp</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.contactoEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactoEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contacto@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para envío de cotizaciones y seguimiento</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <input
                  type="text"
                  value={formData.contactoEmpresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactoEmpresa: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre de la empresa o constructora"
                />
                <p className="text-xs text-gray-500 mt-1">Empresa constructora o inmobiliaria</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FiUser className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium">¿Por qué es importante la información de contacto?</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Estos datos te permitirán contactar al cliente potencial, enviar cotizaciones y hacer seguimiento del proyecto.
                      Puedes completar esta información más tarde si no la tienes ahora.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  💡 Si no vas a hacer ningún cambio en esta sección, presiona &quot;Siguiente&quot; para continuar
                </p>
              </div>
            </div>
          )}

          {currentStep === 'additional' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Información Adicional</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configura detalles adicionales para organizar mejor el seguimiento del proyecto.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Estimada de Inicio</label>
                <input
                  type="date"
                  value={formData.fechaEstimadaInicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaEstimadaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">¿Cuándo planea el cliente comenzar la obra?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales, requerimientos especiales, presupuesto aproximado, etc."
                />
                <p className="text-xs text-gray-500 mt-1">Información adicional que consideres importante para este proyecto</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FiCheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">¡Listo para guardar!</p>
                    <p className="text-green-700 text-sm mt-1">
                      Has completado toda la información necesaria. Revisa los datos y guarda los cambios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {successMessage ? (
            <div className="flex items-center text-green-600">
              <FiCheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">{successMessage}</span>
            </div>
          ) : (
            <button
              onClick={prevStep}
              disabled={getCurrentStepIndex() === 0}
              className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </button>
          )}

          {getCurrentStepIndex() === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || saving || !!successMessage}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : successMessage ? (
                <>
                  <FiCheckCircle className="w-4 h-4 mr-2" />
                  Cerrando...
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <FiChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}