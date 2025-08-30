"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import { getObrasByVendedor, getAllObras, getObraById } from "./mock";
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

  // Obtener obras según el rol del usuario
  const todasLasObras = useMemo(() => {
    if (!user) return [];
    
    // Si es admin, puede ver todas las obras
    if (user.role === 'admin') {
      return getAllObras();
    }
    
    // Si es vendedor, solo ve sus obras
    return getObrasByVendedor(user.id);
  }, [user]);

  // Aplicar filtros a las obras
  const obrasFiltradas = useMemo(() => {
    let obras = todasLasObras;

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
  }, [todasLasObras, filtros]);

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
  const obtenerObra = useCallback((id: string) => {
    return getObraById(id);
  }, []);

  const actualizarEstadoObra = useCallback(async (id: string, nuevoEstado: EstadoObra) => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En producción, aquí iría la llamada a la API
      console.log(`Actualizando obra ${id} a estado ${nuevoEstado}`);
      
      // Aquí se actualizaría el estado local o se refrescarían los datos
      return true;
    } catch (error) {
      console.error('Error actualizando estado de obra:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarObra = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // En producción, aquí iría la llamada a la API
      console.log(`Eliminando obra ${id}`);
      
      return true;
    } catch (error) {
      console.error('Error eliminando obra:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearObra = useCallback(async (nuevaObra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>) => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // En producción, aquí iría la llamada a la API
      console.log('Creando nueva obra:', nuevaObra);
      
      // Simular la creación exitosa
      const obraConId = {
        ...nuevaObra,
        id: `obra-${Date.now()}`,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        fechaUltimoContacto: new Date()
      };
      
      console.log('Obra creada exitosamente:', obraConId);
      
      return true;
    } catch (error) {
      console.error('Error creando obra:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

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
    // Funciones de paginación
    goToPage,
    goToNextPage,
    goToPrevPage,
    // Utilidades
    isAdmin: user?.role === 'admin',
    userId: user?.id,
    userName: user?.name || 'Usuario'
  };
}
