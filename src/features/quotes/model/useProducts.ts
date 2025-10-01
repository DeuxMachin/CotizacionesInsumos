"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

export interface Product {
  id: number;
  sku: string | null;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  // Mantenemos el nombre usado en UI, mapeado desde precio_neto/precio_venta
  precio_venta_neto: number | null;
  activo: boolean;
  // Nuevos campos relevantes
  moneda: string | null;
  afecto_iva: boolean;
  tipo_id: number | null;
  tipo?: { id: number; nombre: string } | null;
}

export interface ProductType { id: number; nombre: string }

interface UseProductsReturn {
  products: Product[];
  types: ProductType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargamos tipos y productos por separado para evitar dependencias de FKs en el select anidado
      const [{ data: tiposData, error: tiposErr }, { data: prodData, error: prodErr }] = await Promise.all([
        supabase.from('producto_tipos').select('id,nombre').order('nombre'),
        supabase.from('productos').select('*').eq('activo', true).order('nombre')
      ]);
      if (tiposErr) throw tiposErr;
      if (prodErr) throw prodErr;
      const tiposMap = new Map<number, ProductType>();
      (tiposData || []).forEach((t) => tiposMap.set(t.id, { id: t.id, nombre: t.nombre }));
      setTypes(Array.from(tiposMap.values()));

      type ProductoRow = Database['public']['Tables']['productos']['Row'];
      const mapped: Product[] = ((prodData || []) as ProductoRow[]).map((p) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion,
        unidad: p.unidad,
        precio_venta_neto: p.precio_neto ?? p.precio_venta ?? null,
        activo: p.activo,
        moneda: p.moneda || null,
        afecto_iva: Boolean(p.afecto_iva),
        tipo_id: p.tipo_id,
        tipo: p.tipo_id ? tiposMap.get(p.tipo_id) || null : null,
      }));
      setProducts(mapped);
    } catch (e: unknown) {
      console.error('Error loading products', e);
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { products, types, loading, error, refresh: load };
}
