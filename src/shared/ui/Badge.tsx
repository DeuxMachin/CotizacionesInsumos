"use client";
import { QuoteStatus } from "@/entities/quote/model/types";
const map: Record<QuoteStatus, string> = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};
export function Badge({ status }: { status: QuoteStatus }) {
  return <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-2xl ${map[status]}`}>{{
    pending:"Pendiente", approved:"Aprobada", rejected:"Rechazada"
  }[status]}</span>;
}
