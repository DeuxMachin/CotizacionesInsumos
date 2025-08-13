"use client";

import { useSection } from "../model/useSection";
import { FiHome, FiFileText, FiUsers, FiBox, FiBarChart2, FiMenu } from "react-icons/fi";
import clsx from "classnames";

const items = [
  { key: "dashboard", icon: <FiHome />, label: "Dashboard" },
  { key: "cotizaciones", icon: <FiFileText />, label: "Cotizaciones" },
  { key: "clientes", icon: <FiUsers />, label: "Clientes" },
  { key: "catalogo", icon: <FiBox />, label: "Catálogo" },
  { key: "reportes", icon: <FiBarChart2 />, label: "Reportes" },
] as const;

export function Sidebar() {
  const { section, setSection, sidebarOpen, setSidebarOpen } = useSection();

  return (
    <aside className={clsx(
      "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 shadow transition-transform",
      "translate-x-[-100%] lg:translate-x-0",
      sidebarOpen && "translate-x-0"
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">Σ</span>
          <span>QuoteAdmin</span>
        </div>
        <button className="lg:hidden p-2 rounded hover:bg-slate-100" onClick={() => setSidebarOpen(false)}>
          <FiMenu />
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => { setSection(it.key as any); setSidebarOpen(false); }}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition",
              section === it.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <span className="text-lg">{it.icon}</span>
            <span className="font-medium">{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 inset-x-0 p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 text-white grid place-content-center">A</div>
          <div className="text-sm">
            <div className="font-semibold">Admin User</div>
            <div className="text-slate-500">Administrador</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
