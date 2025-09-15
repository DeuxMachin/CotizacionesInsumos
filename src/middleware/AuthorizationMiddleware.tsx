"use client";

import { useAuth } from "@/features/auth/model/useAuth";
import { usePermissions, type Resource, type Action } from "@/features/auth/model/permissions";
import { useNavigationItems } from "@/features/navigation/model/navigationItems";
import { useSection } from "@/features/navigation/model/useSection";
import { useEffect, useRef } from "react";

/**
 * Middleware de autorización que se ejecuta en cada renderizado
 * para verificar que el usuario tenga permisos para la sección actual
 */
export function AuthorizationMiddleware({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { section, setSection } = useSection();
  const { canAccessSection } = useNavigationItems(user?.rol || '');
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      hasRedirectedRef.current = false;
      return;
    }

    // Verificar si el usuario puede acceder a la sección actual
    if (!canAccessSection(section) && !hasRedirectedRef.current) {
      console.warn(`User ${user.rol} attempted to access unauthorized section: ${section}`);
      
      // Marcar que ya se ha redirigido para evitar bucles
      hasRedirectedRef.current = true;
      
      // Redirigir al dashboard si no tiene permisos
      setSection('dashboard');
      
      // Resetear la bandera después de un tiempo
      setTimeout(() => {
        hasRedirectedRef.current = false;
      }, 100);
    }
  }, [section, user?.rol, user?.id, isAuthenticated, canAccessSection, setSection]);

  return <>{children}</>;
}

/**
 * Hook para verificar acciones específicas en componentes
 */
export function useActionAuthorization() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(user?.rol || '');

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
    return user?.rol?.toLowerCase() === 'admin' || user?.id === ownerId;
  };

  const logUnauthorizedAction = (resource: Resource, action: Action) => {
    console.warn(`Unauthorized action attempted: ${user?.rol} tried to ${action} ${resource}`);
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
    // La propiedad roleInfo ya no existe, pero proporcionamos isAdmin para compatibilidad
    roleInfo: {
      isAdmin: user?.rol?.toLowerCase() === 'admin'
    },
  };
}
