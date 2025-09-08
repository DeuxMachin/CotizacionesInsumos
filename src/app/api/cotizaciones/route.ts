import { NextRequest, NextResponse } from 'next/server'
import { CotizacionesService } from '@/services/cotizacionesService'

// GET /api/cotizaciones - Obtener todas las cotizaciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('cliente_id')

    let cotizaciones
    if (estado) {
      cotizaciones = await CotizacionesService.getByEstado(estado)
    } else if (clienteId) {
      cotizaciones = await CotizacionesService.getByCliente(parseInt(clienteId))
    } else {
      cotizaciones = await CotizacionesService.getAll()
    }

    return NextResponse.json({
      success: true,
      data: cotizaciones
    })
  } catch (error) {
    console.error('Error fetching cotizaciones:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener las cotizaciones'
    }, { status: 500 })
  }
}

// POST /api/cotizaciones - Crear nueva cotización
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generar folio automáticamente si no se proporciona
    if (!body.folio) {
      body.folio = await CotizacionesService.generateFolio()
    }

    // Calcular fecha de vencimiento si no se proporciona
    if (!body.fecha_vencimiento && body.fecha_emision && body.validez_dias) {
      const fechaEmision = new Date(body.fecha_emision)
      const fechaVencimiento = new Date(fechaEmision)
      fechaVencimiento.setDate(fechaVencimiento.getDate() + body.validez_dias)
      body.fecha_vencimiento = fechaVencimiento.toISOString().split('T')[0]
    }

    const cotizacion = await CotizacionesService.create(body)

    return NextResponse.json({
      success: true,
      data: cotizacion
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cotizacion:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear la cotización'
    }, { status: 500 })
  }
}
