"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, type Resource, type Action } from "@/features/auth/model/permissions";
import { useNavigationItems } from "@/features/navigation/model/navigationItems";
import type { Section } from "@/features/navigation/model/useSection";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Middleware de autorización mejorado que evita bucles infinitos
 * usando el pathname de Next.js en lugar del estado interno
 */
export function SafeAuthorizationMiddleware({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { canAccessSection } = useNavigationItems(user?.role || '');
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      console.log('[AuthMiddleware] Usuario no autenticado, redirigiendo a /login desde', pathname)
      router.replace('/login');
    }
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Mapear pathname a sección
  const pathToSection: Record<string, Section> = {
      '/dashboard': 'dashboard',
      '/cotizaciones': 'cotizaciones',
      '/clientes': 'clientes',
      '/obras': 'obras',
      '/stock': 'stock',
      '/reportes': 'reportes',
      '/posibles-targets': 'posibles-targets',
      '/admin': 'admin',
      '/admin/configuracion': 'configuracion',
    };

  const currentSection = pathToSection[pathname];
    
    // Solo verificar autorización para rutas protegidas
  if (currentSection && !canAccessSection(currentSection as Section)) {
    console.warn(`User ${user.role} attempted to access unauthorized section: ${currentSection}`);
      
      // Redirigir al dashboard usando el router de Next.js
      router.replace('/dashboard');
    }
  }, [pathname, user?.role, user?.id, isAuthenticated, canAccessSection, router]);

  return <>{children}</>;
}

/**
 * Hook para verificar acciones específicas en componentes
 */
export function useActionAuthorization() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(user?.role || '');

  const canCreate = (resource: Resource): boolean => {
    return hasPermission(resource, 'create');
  };

  const canEdit = (resource: Resource): boolean => {
    return hasPermission(resource, 'update');
  };

  const canDelete = (resource: Resource): boolean => {
    return hasPermission(resource, 'delete');
  };

  const canExport = (resource: Resource): boolean => {
    return hasPermission(resource, 'export');
  };

  const canManage = (resource: Resource): boolean => {
    return hasPermission(resource, 'manage');
  };

  const isOwnerOrAdmin = (ownerId?: string): boolean => {
    return user?.role?.toLowerCase() === 'admin' || user?.id === ownerId;
  };

  const logUnauthorizedAction = (resource: Resource, action: Action) => {
    console.warn(`Unauthorized action attempted: ${user?.role} tried to ${action} ${resource}`);
  };

  return {
    canCreate,
    canEdit,
    canDelete,
    canExport,
    canManage,
    isOwnerOrAdmin,
    logUnauthorizedAction,
    user,
    // Proporcionamos isAdmin para compatibilidad
    roleInfo: {
      isAdmin: user?.role?.toLowerCase() === 'admin'
    },
  };
}
