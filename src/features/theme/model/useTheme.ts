"use client";

// Este es un wrapper sobre next-themes para mantener compatibilidad
// con el resto de la aplicación que ya utiliza este hook
import { useTheme as useNextThemes } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextThemes();
  const [mounted, setMounted] = useState(false);
  
  // Importante para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return { 
    mounted,
    theme: theme as "light" | "dark" | "system", 
    setTheme: setTheme,
    // Determinar qué tema se está mostrando realmente (útil para UI)
    isDark: mounted ? resolvedTheme === "dark" : false
  };
}
