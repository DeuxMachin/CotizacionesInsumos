import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth/tokens';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(authToken);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const obraId = searchParams.get('obraId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') as 'active' | 'completed' | null;
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    let query = supabase
      .from('obra_visitas')
      .select(`
        *,
        obras!inner (
          nombre
        ),
        usuarios!obra_visitas_vendedor_id_fkey (
          nombre,
          apellido,
          rol
        )
      `)
      .eq('tipo', 'reunion')
      .order('inicio_at', { ascending: false });

    // Permissions: owners see all, others see only their own
    // But for obra-specific queries, allow seeing all meetings in that obra
    if (payload.rol !== 'dueño' && payload.rol !== 'dueno' && !obraId) {
      query = query.eq('vendedor_id', payload.sub);
    }

    if (obraId) {
      query = query.eq('obra_id', parseInt(obraId));
    }

    if (userId) {
      query = query.eq('vendedor_id', userId);
    }

    if (status) {
      if (status === 'active') {
        query = query.eq('estado', 'abierta');
      } else {
        query = query.eq('estado', 'cerrada');
      }
    }

    if (fechaDesde) {
      query = query.gte('inicio_at', fechaDesde);
    }

    if (fechaHasta) {
      query = query.lte('inicio_at', fechaHasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reuniones:', error);
      return NextResponse.json({ error: 'Error al obtener reuniones' }, { status: 500 });
    }

    // Transform data to include parsed location and obra name
    const reuniones = data.map(reunion => ({
      id: reunion.id,
      obraId: reunion.obra_id,
      userId: reunion.vendedor_id,
      userName: `${reunion.usuarios?.nombre || ''} ${reunion.usuarios?.apellido || ''}`.trim() || 'Usuario',
      userRole: reunion.usuarios?.rol || undefined,
      obraNombre: reunion.obras?.nombre || 'Obra sin nombre',
      tipo: reunion.tipo,
      startTime: new Date(reunion.inicio_at),
      endTime: reunion.fin_at ? new Date(reunion.fin_at) : undefined,
      status: reunion.estado,
      location: reunion.lat && reunion.lng ? {
        lat: reunion.lat,
        lng: reunion.lng,
        accuracy: reunion.accuracy_m,
        address: reunion.ubicacion_text
      } : undefined,
      notas: reunion.notas
    }));

    return NextResponse.json(reuniones);
  } catch (error) {
    console.error('Get reuniones error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}