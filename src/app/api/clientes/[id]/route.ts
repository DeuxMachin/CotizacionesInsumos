import { NextRequest, NextResponse } from 'next/server'
import { ClientesService } from '@/services/clientesService'

export const dynamic = 'force-dynamic' // Make this route dynamic

// Helper para extraer y validar ID desde params asíncronos
async function extractId(paramsPromise: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await paramsPromise;
  const parsed = parseInt(id, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// GET /api/clientes/[id] - Obtener cliente por ID
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
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = await extractId(context.params);
    const body = await request.json()

    console.log('🔍 PUT /api/clientes/[id] - ID:', id);
    console.log('🔍 Headers recibidos:', {
      'x-user-id': request.headers.get('x-user-id'),
      'x-user-email': request.headers.get('x-user-email'),
      'x-user-name': request.headers.get('x-user-name')
    });
    console.log('🔍 Body recibido:', body);

    if (id === null) {
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

    // Obtener información del usuario desde headers para audit log
    const userInfo = {
      id: request.headers.get('x-user-id') || 'unknown',
      email: request.headers.get('x-user-email') || 'unknown@domain.com',
      name: request.headers.get('x-user-name') || 'Usuario'
    };

    console.log('🔍 UserInfo para audit:', userInfo);

    const cliente = await ClientesService.update(id, body, userInfo)

    console.log('🔍 Cliente actualizado exitosamente:', cliente);

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('🔍 Error updating cliente:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({
      success: false,
      error: `Error al actualizar el cliente: ${errorMessage}`
    }, { status: 500 })
  }
}

// DELETE /api/clientes/[id] - Eliminar cliente (cambiar estado)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = await extractId(context.params);

    console.log('🔍 DELETE /api/clientes/[id] - ID:', id);
    console.log('🔍 Headers recibidos:', {
      'x-user-id': request.headers.get('x-user-id'),
      'x-user-email': request.headers.get('x-user-email'),
      'x-user-name': request.headers.get('x-user-name')
    });

    if (id === null) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido'
      }, { status: 400 })
    }

    // Obtener información del usuario desde headers para audit log
    const userInfo = {
      id: request.headers.get('x-user-id') || 'unknown',
      email: request.headers.get('x-user-email') || 'unknown@domain.com',
      name: request.headers.get('x-user-name') || 'Usuario'
    };

    console.log('🔍 UserInfo para audit:', userInfo);

    const cliente = await ClientesService.delete(id, userInfo)

    console.log('🔍 Cliente eliminado exitosamente:', cliente);

    return NextResponse.json({
      success: true,
      data: cliente
    })
  } catch (error) {
    console.error('🔍 Error deleting cliente:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({
      success: false,
      error: `Error al eliminar el cliente: ${errorMessage}`
    }, { status: 500 })
  }
}

