"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "./ChartCard";

type Period = "month" | "year";

// AVISO: Datos estáticos de ejemplo (reemplazar por datos reales)
function buildMonthData() {
  // 30 días con leve estacionalidad; IVA ~19% del neto; exento 0
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return days.map((d) => {
    const neto = 420_000 + Math.round(45_000 * Math.sin((d / 30) * Math.PI)) + d * 2_000;
    const iva = Math.round(neto * 0.19);
    const exento = 0;
    const ventas = neto + iva + exento;
    return { label: `D${d}`, ventas };
  });
}

function buildYearData() {
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return months.map((m, idx) => {
    const neto = 13_000_000 + Math.round(2_500_000 * Math.sin(((idx + 1) / 12) * Math.PI));
    const iva = Math.round(neto * 0.19);
    const ventas = neto + iva;
    return { label: m, ventas };
  });
}

export function SalesTrendChart({ period }: { period: Period }) {
  const data = period === "month" ? buildMonthData() : buildYearData();
  return (
    <ChartCard title={`Ventas a lo largo del ${period === "month" ? "mes" : "año"}`} subtitle="Monto total vendido en cada periodo">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} />
          <YAxis tick={{ fontSize: 12 }} stroke="currentColor" opacity={0.5} tickFormatter={(v) => `$${Math.round(v/1000)}k`} />
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Ventas"]} labelFormatter={(l) => `${l}`} />
          <Area type="monotone" dataKey="ventas" stroke="#fb923c" fill="url(#ventasGrad)" name="Ventas" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
