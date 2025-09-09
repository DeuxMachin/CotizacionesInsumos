import { NextRequest, NextResponse } from 'next/server'
import { ClientesService } from '@/services/clientesService'

export const dynamic = 'force-dynamic' // Make this route dynamic

// GET /api/clientes/[id] - Obtener cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido'
      }, { status: 400 })
    }

    const cliente = await ClientesService.getById(id)

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error fetching cliente:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el cliente'
    }, { status: 500 })
  }
}

// PUT /api/clientes/[id] - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido'
      }, { status: 400 })
    }

    // Si se está actualizando el RUT, verificar que no exista
    if (body.rut) {
      const rutExists = await ClientesService.checkRutExists(body.rut, id)
      if (rutExists) {
        return NextResponse.json({
          success: false,
          error: 'Ya existe un cliente con este RUT'
        }, { status: 400 })
      }
    }

    const cliente = await ClientesService.update(id, body)

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error updating cliente:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar el cliente'
    }, { status: 500 })
  }
}

// DELETE /api/clientes/[id] - Eliminar cliente (cambiar estado)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido'
      }, { status: 400 })
    }

    const cliente = await ClientesService.delete(id)

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar el cliente'
    }, { status: 500 })
  }
}
