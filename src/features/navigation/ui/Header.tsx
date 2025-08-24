"use client";

import { useSection } from "@/features/navigation/model/useSection";
import { useAuth } from "@/features/auth/model/useAuth";
import { FiMenu, FiBell, FiLogOut } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";
import { BRAND } from "@/shared/ui/brand";

// Títulos descriptivos para cada sección del sistema
const titles: Record<string, string> = {
  dashboard: "Bienvenido al Panel Administrativo",
  cotizaciones: "Gestión de Cotizaciones",
  clientes: "Gestión de Clientes", 
  stock: "Control de Stock",
  reportes: "Reportes y Análisis",
  vendedores: "Gestión de Vendedores",
};

// Subtítulos informativos que aparecen debajo del título principal
const subtitles: Record<string, string> = {
  dashboard: "Resumen general de tu sistema de cotizaciones",
  cotizaciones: "Administra y controla todas tus cotizaciones",
  clientes: "Gestiona tu base de datos de clientes",
  stock: "Gestiona inventario y valorización",
  reportes: "Analiza el rendimiento de tu negocio",
  vendedores: "Administra el equipo comercial (en desarrollo)",
};

export function Header() {
  const { section, setSidebarOpen } = useSection();
  const { logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto">
        {/* Sección izquierda: Menú móvil + Títulos */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            className="lg:hidden btn-icon flex-shrink-0" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <FiMenu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="lg:hidden">
            <Logo height={20} className="opacity-90 sm:h-6" />
          </div>
          
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate display-font">
              {titles[section] ?? "Dashboard"}
            </h1>
            <p className="text-xs text-gray-500 truncate hidden sm:block">
              {subtitles[section] ?? "Bienvenido al sistema"}
            </p>
          </div>
        </div>

        {/* Sección derecha: Acciones responsivas */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Notificaciones con indicador visual */}
          <button className="relative btn-icon">
            <FiBell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white hidden sm:inline">1</span>
            </span>
          </button>

          {/* Avatar del usuario con menú */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || "Usuario"}</p>
                <p className="text-xs text-gray-500">{user?.role || "Invitado"}</p>
              </div>
              <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br ${BRAND.accentFrom} ${BRAND.accentTo} flex items-center justify-center text-white text-xs sm:text-sm font-medium`}>
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <button
                onClick={logout}
                className="btn-icon text-gray-500 hover:text-red-600 hover:bg-red-50"
                title="Cerrar sesión"
              >
                <FiLogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
