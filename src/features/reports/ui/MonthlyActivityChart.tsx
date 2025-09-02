"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard } from "./ChartCard";

// AVISO: Datos estáticos para simular ventas totales por mes (reemplazar por datos reales)
const data = [
  { month: "Ene", ventas: 38_000 },
  { month: "Feb", ventas: 41_500 },
  { month: "Mar", ventas: 41_500 },
  { month: "Abr", ventas: 45_100 },
  { month: "May", ventas: 50_300 },
  { month: "Jun", ventas: 47_400 },
  { month: "Jul", ventas: 45_700 },
  { month: "Ago", ventas: 51_800 },
  { month: "Sep", ventas: 55_300 },
  { month: "Oct", ventas: 55_800 },
  { month: "Nov", ventas: 56_600 },
  { month: "Dic", ventas: 55_700 },
];

export function MonthlyActivityChart() {
  return (
    <ChartCard title="Ventas por mes (total)" subtitle="Monto total vendido cada mes">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fb923c" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Ventas"]} labelFormatter={(label) => `Mes: ${label}`} />
          <Area type="monotone" dataKey="ventas" stroke="#fb923c" fill="url(#colorVentas)" name="Ventas" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
