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
  FiTool
} from "react-icons/fi";
import { Modal } from "@/shared/ui/Modal";
import { ClientesService } from "@/services/clientesService";
import { supabase, type Database } from "@/lib/supabase";
import type { Obra, EstadoObra, EtapaObra, ContactoObra, EmpresaConstructora } from "../types/obras";

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Datos de la obra
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccionObra, setDireccionObra] = useState('');
  const [comuna, setComuna] = useState('');
  const [ciudad, setCiudad] = useState('');
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

  // Contacto principal
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoCargo, setContactoCargo] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
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
        const results = await ClientesService.search(term);
        setClienteResults(results || []);
      } catch (e) {
        console.error('Error buscando clientes:', e);
      } finally {
        setSearchingClientes(false);
      }
    }, 250);
  };

  const onClienteSelect = (cli: Database['public']['Tables']['clientes']['Row']) => {
    setClienteId(cli.id);
    setClienteQuery(`${cli.nombre_razon_social} (${cli.rut})`);
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
    } else if (!/^\d{7,8}-[\dkK]$/.test(constructoraRut)) {
      newErrors.constructora = { ...newErrors.constructora, rut: 'Formato de RUT inválido (ej: 12345678-9)' };
    }

  // Teléfono de la constructora ya no es obligatorio

    if (!contactoNombre.trim()) {
      newErrors.constructora = { 
        ...newErrors.constructora, 
        contactoPrincipal: { ...newErrors.constructora?.contactoPrincipal, nombre: 'El nombre del contacto es obligatorio' }
      };
    }

    if (!contactoCargo.trim()) {
      newErrors.constructora = { 
        ...newErrors.constructora, 
        contactoPrincipal: { ...newErrors.constructora?.contactoPrincipal, cargo: 'El cargo del contacto es obligatorio' }
      };
    }

    if (!contactoTelefono.trim()) {
      newErrors.constructora = { 
        ...newErrors.constructora, 
        contactoPrincipal: { ...newErrors.constructora?.contactoPrincipal, telefono: 'El teléfono del contacto es obligatorio' }
      };
    }

    if (contactoEmail && !/\S+@\S+\.\S+/.test(contactoEmail)) {
      newErrors.constructora = { 
        ...newErrors.constructora, 
        contactoPrincipal: { ...newErrors.constructora?.contactoPrincipal, email: 'Email inválido' }
      };
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
    setContactoNombre('');
    setContactoCargo('');
    setContactoTelefono('');
    setContactoEmail('');
  // sin whatsapp separado
    setErrors({});
    setShowSuccess(false);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const contactoPrincipal: ContactoObra = {
        nombre: contactoNombre.trim(),
        cargo: contactoCargo.trim(),
        telefono: contactoTelefono.trim(),
        email: contactoEmail.trim(),
  // whatsapp eliminado; usar teléfono
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
        proximoSeguimiento: proximoSeguimiento ? new Date(proximoSeguimiento) : undefined,
        notas: notas.trim(),
        estado,
        etapaActual,
        etapasCompletadas: [],
        constructora,
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

        {/* Contenido Principal */}
        <div className="p-3 sm:p-4 md:p-6">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {[1,2,3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setCurrentStep(s as 1|2|3)}
                className={`w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center ${currentStep===s ? 'text-white' : ''}`}
                style={{ backgroundColor: currentStep===s ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: currentStep===s ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)' }}
                aria-current={currentStep===s}
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paso 1: Información General de la Obra */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
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

                {/* Dirección de la Obra */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Dirección de la Obra *
                  </label>
                  <input
                    type="text"
                    value={direccionObra}
                    onChange={(e) => setDireccionObra(e.target.value)}
                    placeholder="Dirección completa de la obra"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.direccionObra ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.direccionObra && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.direccionObra}
                    </span>
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
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
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

            {/* Paso 3: Clasificación, Fechas y Estado */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
              hidden={currentStep !== 3}
            >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                <FiTool className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Clasificación de la Obra
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Tipo de obra
                  </label>
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
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Tamaño de obra
                  </label>
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

            {/* Fechas y Estado (Paso 3) */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
              hidden={currentStep !== 3}
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

            {/* Contacto Principal (Paso 2) */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
              hidden={currentStep !== 2}
            >
              <h3 className="text-base font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                <FiUser className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                Contacto Principal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={contactoNombre}
                    onChange={(e) => setContactoNombre(e.target.value)}
                    placeholder="Nombre completo del contacto"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.contactoPrincipal?.nombre ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.contactoPrincipal?.nombre && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.contactoPrincipal.nombre}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={contactoCargo}
                    onChange={(e) => setContactoCargo(e.target.value)}
                    placeholder="Cargo en la empresa"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.contactoPrincipal?.cargo ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.contactoPrincipal?.cargo && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.contactoPrincipal.cargo}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={contactoTelefono}
                    onChange={(e) => setContactoTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.contactoPrincipal?.telefono ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.contactoPrincipal?.telefono && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.contactoPrincipal.telefono}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactoEmail}
                    onChange={(e) => setContactoEmail(e.target.value)}
                    placeholder="contacto@ejemplo.com"
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: errors.constructora?.contactoPrincipal?.email ? 'var(--danger-border)' : 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  {errors.constructora?.contactoPrincipal?.email && (
                    <span className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-3 h-3" />
                      {errors.constructora.contactoPrincipal.email}
                    </span>
                  )}
                </div>

                {/* WhatsApp eliminado: usar teléfono */}
              </div>
            </div>

            {/* Notas adicionales (Paso 3) */}
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)'
              }}
              hidden={currentStep !== 3}
            >
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
                style={{ 
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </form>
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

            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => (Math.max(1, (s as number) - 1) as 1|2|3))}
                className="px-4 py-2 rounded-lg border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Atrás
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => (Math.min(3, (s as number) + 1) as 1|2|3))}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
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
