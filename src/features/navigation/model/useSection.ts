"use client";
import { create } from "zustand";

export type Section = "dashboard" | "cotizaciones" | "clientes" | "obras" | "reuniones" | "stock" | "reportes" | "posibles-targets" | "vendedores" | "admin" | "configuracion";

interface Store {
  section: Section;
  setSection: (s: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export const useSection = create<Store>((set) => ({
  section: "dashboard",
  setSection: (s) => set({ section: s }),
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));