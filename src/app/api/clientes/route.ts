import { NextRequest, NextResponse } from 'next/server'
import { ClientesService } from '@/services/clientesService'
import { getCurrentUser, getUserInfoForAudit } from '@/lib/auth-helpers'

// GET /api/clientes - Obtener todos los clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let clientes
    if (search) {
      clientes = await ClientesService.search(search)
    } else {
      clientes = await ClientesService.getAll()
    }

    return NextResponse.json({
      success: true,
      data: clientes
    })
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener los clientes'
    }, { status: 500 })
  }
}

// POST /api/clientes - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Obtener información del usuario autenticado
    const user = await getCurrentUser(request)
    const userInfo = getUserInfoForAudit(user)

    // Validar que el RUT no exista
    const rutExists = await ClientesService.checkRutExists(body.rut)
    if (rutExists) {
      return NextResponse.json({
        success: false,
        error: 'Ya existe un cliente con este RUT'
      }, { status: 400 })
    }

    const cliente = await ClientesService.create(body, userInfo)

    return NextResponse.json({
      success: true,
      data: cliente
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear el cliente'
    }, { status: 500 })
  }
}
