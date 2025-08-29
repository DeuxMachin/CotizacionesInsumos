"use client";

import { useSection } from "../model/useSection";
import type { Section } from "../model/useSection";
import { useAuth } from "@/features/auth/model/useAuth";
import { FiHome, FiFileText, FiUsers, FiPackage, FiBarChart2, FiX, FiMapPin } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";

// Elementos de navegación con iconos más profesionales y descriptivos
const navigationItems = [
  { key: "dashboard", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" },
  { key: "cotizaciones", icon: <FiFileText className="w-5 h-5" />, label: "Cotizaciones" },
  { key: "clientes", icon: <FiUsers className="w-5 h-5" />, label: "Clientes" },
  { key: "posibles-targets", icon: <FiMapPin className="w-5 h-5" />, label: "Posibles Targets" },
  { key: "stock", icon: <FiPackage className="w-5 h-5" />, label: "Stock" },
  { key: "reportes", icon: <FiBarChart2 className="w-5 h-5" />, label: "Reportes" },
] as const;

export function Sidebar() {
  const { section, setSection, sidebarOpen, setSidebarOpen } = useSection();
  const { user } = useAuth();

  return (
    <>
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 lg:hidden backdrop-blur-sm animate-fadeIn" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar principal */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 
          flex flex-col
          overflow-y-auto
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Header del sidebar - alineado con header principal */}
        <div 
          className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Logo height={22} className="shrink-0 sm:h-7" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-theme-primary text-sm truncate">Panel Admin</span>
              <span className="text-xs text-theme-secondary truncate">Sistema v1.0</span>
            </div>
          </div>
          <button 
            className="lg:hidden btn-icon" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        {/* Items de navegación */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => {
                    setSection(item.key as Section);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-colors duration-200 
                    ${section === item.key 
                      ? `bg-theme-accent text-orange-600 dark:text-orange-400 font-medium` 
                      : `hover:bg-theme-secondary text-theme-secondary`
                    }
                  `}
                >
                  <span className={`
                    ${section === item.key 
                      ? `text-orange-600 dark:text-orange-400` 
                      : `text-theme-secondary`
                    }
                  `}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer del sidebar */}
        <div 
          className="p-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 rounded-full bg-theme-accent text-orange-600 dark:text-orange-400 flex items-center justify-center font-medium">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-theme-primary text-sm truncate">{user?.name || "Usuario"}</span>
              <span className="text-xs text-theme-secondary truncate">{user?.email || "usuario@mail.com"}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
