"use client";

import { ClientsPage } from "@/features/clients/ui/ClientsPage";

export default function ClientesPage() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Acciones de sección */}
      <div className="flex items-start justify-end">
        <button className="btn-primary flex-shrink-0" onClick={() => { /* TODO: open create client modal */ }}>
          <span>Nuevo Cliente</span>
        </button>
      </div>
      <ClientsPage />
    </div>
  );
}
