"use client";

import type { IObrasService } from "./ObrasService";
import { MockObrasService } from "./MockObrasService";

// En un entorno real, aquí importaríamos la implementación real de API
// import { ApiObrasService } from "./ApiObrasService";

/**
 * Factory para obtener la implementación correcta del servicio según el entorno
 */
export function getObrasService(): IObrasService {
  // En un entorno de producción, comprobaríamos variables de entorno
  // if (process.env.NEXT_PUBLIC_API_ENVIRONMENT === 'production') {
  //   return new ApiObrasService();
  // }
  
  // Por ahora, siempre devolvemos el servicio mock
  return new MockObrasService();
}
