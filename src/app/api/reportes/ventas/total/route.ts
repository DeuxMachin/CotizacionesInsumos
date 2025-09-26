import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/reportes/ventas/total?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&estados=confirmada,pagada
// Llama a la función SQL fn_total_ventas_nv para obtener el total vendido.
export async function GET(request: NextRequest) {
  const started = Date.now()
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde') || null
    const hasta = searchParams.get('hasta') || null
    const estadosParam = searchParams.get('estados')
    // Si no pasan estados usar default de la función (ARRAY['confirmada']) mandando null
    const estados = estadosParam ? estadosParam.split(',').map(s => s.trim()).filter(Boolean) : null

    // 1. Intentar RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('fn_total_ventas_nv', {
      p_desde: desde,
      p_hasta: hasta,
      p_estados: estados
    })

    if (!rpcError) {
      const total = typeof rpcData === 'string' ? parseFloat(rpcData) : (rpcData ?? 0)
      return NextResponse.json({ success: true, data: { total, methodUsed: 'rpc', ms: Date.now() - started } })
    }

    console.warn('[GET /api/reportes/ventas/total] RPC falló, usando fallback SELECT', rpcError)

    // 2. Fallback: query directa a notas_venta
    let query = supabase.from('notas_venta').select('total, estado, fecha_emision')
    if (estados) query = query.in('estado', estados)
    if (desde) query = query.gte('fecha_emision', desde)
    if (hasta) query = query.lte('fecha_emision', hasta)

    const { data: notas, error: notasError } = await query
    if (notasError) {
      console.error('[GET /api/reportes/ventas/total] Fallback query error:', notasError)
      return NextResponse.json({ success: false, error: 'Error obteniendo total (fallback)' }, { status: 500 })
    }

    const totalFallback = (notas || []).reduce((sum, n) => sum + (n.total || 0), 0)
    return NextResponse.json({ success: true, data: { total: totalFallback, methodUsed: 'fallback', ms: Date.now() - started } })
  } catch (e) {
    console.error('[GET /api/reportes/ventas/total] Unexpected error:', e)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
