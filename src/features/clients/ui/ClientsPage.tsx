"use client";

import { useEffect, useMemo, useState } from "react";
import { clientsExtended, type ClientExtended, type ClientStatus } from "../model/clientsExtended";
import { BRAND } from "@/shared/ui/brand";
import { Toast } from "@/shared/ui/Toast";
import { quotesData } from "@/features/quotes/model/mock";

const statusStyles: Record<ClientStatus, string> = {
  vigente: "bg-emerald-100 text-emerald-700",
  moroso: "bg-amber-100 text-amber-700",
  inactivo: "bg-slate-200 text-slate-700",
};

function StatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-2xl ${statusStyles[status]}`}>
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export function ClientsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | ClientStatus>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClientExtended | null>(null);
  const pageSize = 10;

  const data = useMemo(() => {
    let out = [...clientsExtended];
    if (status !== "todos") out = out.filter((c) => c.status === status);
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (c) =>
          c.razonSocial.toLowerCase().includes(q) ||
          c.rut.toLowerCase().includes(q) ||
          (c.fantasyName?.toLowerCase().includes(q) ?? false) ||
          (c.contactoNombre?.toLowerCase().includes(q) ?? false)
      );
    }
    return out;
  }, [query, status]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [query, status]);

  if (selected) {
    return (
      <ClientDetail
        client={selected}
        onBack={() => setSelected(null)}
        onEdit={() => Toast.info("Editar cliente próximamente")}
        onDelete={() => Toast.success("Cliente eliminado (demo)")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por razón social, RUT o contacto"
              className="form-input flex-1"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ("todos" | ClientStatus))}
              className="form-input w-[160px]"
            >
              <option value="todos">Todos</option>
              <option value="vigente">Vigente</option>
              <option value="moroso">Moroso</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => { setQuery(""); setStatus("todos"); }}>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white shadow overflow-hidden">
        {/* Mobile cards */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {pageData.map((c) => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-gray-900 text-sm leading-snug flex-1">{c.razonSocial}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs text-gray-600">RUT: {c.rut}</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{formatCLP(c.paid + c.pending + c.partial + c.overdue)}</span>
                  <div className="flex gap-1">
                    <button className="btn-icon text-xs" onClick={() => setSelected(c)}>👁️</button>
                    <button className="btn-icon text-xs" onClick={() => Toast.info(`Editando ${c.razonSocial}`)}>✏️</button>
                    <button className="btn-icon text-xs" onClick={() => Toast.success(`Eliminado ${c.razonSocial}`)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
            {pageData.length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">Sin resultados</div>
            )}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="p-3 font-semibold text-xs sm:text-sm">Razón Social</th>
                <th className="p-3 font-semibold text-xs sm:text-sm text-center">RUT</th>
                <th className="p-3 font-semibold text-xs sm:text-sm">Contacto</th>
                <th className="p-3 font-semibold text-xs sm:text-sm">Estado</th>
                <th className="p-3 font-semibold text-xs sm:text-sm">Total Mov.</th>
                <th className="p-3 font-semibold text-xs sm:text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((c) => (
                <tr key={c.id} className="border-t border-gray-200 hover:bg-slate-50">
                  <td className="p-3 text-xs sm:text-sm font-medium">{c.razonSocial}</td>
                  <td className="p-3 text-xs sm:text-sm text-center">{c.rut}</td>
                  <td className="p-3 text-xs sm:text-sm">{c.contactoNombre || "-"}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3 text-xs sm:text-sm font-medium">
                    {formatCLP(c.paid + c.pending + c.partial + c.overdue)}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 sm:gap-2">
                      <button className="btn-icon" onClick={() => setSelected(c)}>👁️</button>
                      <button className="btn-icon" onClick={() => Toast.info(`Editando ${c.razonSocial}`)}>✏️</button>
                      <button className="btn-icon" onClick={() => Toast.success(`Eliminado ${c.razonSocial}`)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500 text-sm" colSpan={6}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="p-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <div className="text-gray-600">
            {data.length} resultado{data.length === 1 ? "" : "s"}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span className="text-gray-600">
              Página {page} de {totalPages}
            </span>
            <button
              className="btn-secondary text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate"|"emerald"|"amber"|"rose" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 text-slate-800",
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-800",
  };
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 ${tones[tone]}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-base sm:text-lg">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-32 sm:w-40 text-xs text-slate-500 flex-shrink-0">{label}</div>
      <div className="text-sm text-slate-800 break-words hyphens-auto min-w-0">{value || "-"}</div>
    </div>
  );
}

function ClientDetail({ client, onBack, onEdit, onDelete }: { client: ClientExtended; onBack: ()=>void; onEdit: ()=>void; onDelete: ()=>void }) {
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const clientQuotes = useMemo(() => {
    // match by razonSocial or contact; in real app use client id
    return quotesData.filter(q => q.client.toLowerCase().includes(client.razonSocial.toLowerCase().split(" ")[0]));
  }, [client.razonSocial]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="text-base sm:text-xl font-bold text-gray-900 display-font break-words hyphens-auto">
              {client.razonSocial}
            </h3>
            <div className="mt-0.5 sm:mt-0"><StatusBadge status={client.status} /></div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700">RUT: {client.rut}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button className="btn-secondary text-sm" onClick={onBack}>Volver</button>
          <button className="btn-secondary text-sm" onClick={onEdit}>Editar</button>
          <button className="btn-secondary text-sm" onClick={onDelete}>Eliminar</button>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Pagado" value={formatCLP(client.paid)} tone="emerald" />
        <StatCard label="Pendiente" value={formatCLP(client.pending)} tone="amber" />
        <StatCard label="Vencido" value={formatCLP(client.overdue)} tone="rose" />
      </div>

      <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
        {/* Información de la empresa */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Información de la empresa</h4>
          <div className="divide-y divide-gray-100">
            {/* Razón social removed here to avoid duplication with header */}
            <InfoRow label="Giro" value={client.giro} />
            <InfoRow label="Dirección" value={client.direccion} />
            <InfoRow label="Región" value={client.region} />
            <InfoRow label="Ciudad" value={client.ciudad} />
            <InfoRow label="Comuna" value={client.comuna} />
            <InfoRow label="Tipo de empresa" value={client.tipoEmpresa} />
          </div>
        </div>

        {/* Condiciones de pago */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Condiciones de pago</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Días adicionales</span><span className="font-semibold">{client.additionalDays}</span></div>
            <div className="flex justify-between"><span>Línea de crédito</span><span className="font-semibold">{formatCLP(client.creditLine)}</span></div>
            <div className="flex justify-between"><span>Crédito usado</span><span className="font-semibold">{formatCLP(client.credit)}</span></div>
            <div className="flex justify-between"><span>Retención</span><span className="font-semibold">{client.retention}</span></div>
            <div className="flex justify-between"><span>Descuento</span><span className="font-semibold">{client.discount}%</span></div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        {/* Contacto comercial */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Contacto</h4>
          <div className="divide-y divide-gray-100">
            <InfoRow label="Nombre" value={client.contactoNombre} />
            <InfoRow label="Email" value={client.contactoEmail || client.email} />
            <InfoRow label="Teléfono" value={client.contactoTelefono || client.phone} />
            <InfoRow label="Móvil" value={client.mobile} />
          </div>
        </div>

        {/* Responsable de pagos */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Responsable de pagos</h4>
          <div className="divide-y divide-gray-100">
            <InfoRow label="Nombre" value={client.paymentResponsible} />
            <InfoRow label="Email" value={client.paymentEmail} />
            <InfoRow label="Teléfono" value={client.paymentPhone} />
            <InfoRow label="Medio de pago" value={client.transferInfo} />
          </div>
        </div>
      </div>

      {/* Cotizaciones del cliente */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold ${BRAND.accentText}`}>Cotizaciones del cliente</h4>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Ver todas</label>
            <input type="checkbox" className="translate-y-[1px]" checked={showAllQuotes} onChange={(e)=>setShowAllQuotes(e.target.checked)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="p-2">Número</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Monto</th>
              </tr>
            </thead>
            <tbody>
              {(showAllQuotes ? clientQuotes : clientQuotes.slice(0, 5)).map((q) => (
                <tr key={q.id} className="border-t border-gray-200">
                  <td className="p-2">{q.id}</td>
                  <td className="p-2">{q.date}</td>
                  <td className="p-2">
                    {/* reuse badge styles from quotes table via text only for simplicity */}
                    <span className={`text-xs font-semibold rounded-2xl px-2 py-0.5 ${q.status === 'pending' ? 'text-amber-700 bg-amber-100' : q.status === 'approved' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                      {{pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada'}[q.status]}
                    </span>
                  </td>
                  <td className="p-2 font-medium">{formatCLP(Math.round(q.amount))}</td>
                </tr>
              ))}
              {clientQuotes.length === 0 && (
                <tr><td className="p-3 text-center text-slate-500" colSpan={4}>Sin cotizaciones</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientsPage;
