import { useState, useEffect } from 'react';
import { useAuthHeaders } from './useAuthHeaders';
import { ReunionObra, FiltroReuniones } from '@/features/obras/types/obras';

export function useReuniones(obraId?: number) {
  const [reuniones, setReuniones] = useState<ReunionObra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createHeaders } = useAuthHeaders();

  const fetchReuniones = async (filtros?: FiltroReuniones) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filtros?.obraId) params.append('obraId', filtros.obraId.toString());
      if (filtros?.userId) params.append('userId', filtros.userId);
      if (filtros?.status) params.append('status', filtros.status);
      if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde.toISOString());
      if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta.toISOString());

      const response = await fetch(`/api/reuniones?${params}`, {
        headers: createHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reuniones');
      }

      const data = await response.json();
      setReuniones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const checkin = async (obraId: number, location?: any) => {
    try {
      const response = await fetch(`/api/obras/${obraId}/reuniones`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ location }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al iniciar reunión');
      }

      const reunion = await response.json();
      setReuniones(prev => [reunion, ...prev]);
      return reunion;
    } catch (err) {
      throw err;
    }
  };

  const checkout = async (obraId: number) => {
    try {
      const response = await fetch(`/api/obras/${obraId}/reuniones`, {
        method: 'PUT',
        headers: createHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al finalizar reunión');
      }

      const reunion = await response.json();
      setReuniones(prev =>
        prev.map(r => r.id === reunion.id ? reunion : r)
      );
      return reunion;
    } catch (err) {
      throw err;
    }
  };

  const getActiveReunion = (obraId: number) => {
    return reuniones.find(r =>
      r.obraId === obraId &&
      r.status === 'abierta'
    );
  };

  useEffect(() => {
    if (obraId) {
      fetchReuniones({ obraId: obraId });
    }
  }, [obraId]);

  return {
    reuniones,
    loading,
    error,
    checkin,
    checkout,
    getActiveReunion,
    fetchReuniones
  };
}