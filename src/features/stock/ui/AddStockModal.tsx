"use client";

import { useMemo, useRef, useState } from "react";
import { FullscreenModal } from "@/shared/ui/FullscreenModal";
import { BRAND } from "@/shared/ui/brand";
import type { InventoryItem } from "../model/inventory";
import { Toast } from "@/shared/ui/Toast";

type Line = {
  productId: string;
  qty: number; // cantidad a ingresar
  packSize: number; // tamaño de pack
  unitCost: number; // costo unitario de compra
  unitPrice?: number; // precio unitario de venta 
};

type NewProduct = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  packSize: number;
  price: number;
  cost: number;
};

function formatCLP(n: number) { return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n); }

export function AddStockModal({ open, onClose, items, onConfirm }: { open: boolean; onClose: ()=>void; items: InventoryItem[]; onConfirm: (payload: { date: string; warehouse: string; vendor: string; docNumber: string; lines: Line[]; newProducts: NewProduct[]; }) => void; }) {
  // Datos del encabezado del documento de ingreso
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [warehouse, setWarehouse] = useState("Bodega principal");
  const [vendor, setVendor] = useState("");
  const [docNumber, setDocNumber] = useState("");

  // Líneas de productos
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<{ code: string; name: string; category: string; packSize: number; price: number; cost: number; intakeQty: number; }>(
    { code: "", name: "", category: "", packSize: 1, price: 0, cost: 0, intakeQty: 1 }
  );
  const [newProducts, setNewProducts] = useState<NewProduct[]>([]);
  const categoryOptions = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);
  const [catFocus, setCatFocus] = useState(false);

  const products = useMemo(() => {
    const s = search.toLowerCase();
    return items.filter(p => !s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
  }, [search, items]);

  const totals = useMemo(() => {
    const items = lines.length;
    const units = lines.reduce((a,l)=>a + l.qty, 0);
    const cost = lines.reduce((a,l)=>a + l.qty * l.unitCost, 0);
    return { items, units, cost };
  }, [lines]);

  const detailRef = useRef<HTMLDivElement | null>(null);

  const addLine = (productId: string, defaultPack: number, defaultCost: number, defaultPrice?: number) => {
    setLines(prev => [...prev, { productId, qty: defaultPack, packSize: defaultPack, unitCost: defaultCost, unitPrice: defaultPrice }]);
  };
  const updateLine = (idx: number, patch: Partial<Line>) => setLines(prev => prev.map((l,i)=> i===idx ? { ...l, ...patch } : l));
  const removeLine = (idx: number) => setLines(prev => prev.filter((_,i)=>i!==idx));

  const submit = () => {
    if (!lines.length) return Toast.warning("Agrega al menos un producto");
    onConfirm({ date, warehouse, vendor, docNumber, lines, newProducts });
  };

  return (
    <FullscreenModal open={open} onClose={onClose} title={<div className="flex items-center gap-2"><span className={`text-lg font-semibold ${BRAND.accentText}`}>Nuevo ingreso de stock</span></div>}>
  <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
        {/* Encabezado */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="form-label">Fecha de emisión</label>
              <input type="date" className="form-input" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Bodega</label>
              <select className="form-input" value={warehouse} onChange={e=>setWarehouse(e.target.value)}>
                <option>Bodega principal</option>
                <option>Bodega secundaria</option>
              </select>
            </div>
            <div>
              <label className="form-label">Proveedor</label>
              <input className="form-input" placeholder="Nombre proveedor" value={vendor} onChange={e=>setVendor(e.target.value)} />
            </div>
            <div>
              <label className="form-label">N° documento</label>
              <input className="form-input" placeholder="Factura/Guía" value={docNumber} onChange={e=>setDocNumber(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Buscador y listado productos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          <div className="order-2 lg:order-1 lg:col-span-5 xl:col-span-5 bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2">
                <input className="form-input h-11 flex-1" placeholder="Buscar producto por código o nombre" value={search} onChange={e=>setSearch(e.target.value)} />
                <button className={`btn-secondary text-xs shrink-0 ${addingNew ? 'ring-2 ring-orange-300' : ''}`} onClick={()=>setAddingNew(v=>!v)}>
                  {addingNew ? 'Cancelar nuevo' : 'Producto nuevo'}
                </button>
              </div>
              {addingNew && (
                <div className="grid sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="form-label">Código / SKU</label>
                    <input className="form-input h-11" placeholder="Ej: IT-ABC-123" value={newItem.code} onChange={e=>setNewItem({...newItem, code: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Nombre del producto</label>
                    <input className="form-input h-11" placeholder="Ej: Adhesivo 300 Café" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})} />
                  </div>
                  <div className="relative">
                    <label className="form-label">Categoría</label>
                    <input className="form-input h-11" placeholder="Escribe o selecciona" value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})} onFocus={()=>setCatFocus(true)} onBlur={()=>setTimeout(()=>setCatFocus(false), 150)} />
                    {catFocus && (
                      <div className="absolute z-10 mt-1 w-full max-h-40 overflow-auto bg-white border border-slate-200 rounded-lg shadow">
                        {categoryOptions.filter(c => !newItem.category || c.toLowerCase().includes(newItem.category.toLowerCase())).map(c => (
                          <button key={c} type="button" className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-sm" onClick={()=>setNewItem({...newItem, category: c})}>{c}</button>
                        ))}
                        {categoryOptions.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">Sin categorías</div>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-28">
                      <label className="form-label">Pack (tamaño)</label>
                      <input type="number" className="form-input h-11" placeholder="1" value={newItem.packSize} min={1} onChange={e=>setNewItem({...newItem, packSize: Number(e.target.value)})} />
                    </div>
                    <div className="flex-1">
                      <label className="form-label">Cantidad (total a ingresar)</label>
                      <input type="number" className="form-input h-11" placeholder="Unidades totales" min={1} value={newItem.intakeQty} onChange={e=>setNewItem({...newItem, intakeQty: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Precio compra (unitario)</label>
                    <input type="number" className="form-input h-11" placeholder="0" value={newItem.cost} min={0} onChange={e=>setNewItem({...newItem, cost: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="form-label">Precio venta (unitario)</label>
                    <input type="number" className="form-input h-11" placeholder="0" value={newItem.price} min={0} onChange={e=>setNewItem({...newItem, price: Number(e.target.value)})} />
                  </div>
          <div className="sm:col-span-2 flex justify-end">
                    <button className="btn-primary text-sm" onClick={() => {
                      if (!newItem.code || !newItem.name) return Toast.warning('Completa código y nombre');
                      if (newItem.packSize < 1) return Toast.warning('Pack debe ser al menos 1');
            const id = `NEW-${Date.now()}`;
            // Guardar el nuevo producto localmente y crear una línea de ingreso
                      const n: NewProduct = { id, code: newItem.code, name: newItem.name, category: newItem.category || 'Sin categoría', unit: 'un', packSize: newItem.packSize, price: newItem.price, cost: newItem.cost };
            setNewProducts(prev => [...prev, n]);
                      // Crear la línea con la cantidad total indicada
                      setLines(prev => [...prev, { productId: id, qty: Math.max(1, newItem.intakeQty), packSize: newItem.packSize, unitCost: newItem.cost, unitPrice: newItem.price }]);
            Toast.success('Producto nuevo agregado al detalle');
                      setAddingNew(false);
                    }}>Agregar al detalle</button>
                  </div>
                </div>
              )}
            </div>
            <div className="max-h-80 overflow-auto divide-y divide-gray-100">
              {products.map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500">SKU: {p.code}</div>
                  </div>
                  <button className="btn-secondary text-xs h-9" onClick={()=>{ addLine(p.id, p.packSize ?? 1, p.cost, p.price); detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}>
                    Agregar
                  </button>
                </div>
              ))}
              {products.length === 0 && <div className="py-6 text-center text-slate-500 text-sm">Sin resultados</div>}
            </div>
          </div>

          {/* Líneas seleccionadas */}
          <div ref={detailRef} className="order-1 lg:order-2 lg:col-span-7 xl:col-span-7 bg-white rounded-xl border border-gray-100 p-4 sm:p-5 max-h-[55vh] lg:max-h-[65vh] overflow-auto">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-white z-10 pb-2">
              <h4 className="font-semibold">Detalle del ingreso</h4>
              <div className="text-sm text-slate-600">Items: <span className="font-semibold">{totals.items}</span> • Unidades: <span className="font-semibold">{totals.units}</span> • Costo total: <span className="font-semibold">{formatCLP(totals.cost)}</span></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-3">Producto</th>
                    <th className="p-3 text-right">Cantidad (unidades)</th>
                    <th className="p-3 text-right">Pack (tamaño)</th>
                    <th className="p-3 text-right">Precio compra (unitario)</th>
                    <th className="p-3 text-right">Precio venta (unitario)</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => {
                    const p = items.find(x=>x.id===l.productId)!;
                    return (
                      <tr key={idx} className="border-t">
                        <td className="p-3 min-w-[300px]">
                          <div className="text-sm font-medium text-slate-900">{p?.name}</div>
                          <div className="text-xs text-slate-500">SKU: {p?.code}</div>
                        </td>
                        <td className="p-3 text-right">
                          <input type="number" className="form-input h-10 w-32 text-right" min={0} value={l.qty} onChange={e=>updateLine(idx,{ qty: Number(e.target.value) })} placeholder="un" title="Cantidad (unidades)" />
                        </td>
                        <td className="p-3 text-right">
                          <input type="number" className="form-input h-10 w-32 text-right" min={1} value={l.packSize} onChange={e=>updateLine(idx,{ packSize: Number(e.target.value) })} placeholder="pack" title="Pack (tamaño de presentación)" />
                        </td>
                        <td className="p-3 text-right">
                          <input type="number" className="form-input h-10 w-36 text-right" min={0} value={l.unitCost} onChange={e=>updateLine(idx,{ unitCost: Number(e.target.value) })} placeholder="$" title="Precio compra unitario" />
                        </td>
                        <td className="p-3 text-right">
                          <input type="number" className="form-input h-10 w-36 text-right" min={0} value={l.unitPrice ?? p?.price ?? 0} onChange={e=>updateLine(idx,{ unitPrice: Number(e.target.value) })} placeholder="$" title="Precio venta unitario" />
                        </td>
                        <td className="p-3 text-right font-semibold">{formatCLP(l.qty * l.unitCost)}</td>
                        <td className="p-3">
                          <button className="btn-ghost text-sm" onClick={()=>removeLine(idx)}>Eliminar</button>
                        </td>
                      </tr>
                    );
                  })}
                  {lines.length === 0 && (
                    <tr><td className="p-4 text-center text-slate-500" colSpan={6}>Agrega productos para ingresar stock</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer acciones */}
  <div className="flex items-center justify-between">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <div className="flex items-center gap-3">
            <div className={`text-sm ${BRAND.accentText}`}>Total a ingresar: <span className="font-semibold">{totals.units}</span> un • Costo: <span className="font-semibold">{formatCLP(totals.cost)}</span></div>
            <button className="btn-primary" onClick={submit}>Confirmar ingreso</button>
          </div>
        </div>
      </div>
    </FullscreenModal>
  );
}

export function AddStockTrigger({ onOpen }: { onOpen: ()=>void }) {
  return (
    <button className="btn-primary text-sm" onClick={onOpen}>Agregar Stock</button>
  );
}

export function useAddStockModal() {
  const [open, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);
  return { open, openModal, closeModal };
}