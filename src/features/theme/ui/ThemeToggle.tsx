"use client";

import { useTheme as useNextThemes } from "next-themes";
import { FiSun, FiMoon } from "react-icons/fi";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  // Usamos directamente next-themes para evitar capas adicionales
  const { resolvedTheme, theme, setTheme } = useNextThemes();
  const [mounted, setMounted] = useState(false);

  // Este efecto es crucial para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug en consola para ver qué está pasando con el tema
  useEffect(() => {
    if (mounted) {
      console.log('Current theme state:', { 
        theme, 
        resolvedTheme, 
        isDark: resolvedTheme === 'dark',
        hasClass: typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      });
      
      // Forzar actualización de clase en html
      if (typeof document !== 'undefined') {
        if (resolvedTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, [theme, resolvedTheme, mounted]);

  // Alternar entre modo claro y oscuro
  const toggleTheme = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    console.log('Changing theme to:', newTheme);
    setTheme(newTheme);
    
    // Actualizar la clase en el HTML inmediatamente para feedback instantáneo
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // No renderizar nada hasta que el componente esté montado
  if (!mounted) {
    return (
      <button className="btn-icon transition-all duration-200">
        <span className="opacity-0">⬤</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="btn-icon transition-all duration-200"
      title={resolvedTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {resolvedTheme === "dark" ? (
        <FiSun className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  );
}

export function ThemeToggleWithSystem() {
  // Usamos directamente next-themes para evitar capas adicionales
  const { theme, resolvedTheme, setTheme } = useNextThemes();
  const [mounted, setMounted] = useState(false);

  // Este efecto es crucial para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Forzar actualización de clase en html
  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [resolvedTheme, mounted]);

  // No renderizar el contenido real hasta que el componente esté montado
  if (!mounted) {
    return <div className="flex items-center gap-2 h-8 opacity-0">Cargando...</div>;
  }

  const handleThemeChange = (newTheme: string) => {
    console.log('Setting theme to:', newTheme);
    setTheme(newTheme);
    
    // Forzar actualización de clase en html (redundante pero nos aseguramos)
    if (typeof document !== 'undefined') {
      if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleThemeChange("light")}
        className={`btn-icon ${theme === "light" ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600" : ""}`}
        title="Modo claro"
      >
        <FiSun className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleThemeChange("system")}
        className={`btn-icon ${theme === "system" ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600" : ""}`}
        title="Usar preferencia del sistema"
      >
        <span className="text-xs font-medium">AUTO</span>
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className={`btn-icon ${theme === "dark" ? "bg-orange-50 dark:bg-orange-900/30 text-orange-600" : ""}`}
        title="Modo oscuro"
      >
        <FiMoon className="w-4 h-4" />
      </button>
    </div>
  );
}
