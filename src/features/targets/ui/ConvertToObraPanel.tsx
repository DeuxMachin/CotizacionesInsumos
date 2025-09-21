"use client";

import { useEffect, useMemo, useState } from "react";
import { FiHome, FiUser, FiBriefcase, FiMapPin, FiCalendar, FiSearch, FiX } from "react-icons/fi";
import { ClientesService } from "@/services/clientesService";
import { getObrasService } from "@/features/obras/services";
import { useAuth } from "@/features/auth/model/useAuth";
import type { Obra } from "@/features/obras/types/obras";
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

      const obraPayload: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'> = {
        nombreEmpresa: nombreObra.trim(),
        constructora: {
          nombre: clienteSel?.nombre_razon_social || '',
          rut: clienteSel?.rut || '',
          telefono: '',
          contactoPrincipal: { nombre: '', cargo: '', telefono: '' }
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
        proximoSeguimiento: undefined,
        notas: undefined,
        clienteId: clienteSel?.id,
        tipoObraId: tipoObraId,
        tamanoObraId: tamanoObraId,
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
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FiHome className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          Convertir a Obra
        </h3>
        <button className="btn-secondary text-xs" onClick={onClose}><FiX className="w-3 h-3" /> Cerrar</button>
      </div>

      {error && (
        <div className="mb-3 text-sm" style={{ color: 'var(--danger-text)' }}>{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Nombre de la Obra</label>
          <input className="form-input mt-1" value={nombreObra} onChange={(e) => setNombreObra(e.target.value)} placeholder="Ej. Edificio Los Alerces" />
        </div>
        <div>
          <label className="form-label">Vendedor a cargo</label>
          <select className="form-input mt-1" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
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

      <div className="mt-4 flex items-center justify-end gap-2">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
        <button className="btn-primary" onClick={onSubmit} disabled={loading}>
          {loading ? 'Convirtiendo…' : 'Confirmar y Convertir'}
        </button>
      </div>
    </div>
  );
}
