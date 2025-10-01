"use client";

import React from "react";
import { FiEye, FiDownload } from "react-icons/fi";
import { Badge } from "@/shared/ui/Badge";
// import { quotesData } from "@/features/quotes/model/mock";
import type { Quote } from "@/core/domain/quote/Quote";

export function RecentQuotes() {
  const recent: Quote[] = []; // quotesData.slice(0, 3);

  return (
    <div className="space-y-4">
      {recent.map((q, index) => (
        <div
          key={q.id}
          className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-all duration-200 animate-slideUp"
          style={{
            animationDelay: `${index * 100}ms`,
            borderColor: "var(--border)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          {/* Información de la cotización */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="font-semibold text-sm" style={{ color: "var(--accent-primary)" }}>
                {q.id}
              </div>
              <Badge status={q.estado} />
            </div>

            <div className="font-medium mb-1 truncate" style={{ color: "var(--text-primary)" }}>
              {q.cliente.razonSocial}
            </div>

            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {new Date(q.fechaCreacion).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          {/* Monto y acciones */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                ${q.total.toLocaleString("es-ES", { minimumFractionDigits: 0 })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="p-2 rounded-full transition-colors"
                style={{ color: "var(--text-secondary)" }}
                title="Ver"
              >
                <FiEye size={18} />
              </button>
              <button
                className="p-2 rounded-full transition-colors"
                style={{ color: "var(--text-secondary)" }}
                title="Descargar"
              >
                <FiDownload size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}