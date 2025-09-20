"use client";

import { supabase, type Database } from "@/lib/supabase";
import type { IObrasService } from "./ObrasService";
import type { Obra, EstadoObra, FiltroObras, EstadisticasObras, EtapaObra } from "../types/obras";

type ObrasRow = Database["public"]["Tables"]["obras"]["Row"];

type JoinedObra = ObrasRow & {
  cliente?: {
    id: number;
    rut: string | null;
    nombre_razon_social: string | null;
    telefono: string | null;
    celular: string | null;
    email_pago: string | null;
    direccion: string | null;
    comuna: string | null;
    ciudad: string | null;
  } | null;
  vendedor?: {
    id: string;
    nombre: string | null;
    apellido: string | null;
    email: string;
  } | null;
  contactos?: Array<{
    id: number;
    nombre: string | null;
    cargo: string | null;
    telefono: string | null;
    email: string | null;
    es_principal: boolean;
  } > | null;
  tipo?: { id: number; nombre: string } | null;
  tamano?: { id: number; nombre: string } | null;
};

// Tipo intermedio para el resultado crudo de Supabase (con alias de relaciones)
type SupabaseJoinedObra = {
  id: number; nombre: string; direccion: string | null; comuna: string | null; ciudad: string | null; vendedor_id: string | null; cliente_id: number | null; tipo_obra_id: number | null; tamano_obra_id: number | null;
  estado?: string | null; etapa_actual?: string | null; descripcion?: string | null; fecha_inicio?: string | null; fecha_estimada_fin?: string | null; fecha_ultimo_contacto?: string | null; valor_estimado?: number | null; material_vendido?: number | null; proximo_seguimiento?: string | null; notas?: string | null; created_at?: string | null; updated_at?: string | null;
  cliente?: { id: number; rut: string | null; nombre_razon_social: string | null; telefono: string | null; celular: string | null; email_pago: string | null; direccion: string | null; comuna: string | null; ciudad: string | null } | null;
  vendedor?: { id: string; nombre: string | null; apellido: string | null; email: string } | null;
  contactos?: Array<{ id: number; nombre: string | null; cargo: string | null; telefono: string | null; email: string | null; es_principal: boolean }> | null;
  tipo?: { id: number; nombre: string } | null;
  tamano?: { id: number; nombre: string } | null;
};

function safeDate(d?: string | null, fallback?: Date): Date | undefined {
  return d ? new Date(d) : fallback;
}

function toEstado(value?: string | null): EstadoObra {
  const v = (value || '').toLowerCase();
  const allowed: EstadoObra[] = ['planificacion','activa','pausada','finalizada','cancelada','sin_contacto'];
  return (allowed as string[]).includes(v) ? (v as EstadoObra) : 'planificacion';
}

function toEtapa(value?: string | null): EtapaObra {
  const v = (value || '').toLowerCase();
  const allowed: EtapaObra[] = ['fundacion','estructura','albanileria','instalaciones','terminaciones','entrega'];
  return (allowed as string[]).includes(v) ? (v as EtapaObra) : 'fundacion';
}

function mapDbRowToObra(row: JoinedObra): Obra {
  const principal = (row.contactos || []).find(c => c.es_principal) || (row.contactos || [])[0];
  const cliente = row.cliente;
  const vendedor = row.vendedor;
  const nombreVendedor = [vendedor?.nombre, vendedor?.apellido].filter(Boolean).join(' ') || (vendedor?.email || '');

  return {
    id: String(row.id),
    nombreEmpresa: row.nombre,
    constructora: {
      nombre: cliente?.nombre_razon_social || '',
      rut: cliente?.rut || '',
      telefono: cliente?.telefono || cliente?.celular || '',
      email: cliente?.email_pago || undefined,
      direccion: cliente?.direccion || undefined,
      contactoPrincipal: {
        nombre: principal?.nombre || '',
        cargo: principal?.cargo || '',
        telefono: principal?.telefono || '',
        email: principal?.email || undefined,
      },
    },
    vendedorAsignado: row.vendedor_id ?? '',
    nombreVendedor,
    estado: toEstado(row.estado ?? null),
    etapaActual: toEtapa(row.etapa_actual ?? null),
    etapasCompletadas: [],
    descripcion: row.descripcion || undefined,
    direccionObra: [row.direccion, row.comuna, row.ciudad].filter(Boolean).join(', '),
    comuna: row.comuna ?? undefined,
    ciudad: row.ciudad ?? undefined,
    fechaInicio: safeDate(row.fecha_inicio, new Date())!,
    fechaEstimadaFin: safeDate(row.fecha_estimada_fin),
    fechaUltimoContacto: safeDate(row.fecha_ultimo_contacto, new Date())!,
    valorEstimado: row.valor_estimado ?? undefined,
    materialVendido: row.material_vendido ?? 0,
    proximoSeguimiento: safeDate(row.proximo_seguimiento),
    fechaCreacion: safeDate(row.created_at, new Date())!,
    fechaActualizacion: safeDate(row.updated_at, new Date())!,
    notas: row.notas || undefined,
    clienteId: row.cliente_id ?? undefined,
    tipoObraId: row.tipo_obra_id ?? undefined,
    tamanoObraId: row.tamano_obra_id ?? undefined,
  };
}

export class SupabaseObrasService implements IObrasService {
  async getObras(filtros: FiltroObras, userId?: string, isAdmin?: boolean): Promise<Obra[]> {
    let query = supabase
      .from("obras")
      .select(`
        id, nombre, direccion, comuna, ciudad, vendedor_id, cliente_id, tipo_obra_id, tamano_obra_id,
        estado, etapa_actual, descripcion, fecha_inicio, fecha_estimada_fin, fecha_ultimo_contacto,
        valor_estimado, material_vendido, proximo_seguimiento, notas, created_at, updated_at,
        cliente:clientes!obras_cliente_id_fkey ( id, rut, nombre_razon_social, telefono, celular, email_pago, direccion, comuna, ciudad ),
        vendedor:usuarios!obras_vendedor_id_fkey ( id, nombre, apellido, email ),
        contactos:obra_contactos ( id, nombre, cargo, telefono, email, es_principal ),
        tipo:obra_tipos ( id, nombre ),
        tamano:obra_tamanos ( id, nombre )
      `);

    if (!isAdmin && userId) {
      query = query.eq("vendedor_id", userId);
    }

  const { data, error } = await query;
    if (error) throw error;
  const obras = (data ?? []).map((r) => mapDbRowToObra((r as unknown as SupabaseJoinedObra) as JoinedObra));

    // Apply client-side filters for fields not present in DB
    let filtered = obras;
    if (filtros.estado && filtros.estado.length > 0) {
      filtered = filtered.filter((o) => filtros.estado!.includes(o.estado));
    }
    if (filtros.etapa && filtros.etapa.length > 0) {
      filtered = filtered.filter((o) => filtros.etapa!.includes(o.etapaActual));
    }
    if (filtros.vendedor) {
      filtered = filtered.filter((o) => o.vendedorAsignado === filtros.vendedor);
    }
    if (filtros.fechaDesde) {
      filtered = filtered.filter((o) => o.fechaInicio >= filtros.fechaDesde!);
    }
    if (filtros.fechaHasta) {
      filtered = filtered.filter((o) => o.fechaInicio <= filtros.fechaHasta!);
    }
    if (filtros.busqueda) {
      const b = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.nombreEmpresa.toLowerCase().includes(b) ||
          o.constructora.nombre.toLowerCase().includes(b) ||
          o.direccionObra.toLowerCase().includes(b) ||
          o.constructora.rut.includes(b)
      );
    }
    return filtered;
  }

  async getObraById(id: string): Promise<Obra | null> {
    const { data, error } = await supabase
      .from("obras")
      .select(`
        id, nombre, direccion, comuna, ciudad, vendedor_id, cliente_id, tipo_obra_id, tamano_obra_id,
        estado, etapa_actual, descripcion, fecha_inicio, fecha_estimada_fin, fecha_ultimo_contacto,
        valor_estimado, material_vendido, proximo_seguimiento, notas, created_at, updated_at,
        cliente:clientes!obras_cliente_id_fkey ( id, rut, nombre_razon_social, telefono, celular, email_pago, direccion, comuna, ciudad ),
        vendedor:usuarios!obras_vendedor_id_fkey ( id, nombre, apellido, email ),
        contactos:obra_contactos ( id, nombre, cargo, telefono, email, es_principal ),
        tipo:obra_tipos ( id, nombre ),
        tamano:obra_tamanos ( id, nombre )
      `)
      .eq("id", Number(id))
      .single();
    if (error) {
      if (error.code === "PGRST116" /* not found */) return null;
      throw error;
    }
  return data ? mapDbRowToObra((data as unknown as SupabaseJoinedObra) as JoinedObra) : null;
  }

  getEstadisticas(obras: Obra[]): EstadisticasObras {
    const obrasPorEstado = obras.reduce((acc, obra) => {
      acc[obra.estado] = (acc[obra.estado] || 0) + 1;
      return acc;
    }, {} as Record<EstadoObra, number>);

    const obrasPorEtapa = obras.reduce((acc, obra) => {
      acc[obra.etapaActual] = (acc[obra.etapaActual] || 0) + 1;
      return acc;
    }, {} as Record<EtapaObra, number>);

    const valorTotalEstimado = obras.reduce((acc, o) => acc + (o.valorEstimado || 0), 0);
    const materialVendidoTotal = obras.reduce((acc, o) => acc + o.materialVendido, 0);

    return {
      totalObras: obras.length,
      obrasPorEstado,
      obrasPorEtapa,
      valorTotalEstimado,
      materialVendidoTotal,
    };
  }

  async actualizarEstadoObra(_id: string, _nuevoEstado: EstadoObra): Promise<boolean> { return true; }

  async eliminarObra(id: string): Promise<boolean> {
    const { error } = await supabase.from("obras").delete().eq("id", Number(id));
    if (error) throw error;
    return true;
  }

  async crearObra(
    obra: Omit<Obra, "id" | "fechaCreacion" | "fechaActualizacion" | "fechaUltimoContacto">,
    userId?: string
  ): Promise<boolean> {
    const insert: Database["public"]["Tables"]["obras"]["Insert"] = {
      nombre: obra.nombreEmpresa,
      direccion: obra.direccionObra,
      comuna: obra.comuna ?? null,
      ciudad: obra.ciudad ?? null,
      cliente_id: obra.clienteId ?? null,
      vendedor_id: userId ?? null,
      tipo_obra_id: obra.tipoObraId ?? null,
      tamano_obra_id: obra.tamanoObraId ?? null,
      estado: obra.estado,
      etapa_actual: obra.etapaActual,
      descripcion: obra.descripcion ?? null,
      fecha_inicio: obra.fechaInicio?.toISOString().slice(0, 10) ?? null,
      fecha_estimada_fin: obra.fechaEstimadaFin ? obra.fechaEstimadaFin.toISOString().slice(0, 10) : null,
      valor_estimado: obra.valorEstimado ?? null,
      material_vendido: obra.materialVendido ?? 0,
      proximo_seguimiento: obra.proximoSeguimiento ? obra.proximoSeguimiento.toISOString().slice(0, 10) : null,
      notas: obra.notas ?? null,
    };
    // Insert obra and retrieve new id without forcing single() to avoid odd select aliasing in some setups
    let insertResult = await supabase.from("obras").insert(insert).select('id');
    if (insertResult.error) {
      const msg = insertResult.error.message || '';
      if (msg.includes('obras_vendedor_id_fkey') || (msg.toLowerCase().includes('foreign key') && msg.toLowerCase().includes('vendedor'))) {
        const { vendedor_id: _omit, ...rest } = insert;
        insertResult = await supabase.from("obras").insert({ ...rest, vendedor_id: null }).select('id');
      }
    }
    if (insertResult.error) throw insertResult.error;
    const newId = Array.isArray(insertResult.data) ? insertResult.data[0]?.id : (insertResult.data as { id?: number } | null)?.id;
    if (!newId) throw new Error('No se pudo obtener el ID de la nueva obra');

    // Insertar contacto principal si viene en el payload
  if (newId && obra.constructora?.contactoPrincipal?.nombre) {
      const cp = obra.constructora.contactoPrincipal;
      const contacto: Database['public']['Tables']['obra_contactos']['Insert'] = {
        obra_id: newId,
        nombre: cp.nombre,
        cargo: cp.cargo,
        telefono: cp.telefono || null,
        email: cp.email || null,
        es_principal: true,
      };
      const { error: cErr } = await supabase.from('obra_contactos').insert(contacto);
      if (cErr) throw cErr;
    }
    return true;
  }

  async crearObraDesdeTarget(
    obra: Omit<Obra, "id" | "fechaCreacion" | "fechaActualizacion" | "fechaUltimoContacto">,
    userId: string | undefined,
    targetId: number
  ): Promise<number> {
    const insert: Database["public"]["Tables"]["obras"]["Insert"] = {
      nombre: obra.nombreEmpresa,
      direccion: obra.direccionObra,
      comuna: obra.comuna ?? null,
      ciudad: obra.ciudad ?? null,
      cliente_id: obra.clienteId ?? null,
      vendedor_id: userId ?? null,
      tipo_obra_id: obra.tipoObraId ?? null,
      tamano_obra_id: obra.tamanoObraId ?? null,
      estado: obra.estado,
      etapa_actual: obra.etapaActual,
      descripcion: obra.descripcion ?? null,
      fecha_inicio: obra.fechaInicio?.toISOString().slice(0, 10) ?? null,
      fecha_estimada_fin: obra.fechaEstimadaFin ? obra.fechaEstimadaFin.toISOString().slice(0, 10) : null,
      valor_estimado: obra.valorEstimado ?? null,
      material_vendido: obra.materialVendido ?? 0,
      proximo_seguimiento: obra.proximoSeguimiento ? obra.proximoSeguimiento.toISOString().slice(0, 10) : null,
      notas: obra.notas ?? null,
    };

    let insertResult = await supabase.from("obras").insert(insert).select('id');
    if (insertResult.error) {
      const msg = insertResult.error.message || '';
      if (msg.includes('obras_vendedor_id_fkey') || (msg.toLowerCase().includes('foreign key') && msg.toLowerCase().includes('vendedor'))) {
        const { vendedor_id: _omit, ...rest } = insert;
        insertResult = await supabase.from("obras").insert({ ...rest, vendedor_id: null }).select('id');
      }
    }
    if (insertResult.error) throw insertResult.error;
    const newId = Array.isArray(insertResult.data) ? insertResult.data[0]?.id : (insertResult.data as { id?: number } | null)?.id;
    if (!newId) throw new Error('No se pudo obtener el ID de la nueva obra');

  // Set vínculo con target en la obra (si el tipo generado no conoce target_id, hacemos cast)
  await supabase.from('obras').update({ target_id: targetId } as any).eq('id', newId);

  // contacto principal si viene
    if (obra.constructora?.contactoPrincipal?.nombre) {
      const cp = obra.constructora.contactoPrincipal;
      const contacto: Database['public']['Tables']['obra_contactos']['Insert'] = {
        obra_id: newId,
        nombre: cp.nombre,
        cargo: cp.cargo,
        telefono: cp.telefono || null,
        email: cp.email || null,
        es_principal: true,
      };
      const { error: cErr } = await supabase.from('obra_contactos').insert(contacto);
      if (cErr) throw cErr;
    }

    return newId;
  }

  async actualizarObra(obra: Obra): Promise<boolean> {
  const update: Database["public"]["Tables"]["obras"]["Update"] = {
      nombre: obra.nombreEmpresa,
      direccion: obra.direccionObra,
      comuna: obra.comuna ?? null,
      ciudad: obra.ciudad ?? null,
      cliente_id: obra.clienteId ?? null,
      vendedor_id: obra.vendedorAsignado ?? null,
      tipo_obra_id: obra.tipoObraId ?? null,
      tamano_obra_id: obra.tamanoObraId ?? null,
      estado: obra.estado,
      etapa_actual: obra.etapaActual,
      descripcion: obra.descripcion ?? null,
      fecha_inicio: obra.fechaInicio?.toISOString().slice(0, 10) ?? null,
      fecha_estimada_fin: obra.fechaEstimadaFin ? obra.fechaEstimadaFin.toISOString().slice(0, 10) : null,
      valor_estimado: obra.valorEstimado ?? null,
      material_vendido: obra.materialVendido ?? 0,
      proximo_seguimiento: obra.proximoSeguimiento ? obra.proximoSeguimiento.toISOString().slice(0, 10) : null,
      notas: obra.notas ?? null,
    };

    const { error } = await supabase
      .from('obras')
      .update(update)
      .eq('id', Number(obra.id));
    if (error) throw error;

    // Actualizar/crear contacto principal si viene
    const cp = obra.constructora?.contactoPrincipal;
    if (cp && cp.nombre) {
      // Buscar si existe contacto principal
      const { data: existing, error: fetchErr } = await supabase
        .from('obra_contactos')
        .select('id')
        .eq('obra_id', Number(obra.id))
        .eq('es_principal', true)
        .limit(1);
      if (fetchErr) throw fetchErr;

      if (existing && existing.length > 0) {
        const { error: upErr } = await supabase
          .from('obra_contactos')
          .update({ nombre: cp.nombre, cargo: cp.cargo, telefono: cp.telefono || null, email: cp.email || null })
          .eq('id', existing[0].id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from('obra_contactos')
          .insert({ obra_id: Number(obra.id), nombre: cp.nombre, cargo: cp.cargo, telefono: cp.telefono || null, email: cp.email || null, es_principal: true });
        if (insErr) throw insErr;
      }
    }

    return true;
  }
}
