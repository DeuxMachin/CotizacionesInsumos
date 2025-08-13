"use client";
import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";

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

    return (
      <Modal open={isOpen} onClose={close}>
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nueva Cotización</h3>
          <button className="p-2 rounded hover:bg-slate-100" onClick={close}>✖</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Cliente</label>
            <select className="form-input">
              <option>Seleccionar cliente</option>
              <option>Empresa ABC</option>
              <option>Tech Solutions</option>
            </select>
          </div>
          <div>
            <label className="label">Fecha de Vencimiento</label>
            <input type="date" className="form-input" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea rows={3} className="form-input" />
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button className="btn-secondary" onClick={close}>Cancelar</button>
          <button className="btn-primary" onClick={close}>Crear Cotización</button>
        </div>
      </Modal>
    );
  }
};
