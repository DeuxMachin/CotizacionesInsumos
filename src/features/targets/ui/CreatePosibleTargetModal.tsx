"use client";

import { useState } from "react";
import { FiX, FiMapPin, FiSearch, FiLoader, FiMap, FiCheckCircle } from "react-icons/fi";
import { Modal } from "@/shared/ui/Modal";

import type { CreateTargetData } from "../model/types";

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
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export function CreateTargetModal({ isOpen, onClose }: CreateTargetModalProps) {

  const [formData, setFormData] = useState<CreateTargetData>({
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
  
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);
  const [step, setStep] = useState<'location' | 'details'>('location');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      alert("Por favor selecciona una ubicación");
      return;
    }

    try {
     
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
      setStep('location');
      setSelectedLocation(null);
    } catch (error) {
      console.error("Error creating target:", error);
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
      <div className="max-w-2xl mx-auto">
        {/* Header con pasos */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Nuevo Posible Target
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'location' 
                  ? 'bg-orange-600 text-white' 
                  : selectedLocation 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                {selectedLocation ? <FiCheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Ubicación</span>
              <div className="w-6 h-px bg-gray-300 dark:bg-gray-600" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 'details' && selectedLocation
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Detalles</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Paso 1: Selección de Ubicación */}
        {step === 'location' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiMapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Buscar Ubicación del Target
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Busca la dirección exacta donde se encuentra la oportunidad o usa tu ubicación actual
              </p>
            </div>

            {/* Buscador de ubicación */}
            <div className="space-y-4">
              <div className="relative">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar dirección, comuna o punto de referencia..."
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      searchLocation(e.target.value);
                    }}
                    className="input-field pl-10 pr-4"
                  />
                  {searchingLocation && (
                    <FiLoader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5 animate-spin" />
                  )}
                </div>

                {/* Sugerencias de ubicación */}
                {locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        onClick={() => selectLocation(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {suggestion.structured_formatting.main_text}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de ubicación actual */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={searchingLocation}
                  className="btn-secondary flex items-center gap-2 mx-auto"
                >
                  {searchingLocation ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiMapPin className="w-4 h-4" />
                  )}
                  Usar mi ubicación actual
                </button>
              </div>

              {/* Ubicación seleccionada */}
              {selectedLocation && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                          Ubicación Seleccionada
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                          {selectedLocation.formatted_address}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                          <span>Lat: {selectedLocation.lat.toFixed(6)}</span>
                          <span>Lng: {selectedLocation.lng.toFixed(6)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openInMaps}
                      className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    >
                      <FiMap className="w-3 h-3" />
                      Ver en Mapa
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón continuar */}
            {selectedLocation && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="btn-primary"
                >
                  Continuar con Detalles
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 2: Detalles del Target */}
        {step === 'details' && selectedLocation && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información del Target
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título del Target *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Construcción residencial en Las Condes"
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe lo que observaste en el sitio..."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Obra
                  </label>
                  <select
                    value={formData.tipoObra}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoObra: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Infraestructura">Infraestructura</option>
                    <option value="Remodelación">Remodelación</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridad *
                  </label>
                  <select
                    required
                    value={formData.prioridad}
                    onChange={(e) => setFormData(prev => ({ ...prev, prioridad: e.target.value as any }))}
                    className="input-field"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información de Contacto
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contactoNombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactoNombre: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.contactoTelefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactoTelefono: e.target.value }))}
                    placeholder="+56 9 XXXX XXXX"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactoEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactoEmail: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.contactoEmpresa}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactoEmpresa: e.target.value }))}
                    placeholder="Nombre de la empresa"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información Adicional
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha Estimada de Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.fechaEstimadaInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaEstimadaInicio: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Notas adicionales, observaciones del sitio, etc..."
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setStep('location')}
                className="btn-secondary"
              >
                Volver a Ubicación
              </button>
              
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
