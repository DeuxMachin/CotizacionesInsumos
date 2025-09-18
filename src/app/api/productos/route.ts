import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
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

    // Preparar datos para inserción
    const productData = {
      nombre: data.nombre.trim(),
      sku: data.sku || null,
      descripcion: data.descripcion || null,
      unidad: data.unidad.trim(),
      tipo_id: data.tipo_id || null,
      afecto_iva: data.afecto_iva || false,
      moneda: data.moneda || null,
      costo_unitario: data.costo_unitario || null,
      precio_neto: data.precio_neto || null,
      precio_venta: data.precio_venta || null,
      control_stock: data.control_stock || false,
      ficha_tecnica: data.ficha_tecnica || null,
      estado: data.estado || 'disponible',
      activo: data.activo !== undefined ? data.activo : true
    };

    // Insertar producto
    const { data: product, error } = await supabase
      .from('productos')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creando producto:', error);
      return NextResponse.json(
        { error: 'Error al crear el producto' },
        { status: 500 }
      );
    }

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener todos los productos
    const { data: products, error } = await supabase
      .from('productos')
      .select(`
        *,
        producto_tipos (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo productos:', error);
      return NextResponse.json(
        { error: 'Error al obtener los productos' },
        { status: 500 }
      );
    }

    return NextResponse.json(products);

  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}