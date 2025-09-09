"use client";

import type { IObrasService } from "./ObrasService";
import { SupabaseObrasService } from "./SupabaseObrasService";

// En un entorno real, aquí importaríamos la implementación real de API
// import { ApiObrasService } from "./ApiObrasService";

/**
 * Factory para obtener la implementación correcta del servicio según el entorno
 */
export function getObrasService(): IObrasService {
  return new SupabaseObrasService();
}
