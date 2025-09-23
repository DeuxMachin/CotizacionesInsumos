import { useState, useCallback } from 'react';
import { NotasVentaService, SalesNoteRecord, SalesNoteItemRow } from '@/services/notasVentaService';

export function useSalesNotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllSalesNotes = useCallback(async (): Promise<SalesNoteRecord[]> => {
    try {
      setLoading(true);
      setError(null);
      const notes = await NotasVentaService.getAll();
      return notes;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSalesNoteById = useCallback(async (id: number): Promise<SalesNoteRecord | null> => {
    try {
      setLoading(true);
      setError(null);
      const note = await NotasVentaService.getById(id);
      return note;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSalesNoteItems = useCallback(async (noteId: number): Promise<SalesNoteItemRow[]> => {
    try {
      setLoading(true);
      setError(null);
      const items = await NotasVentaService.getItems(noteId);
      return items;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const convertQuoteToSalesNote = useCallback(async (
    quote: any,
    options: {
      formaPago?: string;
      cotizacionDbId?: number;
      itemsOverride?: any[];
      finalizarInmediatamente?: boolean;
    } = {}
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await NotasVentaService.convertFromQuote(quote, options);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmSalesNote = useCallback(async (noteId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await NotasVentaService.confirm(noteId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAllSalesNotes,
    getSalesNoteById,
    getSalesNoteItems,
    convertQuoteToSalesNote,
    confirmSalesNote,
    clearError: () => setError(null)
  };
}