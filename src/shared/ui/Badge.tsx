"use client";
import { QuoteStatus } from "@/entities/quote/model/types";

// Definir colores para modo claro y oscuro
const map: Record<QuoteStatus, { light: string; dark: string }> = {
  pending: {
    light: "bg-amber-100 text-amber-700",
    dark: "bg-amber-900/30 text-amber-300",
  },
  approved: {
    light: "bg-emerald-100 text-emerald-700",
    dark: "bg-emerald-900/30 text-emerald-300",
  },
  rejected: {
    light: "bg-rose-100 text-rose-700",
    dark: "bg-rose-900/30 text-rose-300",
  },
};

export function Badge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-2xl ${map[status].light} dark:${map[status].dark}`}
    >
      {{
        pending: "Pendiente",
        approved: "Aprobada",
        rejected: "Rechazada",
      }[status]}
    </span>
  );
}
