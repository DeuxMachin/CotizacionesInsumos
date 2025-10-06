"use client";

import { useSection } from "@/features/navigation/model/useSection";
// Migrado al nuevo AuthContext basado en JWT
import { useAuth } from "@/contexts/AuthContext";
import { FiMenu, FiLogOut } from "react-icons/fi";
import { Logo } from "@/shared/ui/Logo";
import { ThemeToggle } from "@/features/theme/ui/ThemeToggle";
import { usePathname } from "next/navigation";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useEffect, useState } from "react";

// Títulos descriptivos para cada sección del sistema
const routeTitles: Record<string, string> = {
  "/dashboard": "Bienvenido al Panel Administrativo",
  "/dashboard/cotizaciones": "Gestión de Cotizaciones",
  "/dashboard/clientes": "Gestión de Clientes", 
  "/dashboard/stock": "Control de Stock",
  "/dashboard/reportes": "Reportes y Análisis",
  "/dashboard/obras": "Gestión de Obras",
  "/dashboard/posibles-targets": "Posibles Targets",
  "/admin": "Panel de Administración",
  "/admin/usuarios": "Gestión de Usuarios",
  "/admin/auditoria": "Logs de Auditoría"
};

// Subtítulos informativos que aparecen debajo del título principal
const routeSubtitles: Record<string, string> = {
  "/dashboard": "Resumen general de tu sistema de cotizaciones",
  "/dashboard/cotizaciones": "Administra y controla todas tus cotizaciones",
  "/dashboard/clientes": "Gestiona tu base de datos de clientes",
  "/dashboard/stock": "Gestiona inventario y valorización",
  "/dashboard/reportes": "Analiza el rendimiento de tu negocio",
  "/dashboard/obras": "Administra tus proyectos y obras",
  "/dashboard/posibles-targets": "Gestiona tus prospectos y ubicaciones",
  "/admin": "Administra todos los aspectos del sistema",
  "/admin/usuarios": "Gestiona usuarios y permisos",
  "/admin/auditoria": "Revisa todas las actividades del sistema"
};

export function Header() {
  const { setSidebarOpen } = useSection();
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const scrollDirection = useScrollDirection({ threshold: 10 });
  
  // Detectar si estamos en móvil - inicializar con función para evitar SSR mismatch
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Obtener el título y subtítulo correspondiente a la ruta actual
  const getRouteTitle = (): string => {
    // Intentar encontrar un título exacto
    if (routeTitles[pathname]) {
      return routeTitles[pathname];
    }
    
    // Si no se encuentra una coincidencia exacta, buscar el prefijo más largo
    const paths = Object.keys(routeTitles).sort((a, b) => b.length - a.length);
    for (const path of paths) {
      if (pathname.startsWith(path)) {
        return routeTitles[path];
      }
    }
    
    // Título por defecto
    return "Dashboard";
  };

  const getRouteSubtitle = (): string => {
    // Intentar encontrar un subtítulo exacto
    if (routeSubtitles[pathname]) {
      return routeSubtitles[pathname];
    }
    
    // Si no se encuentra una coincidencia exacta, buscar el prefijo más largo
    const paths = Object.keys(routeSubtitles).sort((a, b) => b.length - a.length);
    for (const path of paths) {
      if (pathname.startsWith(path)) {
        return routeSubtitles[path];
      }
    }
    
    // Subtítulo por defecto
    return "Bienvenido al sistema";
  };

  // Determinar si el header debe estar visible
  // En móviles: se oculta al bajar, aparece al subir o estar en el top
  // En desktop: siempre visible
  const shouldHideHeader = isMobile && scrollDirection === 'down';
  const isAtTop = scrollDirection === 'top';

  return (
    <header 
      className="sticky top-0 z-30 shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        transform: shouldHideHeader ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        boxShadow: isAtTop ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        willChange: 'transform'
      }}
    >
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
            <h1 className="text-base sm:text-lg font-bold text-theme-primary truncate display-font">
              {getRouteTitle()}
            </h1>
            <p className="text-xs text-theme-secondary truncate hidden sm:block">
              {getRouteSubtitle()}
            </p>
          </div>
        </div>

        {/* Sección derecha: Acciones responsivas */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Botón de tema claro/oscuro */}
          <div className="mr-1 sm:mr-2">
            <ThemeToggle />
          </div>
          
          {/* Avatar del usuario con menú */}
          <div 
            className="flex items-center gap-2 pl-2 sm:pl-3"
            style={{ borderLeft: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-theme-primary">
                  {user?.name || user?.email?.split('@')[0] || "Usuario"}
                </p>
                <p className="text-xs text-theme-secondary capitalize">
                  {user?.role || "Invitado"}
                </p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                {(user?.name?.charAt(0) || user?.email?.charAt(0) || "A").toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="btn-icon hover:text-red-600 dark:hover:text-red-500"
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
