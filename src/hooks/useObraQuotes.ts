"use client";

import { useState, useEffect } from 'react';
import { CotizacionesService } from '@/services/cotizacionesService';
import { NotasVentaService } from '@/services/notasVentaService';
import { SupabaseObrasService } from '@/features/obras/services/SupabaseObrasService';
import type { Database } from '@/lib/supabase';

type CotizacionWithRelations = Database['public']['Tables']['cotizaciones']['Row'] & {
  cliente_principal?: {
    id: number;
    nombre_razon_social: string;
    rut: string;
  } | null;
  obra?: {
    id: number;
    nombre: string;
  } | null;
  creador?: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
};

interface ObraQuotesStats {
  totalCotizado: number;
  materialVendido: number;
  pendiente: number;
  conversionRate: number;
  totalQuotes: number;
  quotesEnviadas: number;
  quotesAceptadas: number;
  quotesRechazadas: number;
}

interface UseObraQuotesReturn {
  quotes: CotizacionWithRelations[];
  salesNotes: any[]; // TODO: Implementar consulta separada para notas de venta
  obra: any; // Información de la obra incluyendo material_vendido y pendiente
  stats: ObraQuotesStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useObraQuotes(obraId: number): UseObraQuotesReturn {
  const [quotes, setQuotes] = useState<CotizacionWithRelations[]>([]);
  const [salesNotes, setSalesNotes] = useState<any[]>([]);
  const [obra, setObra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const obrasService = new SupabaseObrasService();
      const [quotesData, salesNotesData, obraData] = await Promise.all([
        CotizacionesService.getByObraId(obraId),
        NotasVentaService.getByObraId(obraId),
        obrasService.getObraById(obraId.toString())
      ]);
      setQuotes(quotesData || []);
      setSalesNotes(salesNotesData || []);
      setObra(obraData);
    } catch (err) {
      console.error('Error fetching obra quotes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setQuotes([]);
      setSalesNotes([]);
      setObra(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (obraId) {
      fetchQuotes();
    }
  }, [obraId]);

  // Calcular estadísticas
  const stats: ObraQuotesStats = {
    totalCotizado: quotes.reduce((sum, quote) => sum + (quote.total_final || 0), 0),
    materialVendido: salesNotes.reduce((sum, note) => sum + (note.total || 0), 0), // Suma de todas las notas de venta de la obra
    pendiente: obra?.pendiente || 0, // Viene de la columna pendiente de la tabla obras
    conversionRate: 0, // Se calcula abajo
    totalQuotes: quotes.length,
    quotesEnviadas: quotes.filter(quote => quote.estado === 'enviada').length,
    quotesAceptadas: quotes.filter(quote => quote.estado === 'aceptada').length,
    quotesRechazadas: quotes.filter(quote => quote.estado === 'rechazada').length,
  };

  // Calcular tasa de conversión
  stats.conversionRate = stats.totalQuotes > 0
    ? Math.round((stats.quotesAceptadas / stats.totalQuotes) * 100 * 10) / 10
    : 0;

  return {
    quotes,
    salesNotes,
    obra,
    stats,
    loading,
    error,
    refetch: fetchQuotes,
  };
}