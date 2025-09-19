import { NextRequest, NextResponse } from 'next/server'
import { ClientesService } from '@/services/clientesService'

export async function GET(request: NextRequest) {
  try {
    const clientTypes = await ClientesService.getClientTypes()
    return NextResponse.json({ data: clientTypes })
  } catch (error) {
    console.error('Error fetching client types:', error)
    return NextResponse.json(
      { error: 'Error al obtener tipos de cliente' },
      { status: 500 }
    )
  }
}