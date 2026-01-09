"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getObrasService } from "../services";
import type { EstadoObra, EtapaObra, FiltroObras, EstadisticasObras, Obra } from "../types/obras";

interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export function useObras() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltroObras>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 obras por página
  const [data, setData] = useState<Obra[]>([]);
  const service = useMemo(() => getObrasService(), []);

  // La búsqueda textual se aplica en cliente para evitar refetch/"reload" en cada tecla.
  const serverFiltros = useMemo<FiltroObras>(() => {
    return {
      estado: filtros.estado,
      etapa: filtros.etapa,
      vendedor: filtros.vendedor,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
    };
  }, [
    filtros.estado,
    filtros.etapa,
    filtros.vendedor,
    filtros.fechaDesde,
    filtros.fechaHasta,
  ]);

  // Obtener obras según el rol del usuario
  const isAdmin = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) {
        setData([]);
        return;
      }
      setLoading(true);
      try {
        const obras = await service.getObras(serverFiltros, user.id, isAdmin);
        if (active) setData(obras);
      } catch (e) {
        console.error('Error cargando obras:', e);
        if (active) setData([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [service, user, serverFiltros, isAdmin]);

  // Aplicar filtros a las obras
  const obrasFiltradas = useMemo(() => {
    let obras = data;

    if (filtros.estado && filtros.estado.length > 0) {
      obras = obras.filter(obra => filtros.estado!.includes(obra.estado));
    }

    if (filtros.etapa && filtros.etapa.length > 0) {
      obras = obras.filter(obra => filtros.etapa!.includes(obra.etapaActual));
    }

    if (filtros.vendedor) {
      obras = obras.filter(obra => obra.vendedorAsignado === filtros.vendedor);
    }

    if (filtros.fechaDesde) {
      obras = obras.filter(obra => obra.fechaInicio >= filtros.fechaDesde!);
    }

    if (filtros.fechaHasta) {
      obras = obras.filter(obra => obra.fechaInicio <= filtros.fechaHasta!);
    }

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      obras = obras.filter(obra => 
        obra.nombreEmpresa.toLowerCase().includes(busqueda) ||
        obra.constructora.nombre.toLowerCase().includes(busqueda) ||
        obra.direccionObra.toLowerCase().includes(busqueda) ||
        obra.constructora.rut.includes(busqueda)
      );
    }

    return obras;
  }, [data, filtros]);

  // Configuración de paginación
  const paginationConfig = useMemo((): PaginationConfig => {
    const totalItems = obrasFiltradas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages
    };
  }, [obrasFiltradas.length, itemsPerPage, currentPage]);

  // Obras paginadas
  const obrasPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return obrasFiltradas.slice(startIndex, endIndex);
  }, [obrasFiltradas, currentPage, itemsPerPage]);

  // Calcular estadísticas (sobre todas las obras filtradas, no solo la página actual)
  const estadisticas = useMemo((): EstadisticasObras => {
    const obras = obrasFiltradas;

    const obrasPorEstado = obras.reduce((acc, obra) => {
      acc[obra.estado] = (acc[obra.estado] || 0) + 1;
      return acc;
    }, {} as Record<EstadoObra, number>);

    const obrasPorEtapa = obras.reduce((acc, obra) => {
      acc[obra.etapaActual] = (acc[obra.etapaActual] || 0) + 1;
      return acc;
    }, {} as Record<EtapaObra, number>);

    const valorTotalEstimado = obras.reduce((acc, obra) => acc + (obra.valorEstimado || 0), 0);
    const materialVendidoTotal = obras.reduce((acc, obra) => acc + obra.materialVendido, 0);

    return {
      totalObras: obras.length,
      obrasPorEstado,
      obrasPorEtapa,
      valorTotalEstimado,
      materialVendidoTotal
    };
  }, [obrasFiltradas]);

  // Funciones de paginación
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationConfig.totalPages) {
      setCurrentPage(page);
    }
  }, [paginationConfig.totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset página cuando cambian los filtros
  const setFiltrosWithPageReset = useCallback((newFiltros: FiltroObras) => {
    setFiltros(newFiltros);
    setCurrentPage(1);
  }, []);

  // Funciones para gestionar obras
  const obtenerObra = useCallback(async (id: string) => {
    try {
      const obra = await service.getObraById(id);
      return obra ?? undefined;
    } catch (e) {
      console.error('Error obteniendo obra:', e);
      return undefined;
    }
  }, [service]);

  const actualizarEstadoObra = useCallback(async (id: string, nuevoEstado: EstadoObra) => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
   
      
      // Aquí se actualizaría el estado local o se refrescarían los datos
      return true;
    } catch (error) {
      console.error('Error actualizando estado de obra:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarObra = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const ok = await service.eliminarObra(id);
      if (ok) {
        // refrescar lista
        setData(prev => prev.filter(o => o.id !== id));
      }
      return ok;
    } catch (error) {
      console.error('Error eliminando obra:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const crearObra = useCallback(async (nuevaObra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>) => {
    setLoading(true);
    try {
      const ok = await service.crearObra(nuevaObra, user?.id);
      if (ok) {
        // recargar lista para reflejar BD
        const obras = await service.getObras(serverFiltros, user?.id, isAdmin);
        setData(obras);
      }
      return ok;
    } catch (error: unknown) {
      let details: string;
      let hint: string | undefined;
      if (error && typeof error === 'object') {
        const errObj = error as { details?: string; message?: string; hint?: string };
        details = errObj.details || errObj.message || 'Error desconocido';
        hint = errObj.hint;
      } else {
        details = String(error);
      }
      console.error('Error creando obra:', { message: details, hint });
      return false;
    } finally {
      setLoading(false);
    }
  }, [service, user?.id, serverFiltros, isAdmin]);

  const actualizarObra = useCallback(async (obra: Obra): Promise<boolean> => {
    setLoading(true);
    try {
      const ok = await service.actualizarObra(obra);
      if (ok) {
        // Refrescar lista y/o actualizar item en memoria
        setData(prev => prev.map(o => (o.id === obra.id ? obra : o)));
      }
      return ok;
    } catch (error) {
      console.error('Error actualizando obra:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    obras: obrasPaginadas,
    todasLasObras: obrasFiltradas, // Para estadísticas
    loading,
    filtros,
    estadisticas,
    paginationConfig,
    setFiltros: setFiltrosWithPageReset,
    obtenerObra,
    actualizarEstadoObra,
    eliminarObra,
    crearObra,
  actualizarObra,
    // Funciones de paginación
    goToPage,
    goToNextPage,
    goToPrevPage,
    // Utilidades
  isAdmin,
    userId: user?.id,
  userName: user?.name || user?.email || 'Usuario'
  };
}
