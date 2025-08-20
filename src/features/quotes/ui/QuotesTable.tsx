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
    <div className="rounded-xl bg-white shadow overflow-hidden">
      {/* Mobile card view for small screens */}
      <div className="block sm:hidden">
        <div className="divide-y divide-gray-100">
          {data.map(q => (
            <div key={q.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">{q.id}</span>
                <Badge status={q.status} />
              </div>
              <div className="text-sm text-gray-600">{q.client}</div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">${q.amount.toLocaleString("es-ES",{minimumFractionDigits:2})}</span>
                <div className="flex gap-1">
                  <button className="btn-icon text-xs" onClick={()=>Toast.info(`Viendo ${q.id}`)}>👁️</button>
                  <button className="btn-icon text-xs" onClick={()=>Toast.info(`Editando ${q.id}`)}>✏️</button>
                  <button className="btn-icon text-xs" onClick={()=>Toast.success(`Eliminada ${q.id}`)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">Sin resultados</div>
          )}
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              {["Número","Cliente","Fecha","Estado","Monto","Acciones"].map(h => (
                <th key={h} className="p-3 font-semibold text-xs sm:text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(q => (
              <tr key={q.id} className="border-t hover:bg-slate-50">
                <td className="p-3 text-xs sm:text-sm">{q.id}</td>
                <td className="p-3 text-xs sm:text-sm">{q.client}</td>
                <td className="p-3 text-xs sm:text-sm">{q.date}</td>
                <td className="p-3"><Badge status={q.status} /></td>
                <td className="p-3 text-xs sm:text-sm font-medium">${q.amount.toLocaleString("es-ES",{minimumFractionDigits:2})}</td>
                <td className="p-3">
                  <div className="flex gap-1 sm:gap-2">
                    <button className="btn-icon" onClick={()=>Toast.info(`Viendo ${q.id}`)}>👁️</button>
                    <button className="btn-icon" onClick={()=>Toast.info(`Editando ${q.id}`)}>✏️</button>
                    <button className="btn-icon" onClick={()=>Toast.success(`Eliminada ${q.id}`)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td className="p-6 text-center text-slate-500 text-sm" colSpan={6}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t flex justify-end">
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
