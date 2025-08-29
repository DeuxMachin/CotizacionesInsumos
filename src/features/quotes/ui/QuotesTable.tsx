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
    <div 
      className="rounded-xl shadow-sm overflow-hidden"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      {/* Mobile card view for small screens */}
      <div className="block sm:hidden">
        <div className="divide-y" style={{ '--tw-divide-y-reverse': '0', '--tw-divide-opacity': '1' }}>
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
