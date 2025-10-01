"use client";

import { supabase, type Database } from "@/lib/supabase";
import type { IObrasService } from "./ObrasService";
import type { Obra, EstadoObra, FiltroObras, EstadisticasObras, EtapaObra, ObraContacto } from "../types/obras";
import { REQUIRED_CARGOS } from "../types/obras";
import { mapSupabaseObra, type SupabaseJoinedObra } from "../model/obraMapper";

export class SupabaseObrasService implements IObrasService {
  async getObras(filtros: FiltroObras, userId?: string, isAdmin?: boolean): Promise<Obra[]> {
    let query = supabase
      .from("obras")
      .select(`
        id, nombre, direccion, comuna, ciudad, vendedor_id, cliente_id, tipo_obra_id, tamano_obra_id,
        estado, etapa_actual, descripcion, fecha_inicio, fecha_estimada_fin, fecha_ultimo_contacto,
        valor_estimado, material_vendido, pendiente, proximo_seguimiento, notas, created_at, updated_at,
        cliente:clientes!obras_cliente_id_fkey ( id, rut, nombre_razon_social, telefono, celular, email_pago, direccion, comuna, ciudad ),
        vendedor:usuarios!obras_vendedor_id_fkey ( id, nombre, apellido, email ),
        contactos:obra_contactos ( id, nombre, cargo, telefono, email, es_principal ),
        tipo:obra_tipos ( id, nombre ),
        tamano:obra_tamanos ( id, nombre ),
        notas_venta:notas_venta!notas_venta_obra_id_fkey ( total )
      `);

    if (!isAdmin && userId) {
      query = query.eq("vendedor_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    const obras = (data ?? []).map((r) => mapSupabaseObra(r as unknown as SupabaseJoinedObra));

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
        valor_estimado, material_vendido, pendiente, proximo_seguimiento, notas, created_at, updated_at,
        cliente:clientes!obras_cliente_id_fkey ( id, rut, nombre_razon_social, telefono, celular, email_pago, direccion, comuna, ciudad ),
        vendedor:usuarios!obras_vendedor_id_fkey ( id, nombre, apellido, email ),
        contactos:obra_contactos ( id, nombre, cargo, telefono, email, es_principal ),
        tipo:obra_tipos ( id, nombre ),
        tamano:obra_tamanos ( id, nombre ),
        notas_venta:notas_venta!notas_venta_obra_id_fkey ( total )
      `)
      .eq("id", Number(id))
      .single();
    if (error) {
      if (error.code === "PGRST116" /* not found */) return null;
      throw error;
    }
    return data ? mapSupabaseObra(data as unknown as SupabaseJoinedObra) : null;
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

  async eliminarObra(id: number): Promise<boolean> {
    const { error } = await supabase.from("obras").delete().eq("id", id);
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

    // Construir los 5 contactos requeridos
    if (newId) {
      const provided = (obra.contactos || []) as ObraContacto[];
      // Asegurar que exista al menos el principal desde constructora.contactoPrincipal
      const principal = obra.constructora?.contactoPrincipal;
      const rows: Database['public']['Tables']['obra_contactos']['Insert'][] = REQUIRED_CARGOS.map((cargo, idx) => {
        const match = provided.find(c => (c.cargo || '').toLowerCase() === cargo.toLowerCase());
        const baseNombre = match?.nombre || (idx === 0 && principal?.nombre) || 'No existe';
        const baseTel = match?.telefono || (idx === 0 && principal?.telefono) || null;
        const baseEmail = match?.email || (idx === 0 && principal?.email) || null;
        return {
          obra_id: newId,
          nombre: baseNombre,
          cargo,
          telefono: baseTel,
          email: baseEmail,
          es_principal: idx === 0 || !!match?.es_principal,
        };
      });
      const { error: cErr } = await supabase.from('obra_contactos').insert(rows);
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
  const updatePayload: Database['public']['Tables']['obras']['Update'] = { target_id: targetId } as Database['public']['Tables']['obras']['Update'];
  await supabase.from('obras').update(updatePayload).eq('id', newId);

    // Insertar los 5 contactos requeridos desde payload (o placeholders)
    {
      const provided = (obra.contactos || []) as ObraContacto[];
      const principal = obra.constructora?.contactoPrincipal;
      const rows: Database['public']['Tables']['obra_contactos']['Insert'][] = REQUIRED_CARGOS.map((cargo, idx) => {
        const match = provided.find(c => (c.cargo || '').toLowerCase() === cargo.toLowerCase());
        const baseNombre = match?.nombre || (idx === 0 && principal?.nombre) || 'No existe';
        const baseTel = match?.telefono || (idx === 0 && principal?.telefono) || null;
        const baseEmail = match?.email || (idx === 0 && principal?.email) || null;
        return {
          obra_id: newId,
          nombre: baseNombre,
          cargo,
          telefono: baseTel,
          email: baseEmail,
          es_principal: idx === 0 || !!match?.es_principal,
        };
      });
      const { error: cErr } = await supabase.from('obra_contactos').insert(rows);
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

    // Upsert de los 5 contactos por cargo
    const provided = (obra.contactos || []) as ObraContacto[];
    for (let i = 0; i < REQUIRED_CARGOS.length; i++) {
      const cargo = REQUIRED_CARGOS[i];
      const incoming = provided.find(c => (c.cargo || '').toLowerCase() === cargo.toLowerCase());
      const nombre = incoming?.nombre || 'No existe';
      const telefono = incoming?.telefono || null;
      const email = incoming?.email || null;
      const es_principal = i === 0 || !!incoming?.es_principal;

      // Existe registro para ese cargo?
      const { data: existing, error: fetchErr } = await supabase
        .from('obra_contactos')
        .select('id')
        .eq('obra_id', Number(obra.id))
        .eq('cargo', cargo)
        .limit(1);
      if (fetchErr) throw fetchErr;
      if (existing && existing.length > 0) {
        const { error: upErr } = await supabase
          .from('obra_contactos')
          .update({ nombre, telefono, email, es_principal })
          .eq('id', existing[0].id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from('obra_contactos')
          .insert({ obra_id: Number(obra.id), cargo, nombre, telefono, email, es_principal });
        if (insErr) throw insErr;
      }
    }

    return true;
  }

  async registrarPrestamo(obraId: string, monto: number, descripcion?: string): Promise<boolean> {
    try {
      // Obtener el pendiente actual
      const { data: obra, error: fetchError } = await supabase
        .from('obras')
        .select('pendiente')
        .eq('id', obraId)
        .single();

      if (fetchError) throw fetchError;

      const pendienteActual = obra?.pendiente || 0;
      const nuevoPendiente = pendienteActual + monto;

      // Actualizar el pendiente
      const { error: updateError } = await supabase
        .from('obras')
        .update({ pendiente: nuevoPendiente })
        .eq('id', obraId);

      if (updateError) throw updateError;

      console.log(`Préstamo registrado en obra ${obraId}: ${pendienteActual} -> ${nuevoPendiente} (${descripcion || 'Sin descripción'})`);
      return true;
    } catch (error) {
      console.error('Error registrando préstamo:', error);
      throw error;
    }
  }

  async registrarPago(obraId: string, monto: number, descripcion?: string): Promise<boolean> {
    try {
      // Obtener el pendiente actual
      const { data: obra, error: fetchError } = await supabase
        .from('obras')
        .select('pendiente')
        .eq('id', obraId)
        .single();

      if (fetchError) throw fetchError;

      const pendienteActual = obra?.pendiente || 0;
      const nuevoPendiente = Math.max(0, pendienteActual - monto); // No permitir negativo

      // Actualizar el pendiente
      const { error: updateError } = await supabase
        .from('obras')
        .update({ pendiente: nuevoPendiente })
        .eq('id', obraId);

      if (updateError) throw updateError;

      console.log(`Pago registrado en obra ${obraId}: ${pendienteActual} -> ${nuevoPendiente} (${descripcion || 'Sin descripción'})`);
      return true;
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }
}
