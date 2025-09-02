"use client";

import React from "react";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

// AVISO: Datos estáticos de ejemplo (reemplazar por datos reales)
const sample = {
  total: 20_245_836,
  exento: 0,
  neto: 17_013_308,
  iva: 3_232_528,
};

export function SalesSummaryKPIs({ values = sample }: { values?: typeof sample }) {
  const items = [
    { label: "Total ventas", value: values.total },
    { label: "Exento", value: values.exento },
    { label: "Neto", value: values.neto },
    { label: "IVA", value: values.iva },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((it) => (
        <div 
          key={it.label} 
          className="rounded-xl p-4 sm:p-5 shadow-sm"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)' 
          }}
        >
          <div className="text-xs uppercase tracking-wide text-theme-secondary font-medium mb-2">{it.label}</div>
          <div className="text-xl sm:text-2xl font-semibold text-theme-primary">{formatCLP(it.value)}</div>
        </div>
      ))}
    </div>
  );
}
