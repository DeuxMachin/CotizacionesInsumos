"use client";

import type { IObrasService } from "./ObrasService";
import { SupabaseObrasService } from "./SupabaseObrasService";


/**
 * Factory para obtener la implementación correcta del servicio según el entorno
 */
export function getObrasService(): IObrasService {
  return new SupabaseObrasService();
}
