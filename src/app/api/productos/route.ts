import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUser } from '@/lib/auth-helpers';
import type { Database } from '@/lib/supabase';

type ProductoInsert = Database['public']['Tables']['productos']['Insert'];

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
    const productData: ProductoInsert = {
      nombre: data.nombre.trim(),
      unidad: data.unidad.trim(),
      afecto_iva: data.afecto_iva || false,
      control_stock: data.control_stock || false,
      estado: data.estado || 'disponible',
      activo: data.activo !== undefined ? data.activo : true
    };

    // Solo incluir campos opcionales si tienen valor
    if (data.sku) productData.sku = data.sku;
    if (data.descripcion) productData.descripcion = data.descripcion;
    if (data.tipo_id) productData.tipo_id = data.tipo_id;
    if (data.moneda) productData.moneda = data.moneda;
    if (data.costo_unitario !== null && data.costo_unitario !== undefined) productData.costo_unitario = data.costo_unitario;
    if (data.precio_neto !== null && data.precio_neto !== undefined) productData.precio_neto = data.precio_neto;
    if (data.precio_venta !== null && data.precio_venta !== undefined) productData.precio_venta = data.precio_venta;
    if (data.ficha_tecnica) productData.ficha_tecnica = data.ficha_tecnica;

    console.log('Product data to insert:', productData);

    // Insertar producto
    const { data: product, error } = await supabaseAdmin
      .from('productos')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Error creando producto:', error);
      return NextResponse.json(
        { error: `Error al crear el producto: ${error.message}` },
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
    const { data: products, error } = await supabaseAdmin
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