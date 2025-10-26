"use client";

import { useSection } from "../model/useSection";
import type { Section } from "../model/useSection";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigationItems, NAVIGATION_ICONS } from "../model/navigationItems";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useSection();
  const { user } = useAuth();
  const { navigationItems } = useNavigationItems(user?.role || '');
  const pathname = usePathname();
  const router = useRouter();

  // Determinar qué sección está activa basada en la URL actual
  const getActiveSection = (path: string): Section => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/dashboard/cotizaciones')) return 'cotizaciones';
    if (path.startsWith('/dashboard/notas-venta')) return 'notas-venta';
    if (path.startsWith('/dashboard/clientes')) return 'clientes';
    if (path.startsWith('/dashboard/obras')) return 'obras';
    if (path.startsWith('/dashboard/reuniones')) return 'reuniones';
    if (path.startsWith('/dashboard/posibles-targets')) return 'posibles-targets';
    if (path.startsWith('/dashboard/stock')) return 'stock';
    if (path.startsWith('/dashboard/reportes')) return 'reportes';
    if (path.startsWith('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const activeSection = getActiveSection(pathname);

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
          fixed inset-y-0 left-0 z-50 lg:z-40
          flex flex-col
          overflow-y-auto
          transform transition-all duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
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
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Logo height={22} className="shrink-0 sm:h-7" />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-theme-primary text-sm truncate">
                  Sistema
                </span>
                <span className="text-xs text-theme-secondary truncate">v1.0</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button 
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors duration-200 border border-orange-200 dark:border-orange-800" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
              title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {sidebarCollapsed ? <FiChevronRight className="w-5 h-5 text-orange-600 dark:text-orange-400" /> : <FiChevronLeft className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            </button>
            <button 
              className="lg:hidden btn-icon" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Items de navegación */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const IconComponent = NAVIGATION_ICONS[item.iconName as keyof typeof NAVIGATION_ICONS];
              const isActive = activeSection === item.key;
              const isComingSoon = item.comingSoon;
              
              // Determinar la URL basada en la clave del elemento
              const getItemUrl = (key: Section): string => {
                if (key === 'admin') return '/admin';
                return `/dashboard/${key === 'dashboard' ? '' : key}`;
              };
              
              const itemUrl = getItemUrl(item.key);
              
              return (
                <li key={item.key}>
                  {isComingSoon ? (
                    <button
                      disabled
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-200 
                        text-theme-muted cursor-not-allowed opacity-50
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title="Próximamente disponible"
                    >
                      <span className="text-theme-muted">
                        <IconComponent className="w-5 h-5" />
                      </span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            Pronto
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={itemUrl}
                      prefetch={true}
                      onClick={() => setSidebarOpen(false)}
                      onMouseEnter={() => {
                        // Prefetch adicional en dev
                        try { router.prefetch(itemUrl); } catch {}
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-200 
                        ${isActive 
                          ? `bg-theme-accent text-orange-600 dark:text-orange-400 font-medium` 
                          : `hover:bg-theme-secondary text-theme-secondary`
                        }
                        ${sidebarCollapsed ? 'justify-center' : ''}
                      `}
                      title={sidebarCollapsed ? item.label : item.description}
                    >
                      <span className={`
                        ${isActive 
                          ? `text-orange-600 dark:text-orange-400` 
                          : `text-theme-secondary`
                        }
                      `}>
                        <IconComponent className="w-5 h-5" />
                      </span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Footer del sidebar */}
        <div 
          className="p-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2 sm:gap-3'}`}>
            <div className="h-9 w-9 rounded-full bg-theme-accent text-orange-600 dark:text-orange-400 flex items-center justify-center font-medium">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-theme-primary text-sm truncate">
                  {user?.name || user?.email?.split('@')[0] || "Usuario"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-theme-secondary truncate">{user?.email || "usuario@mail.com"}</span>
                  {['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '') && (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                      {user?.role?.toLowerCase() === 'admin' ? 'Admin' : 'Dueño'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
