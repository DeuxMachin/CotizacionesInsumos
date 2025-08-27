"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Componente para depurar el estado del tema
 * Este componente muestra información sobre el tema actual en una esquina de la pantalla
 * Solo debe usarse durante el desarrollo
 */
export function ThemeDebugger() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasDarkClass, setHasDarkClass] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Verificar si el elemento html tiene la clase 'dark'
    const checkDarkClass = () => {
      if (typeof document !== 'undefined') {
        setHasDarkClass(document.documentElement.classList.contains('dark'));
      }
    };
    
    checkDarkClass();
    
    // Configurar un observador para detectar cambios en la clase 'dark'
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            checkDarkClass();
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }
    
    return undefined;
  }, []);
  
  if (!mounted) return null;
  
  // Función para obtener variables CSS
  const getCssVariable = (name: string) => {
    if (typeof document !== 'undefined') {
      return getComputedStyle(document.documentElement).getPropertyValue(name);
    }
    return '';
  };
  
  return (
    <div className="fixed bottom-2 left-2 z-[1000] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs shadow-lg">
      <div className="flex flex-col">
        <div className="mb-2"><strong>Estado del tema:</strong></div>
        <div>theme: <span className="font-mono">{theme}</span></div>
        <div>resolvedTheme: <span className="font-mono">{resolvedTheme}</span></div>
        <div>systemTheme: <span className="font-mono">{systemTheme}</span></div>
        <div className="mb-2">HTML class 'dark': <span className={`font-mono ${hasDarkClass ? 'text-green-500' : 'text-red-500'}`}>
          {hasDarkClass ? 'ACTIVA' : 'INACTIVA'}
        </span></div>
        
        <div className="mb-1"><strong>Variables CSS:</strong></div>
        <div>
          <div className="flex flex-row gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCssVariable('--bg-primary') }}></div>
            <span>bg-primary: <code>{getCssVariable('--bg-primary')}</code></span>
          </div>
          <div className="flex flex-row gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCssVariable('--bg-secondary') }}></div>
            <span>bg-secondary: <code>{getCssVariable('--bg-secondary')}</code></span>
          </div>
          <div className="flex flex-row gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCssVariable('--text-primary') }}></div>
            <span>text-primary: <code>{getCssVariable('--text-primary')}</code></span>
          </div>
          <div className="flex flex-row gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCssVariable('--border') }}></div>
            <span>border: <code>{getCssVariable('--border')}</code></span>
          </div>
          <div className="flex flex-row gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCssVariable('--accent-text') }}></div>
            <span>accent-text: <code>{getCssVariable('--accent-text')}</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
