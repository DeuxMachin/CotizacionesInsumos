"use client";

import { useMemo } from "react";
import { FiHome, FiFileText, FiUsers, FiPackage, FiBarChart2, FiMapPin, FiSettings, FiShield, FiTool } from "react-icons/fi";
import type { Section } from "./useSection";
import { usePermissions, type Resource, type Action } from "@/features/auth/model/permissions";

export interface NavigationItem {
  key: Section;
  iconName: string;
  label: string;
  description: string;
  resource: Resource;
  requiredActions: Action[];
  adminOnly?: boolean;
  badge?: string;
  comingSoon?: boolean;
}

// Mapa de iconos para evitar JSX en definiciones
export const NAVIGATION_ICONS = {
  dashboard: FiHome,
  cotizaciones: FiFileText,
  clientes: FiUsers,
  obras: FiTool,
  reuniones: FiUsers,
  'posibles-targets': FiMapPin,
  stock: FiPackage,
  reportes: FiBarChart2,
  admin: FiShield,
  configuracion: FiSettings,
} as const;

// Definición completa de elementos de navegación
export const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    key: "dashboard",
    iconName: "dashboard",
    label: "Dashboard",
    description: "Resumen general del sistema",
    resource: "dashboard",
    requiredActions: ["read"],
  },
  {
    key: "cotizaciones",
    iconName: "cotizaciones",
    label: "Cotizaciones",
    description: "Gestión de cotizaciones y presupuestos",
    resource: "quotes",
    requiredActions: ["read"],
  },
  {
    key: "clientes",
    iconName: "clientes",
    label: "Clientes",
    description: "Administración de clientes",
    resource: "clients",
    requiredActions: ["read"],
  },
  {
    key: "obras",
    iconName: "obras",
    label: "Obras",
    description: "Gestión de obras en construcción",
    resource: "obras",
    requiredActions: ["read"],
  },
  {
    key: "reuniones",
    iconName: "reuniones",
    label: "Reuniones",
    description: "Control de reuniones en obra",
    resource: "obras",
    requiredActions: ["read"],
  },
  {
    key: "posibles-targets",
    iconName: "posibles-targets",
    label: "Posibles Targets",
    description: "Gestión de prospectos y ubicaciones",
    resource: "targets",
    requiredActions: ["read"],
  },
  {
    key: "stock",
    iconName: "stock",
    label: "Stock",
    description: "Control de inventario",
    resource: "stock",
    requiredActions: ["read"],
  },
  {
    key: "reportes",
    iconName: "reportes",
    label: "Reportes",
    description: "Análisis y métricas",
    resource: "reports",
    requiredActions: ["read"],
  },
  {
    key: "admin",
    iconName: "admin",
    label: "Administración",
    description: "Panel de administración",
    resource: "admin",
    requiredActions: ["read"],
    adminOnly: true,
  },
  {
    key: "configuracion",
    iconName: "configuracion",
    label: "Configuración",
    description: "Ajustes del sistema",
    resource: "settings",
    requiredActions: ["read"],
    adminOnly: true,
    comingSoon: true,
  },
] as const;

// Hook para obtener elementos de navegación filtrados por permisos
export function useNavigationItems(userRole: string) {
  const { hasAnyPermission, canRead } = usePermissions(userRole.toLowerCase());

  const navigationItems = useMemo(() => {
    return ALL_NAVIGATION_ITEMS.filter(item => {
      // Verificar si el usuario tiene permisos para ver este elemento
      const hasRequiredPermissions = hasAnyPermission(item.resource, item.requiredActions);

      // Si es adminOnly, verificar que sea admin o dueño
      if (item.adminOnly && !['admin', 'dueño', 'dueno'].includes(userRole.toLowerCase())) {
        return false;
      }

      // Verificar permisos básicos de lectura
      if (!canRead(item.resource)) {
        return false;
      }

      return hasRequiredPermissions;
    });
  }, [userRole, hasAnyPermission, canRead]);

  const visibleSections = useMemo(() => {
    return navigationItems.map(item => item.key);
  }, [navigationItems]);

  const canAccessSection = useMemo(() => {
    return (section: Section): boolean => {
      const item = ALL_NAVIGATION_ITEMS.find(nav => nav.key === section);
      if (!item) return false;

      if (item.adminOnly && !['admin', 'dueño', 'dueno'].includes(userRole.toLowerCase())) {
        return false;
      }

      return hasAnyPermission(item.resource, item.requiredActions);
    };
  }, [userRole, hasAnyPermission]);

  return {
    navigationItems,
    visibleSections,
    canAccessSection,
    allItems: ALL_NAVIGATION_ITEMS,
  };
}
