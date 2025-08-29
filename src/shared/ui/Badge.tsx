"use client";
import { QuoteStatus } from "@/entities/quote/model/types";

// Definir clases completas para cada estado
const statusClasses: Record<QuoteStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

const statusLabels: Record<QuoteStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

export function Badge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-2xl transition-colors ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
