"use client";

import { useEffect } from "react";

/**
 * Este componente es solo para pruebas y debería eliminarse en producción.
 * Fuerza un tema específico para ver si todos los componentes se están renderizando correctamente.
 */
export function ThemeForcedTest() {
  useEffect(() => {
    // Forzar modo claro para pruebas
    document.documentElement.classList.remove("dark");
    
    // Descomenta esta línea para forzar modo oscuro
    // document.documentElement.classList.add("dark");
    
    console.log("⚠️ Tema forzado para pruebas - Eliminar en producción");
  }, []);
  
  return null;
}
