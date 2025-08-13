"use client";

import { useMemo, useState } from "react";
import { quotesData } from "../model/mock";
import { quotesToCSV, downloadCSV } from "@/shared/lib/csv";
import { Badge } from "@/shared/ui/Badge";
import { Toast } from "@/shared/ui/Toast";

export function QuotesTable() {
  const [filters, setFilters] = useState<{status?: string; date?: string; search?: string}>({});
  const data = useMemo(() => {
    let out = [...quotesData];
    if (filters.status && filters.status !== "Todos los estados") {
      const map: Record<string,string> = { "Pendiente":"pending","Aprobada":"approved","Rechazada":"rejected" };
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              {["Número","Cliente","Fecha","Estado","Monto","Acciones"].map(h => (
                <th key={h} className="p-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(q => (
              <tr key={q.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{q.id}</td>
                <td className="p-3">{q.client}</td>
                <td className="p-3"><Badge status={q.status} /></td>
                <td className="p-3">${q.amount.toLocaleString("es-ES",{minimumFractionDigits:2})}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="btn-icon" onClick={()=>Toast.info(`Viendo ${q.id}`)}>👁️</button>
                    <button className="btn-icon" onClick={()=>Toast.info(`Editando ${q.id}`)}>✏️</button>
                    <button className="btn-icon" onClick={()=>Toast.success(`Eliminada ${q.id}`)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td className="p-6 text-center text-slate-500" colSpan={6}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t flex justify-end">
        <button
          className="btn-secondary"
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
