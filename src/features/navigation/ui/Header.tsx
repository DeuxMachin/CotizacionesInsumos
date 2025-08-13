"use client";
import { useSection } from "@/features/navigation/model/useSection";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";
const titles: Record<string, string> = {
  dashboard: "Dashboard",
  cotizaciones: "Gestión de Cotizaciones",
  clientes: "Gestión de Clientes",
  catalogo: "Catálogo de Productos",
  reportes: "Reportes y Análisis",
};

export function Header() {
  const { section, setSidebarOpen } = useSection();
  return (
    <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-2 rounded hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <h1 className="text-xl font-bold">{titles[section] ?? "Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="pl-10 pr-3 py-2 rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                   placeholder="Buscar..." />
          </div>
          <button className="relative p-2 rounded-full hover:bg-slate-100">
            <FiBell />
            <span className="absolute -top-1 -right-1 text-[10px] bg-rose-500 text-white h-4 w-4 rounded-full grid place-content-center">3</span>
          </button>
        </div>
      </div>
    </header>
  );
}
