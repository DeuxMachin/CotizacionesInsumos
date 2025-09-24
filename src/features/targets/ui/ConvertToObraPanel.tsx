"use client";

import { useEffect, useMemo, useState } from "react";
import { FiHome, FiUser, FiBriefcase, FiMapPin, FiCalendar, FiSearch, FiX } from "react-icons/fi";
import { ClientesService } from "@/services/clientesService";
import { getObrasService } from "@/features/obras/services";
import { useAuth } from "@/features/auth/model/useAuth";
import type { Obra, ObraContacto } from "@/features/obras/types/obras";
import { REQUIRED_CARGOS } from "@/features/obras/types/obras";
import { supabase } from "@/lib/supabase";
import { useTargets } from "../model/useTargets";

type SimpleCliente = { id: number; nombre_razon_social: string; rut: string | null };
type Vendedor = { id: string; nombre: string | null; apellido: string | null; email: string };
type OpcionCatalogo = { id: number; nombre: string };

export interface ConvertToObraPanelProps {
  targetId: number;
  defaultDireccion?: { direccion?: string; comuna?: string | null; ciudad?: string | null };
  onClose: () => void;
  onConverted?: (obraId: number) => void;
}

export function ConvertToObraPanel({ targetId, defaultDireccion, onClose, onConverted }: ConvertToObraPanelProps) {
  const { user } = useAuth();
  const obrasService = useMemo(() => getObrasService(), []);
  const { updateTarget, fetchTargets } = useTargets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nombreObra, setNombreObra] = useState("");
  const [direccion, setDireccion] = useState(defaultDireccion?.direccion || "");
  const [comuna, setComuna] = useState<string | undefined>(defaultDireccion?.comuna ?? undefined);
  const [ciudad, setCiudad] = useState<string | undefined>(defaultDireccion?.ciudad ?? undefined);
  const [vendedorId, setVendedorId] = useState<string>(user?.id || "");
  const [tipoObraId, setTipoObraId] = useState<number | undefined>(undefined);
  const [tamanoObraId, setTamanoObraId] = useState<number | undefined>(undefined);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteSel, setClienteSel] = useState<SimpleCliente | null>(null);
  const [clientesSugeridos, setClientesSugeridos] = useState<SimpleCliente[]>([]);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [valorEstimado, setValorEstimado] = useState<string>("");

  // Contactos obligatorios (5 cargos fijos)
  const [contacts, setContacts] = useState<ObraContacto[]>(
    REQUIRED_CARGOS.map((cargo, idx) => ({ cargo, nombre: '', telefono: '', email: '' }))
  );

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [tipos, setTipos] = useState<OpcionCatalogo[]>([]);
  const [tamanos, setTamanos] = useState<OpcionCatalogo[]>([]);

  // Load combos
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: vend }, { data: tps }, { data: tms }] = await Promise.all([
        supabase.from("usuarios").select("id, nombre, apellido, email").eq("activo", true),
        supabase.from("obra_tipos").select("id, nombre").order("nombre"),
        supabase.from("obra_tamanos").select("id, nombre").order("nombre"),
      ]);
      if (!active) return;
      setVendedores(vend || []);
      setTipos((tps || []) as OpcionCatalogo[]);
      setTamanos((tms || []) as OpcionCatalogo[]);
    })();
    return () => { active = false; };
  }, []);

  // Search clients with debounce
  useEffect(() => {
    const ctrl = new AbortController();
    const h = setTimeout(async () => {
      if (!clienteQuery || clienteSel) {
        setClientesSugeridos([]);
        return;
      }
      try {
        const all = await ClientesService.search(clienteQuery);
        type RawClient = { id: number; nombre_razon_social?: string; rut?: string };
        const flat = (all || []).map((c: RawClient) => ({ id: c.id, nombre_razon_social: c.nombre_razon_social || '', rut: c.rut || '' }));
        setClientesSugeridos(flat.slice(0, 8));
      } catch (e) {
        // ignore
      }
    }, 300);
    return () => { clearTimeout(h); ctrl.abort(); };
  }, [clienteQuery, clienteSel]);

  const nombreVendedor = useMemo(() => {
    const v = vendedores.find(v => v.id === vendedorId);
    return [v?.nombre, v?.apellido].filter(Boolean).join(' ') || v?.email || '';
  }, [vendedores, vendedorId]);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (!nombreObra.trim()) throw new Error('Ingresa el nombre de la obra');
      if (!vendedorId) throw new Error('Selecciona el vendedor a cargo');

      // Construir contactos (5 cargos fijos)
      const contactos: ObraContacto[] = contacts.map((c, idx) => ({
        cargo: c.cargo,
        nombre: (c.nombre || '').trim(),
        telefono: (c.telefono || '').trim(),
        email: (c.email || '').trim(),
        es_principal: idx === 0,
      }));

      const obraPayload: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'> = {
        nombreEmpresa: nombreObra.trim(),
        constructora: {
          nombre: clienteSel?.nombre_razon_social || '',
          rut: clienteSel?.rut || '',
          telefono: '',
          contactoPrincipal: { nombre: contactos[0].nombre, cargo: contactos[0].cargo, telefono: contactos[0].telefono, email: contactos[0].email }
        },
        vendedorAsignado: vendedorId,
        nombreVendedor,
        estado: 'planificacion',
        etapaActual: 'fundacion',
        etapasCompletadas: [],
        descripcion: undefined,
        direccionObra: [direccion, comuna, ciudad].filter(Boolean).join(', '),
        comuna,
        ciudad,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        fechaEstimadaFin: undefined,
        valorEstimado: valorEstimado ? Number(valorEstimado) : undefined,
        materialVendido: 0,
        pendiente: 0,
        proximoSeguimiento: undefined,
        notas: undefined,
        clienteId: clienteSel?.id,
        tipoObraId: tipoObraId,
        tamanoObraId: tamanoObraId,
        contactos,
      };

      // Crear obra vinculada al target y obtener ID
      const newObraId = await obrasService.crearObraDesdeTarget(obraPayload, user?.id, targetId);
      if (!newObraId) throw new Error('No se pudo crear la obra');

      // Registrar evento y cerrar target, actualizando cliente si corresponde
      await supabase.from('target_eventos').insert({ target_id: targetId, tipo: 'convertido', detalle: `Convertido a Obra #${newObraId}` });
      await updateTarget(targetId, { estado: 'cerrado', clienteId: clienteSel?.id });
      await fetchTargets();

      onConverted?.(newObraId);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al convertir a obra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiHome className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Creando una Nueva Obra
            </h4>
            <p className="text-sm text-blue-800">
              Completa la información necesaria para formalizar este target como una obra. 
              Los campos marcados con * son obligatorios. Podrás editar estos detalles más tarde.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Nombre de la Obra <span className="text-red-500">*</span>
          </label>
          <input 
            className="form-input mt-1" 
            value={nombreObra} 
            onChange={(e) => setNombreObra(e.target.value)} 
            placeholder="Ej. Edificio Los Alerces" 
            required
          />
        </div>
        <div>
          <label className="form-label">
            Vendedor a cargo <span className="text-red-500">*</span>
          </label>
          <select 
            className="form-input mt-1" 
            value={vendedorId} 
            onChange={(e) => setVendedorId(e.target.value)}
            required
          >
            <option value="">Selecciona vendedor</option>
            {vendedores.map(v => (
              <option key={v.id} value={v.id}>{[v.nombre, v.apellido].filter(Boolean).join(' ') || v.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Tipo de obra</label>
          <select className="form-input mt-1" value={tipoObraId ?? ''} onChange={(e) => setTipoObraId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">No especificado</option>
            {tipos.map(t => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
          </select>
        </div>
        <div>
          <label className="form-label">Tamaño de obra</label>
          <select className="form-input mt-1" value={tamanoObraId ?? ''} onChange={(e) => setTamanoObraId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">No especificado</option>
            {tamanos.map(t => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Cliente (opcional)</label>
          {clienteSel ? (
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{clienteSel.nombre_razon_social} {clienteSel.rut ? `(${clienteSel.rut})` : ''}</span>
              <button className="btn-secondary text-xs" onClick={() => { setClienteSel(null); setClienteQuery(''); }}>Cambiar</button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <FiSearch className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input className="form-input pl-8 mt-1" value={clienteQuery} onChange={(e) => setClienteQuery(e.target.value)} placeholder="Buscar por nombre o RUT" />
              </div>
              {clientesSugeridos.length > 0 && (
                <div className="mt-1 border rounded-md max-h-40 overflow-y-auto" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                  {clientesSugeridos.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 rounded"
                      onClick={() => { setClienteSel(c); setClientesSugeridos([]); }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.nombre_razon_social}</div>
                      {c.rut && <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.rut}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Dirección de la obra</label>
          <input className="form-input mt-1" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle y número" />
        </div>
        <div>
          <label className="form-label">Comuna</label>
          <input className="form-input mt-1" value={comuna || ''} onChange={(e) => setComuna(e.target.value || undefined)} />
        </div>
        <div>
          <label className="form-label">Ciudad</label>
          <input className="form-input mt-1" value={ciudad || ''} onChange={(e) => setCiudad(e.target.value || undefined)} />
        </div>
        <div>
          <label className="form-label">Fecha de inicio</label>
          <input type="date" className="form-input mt-1" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Valor estimado (CLP)</label>
          <input type="number" className="form-input mt-1" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} placeholder="0" />
        </div>
      </div>

      {/* Contactos obligatorios */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Contactos de la Obra (5 obligatorios)
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Los cargos están fijos y no se pueden cambiar. Si un contacto no existe, deja el nombre vacío.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {contacts.map((c, idx) => (
            <div key={REQUIRED_CARGOS[idx]} className="p-3 rounded border" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Cargo
                  </label>
                  <input type="text" value={REQUIRED_CARGOS[idx]} readOnly className="w-full px-3 py-2 rounded-lg border bg-gray-100" style={{ borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nombre {idx === 0 ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    value={c.nombre}
                    onChange={(e) => setContacts(prev => prev.map((p, i) => i === idx ? { ...p, nombre: e.target.value } : p))}
                    placeholder="Nombre del contacto"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={c.telefono}
                    onChange={(e) => setContacts(prev => prev.map((p, i) => i === idx ? { ...p, telefono: e.target.value } : p))}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={c.email}
                    onChange={(e) => setContacts(prev => prev.map((p, i) => i === idx ? { ...p, email: e.target.value } : p))}
                    placeholder="contacto@ejemplo.com"
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <p>Al crear la obra, este target se marcará como cerrado automáticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button 
            className="btn-primary" 
            onClick={onSubmit} 
            disabled={loading || !nombreObra.trim() || !vendedorId || !contacts[0].nombre.trim()}
          >
            {loading ? 'Creando Obra…' : 'Crear Obra'}
          </button>
        </div>
      </div>
    </div>
  );
}
