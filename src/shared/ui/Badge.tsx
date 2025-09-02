"use client";
import { QuoteStatus } from "@/core/domain/quote/Quote";

// Definir clases completas para cada estado
const statusClasses: Record<QuoteStatus, string> = {
  borrador: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  enviada: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  aceptada: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rechazada: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  expirada: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
};

const statusLabels: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  expirada: "Expirada"
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
