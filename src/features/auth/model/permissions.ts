"use client";

// Definición de recursos y acciones del sistema
export type Resource = 
  | 'dashboard'
  | 'quotes' 
  | 'sales-notes'
  | 'clients'
  | 'obras'
  | 'targets'
  | 'stock'
  | 'reports'
  | 'admin'
  | 'users'
  | 'settings';

export type Action = 
  | 'create'
  | 'read' 
  | 'update'
  | 'delete'
  | 'manage'
  | 'export'
  | 'import';

export interface Permission {
  resource: Resource;
  actions: Action[];
}

// Definición de roles y sus permisos
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  dueño: [
    // Acceso total a todo, máximo privilegio
    { resource: 'dashboard', actions: ['read', 'manage'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'sales-notes', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'obras', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'targets', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'stock', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'reports', actions: ['read', 'export', 'manage'] },
    { resource: 'admin', actions: ['read', 'manage'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update', 'manage'] },
  ],
  dueno: [
    // Alias por si se guarda sin ñ
    { resource: 'dashboard', actions: ['read', 'manage'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'sales-notes', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'obras', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'targets', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'stock', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'reports', actions: ['read', 'export', 'manage'] },
    { resource: 'admin', actions: ['read', 'manage'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update', 'manage'] },
  ],
  admin: [
    // Acceso total excepto crear usuarios admin/dueño
    { resource: 'dashboard', actions: ['read', 'manage'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'sales-notes', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'clients', actions: ['create', 'read', 'update', 'delete', 'export', 'import'] },
    { resource: 'obras', actions: ['create', 'read', 'update', 'delete', 'manage', 'export'] },
    { resource: 'targets', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'stock', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'reports', actions: ['read', 'export', 'manage'] },
    { resource: 'admin', actions: ['read', 'manage'] },
    { resource: 'users', actions: ['read', 'update', 'delete'] }, // Sin 'create' para restringir creación de admins
    { resource: 'settings', actions: ['read', 'update', 'manage'] },
  ],
  
  vendedor: [
    // Vendedor/Usuario estándar
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'sales-notes', actions: ['create', 'read', 'export'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'obras', actions: ['create', 'read', 'update'] },
    { resource: 'targets', actions: ['create', 'read', 'update'] },
    { resource: 'stock', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
  
  user: [
    // Vendedor/Usuario estándar (alias)
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'quotes', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'sales-notes', actions: ['create', 'read', 'export'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'obras', actions: ['create', 'read', 'update'] },
    { resource: 'targets', actions: ['create', 'read', 'update'] },
    { resource: 'stock', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
  
  cliente: [
    // Cliente - acceso limitado
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'quotes', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
  ],
  
  demo: [
    // Usuario de demostración - solo lectura
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'quotes', actions: ['read'] },
    { resource: 'clients', actions: ['read'] },
    { resource: 'obras', actions: ['read'] },
    { resource: 'targets', actions: ['read'] },
    { resource: 'stock', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
};

// Utility para verificar permisos
export class PermissionChecker {
  private userRole: string;

  constructor(userRole: string) {
    this.userRole = userRole.toLowerCase();
  }

  hasPermission(resource: Resource, action: Action): boolean {
    const permissions = ROLE_PERMISSIONS[this.userRole];
    if (!permissions) return false;

    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    return resourcePermission.actions.includes(action);
  }

  hasAnyPermission(resource: Resource, actions: Action[]): boolean {
    return actions.some(action => this.hasPermission(resource, action));
  }

  hasAllPermissions(resource: Resource, actions: Action[]): boolean {
    return actions.every(action => this.hasPermission(resource, action));
  }

  canManage(resource: Resource): boolean {
    return this.hasPermission(resource, 'manage');
  }

  canRead(resource: Resource): boolean {
    return this.hasPermission(resource, 'read');
  }

  canWrite(resource: Resource): boolean {
    return this.hasAnyPermission(resource, ['create', 'update', 'delete']);
  }

  getPermissions(): Permission[] {
    return ROLE_PERMISSIONS[this.userRole] || [];
  }
}

// Hook para usar permisos en componentes
export function usePermissions(userRole: string) {
  const checker = new PermissionChecker(userRole);

  return {
    hasPermission: checker.hasPermission.bind(checker),
    hasAnyPermission: checker.hasAnyPermission.bind(checker),
    hasAllPermissions: checker.hasAllPermissions.bind(checker),
    canManage: checker.canManage.bind(checker),
    canRead: checker.canRead.bind(checker),
    canWrite: checker.canWrite.bind(checker),
    getPermissions: checker.getPermissions.bind(checker),
    checker,
  };
}
