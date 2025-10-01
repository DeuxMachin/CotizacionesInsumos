import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth/tokens';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await context.params;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(authToken);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { location } = await request.json();

    // Check if there's already an active reunion for this user and obra
    const { data: existingReunion } = await supabase
      .from('obra_visitas')
      .select('*')
      .eq('obra_id', obraId)
      .eq('vendedor_id', payload.sub)
      .eq('estado', 'abierta')
      .eq('tipo', 'reunion')
      .single();

    if (existingReunion) {
      return NextResponse.json(
        { error: 'Ya tienes una reunión activa en esta obra' },
        { status: 400 }
      );
    }

    // Create new reunion
    const { data, error } = await supabase
      .from('obra_visitas')
      .insert({
        obra_id: parseInt(obraId),
        vendedor_id: payload.sub!,
        tipo: 'reunion',
        inicio_at: new Date().toISOString(),
        estado: 'abierta',
        lat: location?.lat || null,
        lng: location?.lng || null,
        accuracy_m: location?.accuracy || null,
        ubicacion_text: location?.address || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reunion:', error);
      return NextResponse.json({ error: 'Error al iniciar reunión' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await context.params;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(authToken);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find active reunion for this user and obra
    const { data: reunion, error: findError } = await supabase
      .from('obra_visitas')
      .select('*')
      .eq('obra_id', parseInt(obraId))
      .eq('vendedor_id', payload.sub)
      .eq('estado', 'abierta')
      .eq('tipo', 'reunion')
      .single();

    if (findError || !reunion) {
      return NextResponse.json(
        { error: 'No hay reunión activa para finalizar' },
        { status: 404 }
      );
    }

    // Update with end time
    const { data, error } = await supabase
      .from('obra_visitas')
      .update({
        fin_at: new Date().toISOString(),
        estado: 'cerrada'
      })
      .eq('id', reunion.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reunion:', error);
      return NextResponse.json({ error: 'Error al finalizar reunión' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await context.params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get active reunion for this obra
    const { data, error } = await supabase
      .from('obra_visitas')
      .select('*')
      .eq('obra_id', parseInt(obraId))
      .eq('estado', 'abierta')
      .eq('tipo', 'reunion')
      .order('inicio_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching reunion:', error);
      return NextResponse.json({ error: 'Error al obtener reunión' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Get reunion error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}