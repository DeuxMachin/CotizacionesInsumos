"use client";

import { useSection } from "../features/navigation/model/useSection";
import { Sidebar } from "@/features/navigation/ui/Sidebar";
import { Header } from "@/features/navigation/ui/Header";
import { Stats } from "@/features/dashboard/ui/Stats";
import { RecentQuotes } from "@/features/dashboard/ui/RecentQuotes";
import { QuotesTable } from "@/features/quotes/ui/QuotesTable";
import { FiltersBar } from "@/features/quotes/ui/FiltersBar";

import { NewQuoteModal } from "@/features/quotes/ui/NewQuoteModal";
import { ToastHost } from "@/shared/ui/Toast";

export default function HomePage() {
  const { section } = useSection();

  return (
    <div className="min-h-dvh bg-slate-50">
      <Sidebar />
      <main className="ml-0 lg:ml-72 transition-all">
        <Header />
        <div className="p-4 md:p-6 space-y-6">
          {section === "dashboard" && (
            <>
              <Stats />
              <div className="grid gap-6 lg:grid-cols-2">
                <RecentQuotes />
                {/* Coloca aquí tu gráfico cuando lo implementes */}
                <div className="rounded-xl bg-white shadow p-6 min-h-64 flex items-center justify-center text-slate-500">
                  Gráfico de actividad mensual (placeholder)
                </div>
              </div>
            </>
          )}

          {section === "cotizaciones" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">Gestión de Cotizaciones</h2>
                <div className="flex gap-2">
                  <button className="btn-secondary">Exportar</button>
                  <NewQuoteModal.Trigger />
                </div>
              </div>
              <FiltersBar />
              <QuotesTable />
            </>
          )}

          {section === "clientes" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
                <button className="btn-primary">Nuevo Cliente</button>
              </div>
              
            </>
          )}

          {section === "catalogo" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">Catálogo de Productos</h2>
                <button className="btn-primary">Nuevo Producto</button>
              </div>
              
            </>
          )}

          {section === "reportes" && (
            <>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
                <button className="btn-secondary">Exportar Reporte</button>
              </div>
              
            </>
          )}
        </div>
      </main>

      <NewQuoteModal.Root />
      <ToastHost />
    </div>
  );
}
