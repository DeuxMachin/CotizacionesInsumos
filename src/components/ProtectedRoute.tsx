"use client";

import { useAuth } from "@/features/auth/model/useAuth";
import { usePermissions, type Resource, type Action } from "@/features/auth/model/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource: Resource;
  action: Action;
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  resource, 
  action, 
  fallback,
  requireAdmin = false 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions(user?.rol || '');
  const router = useRouter();
  
  useEffect(() => {
    // Verificar autenticación primero
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Si no está autenticado, no renderizar nada hasta que la redirección ocurra
  if (!isAuthenticated) {
    return null;
  }

  // Si requiere admin y no es admin, mostrar fallback
  if (requireAdmin && user?.rol?.toLowerCase() !== 'admin') {
    return fallback || <UnauthorizedView />;
  }

  // Verificar permisos específicos
  if (!hasPermission(resource, action)) {
    return fallback || <UnauthorizedView />;
  }

  return <>{children}</>;
}

interface ProtectedComponentProps {
  children: React.ReactNode;
  resource: Resource;
  actions: Action[];
  requireAll?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedComponent({ 
  children, 
  resource, 
  actions, 
  requireAll = false,
  requireAdmin = false,
  fallback = null 
}: ProtectedComponentProps) {
  const { user } = useAuth();
  const { hasAnyPermission, hasAllPermissions } = usePermissions(user?.rol || '');

  // Si requiere admin y no es admin, no mostrar
  if (requireAdmin && user?.rol?.toLowerCase() !== 'admin') {
    return fallback;
  }

  // Verificar permisos
  const hasRequiredPermissions = requireAll 
    ? hasAllPermissions(resource, actions)
    : hasAnyPermission(resource, actions);

  if (!hasRequiredPermissions) {
    return fallback;
  }

  return <>{children}</>;
}

// Vista de no autorizado
function UnauthorizedView() {
  return (
    <div className="flex flex-col items-center justify-center h-64 rounded-xl p-8 text-center bg-theme-card border border-theme-subtle">
      <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
        Acceso Denegado
      </h3>
      <p className="text-sm max-w-sm text-theme-secondary">
        No tienes permisos suficientes para acceder a esta funcionalidad. 
        Contacta con el administrador si crees que deberías tener acceso.
      </p>
    </div>
  );
}

// Hook para verificación rápida de permisos en componentes
export function useProtectedAction() {
  const { user } = useAuth();
  const { hasPermission, canWrite, canRead, canManage } = usePermissions(user?.rol || '');

  const canPerform = (resource: Resource, action: Action): boolean => {
    return hasPermission(resource, action);
  };

  const canPerformAny = (resource: Resource, actions: Action[]): boolean => {
    return actions.some(action => hasPermission(resource, action));
  };

  const isAdmin = (): boolean => {
    return user?.rol?.toLowerCase() === 'admin';
  };

  const canEditResource = (resource: Resource): boolean => {
    return canWrite(resource);
  };

  const canViewResource = (resource: Resource): boolean => {
    return canRead(resource);
  };

  const canManageResource = (resource: Resource): boolean => {
    return canManage(resource);
  };

  return {
    canPerform,
    canPerformAny,
    isAdmin,
    canEditResource,
    canViewResource,
    canManageResource,
    user,
  };
}
