"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllInventory, searchInventory, getCategories, formatCLP, type InventoryItem } from "../model/inventory";
import { Toast } from "@/shared/ui/Toast";
import { downloadFileFromResponse } from "@/lib/download";
import { FiDownload } from "react-icons/fi";
import type { Database } from "@/lib/supabase";
import { useAuth } from "@/features/auth/model/useAuth";

type Category = Database['public']['Tables']['categorias_productos']['Row'];

function cx(...c: (string|false|undefined)[]) { return c.filter(Boolean).join(" "); }

// Status colors using project theme variables
const statusChip: Record<string, string> = {
  "in-stock": "badge-green",
  "low": "badge-yellow",
  "out": "badge-red",
};

export default function StockPage() {
  const { user } = useAuth();
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [sortBy, setSortBy] = useState<"status"|"quantity"|"name">("status");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [inventoryData, categoriesData] = await Promise.all([
          getAllInventory(),
          getCategories()
        ]);
        setData(inventoryData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading inventory:', error);
        Toast.error('Error al cargar el inventario');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle search
  useEffect(() => {
    const searchData = async () => {
      if (!q.trim()) {
        const inventoryData = await getAllInventory();
        setData(inventoryData);
        return;
      }
      try {
        const searchResults = await searchInventory(q);
        setData(searchResults);
      } catch (error) {
        console.error('Error searching:', error);
        Toast.error('Error en la búsqueda');
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [q]);

  const items = useMemo(() => {
    let out = data;
    if (cat !== "todas") {
      const categoryNames = categories.find(c => c.id === parseInt(cat))?.nombre;
      if (categoryNames) {
        out = out.filter(i => i.categorias.some(cat => cat.nombre === categoryNames));
      }
    }
    if (q) {
      const s = q.toLowerCase();
      out = out.filter(i => i.nombre.toLowerCase().includes(s) || (i.sku && i.sku.toLowerCase().includes(s)));
    }
    if (onlyAlerts) out = out.filter(i => i.status !== "in-stock");

    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      if (sortBy === "status") {
        const order = { "out": 0, "low": 1, "in-stock": 2 };
        return (order[a.status] - order[b.status]) * dir;
      }
      if (sortBy === "quantity") return (a.total_stock - b.total_stock) * dir;
      return a.nombre.localeCompare(b.nombre) * dir;
    });
    return out;
  }, [q, cat, onlyAlerts, sortBy, sortDir, data, categories]);

  // Pagination logic
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [q, cat, onlyAlerts, sortBy, sortDir]);

  const totals = useMemo(() => {
    const currentValue = items.reduce((acc, i) => acc + i.total_stock * (i.precio_compra || 0), 0);
    const potentialRevenue = items.reduce((acc, i) => acc + i.total_stock * (i.precio_venta_neto || 0), 0);
    const margin = potentialRevenue - currentValue;
    return { currentValue, potentialRevenue, margin };
  }, [items]);

  const handleExport = async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        Toast.error('Usuario no identificado');
        return;
      }

      const response = await fetch(`/api/downloads/stock?userId=${userId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Descargar el archivo
      const filename = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
      await downloadFileFromResponse(response, filename);

      Toast.success('Archivo Excel descargado exitosamente');
    } catch (error) {
      console.error("Error al exportar:", error);
      Toast.error("Error al exportar el inventario");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl mb-1">Inventario</h1>
          <p className="text-theme-secondary text-sm">Gestión de productos y stock</p>
        </div>
        <button
          className="btn-secondary text-sm px-4 py-2"
          onClick={handleExport}
        >
          <FiDownload className="inline mr-2" />
          Exportar Excel
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl p-4 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="form-label">Buscar producto</label>
            <div className="relative">
              <input
                type="text"
                className="form-input w-full pl-10"
                placeholder="Buscar por nombre o SKU..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted"></span>
            </div>
          </div>
          <div className="sm:w-48">
            <label className="form-label">Categoría</label>
            <select
              className="form-input w-full"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-theme-secondary">
              <input
                type="checkbox"
                checked={onlyAlerts}
                onChange={(e) => setOnlyAlerts(e.target.checked)}
                className="rounded border-theme-border"
              />
              Solo alertas
            </label>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI
          label="Valor actual (costo)"
          value={formatCLP(totals.currentValue)}
          tone="slate"
        />
        <KPI
          label="Ingreso potencial (venta)"
          value={formatCLP(totals.potentialRevenue)}
          tone="emerald"
        />
        <KPI
          label="Utilidad potencial"
          value={formatCLP(totals.margin)}
          tone="amber"
        />
      </div>

      {/* Sort Controls */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-4"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-theme-secondary">Ordenar por:</span>
          <select
            className="form-input text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name"|"status"|"quantity")}
          >
            <option value="name">Nombre</option>
            <option value="status">Estado</option>
            <option value="quantity">Cantidad</option>
          </select>
          <button
            className="btn-secondary text-sm px-3 py-1.5"
            onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          >
            {sortDir === "asc" ? " Asc" : " Desc"}
          </button>
        </div>
        <div className="text-sm text-theme-text-muted">
          {paginatedItems.length} de {items.length} producto{items.length !== 1 ? 's' : ''} (página {currentPage} de {totalPages})
        </div>
      </div>

      {/* Table/Cards */}
      <div
        className="bg-theme-card rounded-xl border border-theme-border shadow-sm overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Mobile Cards */}
        <div className="block sm:hidden">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {paginatedItems.map(item => (
              <div key={item.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-theme-text-primary text-sm">
                      {item.nombre}
                    </h3>
                    <p className="text-xs text-theme-text-secondary mt-1">
                      SKU: {item.sku || 'N/A'}
                    </p>
                    <p className="text-xs text-theme-text-secondary">
                      Categor�a: {item.categorias.map(c => c.nombre).join(', ') || 'Sin categor�a'}
                    </p>
                  </div>
                  <span className={cx(
                    "px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap",
                    statusChip[item.status]
                  )}>
                    {item.status === "in-stock" ? "En stock" :
                     item.status === "low" ? "Bajo" : "Agotado"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <p className="text-xs text-theme-text-secondary">Stock total</p>
                    <p className="font-semibold text-theme-text-primary">{item.total_stock}</p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <p className="text-xs text-theme-text-secondary">Unidad</p>
                    <p className="font-semibold text-theme-text-primary">{item.unidad}</p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <p className="text-xs text-theme-text-secondary">Precio venta</p>
                    <p className="font-semibold text-theme-text-primary">
                      {formatCLP(item.precio_venta_neto)}
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <p className="text-xs text-theme-text-secondary">Costo</p>
                    <p className="font-semibold text-theme-text-primary">
                      {formatCLP(item.precio_compra)}
                    </p>
                  </div>
                </div>

                {/* Stock by warehouse */}
                {item.stock.length > 0 && (
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <p className="text-xs text-theme-text-secondary mb-2">Stock por bodega:</p>
                    <div className="space-y-1">
                      {item.stock.map((s, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-theme-text-secondary">{s.bodega_nombre}:</span>
                          <span className="font-medium text-theme-text-primary">{s.stock_actual}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-8 text-center text-theme-text-muted">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-theme-bg-secondary">
              <tr>
                <th className="p-4 text-left font-semibold text-theme-text-primary">Producto</th>
                <th className="p-4 text-left font-semibold text-theme-text-primary">SKU</th>
                <th className="p-4 text-left font-semibold text-theme-text-primary">Categoría</th>
                <th className="p-4 text-center font-semibold text-theme-text-primary">Estado</th>
                <th className="p-4 text-center font-semibold text-theme-text-primary">Stock Total</th>
                <th className="p-4 text-center font-semibold text-theme-text-primary">Unidad</th>
                <th className="p-4 text-center font-semibold text-theme-text-primary">Costo</th>
                <th className="p-4 text-center font-semibold text-theme-text-primary">Precio Venta</th>
                <th className="p-4 text-center font-semibold text-theme-text-primary">Valorización</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {paginatedItems.map(item => (
                <tr
                  key={item.id}
                  className="hover:bg-theme-bg-secondary transition-colors"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <td className="p-4 font-medium text-theme-text-primary">
                    {item.nombre}
                  </td>
                  <td className="p-4 text-theme-text-secondary">
                    {item.sku || 'N/A'}
                  </td>
                  <td className="p-4 text-theme-text-secondary">
                    {item.categorias.map(c => c.nombre).join(', ') || 'Sin categor�a'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={cx(
                      "px-2 py-1 text-xs font-medium rounded-full inline-block",
                      statusChip[item.status]
                    )}>
                      {item.status === "in-stock" ? "En stock" :
                       item.status === "low" ? "Bajo" : "Agotado"}
                    </span>
                  </td>
                  <td className="p-4 text-center font-medium text-theme-text-primary">
                    {item.total_stock}
                  </td>
                  <td className="p-4 text-center text-theme-text-secondary">
                    {item.unidad}
                  </td>
                  <td className="p-4 text-center text-theme-text-primary">
                    {formatCLP(item.precio_compra)}
                  </td>
                  <td className="p-4 text-center text-theme-text-primary">
                    {formatCLP(item.precio_venta_neto)}
                  </td>
                  <td className="p-4 text-center text-theme-text-primary">
                    {formatCLP(item.total_stock * (item.precio_compra || 0))}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-theme-text-muted">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
          <div className="text-sm text-theme-text-muted">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, items.length)} de {items.length} productos
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    className={cx(
                      "px-3 py-1.5 text-sm rounded",
                      pageNum === currentPage
                        ? "bg-theme-accent-primary text-white"
                        : "btn-secondary"
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: "slate"|"emerald"|"amber" }) {
  const tones = {
    slate: {
      bg: "var(--neutral-bg)",
      text: "var(--neutral-text)",
      border: "var(--border)"
    },
    emerald: {
      bg: "var(--success-bg)",
      text: "var(--success-text)",
      border: "var(--success)"
    },
    amber: {
      bg: "var(--warning-bg)",
      text: "var(--warning-text)",
      border: "var(--warning)"
    },
  };

  return (
    <div
      className="rounded-xl border p-4 sm:p-5"
      style={{
        backgroundColor: tones[tone].bg,
        borderColor: tones[tone].border,
        color: tones[tone].text
      }}
    >
      <div className="text-sm opacity-80 mb-1">{label}</div>
      <div className="font-bold text-xl sm:text-2xl">{value}</div>
    </div>
  );
}
