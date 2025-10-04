import { NextRequest, NextResponse } from 'next/server';
import { ClienteContactosService } from '@/services/clienteContactosService';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/clientes/[id]/contactos - Obtener todos los contactos de un cliente
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const clienteId = parseInt(id);
    
    if (isNaN(clienteId)) {
      return NextResponse.json({
        success: false,
        error: 'ID de cliente inválido'
      }, { status: 400 });
    }

    const contactos = await ClienteContactosService.getByClienteId(clienteId);

    return NextResponse.json({
      success: true,
      data: contactos
    });
  } catch (error) {
    console.error('Error fetching cliente contactos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener los contactos del cliente'
    }, { status: 500 });
  }
}

/**
 * POST /api/clientes/[id]/contactos - Crear un nuevo contacto para un cliente
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const clienteId = parseInt(id);
    
    if (isNaN(clienteId)) {
      return NextResponse.json({
        success: false,
        error: 'ID de cliente inválido'
      }, { status: 400 });
    }

    const body = await request.json();
    
    const contacto = await ClienteContactosService.create({
      ...body,
      cliente_id: clienteId
    });

    return NextResponse.json({
      success: true,
      data: contacto
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contacto:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al crear el contacto'
    }, { status: 500 });
  }
}
