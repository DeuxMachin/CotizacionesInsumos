"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, LabelList, Cell, Line } from "recharts";
import { ChartCard } from "./ChartCard";
import { ReportsSection } from "./ReportsSection";

// AVISO: Datos estáticos para prototipado de métricas del vendedor

const pipelineDataBase = [
  { estado: "Borrador", cantidad: 12 },
  { estado: "Cotizando", cantidad: 9 },
  { estado: "Enviadas", cantidad: 7 },
  { estado: "Aprobadas", cantidad: 3 },
];

type Period = "month" | "year";

// Top productos del periodo vendidos por el vendedor (static demo)
function buildSellerTopProducts(period: Period) {
  const month = [
    { producto: "Panel A", unidades: 58, precioVenta: 160, precioCosto: 112 },
    { producto: "Inversor X", unidades: 41, precioVenta: 205, precioCosto: 150 },
    { producto: "Batería M", unidades: 29, precioVenta: 235, precioCosto: 182 },
    { producto: "Estructura Q", unidades: 25, precioVenta: 72, precioCosto: 48 },
    { producto: "Cableado Z", unidades: 20, precioVenta: 36, precioCosto: 22 },
  ];
  if (period === "year") return month.map((p) => ({ ...p, unidades: Math.round(p.unidades * 11.5) }));
  return month;
}

// Bullet chart simplificado con barras superpuestas
const goal = 50_000;
const achieved = 38_500;

export function SellerReports({ period = "month" }: { period?: Period }) {
  // Enriquecer datos del pipeline con porcentaje y etiqueta legible
  const total = pipelineDataBase.reduce((a, b) => a + b.cantidad, 0);
  const colorMap: Record<string, string> = {
    Borrador: "#94a3b8", // slate-400
    Cotizando: "#60a5fa", // blue-400
    Enviadas: "#f59e0b", // amber-500
    Aprobadas: "#34d399", // emerald-400
  };
  const pipelineData = pipelineDataBase.map((d) => {
    const pct = total ? Math.round((d.cantidad / total) * 100) : 0;
    return { ...d, pct, label: `${d.cantidad} (${pct}%)` };
  });

  return (
    <div className="space-y-6">
      <ReportsSection title="Mi desempeño" description="Estado actual de mis cotizaciones y avance hacia la meta">
        <ChartCard title="Mis cotizaciones por etapa" subtitle="Cuántas tengo en cada estado hoy">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pipelineData} layout="vertical" margin={{ left: 24, right: 16, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis dataKey="estado" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={90} />
            {/* Tipado del payload de Tooltip para evitar any */}
            <Tooltip
              formatter={(v: number, _n, p: { payload?: { pct?: number } } | undefined) => [`${v} (${p?.payload?.pct ?? 0}%)`, "Cantidad"]}
            />
            <Bar dataKey="cantidad" radius={[6, 6, 6, 6]}>
              {pipelineData.map((entry) => (
                <Cell key={entry.estado} fill={colorMap[entry.estado]} />
              ))}
              <LabelList dataKey="label" position="right" className="text-xs" />
            </Bar>
          </BarChart>
  </ResponsiveContainer>
  </ChartCard>

  <ChartCard title="Mis ventas vs mi meta" subtitle="Cuánto llevo vendido del objetivo mensual">
        <div className="h-full flex items-center">
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={[{ name: "Meta", goal, achieved }]} layout="vertical" margin={{ left: 24, right: 24, top: 10, bottom: 10 }}>
              <XAxis type="number" domain={[0, Math.max(goal * 1.05, achieved * 1.2)]} tickFormatter={(v) => `$${Math.round(v/1000)}k`} hide />
              <YAxis dataKey="name" type="category" width={50} />
              {/* Rangos de performance como fondo */}
              {/* AVISO: Rango estático para fines visuales con datos de ejemplo */}
              <Bar dataKey="goal" barSize={26} fill="#e5e7eb" radius={6} />
              <Bar dataKey="achieved" barSize={16} fill="#34d399" radius={6} />
              <Tooltip formatter={(v: number, name) => name === "goal" ? [ `$${v.toLocaleString()}`, "Meta" ] : [ `$${v.toLocaleString()}`, "Alcanzado" ]} />
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        </ChartCard>
      </ReportsSection>

      <ReportsSection title="Mis productos destacados" description={`Top ${period === 'month' ? 'mensual' : 'anual'} con unidades, ingreso/costo y margen`}>
        <ChartCard title={`Top ${period === 'month' ? 'del mes' : 'del año'}: Ingreso vs Costo y margen %`} subtitle="Barras apiladas ingreso/costo y línea de margen">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={buildSellerTopProducts(period).map(p => { const ingreso = p.unidades * p.precioVenta; const costoTotal = p.unidades * p.precioCosto; const margen = ingreso - costoTotal; const margenPct = ingreso ? Math.round((margen/ingreso)*100) : 0; return { ...p, ingreso, costoTotal, margen, margenPct }; })} margin={{ left: 8, right: 16, top: 10, bottom: 20 }}>
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
            <BarChart data={[...buildSellerTopProducts(period)].sort((a, b) => b.unidades - a.unidades)} margin={{ left: 8, right: 8, top: 10, bottom: 20 }}>
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
