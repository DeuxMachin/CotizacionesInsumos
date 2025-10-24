import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    // Obtener datos del request
    const data = await request.json();

    // Validaciones básicas
    if (!data.nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre del producto es obligatorio' },
        { status: 400 }
      );
    }

    if (!data.unidad?.trim()) {
      return NextResponse.json(
        { error: 'La unidad del producto es obligatoria' },
        { status: 400 }
      );
    }

    // Preparar datos para actualización
    const updateData = {
      nombre: data.nombre.trim(),
      sku: data.sku || null,
      descripcion: data.descripcion || null,
      unidad: data.unidad.trim(),
      tipo_id: data.tipo_id || null,
      afecto_iva: data.afecto_iva ?? false,
      moneda: data.moneda || null,
      costo_unitario: data.costo_unitario || null,
      margen_pct: data.margen_pct || null,
      precio_neto: data.precio_neto || null,
      precio_venta: data.precio_venta || null,
      control_stock: data.control_stock ?? false,
      ficha_tecnica: data.ficha_tecnica || null,
      estado: data.estado || 'disponible',
      activo: data.activo ?? true
    };

    // Actualizar producto
    const { data: product, error } = await supabaseAdmin
      .from('productos')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando producto:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el producto', details: error.message },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error('Error en PUT /api/productos/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID de producto inválido' },
        { status: 400 }
      );
    }

    // Marcar producto como inactivo (soft delete)
    const { data: deletedProduct, error } = await supabaseAdmin
      .from('productos')
      .update({ 
        activo: false
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error eliminando producto:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el producto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Producto eliminado exitosamente',
      product: deletedProduct
    });

  } catch (error) {
    console.error('Error en DELETE /api/productos/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}