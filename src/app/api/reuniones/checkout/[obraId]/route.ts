import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth/tokens';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ obraId: string }> }
) {
  try {
    const { obraId } = await context.params;
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(authToken);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userRole = payload.rol?.toLowerCase() || '';
    const isOwner = ['dueño', 'dueno'].includes(userRole);

    // Find active reunion for this obra
    const { data: reunion, error: findError } = await supabase
      .from('obra_visitas')
      .select('*')
      .eq('obra_id', parseInt(obraId))
      .eq('estado', 'abierta')
      .eq('tipo', 'reunion')
      .single();

    if (findError || !reunion) {
      return NextResponse.json(
        { error: 'No hay reunión activa para finalizar en esta obra' },
        { status: 404 }
      );
    }

    // Check permissions:
    // - Owners can finalize any active reunion
    // - Other users can only finalize their own reunions
    if (!isOwner && reunion.vendedor_id !== payload.sub) {
      return NextResponse.json(
        { error: 'No tienes permisos para finalizar esta reunión' },
        { status: 403 }
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

    return NextResponse.json({
      success: true,
      message: 'Reunión finalizada correctamente',
      reunion: data
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}