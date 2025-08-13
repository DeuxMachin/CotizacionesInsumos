"use client";
import { quotesData } from "@/features/quotes/model/mock";
import { Badge } from "@/shared/ui/Badge";

export function RecentQuotes() {
  return (
    <div className="bg-white rounded-xl shadow">
      <div className="p-5 border-b flex items-center justify-between">
        <h3 className="font-semibold">Cotizaciones Recientes</h3>
        <button className="btn-secondary">Ver todas</button>
      </div>
      <div className="p-3 space-y-2">
        {quotesData.slice(0,3).map(q => (
          <div key={q.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
            <div>
              <div className="font-semibold text-indigo-600">{q.id}</div>
              <div className="text-slate-500 text-sm">{q.client}</div>
            </div>
            <div className="text-right">
              <Badge status={q.status} />
              <div className="font-semibold">${q.amount.toLocaleString("es-ES")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
