"use client";

import { useSection } from "@/features/navigation/model/useSection";
import { useAuth } from "@/features/auth/model/useAuth";
import { FiMenu, FiSearch, FiBell, FiSettings, FiLogOut } from "react-icons/fi";

// Títulos descriptivos para cada sección del sistema
const titles: Record<string, string> = {
  dashboard: "Bienvenido al Panel Administrativo",
  cotizaciones: "Gestión de Cotizaciones",
  clientes: "Gestión de Clientes", 
  catalogo: "Catálogo de Productos",
  reportes: "Reportes y Análisis",
};

// Subtítulos informativos que aparecen debajo del título principal
const subtitles: Record<string, string> = {
  dashboard: "Resumen general de tu sistema de cotizaciones",
  cotizaciones: "Administra y controla todas tus cotizaciones",
  clientes: "Gestiona tu base de datos de clientes",
  catalogo: "Organiza tu inventario de productos",
  reportes: "Analiza el rendimiento de tu negocio",
};

export function Header() {
  const { section, setSidebarOpen } = useSection();
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Sección izquierda: Menú móvil + Títulos */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button 
            className="lg:hidden btn-icon flex-shrink-0" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {titles[section] ?? "Dashboard"}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {subtitles[section] ?? "Bienvenido al sistema"}
            </p>
          </div>
        </div>

        {/* Sección derecha: Acciones responsivas */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Notificaciones con indicador visual */}
          <button className="relative btn-icon">
            <FiBell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">1</span>
            </span>
          </button>

          {/* Avatar del usuario con menú */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || "Usuario"}</p>
                <p className="text-xs text-gray-500">{user?.role || "Invitado"}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <button
                onClick={logout}
                className="btn-icon text-gray-500 hover:text-red-600 hover:bg-red-50"
                title="Cerrar sesión"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
