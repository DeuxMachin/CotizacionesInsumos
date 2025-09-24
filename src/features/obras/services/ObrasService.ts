"use client";

import type { Obra, EstadoObra, FiltroObras, EstadisticasObras } from "../types/obras";

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

  /**
   * Crea una obra vinculada a un target y retorna el ID de la nueva obra
   */
  crearObraDesdeTarget(
    obra: Omit<Obra, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'fechaUltimoContacto'>,
    userId: string | undefined,
    targetId: number
  ): Promise<number>;

  /**
   * Actualiza una obra existente
   */
  actualizarObra(obra: Obra): Promise<boolean>;

  /**
   * Registra un préstamo (préstamo/avance) para una obra, incrementando el pendiente
   */
  registrarPrestamo(obraId: string, monto: number, descripcion?: string): Promise<boolean>;

  /**
   * Registra un pago para una obra, decrementando el pendiente
   */
  registrarPago(obraId: string, monto: number, descripcion?: string): Promise<boolean>;
}
