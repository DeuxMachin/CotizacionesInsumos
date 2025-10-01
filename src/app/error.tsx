"use client";

import { useEffect } from "react";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para debugging
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-theme-secondary">
      <div 
        className="max-w-md w-full p-8 text-center rounded-xl bg-theme-primary border border-theme-border"
      >
        {/* Icono de error */}
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-6">
          <FiAlertTriangle className="w-8 h-8" />
        </div>

        {/* Mensaje de error */}
        <h1 className="text-2xl font-bold text-theme-primary mb-3">
          ¡Oops! Algo salió mal
        </h1>
        
        <p className="text-theme-secondary mb-6">
          Se produjo un error inesperado. Nuestro equipo ha sido notificado y está trabajando para solucionarlo.
        </p>

        {/* Información técnica (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-theme-secondary hover:text-theme-primary mb-2">
              Detalles técnicos
            </summary>
            <pre className="text-xs bg-theme-secondary/30 p-3 rounded overflow-auto text-red-600 dark:text-red-400">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <FiHome className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 pt-6 border-t border-theme-subtle">
          <p className="text-xs text-theme-muted">
            Si el problema persiste, contacta con soporte técnico
          </p>
        </div>
      </div>
    </div>
  );
}
