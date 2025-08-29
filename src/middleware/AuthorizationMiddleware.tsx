"use client";

import { useAuthWithPermissions } from "@/features/auth/model/useAuth";
import { useNavigationItems } from "@/features/navigation/model/navigationItems";
import { useSection } from "@/features/navigation/model/useSection";
import { auditLogger } from "@/shared/lib/auditLogger";
import { useEffect } from "react";

/**
 * Middleware de autorización que se ejecuta en cada renderizado
 * para verificar que el usuario tenga permisos para la sección actual
 */
export function AuthorizationMiddleware({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthWithPermissions();
  const { section, setSection } = useSection();
  const { canAccessSection } = useNavigationItems(user?.role || '');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Log section access
    auditLogger.logResourceAccess(
      user.id,
      user.email,
      user.role,
      'navigation',
      `access_section_${section}`,
      { section }
    );

    // Verificar si el usuario puede acceder a la sección actual
    if (!canAccessSection(section)) {
      console.warn(`User ${user.role} attempted to access unauthorized section: ${section}`);
      
      // Log unauthorized access attempt
      auditLogger.logUnauthorizedAccess(
        user.id,
        user.email,
        user.role,
        'navigation',
        `access_section_${section}`
      );
      
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
  const { user, hasPermission, roleInfo } = useAuthWithPermissions();

  const canCreate = (resource: string): boolean => {
    return hasPermission(resource as any, 'create');
  };

  const canEdit = (resource: string): boolean => {
    return hasPermission(resource as any, 'update');
  };

  const canDelete = (resource: string): boolean => {
    return hasPermission(resource as any, 'delete');
  };

  const canExport = (resource: string): boolean => {
    return hasPermission(resource as any, 'export');
  };

  const canManage = (resource: string): boolean => {
    return hasPermission(resource as any, 'manage');
  };

  const isOwnerOrAdmin = (ownerId?: string): boolean => {
    return roleInfo.isAdmin || user?.id === ownerId;
  };

  const logUnauthorizedAction = (resource: string, action: string) => {
    console.warn(`Unauthorized action attempted: ${user?.role} tried to ${action} ${resource}`);
    
    if (user) {
      auditLogger.logUnauthorizedAccess(
        user.id,
        user.email,
        user.role,
        resource,
        action
      );
    }
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
    roleInfo,
  };
}
