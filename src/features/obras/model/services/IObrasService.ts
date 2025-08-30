"use client";

import type { Obra, EstadoObra, FiltroObras, EstadisticasObras } from "../types";

export interface IObrasService {
  /**
   * Obtiene todas las obras según los filtros especificados
   */
  getObras(filtros: FiltroObras): Promise<Obra[]>;
  
  /**
   * Obtiene una obra específica por su ID
   */
  getObraById(id: string): Promise<Obra | null>;
  
  /**
   * Obtiene las obras asignadas a un vendedor específico
   */
  getObrasByVendedor(vendedorId: string, filtros?: FiltroObras): Promise<Obra[]>;
  
  /**
   * Actualiza el estado de una obra
   */
  actualizarEstadoObra(id: string, nuevoEstado: EstadoObra): Promise<boolean>;
  
  /**
   * Elimina una obra
   */
  eliminarObra(id: string): Promise<boolean>;
  
  /**
   * Calcula estadísticas a partir de un conjunto de obras
   */
  calcularEstadisticas(obras: Obra[]): EstadisticasObras;
}
