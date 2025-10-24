"use client";
import { create } from "zustand";

export type Section = "dashboard" | "cotizaciones" | "notas-venta" | "clientes" | "obras" | "reuniones" | "stock" | "reportes" | "posibles-targets" | "vendedores" | "admin" | "configuracion";

interface Store {
  section: Section;
  setSection: (s: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useSection = create<Store>((set) => ({
  section: "dashboard",
  setSection: (s) => set({ section: s }),
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));