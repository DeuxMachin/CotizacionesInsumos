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
  precio_venta_neto: number | null;
  activo: boolean;
  categorias: { id: number; nombre: string }[];
}

export interface ProductCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface UseProductsReturn {
  products: Product[];
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: catData, error: catErr }, { data: prodData, error: prodErr }] = await Promise.all([
        supabase.from('categorias_productos').select('*').order('nombre'),
        supabase.from('productos').select('*, producto_categorias(categoria_id, categorias_productos:categorias_productos(id,nombre,descripcion))').eq('activo', true).order('nombre')
      ]);
      if (catErr) throw catErr;
      if (prodErr) throw prodErr;
      setCategories((catData || []).map(c => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion })));
      type ProductoWithCategorias = Database['public']['Tables']['productos']['Row'] & { producto_categorias?: { categoria_id: number; categorias_productos?: { id: number; nombre: string; descripcion: string | null } | null }[] };
      const mapped: Product[] = (prodData as unknown as ProductoWithCategorias[] | null || []).map((p) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion,
        unidad: p.unidad,
        precio_venta_neto: p.precio_neto,
        activo: p.activo,
        categorias: (p.producto_categorias || []).map((pc) => ({ id: pc.categoria_id, nombre: pc.categorias_productos?.nombre || '' }))
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

  return { products, categories, loading, error, refresh: load };
}
