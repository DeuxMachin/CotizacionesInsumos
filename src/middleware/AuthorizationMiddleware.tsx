"use client";

import { useAuth } from "@/features/auth/model/useAuth";
import { usePermissions, type Resource, type Action } from "@/features/auth/model/permissions";
import { useNavigationItems } from "@/features/navigation/model/navigationItems";
import { useSection } from "@/features/navigation/model/useSection";
import { useEffect } from "react";

/**
 * Middleware de autorización que se ejecuta en cada renderizado
 * para verificar que el usuario tenga permisos para la sección actual
 */
export function AuthorizationMiddleware({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { section, setSection } = useSection();
  const { canAccessSection } = useNavigationItems(user?.role || '');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Verificar si el usuario puede acceder a la sección actual
    if (!canAccessSection(section)) {
      console.warn(`User ${user.role} attempted to access unauthorized section: ${section}`);
      
      // Redirigir al dashboard si no tiene permisos
      setSection('dashboard');
    }
  }, [section, user, isAuthenticated, canAccessSection, setSection]);

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
    // La propiedad roleInfo ya no existe, pero proporcionamos isAdmin para compatibilidad
    roleInfo: {
      isAdmin: user?.role?.toLowerCase() === 'admin'
    },
  };
}
