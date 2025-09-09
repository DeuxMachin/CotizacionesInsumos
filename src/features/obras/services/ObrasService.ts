"use client";

import type { Obra, EstadoObra, FiltroObras, EstadisticasObras } from "../model/types";

export interface IObrasService {
  /**
   * Obtiene las obras según los filtros aplicados y el usuario actual
   */
  getObras(filtros: FiltroObras, userId?: string, isAdmin?: boolean): Promise<Obra[]>;
  
  /**
   * Obtiene una obra específica por su ID
   */
  getObraById(id: string): Promise<Obra | null>;
  
  /**
   * Calcula estadísticas en base a las obras proporcionadas
   */
  getEstadisticas(obras: Obra[]): EstadisticasObras;
  
  /**
   * Actualiza el estado de una obra
   */
  actualizarEstadoObra(id: string, nuevoEstado: EstadoObra): Promise<boolean>;
  
  /**
   * Elimina una obra del sistema
   */
  eliminarObra(id: string): Promise<boolean>;

  /**
   * Crea una nueva obra
   */
  crearObra(obra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>, userId?: string): Promise<boolean>;
}
