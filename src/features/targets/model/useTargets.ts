"use client";

import { create } from "zustand";
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { useAuth } from '@/features/auth/model/useAuth';
import type { PosibleTarget, CreateTargetData, UpdateTargetData } from "./types";

interface TargetsStore {
  targets: PosibleTarget[];
  loading: boolean;
  error: string | null;
  fetchTargets: () => Promise<void>;
  createTarget: (data: CreateTargetData) => Promise<PosibleTarget | null>;
  updateTarget: (id: number, data: UpdateTargetData) => Promise<void>;
  deleteTarget: (id: number) => Promise<void>;
  claimTarget: (id: number) => Promise<void>;
  releaseTarget: (id: number) => Promise<void>;
}

// (mapDbToTarget eliminado por ahora; se hace mapping inline en fetchTargets)

export const useTargets = create<TargetsStore>((set, get) => ({
  targets: [],
  loading: false,
  error: null,

  fetchTargets: async () => {
    set({ loading: true, error: null });
    try {
      // 1. Obtener targets
      const { data: targetsData, error: targetsError } = await supabase
        .from('targets')
        .select('*')
        .order('created_at', { ascending: false });
      if (targetsError) throw targetsError;

      // 2. IDs para joins secundarios
  const targetIds = targetsData?.map(t => t.id) || [];
  type ContactoRow = Database['public']['Tables']['target_contactos']['Row'];
  type EventoRow = Database['public']['Tables']['target_eventos']['Row'];
  type TipoRow = Database['public']['Tables']['target_tipos']['Row'];
  type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];
  let contactos: ContactoRow[] = [];
  let eventos: EventoRow[] = [];

      if (targetIds.length > 0) {
        const [{ data: contactosData }, { data: eventosData }] = await Promise.all([
          supabase.from('target_contactos').select('*').in('target_id', targetIds),
          supabase.from('target_eventos').select('*').in('target_id', targetIds).order('fecha_evento', { ascending: true })
        ]);
        contactos = contactosData || [];
        eventos = eventosData || [];
      }

      // 3. Tipos
      const tipoIds = targetsData?.filter(t => t.tipo_id).map(t => t.tipo_id) || [];
  let tipos: TipoRow[] = [];
      if (tipoIds.length) {
        const { data: tiposData } = await supabase.from('target_tipos').select('*').in('id', tipoIds);
        tipos = tiposData || [];
      }

      // 4. Usuarios asignados (gestionados)
      const asignadoIds = targetsData?.filter(t => t.asignado_a).map(t => t.asignado_a) || [];
  let usuarios: Pick<UsuarioRow, 'id' | 'nombre' | 'apellido'>[] = [];
      if (asignadoIds.length) {
        const { data: usuariosData } = await supabase.from('usuarios').select('id, nombre, apellido').in('id', asignadoIds);
        usuarios = usuariosData || [];
      }

      // 5. Agrupar
      const mapped: PosibleTarget[] = targetsData.map(t => {
        const contacto = contactos.find(c => c.target_id === t.id);
        const targetEventos = eventos.filter(e => e.target_id === t.id);
        const primerContacto = targetEventos.find(e => e.tipo === 'contacto');
        const estimadoInicio = targetEventos.find(e => e.tipo === 'estimado_inicio');
        const tipo = tipos.find(tp => tp.id === t.tipo_id);
        const asignado = usuarios.find(u => u.id === t.asignado_a);
        return {
          id: t.id,
          titulo: t.titulo,
            descripcion: t.descripcion || '',
          ubicacion: {
            direccion: t.direccion || '',
            lat: Number(t.lat) || 0,
            lng: Number(t.lng) || 0,
            ciudad: t.ciudad,
            region: t.region,
            comuna: t.comuna,
            googleMapsUrl: t.lat && t.lng ? `https://maps.google.com/?q=${t.lat},${t.lng}` : undefined
          },
          contacto: contacto ? {
            id: contacto.id,
            nombre: contacto.nombre,
            telefono: contacto.telefono,
            email: contacto.email,
            empresa: contacto.empresa
          } : {},
          estado: t.estado as PosibleTarget['estado'],
          prioridad: t.prioridad as PosibleTarget['prioridad'],
          fechaCreacion: t.created_at,
          fechaContacto: primerContacto?.fecha_evento,
          creadoPor: t.creado_por,
          gestionadoPor: t.asignado_a,
          nombreGestionadoPor: asignado ? `${asignado.nombre || ''} ${asignado.apellido || ''}`.trim() : null,
          observaciones: undefined, // ver nota en types.ts
          tipoObra: tipo?.nombre || null,
          fechaEstimadaInicio: estimadoInicio?.fecha_evento
        };
      });

      set({ targets: mapped, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cargar targets';
      set({ error: msg, loading: false });
    }
  },

  createTarget: async (data: CreateTargetData) => {
    set({ loading: true, error: null });
    try {
      // Obtener usuario actual (se asume hay un session en cookie o similar)
  const userId = useAuth.getState().user?.id;
  if (!userId) throw new Error('Usuario no autenticado');

      // Resolver tipo (si se envía nombre)
      let tipoId: number | undefined;
      if (data.tipoObra) {
        const { data: tipo } = await supabase
          .from('target_tipos')
          .select('id')
          .eq('nombre', data.tipoObra)
          .maybeSingle();
        tipoId = tipo?.id;
      }

      // Insert target
      const insertPayload: Database['public']['Tables']['targets']['Insert'] = {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        estado: 'pendiente',
        prioridad: data.prioridad,
        direccion: data.direccion || null,
        ciudad: data.ciudad || null,
        region: data.region || null,
        comuna: data.comuna || null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        creado_por: userId,
        tipo_id: tipoId || null
      };

      console.debug('[createTarget] insert payload', insertPayload);
      const { data: inserted, error: insertError } = await supabase
        .from('targets')
        .insert(insertPayload)
        .select('*')
        .single();
      if (insertError) {
        console.error('[createTarget] Error inserting target', insertError);
        throw new Error(`Error insertando target: ${insertError.message || insertError.code}`);
      }
      if (!inserted) {
        throw new Error('Insert retornó sin datos del target');
      }

      // Contacto (opcional)
      let insertedContacto: { id: number; nombre: string | null; telefono: string | null; email: string | null; empresa: string | null } | null = null;
      const contactoNombre = data.contactoNombre?.trim() || null;
      const contactoTelefono = data.contactoTelefono?.trim() || null;
      const contactoEmail = data.contactoEmail?.trim() || null;
      const contactoEmpresa = data.contactoEmpresa?.trim() || null;
      if (contactoNombre || contactoTelefono || contactoEmail || contactoEmpresa) {
        // Log detallado del payload de contacto
        const contactoPayload = {
          target_id: inserted.id,
          nombre: contactoNombre,
          telefono: contactoTelefono ? contactoTelefono.replace(/\s+/g, '') : null, // Eliminar espacios
          email: contactoEmail,
          empresa: contactoEmpresa
        };
        console.debug('[createTarget] Contacto payload:', JSON.stringify(contactoPayload));

        const { data: contactoData, error: contactoError } = await supabase
          .from('target_contactos')
          .insert(contactoPayload)
          .select('*')
          .single();
        if (contactoError) {
          console.error('[createTarget] Error inserting contacto:', JSON.stringify({
            code: contactoError.code,
            message: contactoError.message,
            details: contactoError.details
          }));
          // No abortamos todo si falla contacto; solo registramos error
        } else {
          insertedContacto = contactoData;
        }
      }

      // Observaciones -> event tipo 'observacion' (para no usar notas)
      if (data.observaciones) {
        const { error: obsError } = await supabase.from('target_eventos').insert({
          target_id: inserted.id,
          tipo: 'observacion',
          detalle: data.observaciones
        });
        if (obsError) {
          console.warn('[createTarget] Error insertando observacion (se ignora)', obsError);
        }
      }

      // Fecha estimada -> evento especial
      if (data.fechaEstimadaInicio) {
        const { error: fechaError } = await supabase.from('target_eventos').insert({
          target_id: inserted.id,
          tipo: 'estimado_inicio',
          detalle: 'Fecha estimada de inicio',
          fecha_evento: data.fechaEstimadaInicio
        });
        if (fechaError) {
          console.warn('[createTarget] Error insertando evento estimado_inicio (se ignora)', fechaError);
        }
      }

      // Refrescar lista o mapear localmente
      const nuevo: PosibleTarget = {
        id: inserted.id,
        titulo: inserted.titulo,
        descripcion: inserted.descripcion || '',
        ubicacion: {
          direccion: inserted.direccion || '',
          lat: Number(inserted.lat) || 0,
          lng: Number(inserted.lng) || 0,
          ciudad: inserted.ciudad,
          region: inserted.region,
          comuna: inserted.comuna,
          googleMapsUrl: inserted.lat && inserted.lng ? `https://maps.google.com/?q=${inserted.lat},${inserted.lng}` : undefined
        },
        contacto: insertedContacto ? {
          id: insertedContacto.id,
          nombre: insertedContacto.nombre || undefined,
          telefono: insertedContacto.telefono || undefined,
          email: insertedContacto.email || undefined,
          empresa: insertedContacto.empresa || undefined
        } : {},
        estado: 'pendiente',
        prioridad: data.prioridad,
        fechaCreacion: inserted.created_at,
        creadoPor: inserted.creado_por,
        gestionadoPor: null,
        nombreGestionadoPor: null,
        observaciones: data.observaciones,
        tipoObra: data.tipoObra || null,
  fechaEstimadaInicio: data.fechaEstimadaInicio
      };

      set({ targets: [nuevo, ...get().targets], loading: false });
      return nuevo;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'Error desconocido creando target';
      console.error('[createTarget] failure', e);
      set({ error: msg || 'Error al crear target', loading: false });
      throw new Error(msg);
    }
  },

  updateTarget: async (id: number, data: UpdateTargetData) => {
    set({ loading: true, error: null });
    try {
  const payload: Database['public']['Tables']['targets']['Update'] = {};
      if (data.titulo) payload.titulo = data.titulo;
      if (data.descripcion) payload.descripcion = data.descripcion;
      if (data.direccion) payload.direccion = data.direccion;
      if (data.lat !== undefined) payload.lat = data.lat;
      if (data.lng !== undefined) payload.lng = data.lng;
      if (data.ciudad !== undefined) payload.ciudad = data.ciudad;
      if (data.region !== undefined) payload.region = data.region;
      if (data.comuna !== undefined) payload.comuna = data.comuna;
      if (data.prioridad) payload.prioridad = data.prioridad;
      if (data.estado) payload.estado = data.estado;

      if (Object.keys(payload).length) {
        const { error: upError } = await supabase
          .from('targets')
          .update(payload)
          .eq('id', id);
        if (upError) throw upError;
      }

      // contacto
      if (data.contactoNombre || data.contactoTelefono || data.contactoEmail || data.contactoEmpresa) {
        // obtener contacto existente
        const { data: existing } = await supabase
          .from('target_contactos')
          .select('id')
          .eq('target_id', id)
          .maybeSingle();
        
        const contactoNombre = data.contactoNombre?.trim() || null;
        const contactoTelefono = data.contactoTelefono ? data.contactoTelefono.replace(/\s+/g, '') : null;
        const contactoEmail = data.contactoEmail?.trim() || null;
        const contactoEmpresa = data.contactoEmpresa?.trim() || null;
        
  const contactoPayload: Database['public']['Tables']['target_contactos']['Insert'] | Database['public']['Tables']['target_contactos']['Update'] = {
          nombre: contactoNombre,
          telefono: contactoTelefono,
          email: contactoEmail,
          empresa: contactoEmpresa,
          target_id: id
        };
        
        console.debug('[updateTarget] Contacto payload:', JSON.stringify(contactoPayload));

        if (existing) {
          const { error: contactoError } = await supabase
            .from('target_contactos')
            .update(contactoPayload)
            .eq('id', existing.id);
            
          if (contactoError) {
            console.error('[updateTarget] Error updating contacto:', JSON.stringify({
              code: contactoError.code,
              message: contactoError.message,
              details: contactoError.details
            }));
          }
        } else {
          const { error: contactoError } = await supabase
            .from('target_contactos')
            .insert(contactoPayload);
            
          if (contactoError) {
            console.error('[updateTarget] Error inserting contacto:', JSON.stringify({
              code: contactoError.code,
              message: contactoError.message,
              details: contactoError.details
            }));
          }
        }
      }

      // observaciones -> evento
      if (data.observaciones) {
        await supabase.from('target_eventos').insert({
          target_id: id,
          tipo: 'observacion',
          detalle: data.observaciones
        });
      }

      // fecha estimada -> evento
      if (data.fechaEstimadaInicio) {
        await supabase.from('target_eventos').insert({
          target_id: id,
          tipo: 'estimado_inicio',
          detalle: 'Fecha estimada de inicio (update)',
          fecha_evento: data.fechaEstimadaInicio
        });
      }

      // refrescar local
      await get().fetchTargets();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar target';
      set({ error: msg, loading: false });
      throw e as Error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTarget: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const { error: delError } = await supabase.from('targets').delete().eq('id', id);
      if (delError) throw delError;
      set({ targets: get().targets.filter(t => t.id !== id), loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar target';
      set({ error: msg, loading: false });
      throw e as Error;
    }
  },


  claimTarget: async (id: number) => {
    set({ loading: true, error: null });
    try {
  const userId = useAuth.getState().user?.id;
  if (!userId) throw new Error('Usuario no autenticado');

      // actualizar asignado y estado (si estaba pendiente => contactado)
      const current = get().targets.find(t => t.id === id);
      const newEstado = current?.estado === 'pendiente' ? 'contactado' : current?.estado;

      const { error: upError } = await supabase
        .from('targets')
        .update({ asignado_a: userId, estado: newEstado })
        .eq('id', id);
      if (upError) throw upError;

      // crear evento de contacto si no existía
      if (!current?.fechaContacto) {
        await supabase.from('target_eventos').insert({
          target_id: id,
          tipo: 'contacto',
          detalle: 'Primer contacto'
        });
      }

      await get().fetchTargets();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al tomar target';
      set({ error: msg, loading: false });
      throw error as Error;
    } finally {
      set({ loading: false });
    }
  },

  releaseTarget: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const { error: upError } = await supabase
        .from('targets')
        .update({ asignado_a: null })
        .eq('id', id);
      if (upError) throw upError;
      await get().fetchTargets();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error al liberar target';
      set({ error: msg, loading: false });
      throw error as Error;
    } finally {
      set({ loading: false });
    }
  }
}));
