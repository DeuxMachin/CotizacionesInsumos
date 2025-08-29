"use client";

import { useMemo, useState } from "react";
import { quotesData } from "../model/mock";
import { quotesToCSV, downloadCSV } from "@/shared/lib/csv";
import { Badge } from "@/shared/ui/Badge";
import { Toast } from "@/shared/ui/Toast";

export function QuotesTable() {
  const [filters] = useState<{status?: string; date?: string; search?: string}>({});
  const data = useMemo(() => {
    let out = [...quotesData];
    if (filters.status && filters.status !== "Todos los estados") {
      const mapStatus: Record<string,string> = { "Pendiente":"pending","Aprobada":"approved","Rechazada":"rejected" };
      out = out.filter(q => q.status === mapStatus[filters.status!]);
    }
    if (filters.date) out = out.filter(q => q.date === filters.date);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      out = out.filter(q => q.client.toLowerCase().includes(s) || q.id.toLowerCase().includes(s));
    }
    return out;
  }, [filters]);

  return (
    <div 
      className="rounded-xl shadow-sm overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      {/* Mobile card view for small screens */}
      <div className="block sm:hidden">
        <div className="divide-y divide-[var(--border-subtle)]">
          {data.map(q => (
            <div key={q.id} className="p-4 space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-theme-primary text-sm">{q.id}</span>
                <Badge status={q.status} />
              </div>
              <div className="text-sm text-theme-secondary">{q.client}</div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-theme-primary">${q.amount.toLocaleString("es-ES",{minimumFractionDigits:2})}</span>
                <div className="flex gap-1">
                  <button className="btn-icon text-xs" onClick={()=>Toast.info(`Viendo ${q.id}`)}>👁️</button>
                  <button className="btn-icon text-xs" onClick={()=>Toast.info(`Editando ${q.id}`)}>✏️</button>
                  <button className="btn-icon text-xs" onClick={()=>Toast.success(`Eliminada ${q.id}`)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="p-6 text-center text-theme-secondary text-sm">Sin resultados</div>
          )}
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr 
              className="text-left"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-subtle)' 
              }}
            >
              {["Número","Cliente","Fecha","Estado","Monto","Acciones"].map(h => (
                <th key={h} className="p-3 font-semibold text-xs sm:text-sm text-theme-primary">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(q => (
              <tr 
                key={q.id} 
                className="transition-colors"
                style={{ 
                  borderTop: '1px solid var(--border-subtle)' 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td className="p-3 text-xs sm:text-sm text-theme-primary">{q.id}</td>
                <td className="p-3 text-xs sm:text-sm text-theme-primary">{q.client}</td>
                <td className="p-3 text-xs sm:text-sm text-theme-primary">{q.date}</td>
                <td className="p-3"><Badge status={q.status} /></td>
                <td className="p-3 text-xs sm:text-sm font-medium text-theme-primary">${q.amount.toLocaleString("es-ES",{minimumFractionDigits:2})}</td>
                <td className="p-3">
                  <div className="flex gap-1 sm:gap-2">
                    <button className="btn-icon" onClick={()=>Toast.info(`Viendo ${q.id}`)}>👁️</button>
                    <button className="btn-icon" onClick={()=>Toast.info(`Editando ${q.id}`)}>✏️</button>
                    {/* Botón de PDF deshabilitado temporalmente */}
                    <button className="btn-icon" onClick={()=>Toast.success(`Eliminada ${q.id}`)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td className="p-6 text-center text-theme-secondary text-sm" colSpan={6}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div 
        className="p-3 flex justify-end"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <button
          className="btn-secondary text-xs sm:text-sm"
          onClick={() => {
            const csv = quotesToCSV(data);
            downloadCSV(csv, "cotizaciones.csv");
            Toast.success("Cotizaciones exportadas");
          }}
        >
          Exportar
        </button>
      </div>
    </div>
  );
}
