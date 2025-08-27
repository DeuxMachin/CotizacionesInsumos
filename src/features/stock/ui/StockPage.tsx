"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/shared/ui/brand";
import { inventoryMock, type InventoryItem, inferStatus } from "../model/inventory";
import { Toast } from "@/shared/ui/Toast";
import { AddStockModal, useAddStockModal } from "./AddStockModal";

function cx(...c: (string|false|undefined)[]) { return c.filter(Boolean).join(" "); }
function formatCLP(n: number) { return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n); }

// Definir colores para modo claro y oscuro
const statusChip: Record<string, { light: string, dark: string }> = {
  "in-stock": { 
    light: "bg-emerald-100 text-emerald-700", 
    dark: "bg-emerald-900/30 text-emerald-300" 
  },
  "low": { 
    light: "bg-amber-100 text-amber-700", 
    dark: "bg-amber-900/30 text-amber-300" 
  },
  "out": { 
    light: "bg-rose-100 text-rose-700", 
    dark: "bg-rose-900/30 text-rose-300" 
  },
};

export default function StockPage() {
  const { open, openModal, closeModal } = useAddStockModal();
  const [data, setData] = useState<InventoryItem[]>(inventoryMock);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [sortBy, setSortBy] = useState<"status"|"quantity"|"name">("status");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

  const items = useMemo(() => {
    const withStatus = data.map(i => ({ ...i, status: inferStatus(i) }));
    let out = withStatus;
    if (cat !== "todas") out = out.filter(i => i.category === cat);
    if (q) {
      const s = q.toLowerCase();
      out = out.filter(i => i.name.toLowerCase().includes(s) || i.code.toLowerCase().includes(s));
    }
    if (onlyAlerts) out = out.filter(i => i.status !== "in-stock");
    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a,b) => {
      if (sortBy === "status") {
        // Desc: in-stock (2) > low (1) > out (0)
        const order = { "out":0, "low":1, "in-stock":2 } as const;
        return (order[a.status!] - order[b.status!]) * dir;
      }
      if (sortBy === "quantity") return (a.stock - b.stock) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return out;
  }, [q, cat, onlyAlerts, sortBy, sortDir, data]);

  const categories = useMemo(() => Array.from(new Set(data.map(i => i.category))), [data]);

  const totals = useMemo(() => {
    const currentValue = items.reduce((acc, i) => acc + i.stock * i.cost, 0);
    const potentialRevenue = items.reduce((acc, i) => acc + i.stock * i.price, 0);
    const margin = potentialRevenue - currentValue;
    return { currentValue, potentialRevenue, margin };
  }, [items]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <AddStockModal open={open} onClose={closeModal} items={data} onConfirm={({ lines, newProducts }) => {
        setData(prev => {
          // Insertar productos nuevos
          const inserted = [
            ...prev,
            ...newProducts.map(np => ({
              id: np.id,
              code: np.code,
              name: np.name,
              category: np.category,
              unit: np.unit,
              stock: 0,
              packSize: np.packSize,
              price: np.price,
              cost: np.cost,
              updatedAt: new Date().toISOString(),
            }))
          ];
          // Sumar cantidades al stock
          const updated = inserted.map(it => {
            const l = lines.find(li => li.productId === it.id);
            if (!l) return it;
            return { ...it, stock: it.stock + l.qty, packSize: l.packSize || it.packSize, cost: l.unitCost || it.cost, price: l.unitPrice ?? it.price, updatedAt: new Date().toISOString() };
          });
          return updated;
        });
        Toast.success("Stock actualizado");
        closeModal();
      }} />
      {/* Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-1">
          <select className="form-input w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="todas">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative flex-1">
            <input className="form-input pr-10 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="Buscar por código o nombre" value={q} onChange={e=>setQ(e.target.value)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">🔎</span>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
            <input type="checkbox" checked={onlyAlerts} onChange={e=>setOnlyAlerts(e.target.checked)} />
            Solo alertas
          </label>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary text-sm" onClick={openModal}>Agregar stock</button>
          <button className="btn-secondary text-sm" onClick={()=>Toast.info("Exportar inventario pronto")}>Exportar</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPI label="Valor actual (costo)" value={formatCLP(totals.currentValue)} tone="slate" />
        <KPI label="Ingreso potencial (venta)" value={formatCLP(totals.potentialRevenue)} tone="emerald" />
        <KPI label="Utilidad potencial" value={formatCLP(totals.margin)} tone="amber" />
      </div>

      {/* Ordenar por - visible en todos los tamaños */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 px-3 py-2 flex items-center justify-end gap-2 flex-wrap w-full">
        <span className="text-xs text-slate-600 dark:text-gray-400">Ordenar por</span>
        <select className="form-input h-10 w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" value={sortBy} onChange={e=>setSortBy(e.target.value as "name"|"status"|"quantity")}>
          <option value="name">Nombre</option>
          <option value="status">Estado</option>
          <option value="quantity">Cantidad</option>
        </select>
        <button className="btn-secondary h-8 text-xs" onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")}>
          {sortDir === "asc" ? "Asc" : "Desc"}
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow overflow-hidden">
        {/* Mobile cards */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(i => (
              <div key={i.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{i.name}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">SKU: {i.code}</div>
                  </div>
                  <span className={cx("px-2 py-0.5 text-xs font-semibold rounded-2xl", statusChip[i.status!].light, "dark:"+statusChip[i.status!].dark)}>
                    {
                    i.status === "in-stock" ? "En stock" : i.status === "low" ? "Bajo" : "Agotado"
                  }</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">Cantidad<InfoButton text="Cantidad de producto disponible en bodega." /></div>
                    <div className="font-semibold dark:text-white">{i.stock}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">Pack<InfoButton text="Tamaño de pack o presentación (ej: 6, 12, 24, 36)." /></div>
                    <div className="font-semibold dark:text-white">{i.packSize}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">Precio<InfoButton text="Precio unitario de venta." /></div>
                    <div className="font-semibold dark:text-white">{formatCLP(i.price)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">Costo<InfoButton text="Costo unitario de compra del producto." /></div>
                    <div className="font-semibold dark:text-white">{formatCLP(i.cost)}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-2 col-span-2">
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400">Valorización<InfoButton text="Valor total del stock actual según costo." /></div>
                    <div className="font-semibold dark:text-white">{formatCLP(i.stock * i.cost)}</div>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="p-6 text-center text-slate-500 dark:text-gray-400 text-sm">Sin resultados</div>}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-gray-700 text-center">
                <th className="p-3 text-center dark:text-gray-200">Producto</th>
                <th className="p-3 text-center dark:text-gray-200">SKU</th>
                <th className="p-3 text-center dark:text-gray-200">Estado</th>
                <th className="p-3 text-center dark:text-gray-200">Cantidad <InfoButton text="Cantidad de producto disponible en bodega." /></th>
                <th className="p-3 text-center dark:text-gray-200">Pack <InfoButton text="Tamaño de pack o presentación (ej: 6, 12, 24, 36)." /></th>
                <th className="p-3 text-center dark:text-gray-200">Costo <InfoButton text="Costo unitario de compra del producto." /></th>
                <th className="p-3 text-center dark:text-gray-200">Precio <InfoButton text="Precio unitario de venta." /></th>
                <th className="p-3 text-center dark:text-gray-200">Valorización <InfoButton text="Valor total del stock actual según costo." /></th>
                <th className="p-3 text-center dark:text-gray-200">Ingreso potencial <InfoButton text="Ingreso total si se vende todo el stock al precio actual." /></th>
                <th className="p-3 text-center dark:text-gray-200">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 text-center">
                  <td className="p-3 font-medium text-center dark:text-gray-200">{i.name}</td>
                  <td className="p-3 text-center dark:text-gray-200">{i.code}</td>
                  <td className="p-3 text-center"><span className={cx("px-2 py-0.5 text-xs font-semibold rounded-2xl", statusChip[i.status!].light, "dark:"+statusChip[i.status!].dark)}>{ i.status === "in-stock" ? "En stock" : i.status === "low" ? "Bajo" : "Agotado" }</span></td>
                  <td className="p-3 text-center dark:text-gray-200">{i.stock}</td>
                  <td className="p-3 text-center dark:text-gray-200">{i.packSize}</td>
                  <td className="p-3 text-center dark:text-gray-200">{formatCLP(i.cost)}</td>
                  <td className="p-3 text-center dark:text-gray-200">{formatCLP(i.price)}</td>
                  <td className="p-3 text-center dark:text-gray-200">{formatCLP(i.stock * i.cost)}</td>
                  <td className="p-3 text-center dark:text-gray-200">{formatCLP(i.stock * i.price)}</td>
                  <td className="p-3 text-center dark:text-gray-200">{new Date(i.updatedAt).toLocaleDateString("es-CL")}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="p-6 text-center text-slate-500 dark:text-gray-400 text-sm" colSpan={10}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: "slate"|"emerald"|"amber" }) {
  const tones: Record<string,{light: string, dark: string}> = {
    slate: {
      light: "bg-slate-50 text-slate-800",
      dark: "dark:bg-slate-800/50 dark:text-slate-200"
    },
    emerald: {
      light: "bg-emerald-50 text-emerald-800",
      dark: "dark:bg-emerald-900/20 dark:text-emerald-200"
    },
    amber: {
      light: "bg-amber-50 text-amber-800",
      dark: "dark:bg-amber-900/20 dark:text-amber-200"
    },
  };
  return (
    <div className={cx("rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4", tones[tone].light, tones[tone].dark)}>
      <div className="text-xs text-slate-500 dark:text-gray-400">{label}</div>
      <div className="font-semibold text-base sm:text-lg">{value}</div>
    </div>
  );
}

function InfoButton({ text }: { text: string }) {
  return (
    <span className="relative group inline-block align-middle">
      <button className="ml-1 text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 focus:outline-none" tabIndex={0}>ⓘ</button>
      <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:block group-focus:block min-w-[180px] bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/50 rounded-lg shadow-lg p-2 text-xs text-slate-700 dark:text-gray-300">
        {text}
      </div>
    </span>
  );
}
