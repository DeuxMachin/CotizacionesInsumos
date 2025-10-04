"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  FiX, 
  FiSave, 
  FiUser, 
  FiHome, 
  FiCalendar, 
  FiBriefcase,
  FiFileText,
  FiAlertCircle,
  FiCheck,
  FiTool,
  FiMapPin,
  FiCheckCircle
} from "react-icons/fi";
import { Modal } from "@/shared/ui/Modal";
import { ClientesService } from "@/services/clientesService";
import { supabase, type Database } from "@/lib/supabase";
import type { Obra, EstadoObra, EtapaObra, ContactoObra, EmpresaConstructora, ObraContacto } from "../types/obras";
import { REQUIRED_CARGOS } from "../types/obras";

interface CreateObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>) => Promise<boolean>;
  currentUserId: string;
  currentUserName: string;
}

interface FormErrors {
  nombreEmpresa?: string;
  constructora?: {
    nombre?: string;
    rut?: string;
    telefono?: string;
    contactoPrincipal?: {
      nombre?: string;
      cargo?: string;
      telefono?: string;
      email?: string;
    };
  };
  direccionObra?: string;
  fechaInicio?: string;
  valorEstimado?: string;
  contactos?: Record<number, { nombre?: string }>;
}

export function CreateObraModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentUserId,
  currentUserName
}: CreateObraModalProps) {
  // Estados del formulario
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [stepErrors, setStepErrors] = useState<string[]>([]);

  // Datos de la obra
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccionObra, setDireccionObra] = useState('');
  const [comuna, setComuna] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [region, setRegion] = useState('');
  
  // Estados para geocoding
  const [direccionQuery, setDireccionQuery] = useState('');
  const [direccionResults, setDireccionResults] = useState<Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    lat: number;
    lng: number;
    address: Record<string, unknown>;
  }>>([]);
  const [searchingDirecciones, setSearchingDirecciones] = useState(false);
  const [showDireccionDropdown, setShowDireccionDropdown] = useState(false);
  const direccionSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaEstimadaFin, setFechaEstimadaFin] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [materialVendido, setMaterialVendido] = useState('0');
  const [proximoSeguimiento, setProximoSeguimiento] = useState('');
  const [notas, setNotas] = useState('');
  const [estado, setEstado] = useState<EstadoObra>('planificacion');
  const [etapaActual, setEtapaActual] = useState<EtapaObra>('fundacion');

  // Datos de la constructora
  const [constructoraNombre, setConstructoraNombre] = useState('');
  const [constructoraRut, setConstructoraRut] = useState('');
  const [constructoraTelefono, setConstructoraTelefono] = useState('');
  const [constructoraEmail, setConstructoraEmail] = useState('');
  const [constructoraDireccion, setConstructoraDireccion] = useState('');
  // Cliente vinculado y autocompletado
  const [clienteId, setClienteId] = useState<number | undefined>(undefined);
  const [clienteQuery, setClienteQuery] = useState('');
  const [clienteResults, setClienteResults] = useState<Array<Database['public']['Tables']['clientes']['Row']>>([]);
  const [searchingClientes, setSearchingClientes] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contactos obligatorios (5 cargos fijos)
  const [contacts, setContacts] = useState<ObraContacto[]>(
    REQUIRED_CARGOS.map((cargo, idx) => ({ cargo, nombre: idx === 0 ? '' : '', telefono: '', email: '' }))
  );
  // WhatsApp se unifica con teléfono; no se maneja por separado

  const estadosObra: { value: EstadoObra; label: string; color: string }[] = [
    { value: 'planificacion', label: 'Planificación', color: 'var(--info-text)' },
    { value: 'activa', label: 'Activa', color: 'var(--success-text)' },
    { value: 'pausada', label: 'Pausada', color: 'var(--warning-text)' },
    { value: 'finalizada', label: 'Finalizada', color: 'var(--neutral-text)' },
    { value: 'cancelada', label: 'Cancelada', color: 'var(--danger-text)' },
    { value: 'sin_contacto', label: 'Sin Contacto', color: 'var(--danger-text)' }
  ];

  const etapasObra: { value: EtapaObra; label: string; color: string }[] = [
    { value: 'fundacion', label: 'Fundación', color: '#8B5CF6' },
    { value: 'estructura', label: 'Estructura', color: '#3B82F6' },
    { value: 'albanileria', label: 'Albañilería', color: '#F59E0B' },
    { value: 'instalaciones', label: 'Instalaciones', color: '#10B981' },
    { value: 'terminaciones', label: 'Terminaciones', color: '#EF4444' },
    { value: 'entrega', label: 'Entrega', color: '#6B7280' }
  ];

  // Catálogos: tipos y tamaños
  type ObraTipo = Database['public']['Tables']['obra_tipos']['Row'];
  type ObraTamano = Database['public']['Tables']['obra_tamanos']['Row'];
  const [tiposObra, setTiposObra] = useState<ObraTipo[]>([]);
  const [tamanosObra, setTamanosObra] = useState<ObraTamano[]>([]);
  const [tipoObraId, setTipoObraId] = useState<number | undefined>(undefined);
  const [tamanoObraId, setTamanoObraId] = useState<number | undefined>(undefined);

  // Cargar catálogos al abrir
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [{ data: tipos }, { data: tamanos }] = await Promise.all([
        supabase.from('obra_tipos').select('*').order('nombre'),
        supabase.from('obra_tamanos').select('*').order('nombre')
      ]);
      setTiposObra(tipos || []);
      setTamanosObra(tamanos || []);
    })();
  }, [isOpen]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.direccion-autocomplete')) {
        setShowDireccionDropdown(false);
      }
    };

    if (showDireccionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDireccionDropdown]);

  // Buscar cliente con debounce
  const onClienteQueryChange = (value: string) => {
    setClienteQuery(value);
    setShowClienteDropdown(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      const term = value.trim();
      if (term.length < 2) {
        setClienteResults([]);
        return;
      }
      setSearchingClientes(true);
      try {
        // Detectar si el término de búsqueda parece un RUT (contiene puntos, guión o es numérico)
        const isRutLike = /[.\-]/.test(term) || /^\d+$/.test(term);
        
        // Si es RUT, cargar todos los clientes y filtrar client-side
        // Si no, hacer búsqueda por nombre (API)
        let results: Database['public']['Tables']['clientes']['Row'][] = [];
        
        if (isRutLike) {
          // Normalizar: eliminar puntos, guiones y espacios
          const normalizeRut = (v: string) => (v || '').replace(/[.\-\s]/g, '').toUpperCase();
          const searchNormalized = normalizeRut(term);
          
          // Obtener todos los clientes
          const allClients = await ClientesService.getAll();
          
          // Filtrar del lado del cliente
          results = (allClients || []).filter(client => {
            const rutNormalized = normalizeRut(client.rut || '');
            // Buscar si el RUT normalizado contiene el término de búsqueda normalizado
            return rutNormalized.includes(searchNormalized);
          });
        } else {
          // Búsqueda normal por nombre
          results = await ClientesService.search(term);
        }
        
        setClienteResults(results || []);
      } catch (e) {
        console.error('Error buscando clientes:', e);
      } finally {
        setSearchingClientes(false);
      }
    }, 250);
  };

  // Buscar direcciones con geocoding
  const onDireccionQueryChange = (value: string) => {
    setDireccionQuery(value);
    setShowDireccionDropdown(true);
    if (direccionSearchTimeoutRef.current) clearTimeout(direccionSearchTimeoutRef.current);
    
    direccionSearchTimeoutRef.current = setTimeout(async () => {
      const term = value.trim();
      if (term.length < 3) {
        setDireccionResults([]);
        return;
      }
      
      setSearchingDirecciones(true);
      try {
        const response = await fetch(`/api/geocoding?action=search&q=${encodeURIComponent(term)}`);
        if (response.ok) {
          const data = await response.json();
          setDireccionResults(data.results || []);
        }
      } catch (e) {
        console.error('Error buscando direcciones:', e);
      } finally {
        setSearchingDirecciones(false);
      }
    }, 400);
  };

  // Seleccionar una dirección del geocoding
  const onDireccionSelect = (result: typeof direccionResults[0]) => {
    setDireccionQuery(result.description);
    setDireccionObra(result.structured_formatting.main_text);
    
    // Extraer información del address
    const addr = result.address;
    const cityValue = (addr['city'] as string) || (addr['town'] as string) || (addr['village'] as string) || '';
    const comunaValue = (addr['municipality'] as string) || (addr['city_district'] as string) || (addr['county'] as string) || '';
    const regionValue = (addr['state'] as string) || (addr['region'] as string) || '';
    
    setCiudad(cityValue);
    setComuna(comunaValue);
    setRegion(regionValue);
    setShowDireccionDropdown(false);
  };

  const onClienteSelect = (cli: Database['public']['Tables']['clientes']['Row']) => {
    setClienteId(cli.id);
    setClienteQuery(cli.nombre_razon_social || '');
    setShowClienteDropdown(false);
    setConstructoraNombre(cli.nombre_razon_social || '');
    setConstructoraRut(cli.rut || '');
    setConstructoraTelefono(cli.telefono || cli.celular || '');
    setConstructoraEmail(cli.email_pago || '');
    setConstructoraDireccion(cli.direccion || '');
  // No autocompletar información de la obra (dirección/comuna/ciudad)
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!nombreEmpresa.trim()) {
      newErrors.nombreEmpresa = 'El nombre de la obra es obligatorio';
    }

    if (!constructoraNombre.trim()) {
      newErrors.constructora = { ...newErrors.constructora, nombre: 'El nombre de la constructora es obligatorio' };
    }

    if (!constructoraRut.trim()) {
      newErrors.constructora = { ...newErrors.constructora, rut: 'El RUT de la constructora es obligatorio' };
    } else {
      // Normalizar RUT para validación (eliminar puntos y espacios)
      const rutNormalizado = constructoraRut.trim().replace(/[.\s]/g, '');
      // Validar formato: debe tener entre 7-8 dígitos, guión y dígito verificador
      const rutRegex = /^\d{7,8}-[0-9kK]$/;
      if (!rutRegex.test(rutNormalizado)) {
        newErrors.constructora = { 
          ...newErrors.constructora, 
          rut: 'Formato de RUT inválido (ej: 20.838.987-4 o 20838987-4)' 
        };
      }
    }



    // Validación de 5 contactos: nombre obligatorio; si no existe, usar botón "No existe"
    const contactosErrors: Record<number, { nombre?: string }> = {};
    contacts.forEach((c, i) => {
      if (!c.nombre || !c.nombre.trim()) {
        contactosErrors[i] = { nombre: 'Nombre requerido o marque "No existe"' };
      }
    });
    if (Object.keys(contactosErrors).length > 0) {
      newErrors.contactos = contactosErrors;
    }

    if (!direccionObra.trim()) {
      newErrors.direccionObra = 'La dirección de la obra es obligatoria';
    }

    if (!fechaInicio.trim()) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (valorEstimado && isNaN(Number(valorEstimado))) {
      newErrors.valorEstimado = 'El valor debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && 
           !Object.values(newErrors).some(error => 
             typeof error === 'object' && Object.keys(error).length > 0
           );
  };

  // Validación por paso con resumen de errores UX
  const validateStep = (step: 1 | 2 | 3 | 4): boolean => {
    // Ejecuta la validación completa para mantener el estado de errores
    validateForm();
    const msgs: string[] = [];

    // Construir mensajes por paso usando el estado actual + reglas
    if (step === 1) {
      if (!nombreEmpresa.trim()) msgs.push('• Nombre de la obra es obligatorio');
      if (!direccionObra.trim()) msgs.push('• Dirección de la obra es obligatoria');
    }
    if (step === 2) {
      if (!constructoraNombre.trim()) msgs.push('• Nombre de la constructora es obligatorio');
      if (!constructoraRut.trim()) {
        msgs.push('• RUT de la constructora es obligatorio');
      } else {
        // Normalizar RUT para validación (eliminar puntos y espacios)
        const rutNormalizado = constructoraRut.trim().replace(/[.\s]/g, '');
        if (!/^\d{7,8}-[0-9kK]$/.test(rutNormalizado)) {
          msgs.push('• RUT con formato inválido (ej: 20.838.987-4 o 20838987-4)');
        }
      }
    }
    if (step === 3) {
      contacts.forEach((c, i) => {
        if (!c.nombre || !c.nombre.trim()) msgs.push(`• Contacto &quot;${REQUIRED_CARGOS[i]}&quot;: nombre requerido o marque "No existe"`);
      });
    }
    if (step === 4) {
      if (!fechaInicio.trim()) msgs.push('• Fecha de inicio es obligatoria');
      if (valorEstimado && isNaN(Number(valorEstimado))) msgs.push('• Valor estimado debe ser un número válido');
    }

    setStepErrors(msgs);
    // Si hay mensajes para el paso, no permitir avanzar
    if (msgs.length > 0) return false;
    // Si no hay mensajes pero okAll es false por otros pasos, igualmente permitir avanzar dentro del flujo por pasos
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setStepErrors([]);
      setCurrentStep((prev) => (Math.min(4, (prev + 1)) as 1 | 2 | 3 | 4));
      // Desplazar al inicio del modal para visibilidad
      const root = document.querySelector('.custom-scrollbar');
      if (root) root.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStepErrors([]);
    setCurrentStep((prev) => (Math.max(1, (prev - 1)) as 1 | 2 | 3 | 4));
    const root = document.querySelector('.custom-scrollbar');
    if (root) root.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Indicador de validez por paso (no modifica estado de errores)
  const isStepValidForIndicator = (step: 1 | 2 | 3 | 4): boolean => {
    if (step === 1) {
      return !!nombreEmpresa.trim() && !!direccionObra.trim();
    }
    if (step === 2) {
      return !!constructoraNombre.trim() && /^\d{7,8}-[\dkK]$/.test(constructoraRut.trim());
    }
    if (step === 3) {
      return contacts.every((c) => !!(c.nombre && c.nombre.trim()));
    }
    if (step === 4) {
      return !!fechaInicio.trim() && (!valorEstimado || !isNaN(Number(valorEstimado)));
    }
    return false;
  };

  const formatRut = (rut: string): string => {
    const cleanRut = rut.replace(/[^\dkK]/g, '');
    if (cleanRut.length >= 2) {
      return `${cleanRut.slice(0, -1)}-${cleanRut.slice(-1)}`;
    }
    return cleanRut;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setConstructoraRut(formatted);
  };

  const resetForm = () => {
    setNombreEmpresa('');
    setDescripcion('');
    setDireccionObra('');
    setComuna('');
    setCiudad('');
    setRegion('');
    setDireccionQuery('');
    setDireccionResults([]);
    setShowDireccionDropdown(false);
    setFechaInicio('');
    setFechaEstimadaFin('');
    setValorEstimado('');
    setMaterialVendido('0');
    setProximoSeguimiento('');
    setNotas('');
    setEstado('planificacion');
    setEtapaActual('fundacion');
    setConstructoraNombre('');
    setConstructoraRut('');
    setConstructoraTelefono('');
    setConstructoraEmail('');
    setConstructoraDireccion('');
    setClienteId(undefined);
    setClienteQuery('');
    setClienteResults([]);
    setShowClienteDropdown(false);
    setTipoObraId(undefined);
  setTamanoObraId(undefined);
  setContacts(REQUIRED_CARGOS.map((cargo) => ({ cargo, nombre: '', telefono: '', email: '' })));
  // sin whatsapp separado
    setErrors({});
    setShowSuccess(false);
    setCurrentStep(1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Construir contactos (5 cargos fijos)
      const contactos: ObraContacto[] = contacts.map((c, idx) => ({
        cargo: c.cargo,
        nombre: (c.nombre || '').trim(),
        telefono: (c.telefono || '').trim(),
        email: (c.email || '').trim(),
        es_principal: idx === 0,
      }));

      // Derivar contacto principal desde el primer cargo
      const first = contactos[0];
      const contactoPrincipal: ContactoObra = {
        nombre: first.nombre,
        cargo: first.cargo,
        telefono: first.telefono,
        email: first.email,
      };

      const constructora: EmpresaConstructora = {
        nombre: constructoraNombre.trim(),
        rut: constructoraRut.trim(),
        telefono: constructoraTelefono.trim(),
        email: constructoraEmail.trim(),
        direccion: constructoraDireccion.trim(),
        contactoPrincipal
      };

      const nuevaObra = {
        nombreEmpresa: nombreEmpresa.trim(),
        descripcion: descripcion.trim(),
        direccionObra: direccionObra.trim(),
        comuna: comuna.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        fechaInicio: new Date(fechaInicio),
        fechaEstimadaFin: fechaEstimadaFin ? new Date(fechaEstimadaFin) : undefined,
        valorEstimado: valorEstimado ? Number(valorEstimado) : 0,
        materialVendido: Number(materialVendido),
        pendiente: 0,
        proximoSeguimiento: proximoSeguimiento ? new Date(proximoSeguimiento) : undefined,
        notas: notas.trim(),
        estado,
        etapaActual,
        etapasCompletadas: [],
        constructora,
        contactos,
        vendedorAsignado: currentUserId,
        nombreVendedor: currentUserName,
        clienteId: clienteId,
        tipoObraId: tipoObraId,
        tamanoObraId: tamanoObraId,
      };

      const success = await onSave(nuevaObra);

      if (success) {
        setShowSuccess(true);
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error al crear la obra:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Success Overlay */}
        {showSuccess && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.95)' }}
          >
            <div className="text-center">
              <FiCheck className="w-20 h-20 text-white mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-white mb-2">¡Obra Creada!</h3>
              <p className="text-xl text-white opacity-90">La nueva obra se ha registrado correctamente</p>
            </div>
          </div>
        )}

        {/* Header Principal */}
        <div className="p-4 sm:p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div 
                  className="p-3 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
                >
                  <FiTool className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Nueva Obra
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Completa todos los campos para registrar una nueva obra en el sistema
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 rounded-lg transition-colors"
                  style={{ 
                    color: 'var(--text-muted)',
                    backgroundColor: 'transparent'
                  }}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal - Wizard a pantalla completa con sidebar */}
        <div className="p-0 sm:p-4 md:p-6">
          <div className="flex gap-4">
            {/* Sidebar de pasos */}
            <aside className="hidden md:block w-64 flex-shrink-0">
              <nav className="p-3 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }} aria-label="Pasos de creación">
                {([
                  { id: 1, label: 'Datos de la Obra', icon: 'home' },
                  { id: 2, label: 'Constructora', icon: 'briefcase' },
                  { id: 3, label: 'Contactos (5)', icon: 'user' },
                  { id: 4, label: 'Fechas y Estado', icon: 'calendar' },
                ] as Array<{id:1|2|3|4;label:string;icon:'home'|'briefcase'|'user'|'calendar'}>).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (s.id > currentStep && !validateStep(currentStep)) return;
                      setCurrentStep(s.id);
                      setStepErrors([]);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded mb-2 text-left ${currentStep===s.id ? 'shadow' : ''}`}
                    style={{ backgroundColor: currentStep===s.id ? 'var(--accent-bg)' : 'var(--bg-secondary)', color: currentStep===s.id ? 'var(--accent-text)' : 'var(--text-primary)' }}
                    aria-current={currentStep===s.id}
                  >
                    <span className="text-sm truncate">{s.label}</span>
                    {isStepValidForIndicator(s.id) ? <FiCheck className="w-4 h-4" /> : <span className="text-[10px] opacity-70">{s.id}/4</span>}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Panel derecho */}
            <div className="flex-1 min-w-0">
              {/* Barra de progreso y resumen de errores */}
              <div className="mb-3">
                <div className="w-full h-2 rounded" style={{ backgroundColor: 'var(--border)' }}>
                  <div className="h-2 rounded" style={{ width: `${(currentStep/4)*100}%`, backgroundColor: 'var(--accent-primary)' }} />
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Paso {currentStep} de 4</div>
              </div>

              {stepErrors.length > 0 && (
                <div className="mb-4 p-3 rounded border" style={{ backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }} role="alert" aria-live="polite">
                  <div className="font-semibold mb-1 flex items-center gap-2"><FiAlertCircle className="w-4 h-4" /> Revisa los siguientes puntos antes de continuar:</div>
                  <ul className="list-disc ml-5 text-sm">
                    {stepErrors.map((m, i) => (<li key={i}>{m}</li>))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Paso 1: Información General de la Obra */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  hidden={currentStep !== 1}
                >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                <FiHome className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Información de la Obra
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de la Obra */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nombre de la Obra *
                  </label>
                  <input
                    type="text"
                    value={nombreEmpresa}
                    onChange={(e) => setNombreEmpresa(e.target.value)}
                    placeholder="Ej: Condominio Las Flores"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.nombreEmpresa ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.nombreEmpresa && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.nombreEmpresa}
                    </span>
                  )}
                </div>

                {/* Dirección de la Obra con Geocoding */}
                <div className="relative direccion-autocomplete">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Dirección de la Obra *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={direccionQuery}
                      onChange={(e) => onDireccionQueryChange(e.target.value)}
                      onFocus={() => direccionQuery.length >= 3 && setShowDireccionDropdown(true)}
                      placeholder="Buscar dirección (ej: Av. Providencia 123, Santiago)"
                      className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ 
                        backgroundColor: 'var(--input-bg)',
                        borderColor: errors.direccionObra ? 'var(--danger-border)' : 'var(--input-border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    {searchingDirecciones && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados de geocoding */}
                  {showDireccionDropdown && direccionResults.length > 0 && (
                    <div 
                      className="absolute z-50 w-full mt-1 rounded-lg shadow-lg border max-h-60 overflow-y-auto"
                      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
                    >
                      {direccionResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          onClick={() => onDireccionSelect(result)}
                          className="w-full text-left px-3 py-2 hover:bg-opacity-80 transition-colors border-b last:border-b-0"
                          style={{ 
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
                        >
                          <div className="flex items-start gap-2">
                            <FiMapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{result.structured_formatting.main_text}</div>
                              <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                {result.structured_formatting.secondary_text}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {errors.direccionObra && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.direccionObra}
                    </span>
                  )}
                  
                  {/* Mostrar dirección seleccionada */}
                  {direccionObra && (
                    <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                      <div className="flex items-start gap-2">
                        <FiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">Dirección seleccionada:</div>
                          <div>{direccionObra}</div>
                          {(comuna || ciudad || region) && (
                            <div className="text-xs opacity-75 mt-1">
                              {[comuna, ciudad, region].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comuna */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Comuna
                  </label>
                  <input
                    type="text"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="Comuna"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Ciudad"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Etapa Actual */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Etapa Actual
                  </label>
                  <select
                    value={etapaActual}
                    onChange={(e) => setEtapaActual(e.target.value as EtapaObra)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {etapasObra.map((etapa) => (
                      <option key={etapa.value} value={etapa.value}>
                        {etapa.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción - Full Width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Descripción
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción opcional del proyecto..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
                </div>

                {/* Paso 2: Información de la Constructora y Cliente */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  hidden={currentStep !== 2}
                >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                <FiBriefcase className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Empresa Constructora
              </h3>

              {/* Autocompletar cliente */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Buscar cliente (RUT o nombre)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clienteQuery}
                    onChange={(e) => onClienteQueryChange(e.target.value)}
                    onFocus={() => setShowClienteDropdown(true)}
                    placeholder="Ej: 76.123.456-7 o Constructora XYZ"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  />
                  {showClienteDropdown && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border shadow-sm" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                      {searchingClientes ? (
                        <div className="p-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Buscando...
                        </div>
                      ) : clienteResults.length === 0 ? (
                        <div className="p-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Sin resultados. Continúa escribiendo o completa manualmente.
                        </div>
                      ) : (
                        clienteResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => onClienteSelect(c)}
                            className="w-full text-left px-3 py-2 hover:bg-black/5"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <div className="text-sm font-medium">{c.nombre_razon_social}</div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.rut} • {c.comuna || ''} {c.ciudad ? `- ${c.ciudad}` : ''}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Al seleccionar un cliente, se rellenarán automáticamente los datos de la constructora y la ubicación.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nombre de la empresa constructora *
                  </label>
                  <input
                    type="text"
                    value={constructoraNombre}
                    onChange={(e) => setConstructoraNombre(e.target.value)}
                    placeholder="Nombre de la empresa constructora"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.nombre ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.nombre && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.nombre}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    RUT *
                  </label>
                  <input
                    type="text"
                    value={constructoraRut}
                    onChange={handleRutChange}
                    placeholder="12345678-9"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.rut ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.rut && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.rut}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={constructoraTelefono}
                    onChange={(e) => setConstructoraTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.telefono ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.telefono && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.telefono}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={constructoraEmail}
                    onChange={(e) => setConstructoraEmail(e.target.value)}
                    placeholder="constructora@ejemplo.com"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={constructoraDireccion}
                    onChange={(e) => setConstructoraDireccion(e.target.value)}
                    placeholder="Dirección de la oficina principal"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
                </div>

                {/* Paso 3: Contactos obligatorios (5) */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  hidden={currentStep !== 3}
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Contactos de la Obra (5 obligatorios)
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Los cargos están fijos y no se pueden cambiar. Si un contacto no existe, presiona &quot;No existe&quot; para continuar.
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      {contacts.filter(c => (c.nombre || '').trim()).length}/5 completos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {contacts.map((c, idx) => (
                      <div key={REQUIRED_CARGOS[idx]} className="p-3 rounded border" style={{ borderColor: 'var(--border)' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Cargo</label>
                            <input type="text" value={REQUIRED_CARGOS[idx]} readOnly className="w-full px-3 py-2 rounded-lg border bg-[var(--bg-secondary)]" style={{ borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Nombre {idx===0 ? '*' : ''}</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={c.nombre}
                                onChange={(e) => setContacts(prev => prev.map((p, i) => i===idx ? { ...p, nombre: e.target.value } : p))}
                                placeholder="Nombre del contacto"
                                className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ backgroundColor: 'var(--input-bg)', borderColor: errors.contactos?.[idx]?.nombre ? 'var(--danger-border)' : 'var(--input-border)', color: 'var(--text-primary)' }}
                              />
                              <button type="button" className="px-2 py-2 text-xs rounded border" onClick={() => setContacts(prev => prev.map((p, i) => i===idx ? { ...p, nombre: 'No existe', telefono: '', email: '' } : p))} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                                No existe
                              </button>
                            </div>
                            {errors.contactos?.[idx]?.nombre && (
                              <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                                <FiAlertCircle className="w-3 h-3" />
                                {errors.contactos[idx]?.nombre}
                              </span>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
                            <input type="tel" value={c.telefono || ''} onChange={(e) => setContacts(prev => prev.map((p, i) => i===idx ? { ...p, telefono: e.target.value } : p))} placeholder="+56 9 1234 5678" className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                            <input type="email" value={c.email || ''} onChange={(e) => setContacts(prev => prev.map((p, i) => i===idx ? { ...p, email: e.target.value } : p))} placeholder="contacto@ejemplo.com" className="w-full px-3 py-2 rounded-lg border" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paso 4: Clasificación, Fechas y Estado */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  hidden={currentStep !== 4}
                >
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                    <FiTool className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Clasificación de la Obra
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tipo de obra</label>
                      <select
                        value={tipoObraId ?? ''}
                        onChange={(e) => setTipoObraId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Selecciona un tipo</option>
                        {tiposObra.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tamaño de obra</label>
                      <select
                        value={tamanoObraId ?? ''}
                        onChange={(e) => setTamanoObraId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Selecciona un tamaño</option>
                        {tamanosObra.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Paso 4 (continuación): Fechas, Estado y Notas */}
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
                  hidden={currentStep !== 4}
                >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                <FiCalendar className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Fechas y Estado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.fechaInicio ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.fechaInicio && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.fechaInicio}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Fecha Estimada de Fin
                  </label>
                  <input
                    type="date"
                    value={fechaEstimadaFin}
                    onChange={(e) => setFechaEstimadaFin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Valor Estimado
                  </label>
                  <input
                    type="number"
                    value={valorEstimado}
                    onChange={(e) => setValorEstimado(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.valorEstimado ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.valorEstimado && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.valorEstimado}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Próximo Seguimiento
                  </label>
                  <input
                    type="date"
                    value={proximoSeguimiento}
                    onChange={(e) => setProximoSeguimiento(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoObra)}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {estadosObra.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
              {/* Notas adicionales (en Paso 4) */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }} hidden={currentStep !== 4}>
                <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                  <FiFileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  Notas Adicionales
                </h3>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información adicional relevante sobre la obra..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                />
              </div>

              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 md:p-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              * Campos obligatorios
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep===1 || loading}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', opacity: currentStep===1 ? 0.6 : 1 }}
            >
              Atrás
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading}
                className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                style={{ 
                  backgroundColor: loading ? 'var(--accent-disabled)' : 'var(--accent-primary)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Crear Obra
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
