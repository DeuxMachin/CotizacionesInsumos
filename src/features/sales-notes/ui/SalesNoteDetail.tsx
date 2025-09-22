"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPackage, FiUser, FiMapPin,  FiPlus, FiSave, FiCheck, FiPercent, FiTrash2 } from 'react-icons/fi';
import { NotasVentaService, SalesNoteRecord, SalesNoteItemRow } from '@/services/notasVentaService';
import { supabase } from '@/lib/supabase';

interface SalesNoteDetailProps {
  id: number;
}

interface NewItemDraft {
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario_neto: number;
  descuento_pct: number;
}

export const SalesNoteDetail: React.FC<SalesNoteDetailProps> = ({ id }) => {
  const router = useRouter();
  const [nota, setNota] = useState<SalesNoteRecord | null>(null);
  const [items, setItems] = useState<SalesNoteItemRow[]>([]);
  const [cxcDocumentos, setCxcDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newItem, setNewItem] = useState<NewItemDraft>({ descripcion: '', unidad: 'Unidad', cantidad: 1, precio_unitario_neto: 0, descuento_pct: 0 });

  useEffect(() => {
    (async () => {
      try {
        const data = await NotasVentaService.getById(id);
        const its = await NotasVentaService.getItems(id);
        setNota(data); setItems(its);

        // Fetch CxC documents for this sales note
        const { data: cxcData, error: cxcError } = await supabase
          .from('cxc_documentos')
          .select('*')
          .eq('nota_venta_id', id);

        if (!cxcError) {
          setCxcDocumentos(cxcData || []);
        }
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error cargando nota de venta'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const formatMoney = (n: number) => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n||0);

  const recalcTotals = (base: SalesNoteRecord, lineItems: SalesNoteItemRow[]) => {
    const subtotal = lineItems.reduce((s,it)=> s + (it.cantidad * it.precio_unitario_neto),0);
    const descLineas = lineItems.reduce((s,it)=> s + (it.descuento_monto || 0),0);
    const descGlobal = base.descuento_global_monto || 0;
    const descuento_total = descLineas + descGlobal;
    const subtotal_neto_post_desc = subtotal - descuento_total;
    const iva_pct = base.iva_pct || 19;
    const iva_monto = Math.round(subtotal_neto_post_desc * iva_pct / 100);
    const total = subtotal_neto_post_desc + iva_monto;
    return { subtotal, descuento_lineas_monto: descLineas, descuento_total, subtotal_neto_post_desc, iva_monto, total };
  };

  const handleAddItem = async () => {
    if (!nota || !newItem.descripcion) return;
    setAdding(true); setError(null);
    try {
      const bruto = newItem.cantidad * newItem.precio_unitario_neto;
      const descuento_monto = Math.round(bruto * (newItem.descuento_pct/100));
      const subtotal_neto = bruto - descuento_monto;
      const inserted = await NotasVentaService.addItem(nota.id, {
        descripcion: newItem.descripcion,
        unidad: newItem.unidad,
        cantidad: newItem.cantidad,
        precio_unitario_neto: newItem.precio_unitario_neto,
        descuento_pct: newItem.descuento_pct,
        descuento_monto,
        subtotal_neto,
        total_neto: subtotal_neto
      });
      const updatedItems = [...items, inserted];
      setItems(updatedItems);
      const patch = recalcTotals(nota, updatedItems);
      const updatedNota = await NotasVentaService.update(nota.id, { ...patch });
      setNota(updatedNota);
      setNewItem({ descripcion:'', unidad:'Unidad', cantidad:1, precio_unitario_neto:0, descuento_pct:0 });
  } catch(e: unknown){ setError(e instanceof Error ? e.message : 'Error agregando ítem'); }
    finally { setAdding(false); }
  };

  const handleSaveConditions = async () => {
    if (!nota) return; setSaving(true); setError(null);
    try {
      const patch = recalcTotals(nota, items);
      const saved = await NotasVentaService.update(nota.id, { ...patch, forma_pago_final: nota.forma_pago_final, descuento_global_monto: nota.descuento_global_monto });
      setNota(saved);
    } catch(e: unknown){ setError(e instanceof Error ? e.message : 'Error guardando'); }
    finally { setSaving(false); }
  };

  const handleConfirm = async () => {
    if (!nota) return; if(!confirm('¿Confirmar Nota de Venta?')) return;
    setConfirming(true); setError(null);
  try { const updated = await NotasVentaService.confirm(nota.id); setNota(updated); }
  catch(e: unknown){ setError(e instanceof Error ? e.message : 'Error confirmando'); }
    finally { setConfirming(false); }
  };

  const handleDelete = async () => {
    if (!nota) return;
    if (!confirm('¿Eliminar DEFINITIVAMENTE esta Nota de Venta y sus ítems?')) return;
    setDeleting(true); setError(null);
    try {
      await NotasVentaService.deleteById(nota.id);
      // Opcional: si quieres también eliminar la cotización origen (si existe y la regla de negocio lo exige)
      // Redirigir a listado de cotizaciones o futura lista de notas de venta
      router.push('/dashboard/cotizaciones');
  } catch(e: unknown){ setError(e instanceof Error ? e.message : 'Error eliminando nota de venta'); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!nota) return <div className="p-10 text-center">No encontrada</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header replicado estilo cotización */}
      <div className="p-4 sm:p-6 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border)'}}>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <button onClick={()=>router.push('/dashboard/cotizaciones')} className="p-2 rounded-lg" style={{backgroundColor:'var(--bg-secondary)', color:'var(--text-secondary)', border:'1px solid var(--border)'}}>
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 sm:p-3 rounded-lg" style={{backgroundColor:'var(--accent-bg)', color:'var(--accent-text)'}}>
            <FiPackage className="w-5 sm:w-6 h-5 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{color:'var(--text-primary)'}}>Nota de Venta {nota.folio || `#${nota.id}`}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-3 py-1 text-xs sm:text-sm rounded-full font-medium" style={{background:'var(--accent-soft)', color:'var(--accent-text)'}}>{nota.estado}</span>
              {cxcDocumentos.length > 0 && (
                <span className={`px-3 py-1 text-xs sm:text-sm rounded-full font-medium ${
                  cxcDocumentos[0].estado === 'pagado' ? 'bg-green-100 text-green-800' :
                  cxcDocumentos[0].estado === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {cxcDocumentos[0].estado === 'pagado' ? 'Pagado' :
                   cxcDocumentos[0].estado === 'parcial' ? 'Pago Parcial' :
                   'Pendiente'}
                </span>
              )}
              {nota.cotizacion_id && <span className="text-xs sm:text-sm" style={{color:'var(--text-secondary)'}}>Origen Cotización ID {nota.cotizacion_id}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nota.estado === 'borrador' && (
            <button onClick={handleConfirm} disabled={confirming} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm" style={confirming?{opacity:.7}:{}}>
              <FiCheck className="w-4 h-4" /> Confirmar
            </button>
          )}
          <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg" style={{background:'var(--danger-bg)', color:'var(--danger-text)', opacity: deleting? .7:1}}>
            <FiTrash2 className="w-4 h-4" /> {deleting? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Cliente (snapshot) */}
            <div className="rounded-lg p-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border)'}}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{color:'var(--text-primary)'}}>
                <FiUser className="w-5 h-5" style={{color:'var(--accent-primary)'}} /> Información del Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-medium" style={{color:'var(--text-secondary)'}}>Razón Social</label>
                  <p className="mt-1 font-medium" style={{color:'var(--text-primary)'}}>{nota.cliente_razon_social || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{color:'var(--text-secondary)'}}>RUT</label>
                  <p className="mt-1" style={{color:'var(--text-primary)'}}>{nota.cliente_rut || 'No especificado'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium flex items-center gap-1" style={{color:'var(--text-secondary)'}}><FiMapPin className="w-3 h-3" /> Dirección</label>
                  <p className="mt-1" style={{color:'var(--text-primary)'}}>{nota.cliente_direccion || 'No especificada'}</p>
                </div>
              </div>
            </div>

          {/* Items */}
          <div className="rounded-lg p-4 sm:p-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border)'}}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{color:'var(--text-primary)'}}>
              <FiPackage className="w-5 h-5" style={{color:'var(--accent-primary)'}} /> Productos ({items.length})
            </h3>
            {nota.estado==='borrador' && (
              <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-6 text-xs md:text-sm">
                <input placeholder="Descripción" value={newItem.descripcion} onChange={e=>setNewItem({...newItem, descripcion:e.target.value})} className="px-2 py-1 rounded border col-span-2 md:col-span-2" style={{borderColor:'var(--border)'}} />
                <input placeholder="Unidad" value={newItem.unidad} onChange={e=>setNewItem({...newItem, unidad:e.target.value})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <input type="number" min={1} value={newItem.cantidad} onChange={e=>setNewItem({...newItem, cantidad: parseFloat(e.target.value)||1})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <input type="number" min={0} value={newItem.precio_unitario_neto} onChange={e=>setNewItem({...newItem, precio_unitario_neto: parseFloat(e.target.value)||0})} className="px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
                <div className="flex items-center gap-1">
                  <FiPercent className="w-4 h-4 text-xs" />
                  <input type="number" min={0} max={100} value={newItem.descuento_pct} onChange={e=>setNewItem({...newItem, descuento_pct: parseFloat(e.target.value)||0})} className="px-2 py-1 rounded border w-full" style={{borderColor:'var(--border)'}} />
                </div>
                <button onClick={handleAddItem} disabled={adding || !newItem.descripcion} className="btn-primary col-span-2 md:col-span-1 flex items-center gap-2 justify-center text-xs md:text-sm" style={adding?{opacity:.7}:{}}>
                  <FiPlus className="w-4 h-4" /> {adding?'...':'Agregar'}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{borderColor:'var(--border)'}}>
                    <th className="text-left py-2">Descripción</th>
                    <th className="text-right py-2">Unidad</th>
                    <th className="text-right py-2">Cant</th>
                    <th className="text-right py-2 hidden md:table-cell">P.Unit</th>
                    <th className="text-right py-2 hidden md:table-cell">Desc</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it,i)=> (
                    <tr key={it.id||i} className="border-b last:border-0" style={{borderColor:'var(--border)'}}>
                      <td className="py-2">
                        <span className="font-medium" style={{color:'var(--text-primary)'}}>{it.descripcion}</span>
                        <span className="block md:hidden text-xs mt-1" style={{color:'var(--text-secondary)'}}>
                          {formatMoney(it.precio_unitario_neto)} {it.descuento_pct?`| -${it.descuento_pct}%`:''}
                        </span>
                      </td>
                      <td className="py-2 text-right text-xs md:text-sm" style={{color:'var(--text-secondary)'}}>{it.unidad}</td>
                      <td className="py-2 text-right" style={{color:'var(--text-primary)'}}>{it.cantidad}</td>
                      <td className="py-2 text-right hidden md:table-cell" style={{color:'var(--text-secondary)'}}>{formatMoney(it.precio_unitario_neto)}</td>
                      <td className="py-2 text-right hidden md:table-cell" style={{color: it.descuento_pct? 'var(--success-text)': 'var(--text-muted)'}}>{it.descuento_pct? it.descuento_pct+'%':'-'}</td>
                      <td className="py-2 text-right font-medium" style={{color:'var(--text-primary)'}}>{formatMoney(it.subtotal_neto)}</td>
                    </tr>
                  ))}
                  {items.length===0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-sm" style={{color:'var(--text-secondary)'}}>Sin productos aún</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Despacho y observaciones comerciales opcional futuro */}
        </div>

        {/* Columna derecha - Totales y condiciones */}
        <div className="space-y-6">
          <div className="rounded-lg p-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border)'}}>
            <h3 className="text-lg font-semibold mb-4" style={{color:'var(--text-primary)'}}>Resumen Financiero</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(nota.subtotal)}</span></div>
              {nota.descuento_lineas_monto>0 && <div className="flex justify-between"><span>Desc. Líneas</span><span>-{formatMoney(nota.descuento_lineas_monto)}</span></div>}
              {nota.descuento_global_monto>0 && <div className="flex justify-between"><span>Desc. Global</span><span>-{formatMoney(nota.descuento_global_monto)}</span></div>}
              <div className="flex justify-between"><span>Subtotal Neto</span><span>{formatMoney(nota.subtotal_neto_post_desc)}</span></div>
              <div className="flex justify-between"><span>IVA ({nota.iva_pct}%)</span><span>{formatMoney(nota.iva_monto)}</span></div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t" style={{borderColor:'var(--border)'}}><span>Total</span><span>{formatMoney(nota.total)}</span></div>
            </div>
          </div>
          <div className="rounded-lg p-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border)'}}>
            <h3 className="text-lg font-semibold mb-4" style={{color:'var(--text-primary)'}}>Condiciones</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs mb-1">Forma de Pago</label>
                <input disabled={nota.estado!=='borrador'} value={nota.forma_pago_final||''} onChange={e=>setNota(n=>n?{...n, forma_pago_final:e.target.value}:n)} className="w-full px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
              </div>
              <div>
                <label className="block text-xs mb-1">Descuento Global ($)</label>
                <input type="number" min={0} disabled={nota.estado!=='borrador'} value={nota.descuento_global_monto} onChange={e=>setNota(n=>n?{...n, descuento_global_monto: parseInt(e.target.value)||0}:n)} className="w-full px-2 py-1 rounded border" style={{borderColor:'var(--border)'}} />
              </div>
              {nota.estado==='borrador' && (
                <button onClick={handleSaveConditions} disabled={saving} className="btn-primary w-full flex items-center gap-2 justify-center" style={saving?{opacity:.7}:{}}>
                  <FiSave className="w-4 h-4" /> {saving? 'Guardando...' : 'Guardar Cambios'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
};

export default SalesNoteDetail;
