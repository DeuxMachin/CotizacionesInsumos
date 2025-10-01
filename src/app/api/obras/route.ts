import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mapSupabaseObra, type SupabaseJoinedObra } from '@/features/obras/model/obraMapper'
import type { Obra } from '@/features/obras/types/obras'

function serializeObra(obra: Obra) {
  return {
    ...obra,
    fechaInicio: obra.fechaInicio.toISOString(),
    fechaEstimadaFin: obra.fechaEstimadaFin ? obra.fechaEstimadaFin.toISOString() : null,
    fechaUltimoContacto: obra.fechaUltimoContacto.toISOString(),
    proximoSeguimiento: obra.proximoSeguimiento ? obra.proximoSeguimiento.toISOString() : null,
    fechaCreacion: obra.fechaCreacion.toISOString(),
    fechaActualizacion: obra.fechaActualizacion.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteIdParam = searchParams.get('cliente_id')

    let query = supabase
      .from('obras')
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
      .order('created_at', { ascending: false })

    if (clienteIdParam) {
      const clienteId = Number(clienteIdParam)
      if (Number.isNaN(clienteId)) {
        return NextResponse.json({ success: false, error: 'cliente_id inválido' }, { status: 400 })
      }
      query = query.eq('cliente_id', clienteId)
    }

    const { data, error } = await query
    if (error) throw error

    const obras = (data ?? []).map((row) => mapSupabaseObra(row as unknown as SupabaseJoinedObra))
    const serialized = obras.map(serializeObra)

    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    console.error('Error fetching obras:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener las obras' }, { status: 500 })
  }
}
