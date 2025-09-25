import { NextRequest, NextResponse } from 'next/server'
import { ClientesService } from '@/services/clientesService'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // Make this route dynamic

// Helper para extraer y validar ID desde params asíncronos
async function extractId(paramsPromise: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await paramsPromise;
  const parsed = parseInt(id, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// GET /api/clientes/[id]/dashboard - Obtener datos completos del dashboard del cliente
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = await extractId(context.params);

    if (id === null) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido'
      }, { status: 400 })
    }

    // Ejecutar todas las consultas en paralelo para optimizar
    const [cliente, cotizaciones, obras, notasVenta] = await Promise.all([
      ClientesService.getById(id),
      // Cotizaciones por cliente
      supabase
        .from('cotizaciones')
        .select(`
          *,
          obra:obras(id, nombre),
          creador:usuarios!vendedor_id(id, nombre, apellido)
        `)
        .eq('cliente_principal_id', id)
        .order('created_at', { ascending: false }),
      // Obras por cliente
      supabase
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
        .eq('cliente_id', id)
        .order('created_at', { ascending: false }),
      // Notas de venta por cliente
      supabase
        .from('notas_venta')
        .select(`
          *,
          obra:obras(id, nombre),
          creador:usuarios!vendedor_id(id, nombre, apellido)
        `)
        .eq('cliente_principal_id', id)
        .order('created_at', { ascending: false })
    ]);

    // Verificar errores
    if (cotizaciones.error) throw cotizaciones.error;
    if (obras.error) throw obras.error;
    if (notasVenta.error) throw notasVenta.error;

    return NextResponse.json({
      success: true,
      data: {
        cliente,
        cotizaciones: cotizaciones.data || [],
        obras: obras.data || [],
        notasVenta: notasVenta.data || []
      }
    })
  } catch (error) {
    console.error('Error fetching client dashboard data:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener los datos del dashboard'
    }, { status: 500 })
  }
}