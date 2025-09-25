"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {

  FiPhone,
  FiMail,
  FiUser,
  FiClock,
  FiTool,
  FiDollarSign,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiEdit3,
  FiSave,
  FiHome,
  FiMessageSquare,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiMapPin,
  FiPlus,
  FiTrendingUp
} from 'react-icons/fi';
import { Obra, EtapaObra, EstadoObra,  ObraContacto, REQUIRED_CARGOS } from '../types/obras';
import { Toast } from '@/shared/ui/Toast';
import { useObraQuotes } from '@/hooks/useObraQuotes';
import { PrestamoModal } from './payments/PrestamoModal';
import { PagoModal } from './payments/PagoModal';

interface ObraDetailPageProps {
  obra: Obra;
  onUpdate: (obra: Obra) => Promise<boolean>;
  formatMoney: (amount: number) => string;
  getEstadoColor: (estado: EstadoObra) => { bg: string; text: string };
  getEtapaColor: (etapa: EtapaObra) => { bg: string; text: string };
}

export function ObraDetailPage({
  obra,
  onUpdate,
  formatMoney,
  getEstadoColor,
  getEtapaColor,
}: ObraDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Modo edición rediseñado: panel lateral en lugar de edición inline
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'datos' | 'contacto'>('datos');
  const [isPanelSaving, setIsPanelSaving] = useState(false);
  // Estado editable 
  const [isEditing, setIsEditing] = useState(false); 
  const [editedObra, setEditedObra] = useState<Obra>(obra);
  // Carousel index for 5 fixed cargos
  const [contactCarouselIndex, setContactCarouselIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{success: boolean, message: string} | null>(null);
  const [savedState, setSavedState] = useState<{etapasCompletadas: EtapaObra[], etapaActual: EtapaObra}>(
    {etapasCompletadas: [...obra.etapasCompletadas], etapaActual: obra.etapaActual}
  );

  // Estados para modales de pagos
  const [isPrestamoModalOpen, setIsPrestamoModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

  // Obtener cotizaciones y estadísticas de la obra
  const { quotes,  stats, loading: quotesLoading, refetch: refetchObraData } = useObraQuotes(Number(obra.id));
  
  useEffect(() => {
    setEditedObra(obra);
    
    // También actualizamos el estado guardado cuando cambia la obra
    setSavedState({
      etapasCompletadas: [...obra.etapasCompletadas],
      etapaActual: obra.etapaActual
    });
    
  }, [obra]);

  // Abrir editor automáticamente cuando venimos desde la lista con ?edit=1
  useEffect(() => {
    if (searchParams?.get('edit') === '1') {
      setActiveEditTab('datos');
      setIsEditPanelOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const estadoColor = getEstadoColor(obra.estado);
  const etapaColorCurrent = getEtapaColor(obra.etapaActual);
  const etapas: EtapaObra[] = ['fundacion', 'estructura', 'albanileria', 'instalaciones', 'terminaciones', 'entrega'];

  const getContactsWithCargos = (o: Obra): ObraContacto[] => {
    const list = (o.contactos || []) as ObraContacto[];
    return REQUIRED_CARGOS.map((cargo, idx) => {
      const found = list.find(c => (c.cargo || '').toLowerCase() === cargo.toLowerCase());
      if (found) return { ...found, cargo, es_principal: idx === 0 };
      if (idx === 0 && o.constructora?.contactoPrincipal) {
        const cp = o.constructora.contactoPrincipal;
        return { cargo, nombre: cp.nombre, telefono: cp.telefono, email: cp.email, es_principal: true };
      }
      return { cargo, nombre: 'No existe', telefono: '', email: '', es_principal: idx === 0 };
    });
  };

  const getProgressPercentage = () => {
    return ((obra.etapasCompletadas.length / etapas.length) * 100);
  };

  const setCurrentStage = (etapa: EtapaObra) => {
    const etapaIndex = etapas.indexOf(etapa);
    const prevEtapas = etapas.slice(0, etapaIndex);
    
    const updatedEtapasCompletadas = [...prevEtapas];
    
    setEditedObra({
      ...editedObra,
      etapaActual: etapa,
      etapasCompletadas: updatedEtapasCompletadas
    });
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveResult(null);
      const updated: Obra = {
        ...obra,
        etapaActual: editedObra.etapaActual,
        etapasCompletadas: [...editedObra.etapasCompletadas],
      };
      const ok = await onUpdate(updated);
      if (ok) {
        setSaveResult({ success: true, message: 'Progreso guardado' });
        setSavedState({ etapasCompletadas: [...updated.etapasCompletadas], etapaActual: updated.etapaActual });
        setEditedObra(prev => ({ ...prev, etapaActual: updated.etapaActual, etapasCompletadas: [...updated.etapasCompletadas] }));
        router.refresh?.();
      } else {
        setSaveResult({ success: false, message: 'No se pudo guardar' });
      }
    } catch (e) {
      console.error(e);
      setSaveResult({ success: false, message: 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const getDaysFromNow = (date: Date) => {
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleBack = () => {
    router.back();
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Geocoding autocomplete (modal de edición > Datos)
  type LocationSuggestion = { place_id: string; description: string; structured_formatting?: { main_text: string; secondary_text: string } };
  type LocationDetails = { lat: number; lng: number; formatted_address: string };
  const [locationSearch, setLocationSearch] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  const searchLocation = async (query: string) => {
    if (query.trim().length < 3) {
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

  useEffect(() => {
    if (!locationSearch) return;
    const h = setTimeout(() => searchLocation(locationSearch), 350);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch]);

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
    try {
      setSearchingLocation(true);
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
      };
      setSelectedLocation(details);
      setEditedObra(prev => ({
        ...prev,
        direccionObra: details.formatted_address,
        comuna: match.address?.municipality || match.address?.city_district || match.address?.county || match.address?.suburb || prev.comuna,
        ciudad: match.address?.city || match.address?.town || match.address?.village || match.address?.municipality || prev.ciudad,
      }));
      setLocationSearch(details.formatted_address);
      setShowSuggestions(false);
    } catch (e) {
      console.error('selectLocation error', e);
    } finally {
      setSearchingLocation(false);
    }
  };

  // Confirmar entrega: cuando etapaActual es 'entrega' pasar a estado 'finalizada'
  const [confirmingEntrega, setConfirmingEntrega] = useState(false);
  const [entregaConfirmada, setEntregaConfirmada] = useState(obra.estado === 'finalizada');

  const handleConfirmEntrega = async () => {
    try {
      setConfirmingEntrega(true);
      const updated: Obra = {
        ...obra,
        estado: 'finalizada',
        etapaActual: 'entrega',
        etapasCompletadas: Array.from(new Set([...(obra.etapasCompletadas || []), 'entrega'])) as EtapaObra[],
      };
      const ok = await onUpdate(updated);
      if (ok) {
        Toast.success('Obra marcada como FINALIZADA');
        setEntregaConfirmada(true);
        setEditedObra(updated);
        setSavedState({ etapasCompletadas: [...updated.etapasCompletadas], etapaActual: updated.etapaActual });
        // Refrescar datos de la página para que el listado principal lo refleje
        router.refresh?.();
      } else {
        Toast.error('No se pudo confirmar la entrega');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Error al confirmar la entrega');
    } finally {
      setConfirmingEntrega(false);
    }
  };

  // Editor moderno: abrir/cerrar y guardar
  const openEditPanel = () => {
  setActiveEditTab('datos');
    setIsEditPanelOpen(true);
  };
  const closeEditPanel = () => {
    setIsEditPanelOpen(false);
    setIsEditing(false);
    setEditedObra(obra);
  };
  const saveEditPanel = async () => {
    try {
      setIsPanelSaving(true);
      const ok = await onUpdate(editedObra);
      if (ok) {
        Toast.success('Cambios guardados');
        setSavedState({ etapasCompletadas: [...editedObra.etapasCompletadas], etapaActual: editedObra.etapaActual });
        setIsEditPanelOpen(false);
        setIsEditing(false);
        router.refresh?.();
      } else {
        Toast.error('No se pudieron guardar los cambios');
      }
    } catch (e) {
      console.error(e);
      Toast.error('Error al guardar cambios');
    } finally {
      setIsPanelSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
  <div className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6">
          <ol className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <button
                onClick={() => router.push('/dashboard/obras')}
                className="hover:underline"
                aria-label="Ir a Obras"
                title="Ir a Obras"
                style={{ color: 'var(--accent-primary)' }}
              >
                Obras
              </button>
            </li>
            <li aria-hidden="true">/</li>
            <li className="truncate" aria-current="page" style={{ color: 'var(--text-primary)' }}>
              {obra.nombreEmpresa}
            </li>
          </ol>
        </nav>

        {/* Header principal y Acciones rápidas */}
        <header
          className="rounded-xl p-3 sm:p-5 mb-3 sm:mb-6"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiTool className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {obra.nombreEmpresa}
                  </h1>
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                    {obra.constructora.nombre} • {obra.nombreVendedor}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs font-medium rounded-full" style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}>
                      {obra.estado.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs font-medium rounded-full capitalize" style={{ backgroundColor: etapaColorCurrent.bg, color: etapaColorCurrent.text }}>
                      {obra.etapaActual.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleBack}
                  className="text-sm px-4 py-2 min-h-[44px] flex items-center gap-2 rounded-md transition-all duration-200 font-semibold"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  title="Volver atrás"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Volver</span>
                </button>
                {obra.etapaActual === 'entrega' && obra.estado !== 'finalizada' && (
                  <button
                    onClick={handleConfirmEntrega}
                    disabled={confirmingEntrega}
                    className="text-sm px-3 py-2 min-h-[44px] flex items-center gap-2 rounded-md transition-all duration-200 font-semibold"
                    style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-text)' }}
                    title="Marcar obra como FINALIZADA"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    {confirmingEntrega ? 'Confirmando...' : 'Confirmar entrega'}
                  </button>
                )}
                <button
                  onClick={() => router.push(`/dashboard/obras/${obra.id}/nueva-cotizacion`)}
                  className="text-sm px-4 py-2 min-h-[44px] flex items-center gap-2 rounded-md transition-all duration-200 font-semibold text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                  title="Crear cotización para esta obra"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-primary)')}
                >
                  <FiDollarSign className="w-4 h-4" />
                  <span>Cotizar</span>
                </button>
                <button
                  onClick={openEditPanel}
                  className="text-sm px-4 py-2 min-h-[44px] flex items-center gap-2 rounded-md transition-all duration-200 font-semibold"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  title="Editar datos de la obra"
                >
                  <FiEdit3 className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>
            </div>

            {/* Acciones rápidas para usuarios novatos */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <button onClick={() => scrollTo('section-resumen')} className="flex items-center gap-2 p-3 rounded-lg text-left"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiFileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resumen</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Indicadores y finanzas</p>
                </div>
              </button>
              <button onClick={() => scrollTo('section-informacion')} className="flex items-center gap-2 p-3 rounded-lg text-left"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiHome className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Datos de obra</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Dirección, fechas y vendedor</p>
                </div>
              </button>
              <button onClick={() => scrollTo('section-contacto')} className="flex items-center gap-2 p-3 rounded-lg text-left"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiPhone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Contacto</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Llama o escribe al responsable</p>
                </div>
              </button>
              <button onClick={() => scrollTo('section-progreso')} className="flex items-center gap-2 p-3 rounded-lg text-left"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiActivity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Progreso</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Etapas y avance</p>
                </div>
              </button>
              <button onClick={() => scrollTo('section-cotizaciones')} className="flex items-center gap-2 p-3 rounded-lg text-left"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiDollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cotizaciones</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Historial y documentos</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido principal: columna principal + sidebar sticky */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Columna principal (2/3) */}
          <main className="lg:col-span-2 space-y-4">
            {/* Resumen de la obra (KPI + finanzas) */}
            <section id="section-resumen" className="space-y-3 sm:space-y-4" aria-label="Resumen de la obra">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Material Vendido</p>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1 break-words" style={{ color: 'var(--text-primary)' }}>
                      {formatMoney(obra.materialVendido)}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Monto confirmado de ventas</p>
                  </div>
                  <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--badge-success-bg)' }}>
                    <FiBox size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-success-text)' }} />
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cotizaciones hechas</p>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {quotesLoading ? '...' : stats.totalQuotes}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Documentos emitidos</p>
                  </div>
                  <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--badge-primary-bg)' }}>
                    <FiFileText size={18} className="sm:text-lg md:text-xl" style={{ color: 'var(--badge-primary-text)' }} />
                  </div>
                </div>
              </div>
              </div>
              <div id="section-finanzas" className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <h2 className="text-base font-semibold flex items-center gap-2 mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiDollarSign className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Resumen de cotizaciones
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Total Cotizado</p>
                    <p className="text-lg sm:text-xl font-bold mt-1 break-words" style={{ color: 'var(--text-primary)' }}>
                      {quotesLoading ? '...' : formatMoney(stats.totalCotizado)}
                    </p>
                  </div>
                  <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Material Vendido</p>
                    <p className="text-lg sm:text-xl font-bold mt-1 break-words" style={{ color: 'var(--success-text)' }}>
                      {quotesLoading ? '...' : formatMoney(stats.materialVendido)}
                    </p>
                  </div>
                  <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Pendiente</p>
                      {stats.pendiente > 0 && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Hay montos pendientes por pagar"></div>
                      )}
                    </div>
                    <p className={`text-lg sm:text-xl font-bold mt-1 break-words ${
                      stats.pendiente > 0 ? 'text-orange-600' : 'text-green-600'
                    }`} style={{ color: stats.pendiente > 0 ? 'var(--warning-text)' : 'var(--success-text)' }}>
                      {quotesLoading ? '...' : formatMoney(stats.pendiente)}
                    </p>
                    {stats.pendiente > 0 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Requiere atención
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>% Conversión</p>
                    <p className="text-lg sm:text-xl font-bold mt-1" style={{ color: 'var(--info-text)' }}>
                      {quotesLoading ? '...' : `${stats.conversionRate}%`}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-center" style={{ color: 'var(--text-secondary)' }}>
                    Gestión de Pendientes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                      onClick={() => setIsPrestamoModalOpen(true)}
                      title="Registrar un préstamo o anticipo para esta obra"
                    >
                      <FiTrendingUp className="w-4 h-4" />
                      <span>Registrar Préstamo</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md ${
                        stats.pendiente > 0
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => stats.pendiente > 0 && setIsPagoModalOpen(true)}
                      disabled={stats.pendiente <= 0}
                      title={stats.pendiente > 0 ? "Registrar un pago para reducir el pendiente" : "No hay montos pendientes por pagar"}
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Registrar Pago</span>
                    </button>
                  </div>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Usa estos botones para gestionar los préstamos y pagos de la obra
                  </p>
                </div>
              </div>
            </section>

            {/* Información de la obra (antes que contacto y progreso) */}
            <section id="section-informacion" className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <h2 className="text-base font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                <FiHome className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Información de la obra
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                Datos principales de ubicación, fechas y responsable.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ubicación</label>
                  <div className="mt-1 flex items-start gap-2">
                    <FiMapPin className="w-4 h-4 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{obra.direccionObra}</p>
                      {(obra.comuna || obra.ciudad) && (
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{[obra.comuna, obra.ciudad].filter(Boolean).join(' — ')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Constructora</label>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{obra.constructora.nombre}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>RUT: {obra.constructora.rut}</p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha de inicio</label>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(obra.fechaInicio)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Vendedor asignado</label>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{obra.nombreVendedor}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{obra.descripcion || '—'}</p>
              </div>
            </section>

            {/* Contactos - Carrusel de 5 cargos fijos */}
            <section id="section-contacto" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Contactos de la obra
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setContactCarouselIndex((i) => Math.max(0, i - 1))}
                    className="p-1 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    aria-label="Anterior"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setContactCarouselIndex((i) => Math.min(4, i + 1))}
                    className="p-1 rounded"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    aria-label="Siguiente"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(() => {
                const contacts = getContactsWithCargos(obra);
                const c = contacts[contactCarouselIndex];
                return (
                  <div className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nombre Completo</label>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{c.nombre}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cargo</label>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{c.cargo}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FiPhone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <div className="min-w-0 w-full">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Teléfono</p>
                            {c.telefono ? (
                              <a href={`tel:${c.telefono}`} className="text-sm font-medium transition-colors truncate block" style={{ color: 'var(--accent-primary)' }}>
                                {c.telefono}
                              </a>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </div>
                        </div>
                        {c.telefono && (
                          <button className="btn-primary text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0" onClick={() => window.open(`tel:${c.telefono}`)}>
                            <FiPhone className="w-3 h-3" />
                            <span className="hidden xs:inline">Llamar</span>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FiMail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                          <div className="min-w-0 w-full">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email</p>
                            {c.email ? (
                              <a href={`mailto:${c.email}`} className="text-sm font-medium transition-colors truncate block" style={{ color: 'var(--accent-primary)' }}>
                                {c.email}
                              </a>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </div>
                        </div>
                        {c.email && (
                          <button className="btn-secondary text-xs px-2 py-1 flex items-center gap-1 flex-shrink-0" onClick={() => window.open(`mailto:${c.email}`)}>
                            <FiMail className="w-3 h-3" />
                            <span className="hidden xs:inline">Email</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {contactCarouselIndex + 1} / 5
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* Progreso de la obra (al final) */}
            <section id="section-progreso" className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiActivity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Progreso de la obra
                </h2>
                {obra.etapaActual === 'entrega' && obra.estado !== 'finalizada' && (
                  <button onClick={handleConfirmEntrega} disabled={confirmingEntrega} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-text)' }}>
                    {confirmingEntrega ? 'Confirmando...' : 'Confirmar entrega'}
                  </button>
                )}
                {(JSON.stringify(savedState.etapasCompletadas) !== JSON.stringify(editedObra.etapasCompletadas) || savedState.etapaActual !== editedObra.etapaActual) && (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}>Cambios pendientes</span>
                )}
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                Marca la etapa actual para mantener un seguimiento claro del avance.
              </p>
              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="w-full h-2 rounded" style={{ backgroundColor: 'var(--border)' }}>
                  <div className="h-2 rounded" style={{ width: `${Math.round(getProgressPercentage())}%`, backgroundColor: 'var(--accent-primary)' }} />
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{Math.round(getProgressPercentage())}% completado</div>
              </div>
              <div className="space-y-4">
                {etapas.map((etapa, index) => {
                  const isCompleted = editedObra.etapasCompletadas.includes(etapa);
                  const isCurrent = editedObra.etapaActual === etapa;
                  const etapaColor = getEtapaColor(etapa);
                  return (
                    <div key={etapa} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium`}
                          style={{
                            backgroundColor: isCompleted ? 'var(--success-bg)' : isCurrent ? etapaColor.bg : 'var(--bg-secondary)',
                            color: isCompleted ? 'var(--success-text)' : isCurrent ? etapaColor.text : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: isCompleted ? 'var(--success-text)' : isCurrent ? etapaColor.text : 'var(--border)'
                          }}
                        >
                          {isCompleted ? <FiCheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                        {index < etapas.length - 1 && (
                          <div className="w-px h-8 mx-auto" style={{ backgroundColor: isCompleted ? 'var(--success-text)' : 'var(--border)' }} />
                        )}
                      </div>
                      <div className="flex-1 pt-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h3 className="text-sm font-medium capitalize" style={{ color: isCompleted ? 'var(--success-text)' : isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {etapa.replace('_', ' ')}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isCompleted && (
                              <span className="text-xs px-3 py-1 rounded" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>Completado</span>
                            )}
                            {isCurrent ? (
                              <span className="text-xs px-3 py-1 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>En progreso</span>
                            ) : (
                              <button onClick={() => setCurrentStage(etapa)} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
                                Establecer actual
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {(JSON.stringify(savedState.etapasCompletadas) !== JSON.stringify(editedObra.etapasCompletadas) || savedState.etapaActual !== editedObra.etapaActual) && (
                <div className="mt-4 flex justify-end items-center gap-3">
                  {saveResult && (
                    <div className="text-sm px-3 py-1 rounded" style={{ backgroundColor: saveResult.success ? 'var(--success-bg)' : 'var(--error-bg)', color: saveResult.success ? 'var(--success-text)' : 'var(--error-text)' }}>
                      {saveResult.message}
                    </div>
                  )}
                  <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 rounded" style={{ backgroundColor: isSaving ? 'var(--bg-secondary)' : 'var(--accent-primary)', color: isSaving ? 'var(--text-secondary)' : 'white' }}>
                    {isSaving ? (<div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />) : (<FiSave className="w-4 h-4" />)}
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </section>

            {/* Historial de cotizaciones y notas de venta */}
            <section id="section-cotizaciones" className="p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiFileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Historial de cotizaciones
                </h2>
                <button
                  onClick={() => router.push(`/dashboard/obras/${obra.id}/nueva-cotizacion`)}
                  className="text-sm px-3 py-2 flex items-center gap-2 rounded-md transition-all duration-200 font-semibold text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                  title="Crear nueva cotización"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Nueva</span>
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                Historial completo de cotizaciones y notas de venta generadas para esta obra.
              </p>

              {quotesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent border-current rounded-full animate-spin" style={{ color: 'var(--accent-primary)' }} />
                  <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando cotizaciones...</span>
                </div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No hay cotizaciones para esta obra</p>
                  <button
                    onClick={() => router.push(`/dashboard/obras/${obra.id}/nueva-cotizacion`)}
                    className="mt-3 text-sm px-4 py-2 rounded-md font-semibold text-white"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    Crear primera cotización
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Cotizaciones */}
                  {quotes.map((quote) => (
                    <div key={quote.id} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FiFileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              Cotización {quote.folio || `#${quote.id}`}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              quote.estado === 'aceptada' ? 'bg-green-100 text-green-800' :
                              quote.estado === 'enviada' ? 'bg-blue-100 text-blue-800' :
                              quote.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                              quote.estado === 'expirada' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {quote.estado}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <div>
                              <span className="font-medium">Cliente:</span> {quote.cliente_principal?.nombre_razon_social || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Fecha:</span> {new Date(quote.fecha_emision).toLocaleDateString('es-CL')}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> {formatMoney(quote.total_final || 0)}
                            </div>
                          </div>
                          {quote.nota_venta_id && (
                            <div className="mt-2 p-2 rounded" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-text)' }}>
                              <div className="flex items-center gap-2">
                                <FiCheckCircle className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                                <span className="text-xs font-medium" style={{ color: 'var(--success-text)' }}>
                                  Tiene nota de venta asociada (ID: {quote.nota_venta_id})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/cotizaciones/${quote.folio || `COT-${quote.id}`}`)}
                          className="text-xs px-3 py-1 rounded font-medium transition-colors"
                          style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                          title="Ver cotización completa"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* TODO: Implementar notas de venta independientes */}
                  {/* {salesNotes.filter(note => !quotes.some(q => q.nota_venta_id === note.id)).map((note) => (
                    <div key={`nota-${note.id}`} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FiCheckCircle className="w-4 h-4" style={{ color: 'var(--success-text)' }} />
                            <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              Nota de venta {note.folio}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                              Vendida
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <div>
                              <span className="font-medium">Fecha:</span> {new Date(note.fecha_emision).toLocaleDateString('es-CL')}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> {formatMoney(note.total_final)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/notas-venta/${note.id}`)}
                          className="text-xs px-3 py-1 rounded font-medium transition-colors"
                          style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-text)' }}
                          title="Ver nota de venta"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  ))} */}
                </div>
              )}
            </section>

            {/* Pie de finanzas y accesos rápidos */}
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Actualizado: {formatDate(obra.fechaActualizacion)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button className="btn-secondary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2">
                  <FiMessageSquare className="w-3 h-3" />
                  <span className="hidden xs:inline">Agregar Nota</span>
                  <span className="xs:hidden">Nota</span>
                </button>
                <button className="btn-secondary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2" onClick={() => scrollTo('section-informacion')}>
                  <FiHome className="w-3 h-3" />
                  <span className="hidden xs:inline">Datos de Obra</span>
                  <span className="xs:hidden">Datos</span>
                </button>
                <button className="btn-primary text-xs sm:text-sm flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2" onClick={() => scrollTo('section-contacto')}>
                  <FiPhone className="w-3 h-3" />
                  <span className="hidden xs:inline">Contactar</span>
                  <span className="xs:hidden">Llamar</span>
                </button>
              </div>
            </section>
          </main>

          {/* Sidebar sticky (1/3) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-6 h-fit space-y-4">
            <section className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Resumen</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Estado</span>
                  <div className="mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: estadoColor.bg, color: estadoColor.text, fontWeight: 600 }}>
                    {obra.estado.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Etapa</span>
                  <div className="mt-1 px-2 py-0.5 rounded-full inline-block capitalize" style={{ backgroundColor: etapaColorCurrent.bg, color: etapaColorCurrent.text, fontWeight: 600 }}>
                    {obra.etapaActual.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Inicio</span>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(obra.fechaInicio)}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Últ. contacto</span>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Hace {getDaysFromNow(obra.fechaUltimoContacto)} días</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Progreso</span>
                  <p className="font-medium" style={{ color: 'var(--accent-primary)' }}>{Math.round(getProgressPercentage())}%</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Vendedor</span>
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{obra.nombreVendedor}</p>
                </div>
              </div>
            </section>
            <section className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Constructora</h3>
              <div className="space-y-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                <p className="font-medium">{obra.constructora.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>RUT: {obra.constructora.rut}</p>
                <p className="text-xs">Tel: {obra.constructora.telefono}</p>
                {obra.constructora.email && <p className="text-xs">Email: {obra.constructora.email}</p>}
                {obra.constructora.direccion && <p className="text-xs">Dirección: {obra.constructora.direccion}</p>}
              </div>
            </section>
            <section className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Próximos hitos</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <FiAlertCircle className="w-4 h-4" style={{ color: 'var(--warning-text)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Revisión de instalaciones</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>En 7 días</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <FiClock className="w-4 h-4" style={{ color: 'var(--info-text)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Entrega de material fase {obra.etapasCompletadas.length + 1}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>En 14 días</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
      {/* Editor en modal centrado y responsivo */}
      {isEditPanelOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditPanel} />
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[640px] md:w-[760px] lg:w-[860px] rounded-none sm:rounded-xl overflow-hidden"
               style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between sticky top-0 z-10" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 rounded" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                  <FiEdit3 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Editar obra</h3>
                  <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{obra.nombreEmpresa}</p>
                </div>
              </div>
              <button onClick={closeEditPanel} className="btn-secondary text-xs px-2 py-1">Cerrar</button>
            </div>
            {/* Tabs */}
            <div className="px-4 pt-3 sticky top-[56px] z-10" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="grid grid-cols-2 gap-2">
                {(['datos','contacto'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveEditTab(tab)}
                    className={`text-xs sm:text-sm px-2 py-2 rounded font-medium ${activeEditTab===tab ? 'shadow' : ''}`}
                    style={{ backgroundColor: activeEditTab===tab ? 'var(--accent-bg)' : 'var(--bg-secondary)', color: activeEditTab===tab ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                    {tab === 'datos' && 'Datos'}
                    {tab === 'contacto' && 'Contacto'}
                  </button>
                ))}
              </div>
            </div>
            {/* Content */}
            <div className="max-h-[calc(100%-112px)] sm:max-h-[60vh] overflow-auto p-4 space-y-4">
                 {activeEditTab === 'datos' && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative" ref={suggestionsRef}>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Dirección (autocompletar)</label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={locationSearch || editedObra.direccionObra}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        onFocus={() => setShowSuggestions(!!locationSuggestions.length)}
                        className="mt-1 w-full px-2 py-2 rounded text-sm"
                        placeholder="Escribe calle y número..."
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                      <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>Selecciona una dirección.</p>
                      {showSuggestions && (
                        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                          {searchingLocation && (
                            <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>Buscando...</div>
                          )}
                          {!searchingLocation && locationSuggestions.length === 0 && (
                            <div className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>Sin resultados</div>
                          )}
                          {locationSuggestions.map(s => (
                            <button
                              key={s.place_id}
                              onClick={() => selectLocation(s)}
                              className="w-full text-left px-3 py-2 hover:opacity-80"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              <div className="text-sm truncate">{s.structured_formatting?.main_text || s.description}</div>
                              {s.structured_formatting?.secondary_text && (
                                <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{s.structured_formatting.secondary_text}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedLocation && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            className="btn-secondary text-xs px-2 py-1"
                            onClick={() => window.open(`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`,'_blank')}
                          >
                            Ver en Maps
                          </button>
                          <button
                            className="btn-primary text-xs px-2 py-1"
                            onClick={() => {
                              // Confirmar selección en el modelo editable
                              setEditedObra(prev => ({ ...prev, direccionObra: locationSearch || prev.direccionObra }));
                              Toast.success('Dirección validada por geocoding');
                            }}
                          >
                            Usar esta dirección
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Comuna</label>
                        <input type="text" value={editedObra.comuna || ''} onChange={(e) => setEditedObra({ ...editedObra, comuna: e.target.value })} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Ciudad</label>
                        <input type="text" value={editedObra.ciudad || ''} onChange={(e) => setEditedObra({ ...editedObra, ciudad: e.target.value })} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha de inicio</label>
                        <input type="date" value={new Date(editedObra.fechaInicio).toISOString().slice(0, 10)} onChange={(e) => setEditedObra({ ...editedObra, fechaInicio: new Date(e.target.value) })} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Fecha estimada fin</label>
                        <input type="date" value={editedObra.fechaEstimadaFin ? new Date(editedObra.fechaEstimadaFin).toISOString().slice(0, 10) : ''} onChange={(e) => setEditedObra({ ...editedObra, fechaEstimadaFin: e.target.value ? new Date(e.target.value) : undefined })} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Vendedor asignado</label>
                      <input type="text" value={editedObra.nombreVendedor} onChange={(e) => setEditedObra({ ...editedObra, nombreVendedor: e.target.value })} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                )}
                {activeEditTab === 'contacto' && (
                  <div className="grid grid-cols-1 gap-3">
                    {getContactsWithCargos(editedObra).map((c, idx) => (
                      <div key={c.cargo} className="p-3 rounded border" style={{ borderColor: 'var(--border)' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Cargo</label>
                            <input type="text" value={c.cargo} readOnly className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Nombre</label>
                            <div className="flex gap-2">
                              <input type="text" value={c.nombre} onChange={(e) => {
                                const updated = [...(editedObra.contactos || [])];
                                const i = updated.findIndex(x => (x.cargo || '').toLowerCase() === c.cargo.toLowerCase());
                                if (i >= 0) updated[i] = { ...updated[i], nombre: e.target.value };
                                else updated.push({ cargo: c.cargo, nombre: e.target.value, telefono: '', email: '', es_principal: idx === 0 });
                                setEditedObra({ ...editedObra, contactos: updated });
                              }} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                              <button type="button" className="px-2 py-2 text-xs rounded border" onClick={() => {
                                const updated = [...(editedObra.contactos || [])];
                                const i = updated.findIndex(x => (x.cargo || '').toLowerCase() === c.cargo.toLowerCase());
                                if (i >= 0) updated[i] = { ...updated[i], nombre: 'No existe', telefono: '', email: '' };
                                else updated.push({ cargo: c.cargo, nombre: 'No existe', telefono: '', email: '', es_principal: idx === 0 });
                                setEditedObra({ ...editedObra, contactos: updated });
                              }} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>No existe</button>
                            </div>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
                            <input type="tel" value={c.telefono || ''} onChange={(e) => {
                              const updated = [...(editedObra.contactos || [])];
                              const i = updated.findIndex(x => (x.cargo || '').toLowerCase() === c.cargo.toLowerCase());
                              if (i >= 0) updated[i] = { ...updated[i], telefono: e.target.value };
                              else updated.push({ cargo: c.cargo, nombre: '', telefono: e.target.value, email: '', es_principal: idx === 0 });
                              setEditedObra({ ...editedObra, contactos: updated });
                            }} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Email</label>
                            <input type="email" value={c.email || ''} onChange={(e) => {
                              const updated = [...(editedObra.contactos || [])];
                              const i = updated.findIndex(x => (x.cargo || '').toLowerCase() === c.cargo.toLowerCase());
                              if (i >= 0) updated[i] = { ...updated[i], email: e.target.value };
                              else updated.push({ cargo: c.cargo, nombre: '', telefono: '', email: e.target.value, es_principal: idx === 0 });
                              setEditedObra({ ...editedObra, contactos: updated });
                            }} className="mt-1 w-full px-2 py-2 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            {/* Footer */}
            <div className="p-3 border-t flex items-center justify-end gap-2 sticky bottom-0 z-10" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <button onClick={closeEditPanel} className="btn-secondary text-xs px-3 py-2">Cancelar</button>
              <button onClick={saveEditPanel} disabled={isPanelSaving} className="btn-primary text-xs px-3 py-2 flex items-center gap-2">
                {isPanelSaving ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                {isPanelSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales de pagos */}
      <PrestamoModal
        isOpen={isPrestamoModalOpen}
        onClose={() => setIsPrestamoModalOpen(false)}
        obraId={obra.id}
        pendienteActual={stats.pendiente}
        onPrestamoAdded={async () => {
          // Refrescar datos de la obra y estadísticas
          console.log('Préstamo agregado, refrescando datos');
          await refetchObraData();
        }}
      />

      <PagoModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        obraId={obra.id}
        pendienteActual={stats.pendiente}
        onPagoAdded={async () => {
          // Refrescar datos de la obra y estadísticas
          console.log('Pago agregado, refrescando datos');
          await refetchObraData();
        }}
      />
    </div>
  );
}
