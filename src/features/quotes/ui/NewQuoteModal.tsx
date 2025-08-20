"use client";
import { useMemo, useState } from "react";
import { FullscreenModal } from "@/shared/ui/FullscreenModal";
import { products as allProducts } from "@/features/quotes/model/products";
import { clients as mockClients, type Client } from "@/features/clients/model/clients";
import { QuoteAmountCalculator } from "@/entities/quote/model/types";

export const NewQuoteModal = {
  Trigger() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button className="btn-primary" onClick={()=>setOpen(true)}>Nueva Cotización</button>
        <NewQuoteModal.Root controlledOpen={open} onClose={()=>setOpen(false)} />
      </>
    );
  },
  Root({ controlledOpen, onClose }: { controlledOpen?: boolean; onClose?: ()=>void }) {
    const [open, setOpen] = useState(false);
    const isOpen = controlledOpen ?? open;
    const close = onClose ?? (()=>setOpen(false));

    // Wizard state
  const [step, setStep] = useState<1|2|3>(1);
  // Cliente y empresa (Chile)
  const [client, setClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string|undefined>();
  const [clientRut, setClientRut] = useState("");
  const [clientRazonSocial, setClientRazonSocial] = useState("");
  const [clientGiro, setClientGiro] = useState("");
  const [clientDireccion, setClientDireccion] = useState("");
  const [clientRegion, setClientRegion] = useState("");
  const [clientCiudad, setClientCiudad] = useState("");
  const [clientComuna, setClientComuna] = useState("");
  const [clientTipoEmpresa, setClientTipoEmpresa] = useState<Client["tipoEmpresa"]>("Ltda.");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
    const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Record<string, number>>({}); // id -> qty

    // Borrador local (guardar y reanudar)
    type Draft = {
      step: 1|2|3;
      client: string; selectedClientId?: string;
      clientRut: string; clientRazonSocial: string; clientGiro: string; clientDireccion: string; clientRegion: string; clientCiudad: string; clientComuna: string; clientTipoEmpresa: Client["tipoEmpresa"]; contactoNombre: string; contactoEmail: string; contactoTelefono: string;
      dueDate: string; notes: string;
      selected: Record<string, number>;
    };
    const DRAFT_KEY = "quote_draft_v1";
    const saveDraft = () => {
      const d: Draft = { step, client, selectedClientId, clientRut, clientRazonSocial, clientGiro, clientDireccion, clientRegion, clientCiudad, clientComuna, clientTipoEmpresa, contactoNombre, contactoEmail, contactoTelefono, dueDate, notes, selected };
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {}
    };
    const loadDraft = () => {
      try {
        const s = localStorage.getItem(DRAFT_KEY);
        if (!s) return false;
        const d: Draft = JSON.parse(s);
  setStep(d.step); setClient(d.client); setSelectedClientId(d.selectedClientId);
        setClientRut(d.clientRut); setClientRazonSocial(d.clientRazonSocial); setClientGiro(d.clientGiro); setClientDireccion(d.clientDireccion);
        setClientRegion(d.clientRegion); setClientCiudad(d.clientCiudad); setClientComuna(d.clientComuna); setClientTipoEmpresa(d.clientTipoEmpresa);
        setContactoNombre(d.contactoNombre); setContactoEmail(d.contactoEmail); setContactoTelefono(d.contactoTelefono);
        setDueDate(d.dueDate); setNotes(d.notes); setSelected(d.selected);
        return true;
      } catch { return false; }
    };
    const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  // Búsqueda directa se aplica dentro de cada categoría; no necesitamos una lista filtrada global.

    const subtotal = useMemo(() => Object.entries(selected).reduce((acc,[id,qty]) => {
      const prod = allProducts.find(p=>p.id===id);
      return acc + (prod ? prod.price * qty : 0);
    }, 0), [selected]);

    const tax = QuoteAmountCalculator.calculateTax(subtotal, 0.19);
    const total = subtotal + tax;

    const updateQty = (id: string, delta: number) => {
      setSelected(prev => {
        const next = { ...prev };
        const q = (next[id] ?? 0) + delta;
        if (q <= 0) delete next[id]; else next[id] = Math.min(q, 999);
        return next;
      });
    };

    const resetAndClose = () => {
  setStep(1); setClient(""); setSelectedClientId(undefined);
      setClientRut(""); setClientRazonSocial(""); setClientGiro(""); setClientDireccion(""); setClientRegion(""); setClientCiudad(""); setClientComuna(""); setClientTipoEmpresa("Ltda.");
      setContactoNombre(""); setContactoEmail(""); setContactoTelefono("");
      setDueDate(new Date().toISOString().split("T")[0]); setNotes(""); setSearch(""); setSelected({});
      clearDraft();
      close();
    };

    return (
      <FullscreenModal open={isOpen} onClose={resetAndClose} title={
        <div className="flex items-center justify-between w-full">
          <span className="text-base sm:text-lg font-semibold truncate">Nueva Cotización</span>
          <div className="flex gap-1 sm:gap-2 ml-2">
            <button className="btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" onClick={saveDraft}>Guardar</button>
            <button className="btn-ghost text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" onClick={loadDraft}>Reanudar</button>
          </div>
        </div>
      }>
        <div className="grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] h-full">
          {/* Left: wizard steps */}
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Stepper */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm overflow-x-auto pb-2">
              {[1,2,3].map(n => (
                <div key={n} className={`inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${step===n? 'text-orange-600 font-semibold':'text-gray-500'}`}>
                  <span className={`h-5 w-5 sm:h-6 sm:w-6 inline-flex items-center justify-center rounded-full border text-xs ${step===n? 'border-orange-500 bg-orange-50':'border-gray-300'}`}>{n}</span>
                  {n===1? 'Datos': n===2? 'Productos':'Términos'}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="form-label">Cliente existente (opcional)</label>
                  <div className="flex items-stretch gap-2">
                    <select className="form-input flex-1" value={selectedClientId ?? ""} onChange={(e)=>{
                      const id = e.target.value || undefined; setSelectedClientId(id);
                      if (id) {
                        const c = mockClients.find(x=>x.id===id)!;
                        setClient(c.razonSocial);
                        setClientRut(c.rut); setClientRazonSocial(c.razonSocial); setClientGiro(c.giro);
                        setClientDireccion(c.direccion); setClientRegion(c.region); setClientCiudad(c.ciudad); setClientComuna(c.comuna);
                        setClientTipoEmpresa(c.tipoEmpresa); setContactoNombre(c.contactoNombre); setContactoEmail(c.contactoEmail); setContactoTelefono(c.contactoTelefono);
                      }
                    }}>
                      <option value="">Seleccionar cliente...</option>
                      {mockClients.map(c => (
                        <option key={c.id} value={c.id}>{c.razonSocial} - {c.rut}</option>
                      ))}
                    </select>
                    {selectedClientId && (
                      <button type="button" className="btn-ghost text-xs sm:text-sm px-2 sm:px-3" onClick={()=>{ setSelectedClientId(undefined); }}>Desvincular</button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Si seleccionas un cliente, los campos se completarán automáticamente. Puedes editar cualquier dato.</p>
                </div>
                <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">RUT</label>
                      <input className="form-input" placeholder="12.345.678-9" value={clientRut} onChange={(e)=>setClientRut(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Tipo de Empresa</label>
                      <select
                        className="form-input"
                        value={clientTipoEmpresa}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setClientTipoEmpresa(e.target.value as Client["tipoEmpresa"]) }
                      >
                        <option>Ltda.</option><option>S.A.</option><option>SpA</option><option>E.I.R.L.</option><option>Otra</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Razón Social</label>
                    <input className="form-input" value={clientRazonSocial} onChange={(e)=>{ setClientRazonSocial(e.target.value); setClient(e.target.value); }} placeholder="Nombre de la empresa" />
                  </div>
                  <div>
                    <label className="form-label">Giro</label>
                    <input className="form-input" value={clientGiro} onChange={(e)=>setClientGiro(e.target.value)} placeholder="Actividad económica" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Región</label>
                      <input className="form-input" value={clientRegion} onChange={(e)=>setClientRegion(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Ciudad</label>
                      <input className="form-input" value={clientCiudad} onChange={(e)=>setClientCiudad(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Comuna</label>
                      <input className="form-input" value={clientComuna} onChange={(e)=>setClientComuna(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Dirección</label>
                      <input className="form-input" value={clientDireccion} onChange={(e)=>setClientDireccion(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="form-label">Contacto</label>
                      <input className="form-input" value={contactoNombre} onChange={(e)=>setContactoNombre(e.target.value)} placeholder="Nombre y apellido" />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" value={contactoEmail} onChange={(e)=>setContactoEmail(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Teléfono</label>
                      <input className="form-input" value={contactoTelefono} onChange={(e)=>setContactoTelefono(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Fecha de vencimiento</label>
                    <input type="date" className="form-input" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Notas</label>
                    <input className="form-input" placeholder="Referencia del pedido, condiciones, etc." value={notes} onChange={(e)=>setNotes(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                  <button className="btn-ghost order-2 sm:order-1" onClick={saveDraft}>Guardar borrador</button>
                  <button className="btn-primary order-1 sm:order-2" onClick={()=>setStep(2)}>Continuar</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Buscar productos por nombre...</label>
                  <input className="form-input" placeholder="Escribe para buscar..." value={search} onChange={(e)=>setSearch(e.target.value)} />
                </div>
                {/* Categorías y subcategorías (checkbox) */}
                <div className="border rounded-xl overflow-hidden divide-y">
                  {Array.from(new Set(allProducts.map(p=>p.category))).map(cat => {
                    const catProducts = allProducts.filter(p=>p.category===cat && p.name.toLowerCase().includes(search.toLowerCase()));
                    const subcats = Array.from(new Set(catProducts.map(p=>p.subcategory || "Otros")));
                    return (
                      <details key={cat} open className="group">
                        <summary className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-white cursor-pointer">
                          <div className="font-semibold text-gray-900">{cat}</div>
                          <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                        </summary>
                        {subcats.map(sub => {
                          const subProducts = catProducts.filter(p=> (p.subcategory||"Otros")===sub);
                          const subSelectedCount = subProducts.reduce((acc,p)=> acc + (selected[p.id] ? 1 : 0), 0);
                          return (
                            <details key={sub} className="border-t last:border-b-0">
                              <summary className="flex items-center justify-between px-6 py-3 bg-white cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <div className="text-gray-800 font-medium">{sub}</div>
                                  {subSelectedCount>0 && (<span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{subSelectedCount} seleccionados</span>)}
                                </div>
                                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                              </summary>
                              <div className="px-6 py-3 bg-white">
                                <ul className="grid sm:grid-cols-2 gap-3">
                                  {subProducts.map(p => (
                                    <li key={p.id} className="rounded-lg border p-3 hover:shadow-sm transition flex items-center justify-between">
                                      <div className="flex items-start gap-3">
                                        <input type="checkbox" className="mt-1 accent-orange-600" checked={!!selected[p.id]} onChange={(e)=>{
                                          if (e.target.checked) updateQty(p.id, 1); else updateQty(p.id, -999);
                                        }} />
                                        <div>
                                          <div className="font-medium text-gray-900">{p.name}</div>
                                          <div className="text-sm text-gray-600">${p.price.toLocaleString('es-CL')}</div>
                                        </div>
                                      </div>
                                      {selected[p.id] ? (
                                        <div className="flex items-center gap-2">
                                          <button className="btn-ghost" onClick={()=>updateQty(p.id,-1)}>-</button>
                                          <div className="w-8 text-center">{selected[p.id]}</div>
                                          <button className="btn-secondary" onClick={()=>updateQty(p.id,1)}>+</button>
                                        </div>
                                      ) : (
                                        <button className="btn-secondary" onClick={()=>updateQty(p.id,1)}>Agregar</button>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </details>
                          );
                        })}
                      </details>
                    );
                  })}
                </div>
                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={()=>setStep(1)}>Atrás</button>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={saveDraft}>Guardar borrador</button>
                    <button className="btn-primary" onClick={()=>setStep(3)} disabled={Object.keys(selected).length===0}>Continuar</button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Términos y condiciones</label>
                  <textarea className="form-input" rows={5} defaultValue={`Validez de la cotización: 30 días\nForma de pago: 50% al confirmar pedido, 50% contra entrega\nTiempo de entrega: 15 días hábiles\nGarantía: 12 meses por defectos de fabricación`} />
                </div>
                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={()=>setStep(2)}>Atrás</button>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={saveDraft}>Guardar borrador</button>
                    <button className="btn-primary" onClick={()=>{ clearDraft(); resetAndClose(); }}>Crear Cotización</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky summary */}
          <aside className="hidden lg:block border-l border-gray-100 p-4 lg:p-6 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-auto">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">Resumen</h4>
            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Cliente</span><span className="font-medium truncate ml-2">{client || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Vencimiento</span><span className="font-medium">{dueDate}</span></div>
            </div>
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2 text-sm">Productos</h5>
              {Object.keys(selected).length===0 ? (
                <p className="text-xs lg:text-sm text-gray-500">Sin productos</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(selected).map(([id,qty])=>{
                    const p = allProducts.find(pp=>pp.id===id)!;
                    return (
                      <li key={id} className="flex justify-between text-xs lg:text-sm">
                        <span className="text-gray-700 truncate mr-2">{p.name} × {qty}</span>
                        <span className="font-medium whitespace-nowrap">${(p.price*qty).toLocaleString('es-CL')}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-4 pt-4 border-t space-y-1 text-xs lg:text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">${subtotal.toLocaleString('es-CL')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">IVA (19%)</span><span className="font-semibold">${tax.toLocaleString('es-CL')}</span></div>
              <div className="flex justify-between text-sm lg:text-base border-t pt-2"><span className="text-gray-900">Total</span><span className="font-extrabold text-gray-900">${total.toLocaleString('es-CL')}</span></div>
            </div>
          </aside>
        </div>
      </FullscreenModal>
    );
  }
};
