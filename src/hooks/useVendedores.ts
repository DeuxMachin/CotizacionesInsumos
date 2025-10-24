"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  name?: string;
}

export function useVendedores() {
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener todos los usuarios para que admin/dueño puedan asignar a cualquiera
        const { data, error: fetchError } = await supabase
          .from('usuarios')
          .select('id, email, nombre, apellido, rol')
          .order('nombre', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Formatear los nombres
        const formattedVendedores = (data || []).map(user => ({
          ...user,
          name: `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email
        }));

        setVendedores(formattedVendedores);
      } catch (err) {
        console.error('Error fetching vendedores:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchVendedores();
  }, []);

  return { vendedores, loading, error };
}