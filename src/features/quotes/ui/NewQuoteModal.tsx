"use client";
import { useEffect, useMemo, useState } from "react";
import { FullscreenModal } from "@/shared/ui/FullscreenModal";
import { products as allProducts } from "@/features/quotes/model/products";
import { clients as mockClients, type Client } from "@/features/clients/model/clients";
import { QuoteAmountCalculator } from "@/entities/quote/model/types";
// PDF deshabilitado temporalmente
// import { downloadServerDTE } from "@/features/reports/ui/pdf";

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
  const [dueDate, setDueDate] = useState<string>("");
    const [createdDate, setCreatedDate] = useState<string>("");
  const [docType, setDocType] = useState<string>("");
    const [validDaysStr, setValidDaysStr] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [currency, setCurrency] = useState<"CLP" | "USD" | "">("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  // const [folio, setFolio] = useState<string>("");
    // helper: add days
    const addDays = (dateStr: string, days: number) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    };
    useEffect(() => {
      // Sync due date only if both fields are present
      const days = parseInt(validDaysStr);
      if (createdDate && !isNaN(days)) {
        setDueDate(addDays(createdDate, days));
      } else {
        setDueDate("");
      }
    }, [createdDate, validDaysStr]);
  // Notas rápidas eliminadas: se mantienen sólo términos en paso 3

  const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Record<string, number>>({}); // id -> qty
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [globalDiscountPct, setGlobalDiscountPct] = useState<number>(0);
  const [exentoAmount, setExentoAmount] = useState<number>(0);

    // Borrador local (guardar y reanudar)
    type Draft = {
      step: 1|2|3;
      client: string; selectedClientId?: string;
    clientRut: string; clientRazonSocial: string; clientGiro: string; clientDireccion: string; clientRegion: string; clientCiudad: string; clientComuna: string; clientTipoEmpresa: Client["tipoEmpresa"]; contactoNombre: string; contactoEmail: string; contactoTelefono: string;
  createdDate: string; docType: string; validDaysStr: string; paymentMethod: string; currency: "CLP"|"USD"|""; paymentNotes: string;
  dueDate: string; globalDiscountPct: number; exentoAmount: number;
      selected: Record<string, number>;
    };
    const DRAFT_KEY = "quote_draft_v1";
    const saveDraft = () => {
  const d: Draft = { step, client, selectedClientId, clientRut, clientRazonSocial, clientGiro, clientDireccion, clientRegion, clientCiudad, clientComuna, clientTipoEmpresa, contactoNombre, contactoEmail, contactoTelefono, createdDate, docType, validDaysStr, paymentMethod, currency, paymentNotes, dueDate, globalDiscountPct, exentoAmount, selected };
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
  setCreatedDate(d.createdDate); setDocType(d.docType); setValidDaysStr(d.validDaysStr); setPaymentMethod(d.paymentMethod); setCurrency(d.currency); setPaymentNotes(d.paymentNotes);
    setDueDate(d.dueDate); setGlobalDiscountPct(d.globalDiscountPct); setExentoAmount(d.exentoAmount); setSelected(d.selected);
        return true;
      } catch { return false; }
    };
    const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  // Búsqueda directa se aplica dentro de cada categoría; no necesitamos una lista filtrada global.

    const subtotal = useMemo(() => Object.entries(selected).reduce((acc,[id,qty]) => {
      const prod = allProducts.find(p=>p.id===id);
      return acc + (prod ? prod.price * qty : 0);
    }, 0), [selected]);

    const discountAmount = useMemo(() => {
      const pct = Math.min(100, Math.max(0, globalDiscountPct));
      return (subtotal * pct) / 100;
    }, [subtotal, globalDiscountPct]);
    const taxableBase = Math.max(0, subtotal - discountAmount);
    const tax = QuoteAmountCalculator.calculateTax(taxableBase, 0.19);
    const total = taxableBase + exentoAmount + tax;

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
  setCreatedDate(""); setDocType(""); setValidDaysStr(""); setPaymentMethod(""); setCurrency(""); setPaymentNotes("");
  setDueDate(""); setSearch(""); setSelected({}); setCollapsed(true); setGlobalDiscountPct(0); setExentoAmount(0); /* setFolio(""); */
      clearDraft();
      close();
    };

    const clearAll = () => {
      setStep(1); setClient(""); setSelectedClientId(undefined);
      setClientRut(""); setClientRazonSocial(""); setClientGiro(""); setClientDireccion(""); setClientRegion(""); setClientCiudad(""); setClientComuna(""); setClientTipoEmpresa("Ltda.");
      setContactoNombre(""); setContactoEmail(""); setContactoTelefono("");
  setCreatedDate(""); setDocType(""); setValidDaysStr(""); setPaymentMethod(""); setCurrency(""); setPaymentNotes("");
  setDueDate(""); setSearch(""); setSelected({}); setCollapsed(true); setGlobalDiscountPct(0); setExentoAmount(0); /* setFolio(""); */
      clearDraft();
    };

    const startManualEntry = () => {
      // Limpiar datos de cliente por completo y expandir para ingreso manual
      setSelectedClientId(undefined);
      setClient("");
      setClientRut(""); setClientRazonSocial(""); setClientGiro("");
      setClientDireccion(""); setClientRegion(""); setClientCiudad(""); setClientComuna("");
      setClientTipoEmpresa("Ltda."); setContactoNombre(""); setContactoEmail(""); setContactoTelefono("");
      setCollapsed(false);
    };

    return (
      <FullscreenModal open={isOpen} onClose={resetAndClose} title={
        <div className="flex items-center justify-between w-full">
          <span className="text-base sm:text-lg font-semibold truncate">Nueva Cotización</span>
          <div className="flex gap-1 sm:gap-2 ml-2">
            <button className="btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" onClick={saveDraft}>Guardar</button>
            <button className="btn-ghost text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" onClick={clearAll}>Limpiar</button>
            <button className="btn-ghost text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" onClick={loadDraft}>Reanudar</button>
          </div>
        </div>
      }>
        <div className="grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] h-full">
          {/* Left: wizard steps */}
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {step === 1 && (
              <div className="space-y-4 sm:space-y-5">
                <div className="grid lg:grid-cols-2 gap-4">
                  {/* Panel Cliente */}
                  <div 
                    className="rounded-xl p-3 sm:p-4 shadow-sm"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      border: '1px solid var(--border)' 
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Datos del cliente</h3>
                      <div className="flex gap-1 sm:gap-2">
                        <button className="btn-secondary text-xs sm:text-sm px-2 py-1" onClick={()=>setCollapsed(c=>!c)}>{collapsed? 'Editar datos':'Contraer'}</button>
                        <button className="btn-ghost text-xs sm:text-sm px-2 py-1" onClick={startManualEntry}>Rellenar manualmente</button>
                      </div>
                    </div>
                    {/* Selector existente */}
                    <div className="mb-3">
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
                            setCollapsed(true);
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
                    </div>

                    {/* Vista compacta */}
                    {collapsed ? (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
                          <span className="font-medium truncate ml-2" style={{ color: 'var(--text-primary)' }}>{client || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Contacto</span>
                          <span className="truncate ml-2" style={{ color: 'var(--text-primary)' }}>{contactoNombre || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>RUT</span>
                          <span style={{ color: 'var(--text-primary)' }}>{clientRut || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Dirección</span>
                          <span className="truncate ml-2" style={{ color: 'var(--text-primary)' }}>{clientDireccion || '—'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
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
                    )}
                  </div>

                  {/* Panel de Configuración de la cotización */}
                  <div 
                    className="rounded-xl p-3 sm:p-4 shadow-sm"
                    style={{ 
                      backgroundColor: 'var(--card-bg)', 
                      border: '1px solid var(--border)' 
                    }}
                  >
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Configuración</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Folio</label>
        <input className="form-input" value={"Se asigna al emitir"} readOnly disabled />
                      </div>
                      <div>
                        <label className="form-label">Tipo documento</label>
                        <select className="form-input" value={docType} onChange={(e)=>setDocType(e.target.value)}>
                          <option value="" disabled>Seleccione tipo...</option>
                          <option value="Cotización">Cotización</option>
                          <option value="Proforma">Proforma</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Fecha de creación</label>
                        <input type="date" className="form-input" value={createdDate} onChange={(e)=>setCreatedDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">Válida por (días)</label>
                        <input type="number" min={0} className="form-input" value={validDaysStr} onChange={(e)=>setValidDaysStr(e.target.value)} placeholder="Ej: 30" />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Vence el <span className="font-medium">{dueDate || '—'}</span></p>
                      </div>
                      <div>
                        <label className="form-label">Forma de pago</label>
                        <select className="form-input" value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
                          <option value="" disabled>Seleccione forma...</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Cheque adjunto a la OC">Cheque adjunto a la OC</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Efectivo">Efectivo</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Moneda</label>
                        <select className="form-input" value={currency} onChange={(e)=>setCurrency(e.target.value as "CLP"|"USD"|"") }>
                          <option value="" disabled>Seleccione moneda...</option>
                          <option value="CLP">Pesos (CLP)</option>
                          <option value="USD">Dólares (USD)</option>
                        </select>
                      </div>
                      {/* Orden alfabético eliminado por requerimiento */}
                      <div className="sm:col-span-2">
                        <label className="form-label">Observaciones pago</label>
                        <textarea className="form-input" rows={3} value={paymentNotes} onChange={(e)=>setPaymentNotes(e.target.value)} placeholder="Ej: Datos de transferencia (máx. 200 caracteres)" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Se elimina bloque de "Fecha de vencimiento y notas" por requerimiento */}
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
                <div 
                  className="rounded-xl overflow-hidden shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border)' 
                  }}
                >
                  {Array.from(new Set(allProducts.map(p=>p.category))).map(cat => {
                    const catProducts = allProducts.filter(p=>p.category===cat && p.name.toLowerCase().includes(search.toLowerCase()));
                    const subcats = Array.from(new Set(catProducts.map(p=>p.subcategory || "Otros")));
                    return (
                      <details key={cat} open className="group">
                        <summary 
                          className="flex items-center justify-between px-4 py-3 cursor-pointer"
                          style={{ backgroundColor: 'var(--accent-bg)' }}
                        >
                          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{cat}</div>
                          <svg className="w-4 h-4 transition-transform group-open:rotate-180" style={{ color: 'var(--text-secondary)' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                        </summary>
                        {subcats.map(sub => {
                          const subProducts = catProducts.filter(p=> (p.subcategory||"Otros")===sub);
                          const subSelectedCount = subProducts.reduce((acc,p)=> acc + (selected[p.id] ? 1 : 0), 0);
                          return (
                            <details key={sub} className="last:border-b-0" style={{ borderTop: '1px solid var(--border)' }}>
                              <summary 
                                className="flex items-center justify-between px-6 py-3 cursor-pointer"
                                style={{ 
                                  backgroundColor: 'var(--card-bg)',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{sub}</div>
                                  {subSelectedCount>0 && (
                                    <span 
                                      className="text-xs px-2 py-0.5 rounded-full"
                                      style={{ 
                                        backgroundColor: 'var(--accent-bg)', 
                                        color: 'var(--accent-primary)' 
                                      }}
                                    >
                                      {subSelectedCount} seleccionados
                                    </span>
                                  )}
                                </div>
                                <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
                              </summary>
                              <div className="px-6 py-3" style={{ backgroundColor: 'var(--card-bg)' }}>
                <ul className="grid sm:grid-cols-2 gap-3">
                                  {subProducts.map(p => (
                  <li 
                                      key={p.id} 
                                      className="rounded-lg p-3 transition flex items-center justify-between"
                                      style={{
                                        backgroundColor: selected[p.id] ? 'var(--accent-bg)' : 'var(--card-bg)',
                                        border: selected[p.id] ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!selected[p.id]) {
                                          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!selected[p.id]) {
                                          e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                                          e.currentTarget.style.boxShadow = 'none';
                                        }
                                      }}
                                    >
                                      <div className="flex items-start gap-3">
                    <input type="checkbox" className={`mt-1 accent-orange-600`} checked={!!selected[p.id]} onChange={(e)=>{
                                          if (e.target.checked) updateQty(p.id, 1); else updateQty(p.id, -999);
                                        }} />
                                        <div className="min-w-0">
                                          <div className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                                          <div 
                                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1"
                                            style={{ 
                                              backgroundColor: 'var(--accent-soft)', 
                                              color: 'var(--accent-primary)' 
                                            }}
                                          >
                                            $ {p.price.toLocaleString('es-CL')}
                                          </div>
                                        </div>
                                      </div>
                                      {selected[p.id] ? (
                                        <div className="flex items-center gap-2">
                                          <button className="btn-ghost" onClick={()=>updateQty(p.id,-1)}>-</button>
                                          <div 
                                            className="w-9 text-center rounded-md py-0.5 text-sm"
                                            style={{ 
                                              border: '1px solid var(--border)',
                                              color: 'var(--text-primary)'
                                            }}
                                          >
                                            {selected[p.id]}
                                          </div>
                                          <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow" onClick={()=>updateQty(p.id,1)}>+</button>
                                        </div>
                                      ) : (
                                        <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow" onClick={()=>updateQty(p.id,1)}>Agregar</button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Descuento global (%)</label>
                    <input type="number" min={0} max={100} className="form-input" value={globalDiscountPct} onChange={(e)=>setGlobalDiscountPct(Math.max(0, Math.min(100, Number(e.target.value)||0)))} />
                  </div>
                  <div>
                    <label className="form-label">Monto exento</label>
                    <input type="number" min={0} className="form-input" value={exentoAmount} onChange={(e)=>setExentoAmount(Math.max(0, Number(e.target.value)||0))} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={()=>setStep(2)}>Atrás</button>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={saveDraft}>Guardar borrador</button>
                    <button className="btn-primary" onClick={async ()=>{
                      // Descarga de PDF deshabilitada temporalmente
                      clearDraft();
                      resetAndClose();
                    }}>Crear Cotización</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: sticky summary */}
          <aside 
            className="hidden lg:block p-4 lg:p-6 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-auto"
            style={{ borderLeft: '1px solid var(--border)' }}
          >
            <h4 className="font-semibold mb-3 text-sm lg:text-base" style={{ color: 'var(--text-primary)' }}>Resumen</h4>
            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Cliente</span>
                <span className="font-medium truncate ml-2" style={{ color: 'var(--text-primary)' }}>{client || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Vencimiento</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{dueDate || '—'}</span>
              </div>
            </div>
            <div className="mt-4">
              <h5 className="font-medium mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>Productos</h5>
              {Object.keys(selected).length===0 ? (
                <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>Sin productos</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(selected).map(([id,qty])=>{
                    const p = allProducts.find(pp=>pp.id===id)!;
                    return (
                      <li key={id} className="flex justify-between text-xs lg:text-sm">
                        <span className="truncate mr-2" style={{ color: 'var(--text-secondary)' }}>{p.name} × {qty}</span>
                        <span className="font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>${(p.price*qty).toLocaleString('es-CL')}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-4 pt-4 space-y-1 text-xs lg:text-sm" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{currency==='USD' ? `$ ${(subtotal/900).toLocaleString('en-US')}` : `$ ${subtotal.toLocaleString('es-CL')}`}</span>
              </div>
              {globalDiscountPct>0 && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Descuento ({globalDiscountPct}%)</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>- {currency==='USD' ? `$ ${(discountAmount/900).toLocaleString('en-US')}` : `$ ${discountAmount.toLocaleString('es-CL')}`}</span>
                </div>
              )}
              {exentoAmount>0 && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Exento</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{currency==='USD' ? `$ ${(exentoAmount/900).toLocaleString('en-US')}` : `$ ${exentoAmount.toLocaleString('es-CL')}`}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>IVA (19%)</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{currency==='USD' ? `$ ${(tax/900).toLocaleString('en-US')}` : `$ ${tax.toLocaleString('es-CL')}`}</span>
              </div>
              <div className="flex justify-between text-sm lg:text-base pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total</span>
                <span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>{currency==='USD' ? `$ ${(total/900).toLocaleString('en-US')}` : `$ ${total.toLocaleString('es-CL')}`}</span>
              </div>
            </div>
          </aside>
        </div>
      </FullscreenModal>
    );
  }
};
