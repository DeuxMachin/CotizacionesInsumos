"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from "recharts";
import { ChartCard } from "./ChartCard";
import { ReportsSection } from "./ReportsSection";

type Period = "month" | "year";

// AVISO: Datos estáticos para prototipado (reemplazar por datos reales)
function buildSellers(period: Period) {
  // valores similares entre mes/año para demo
  const base = [
    { seller: "Ana", ventas: 56000 },
    { seller: "Luis", ventas: 48000 },
    { seller: "María", ventas: 42000 },
    { seller: "Pedro", ventas: 31000 },
    { seller: "Sofía", ventas: 29000 },
  ];
  if (period === "year") return base.map((x) => ({ ...x, ventas: Math.round(x.ventas * 12) }));
  return base;
}

function buildTopProducts(period: Period) {
  const month = [
    { producto: "Panel A", unidades: 210, precioVenta: 160, precioCosto: 110 },
    { producto: "Inversor X", unidades: 140, precioVenta: 200, precioCosto: 140 },
    { producto: "Batería M", unidades: 90, precioVenta: 230, precioCosto: 180 },
    { producto: "Estructura Q", unidades: 200, precioVenta: 70, precioCosto: 45 },
    { producto: "Cableado Z", unidades: 400, precioVenta: 35, precioCosto: 20 },
    { producto: "Conector T", unidades: 600, precioVenta: 22, precioCosto: 14 },
  ];
  if (period === "year") return month.map((p) => ({ ...p, unidades: Math.round(p.unidades * 11.5) }));
  return month;
}

export function AdminReports({ period = "month" }: { period?: Period }) {
  const sellersData = buildSellers(period);
  const top = buildTopProducts(period);
  // Ingreso y costo totales por producto + margen
  const topAgg = top.map((p) => {
    const ingreso = p.unidades * p.precioVenta;
    const costoTotal = p.unidades * p.precioCosto;
    const margen = ingreso - costoTotal;
    const margenPct = ingreso ? Math.round((margen / ingreso) * 100) : 0;
    return { ...p, ingreso, costoTotal, margen, margenPct };
  });
  return (
    <div className="space-y-6">
      <ReportsSection title="Rendimiento del equipo" description="Comparación de ventas por vendedor y productos estrella a nivel global">
        <ChartCard title="Ventas por vendedor" subtitle="Comparación de ventas por persona (CLP)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...sellersData].sort((a, b) => a.ventas - b.ventas)} layout="vertical" margin={{ left: 16, right: 16, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v/1000}k`} />
            <YAxis dataKey="seller" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={70} />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
            <Bar dataKey="ventas" fill="#34d399" radius={[6, 6, 6, 6]} />
          </BarChart>
        </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Top ${period === 'month' ? 'del mes' : 'del año'}: Ingreso vs Costo y margen %`} subtitle="Barras apiladas ingreso/costo y línea de margen">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={topAgg} margin={{ left: 8, right: 16, top: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="producto" angle={-10} tickMargin={10} height={50} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${Math.round(v/1000)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number, name: string) => name.includes('%') ? [`${v}%`, 'Margen'] : [`$${v.toLocaleString()}`, name === 'costoTotal' ? 'Costo' : 'Ingreso']} />
              <Legend />
              <Bar yAxisId="left" stackId="ing" dataKey="costoTotal" name="Costo" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="left" stackId="ing" dataKey="margen" name="Margen" fill="#34d399" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="margenPct" name="Margen %" stroke="#fb923c" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Top ${period === 'month' ? 'del mes' : 'del año'}: Unidades vendidas`} subtitle="Productos ordenados por unidades">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...topAgg].sort((a, b) => b.unidades - a.unidades)} margin={{ left: 8, right: 8, top: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="producto" angle={-10} tickMargin={10} height={50} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString()}`, 'Unidades']} />
              <Legend />
              <Bar dataKey="unidades" name="Unidades" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ReportsSection>
    </div>
  );
}
