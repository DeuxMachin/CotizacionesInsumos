"use client";

import { useSection } from "../model/useSection";
import type { Section } from "../model/useSection";
import { FiHome, FiFileText, FiUsers, FiBox, FiPackage, FiBarChart2, FiX } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";
import { BRAND } from "@/shared/ui/brand";

// Elementos de navegación con iconos más profesionales y descriptivos
const navigationItems = [
  { key: "dashboard", icon: <FiHome className="w-5 h-5" />, label: "Dashboard" },
  { key: "cotizaciones", icon: <FiFileText className="w-5 h-5" />, label: "Cotizaciones" },
  { key: "clientes", icon: <FiUsers className="w-5 h-5" />, label: "Clientes" },
  { key: "stock", icon: <FiPackage className="w-5 h-5" />, label: "Stock" },
  { key: "reportes", icon: <FiBarChart2 className="w-5 h-5" />, label: "Reportes" },
] as const;

export function Sidebar() {
  const { section, setSection, sidebarOpen, setSidebarOpen } = useSection();

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
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 bg-white flex flex-col
        border-r border-gray-100
        overflow-y-auto
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header del sidebar - alineado con header principal */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Logo height={22} className="shrink-0 sm:h-7" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-gray-900 text-sm truncate">Panel Admin</span>
              <span className="text-xs text-gray-500 truncate">Sistema v1.0</span>
            </div>
          </div>
          
          {/* Botón cerrar en móvil */}
          <button 
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navegación principal - ocupa el espacio disponible */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
          <div className="space-y-1 sm:space-y-2">
            {navigationItems.map((item) => {
              const isActive = section === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { 
                    setSection(item.key as Section); 
                    setSidebarOpen(false); 
                  }}
                  className={`
                    w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-sm transition-all duration-200
                    ${isActive
                      ? `${BRAND.accentBgSoft} ${BRAND.accentText} border-l-4 pl-2 sm:pl-2 border-orange-500`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }
                  `}
                >
                  <div className={`${isActive ? 'text-orange-600' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-600"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer del sidebar - fijo en la parte inferior */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">Sistema de Gestión v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
