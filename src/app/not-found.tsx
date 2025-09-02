"use client";

import Link from "next/link";
import { FiSearch, FiHome } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div 
        className="max-w-md w-full p-8 text-center rounded-xl"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Icono 404 */}
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto mb-6">
          <FiSearch className="w-8 h-8" />
        </div>

        {/* Mensaje principal */}
        <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-theme-primary mb-3">
          Página no encontrada
        </h2>
        
        <p className="text-theme-secondary mb-8">
          La página que buscas no existe o fue movida. Verifica la URL o navega desde el menú principal.
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FiHome className="w-4 h-4" />
            Ir al Dashboard
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Página anterior
          </button>
        </div>

        {/* Enlaces útiles */}
        <div className="mt-8 pt-6 border-t border-theme-subtle">
          <p className="text-sm text-theme-secondary mb-3">Enlaces útiles:</p>
          <div className="space-y-2 text-sm">
            <Link href="/" className="block text-orange-600 dark:text-orange-400 hover:underline">Dashboard</Link>
            <Link href="/cotizaciones" className="block text-orange-600 dark:text-orange-400 hover:underline">Cotizaciones</Link>
            <Link href="/clientes" className="block text-orange-600 dark:text-orange-400 hover:underline">Clientes</Link>
            <Link href="/reportes" className="block text-orange-600 dark:text-orange-400 hover:underline">Reportes</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
