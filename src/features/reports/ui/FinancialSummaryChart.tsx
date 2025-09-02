"use client";

import React from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartCard } from "./ChartCard";

type Period = "month" | "year";

// AVISO: Datos estáticos de ejemplo (reemplazar por datos reales del backend)
function buildYearData() {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return months.map((m, i) => {
    const neto = 28_000 + Math.round(6_000 * Math.sin(((i + 1) / 12) * Math.PI));
    const iva = Math.round(neto * 0.19);
    const ventas = neto + iva;
    const compras = Math.round(neto * 0.6);
    return { label: m, compras, ventas, iva };
  });
}

function buildMonthData() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return days.map((d) => {
    const neto = 900 + Math.round(120 * Math.sin((d / 30) * Math.PI)) + d * 10;
    const iva = Math.round(neto * 0.19);
    const ventas = neto + iva;
    const compras = Math.round(neto * 0.6);
    return { label: `D${d}`, compras, ventas, iva };
  });
}

export function FinancialSummaryChart({ period = "year" }: { period?: Period }) {
  const data = period === "month" ? buildMonthData() : buildYearData();
  return (
    <ChartCard title="Compras, ventas e IVA" subtitle={`Montos por ${period === "month" ? "día" : "mes"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip formatter={(v: number, n: string) => [`$${v.toLocaleString()}`, n[0].toUpperCase()+n.slice(1)]} labelFormatter={(l) => `${period === "month" ? "Día" : "Mes"}: ${l}`} />
          <Legend />
          <Bar dataKey="compras" name="Compras" fill="#60a5fa" radius={[6, 6, 0, 0]} />
          <Bar dataKey="ventas" name="Ventas" fill="#34d399" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="iva" name="IVA" stroke="#fb923c" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
