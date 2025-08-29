"use client";
import { useMemo, useState } from "react";

type Props = { onChange?: (v: { status?: string; date?: string; search?: string }) => void };

export function FiltersBar({ onChange }: Props) {
  const [status, setStatus] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useMemo(() => { onChange?.({ status, date, search }); }, [status, date, search, onChange]);

  return (
    <div 
      className="rounded-xl p-4 mb-4 shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <select className="form-input" value={status} onChange={(e)=>setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Pendiente</option>
          <option>Aprobada</option>
          <option>Rechazada</option>
        </select>
        <input type="date" className="form-input" value={date} onChange={(e)=>setDate(e.target.value)} />
        <input type="text" className="form-input" placeholder="Buscar cliente..." value={search} onChange={(e)=>setSearch(e.target.value)} />
      </div>
    </div>
  );
}
