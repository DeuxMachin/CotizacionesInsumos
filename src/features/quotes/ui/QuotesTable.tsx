"use client";

import { useMemo, useState } from "react";
import { quotesData } from "../model/mock";
import { quotesToCSV, downloadCSV } from "@/shared/lib/csv";
import { Badge } from "@/shared/ui/Badge";
import { Toast } from "@/shared/ui/Toast";
import { downloadServerDTE } from "@/features/reports/ui/pdf/downloadServerDTE";
import { mapQuoteToDTE, DTEItem } from "@/features/reports/ui/pdf/ChileanTaxUtils";
import { BRAND } from "@/shared/ui/brand";

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
                    <button className="btn-icon" onClick={async ()=>{
                      // DEMO: Generar PDF tipo Nota de Crédito como en la imagen, con datos estáticos
                      const items: DTEItem[] = [
                        { codigo: "1S-SA-406715", descripcion: "SELLANTE HIBRIDO POMO DE 300ML GRIS\nMS-35 QUILOSA", cantidad: 5, precio: 4708, descuentoPct: 0, afecto: true },
                        { codigo: "1S-AD-165758", descripcion: "ADHESIVO DE MONTAJE BLANCO POMO DE 370 ML\nAFIX MONTAJE", cantidad: 5, precio: 1581, descuentoPct: 0, afecto: true },
                      ];
                      const doc = mapQuoteToDTE({
                        quoteId: q.id,
                        tipo: "NOTA DE CRÉDITO",
                        fechaEmision: new Date().toISOString(),
                        folio: 937,
                        items,
                        emisor: {
                          razonSocial: "OLGA ESTER LEAL LEAL E.I.R.L.",
                          rut: "76.309.629-7",
                          giro: "VTA.INSUM.CONST/ COM.EN VTAS/ PREST.SERV.PROF/ ASESORIA VENTAS",
                          direccion: "BELGRADO 699, Temuco",
                          email: "cobranza@importalventas.cl",
                          telefono: "+56 9 77497459",
                          logoUrl: BRAND?.logoSrc || undefined,
                          encabezadoSuperior: "INSUMOS DE CONSTRUCCION Y SERVICIOS DE VENTA",
                          encabezadoInferior: "OLGA ESTER LEAL LEAL E.I.R.L.",
                        },
                        cliente: {
                          razonSocial: q.client,
                          rut: "76.146.982-7",
                          direccion: "ALDUNATE 719 711",
                          comuna: "Temuco",
                          ciudad: "Temuco",
                          giro: "CONSTRUCCION DE EDIFICIOS COMPLETOS O DE",
                        },
                      });
                      await downloadServerDTE(doc, `${q.id}_DTE.pdf`);
                      Toast.success("PDF generado");
                    }}>📄</button>
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
