"use client";
export function Stats() {
  const card = "bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition";
  const icon = "h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white grid place-content-center text-xl";
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className={card}><div className={icon}>🧾</div><div><div className="text-2xl font-bold">156</div><div className="text-slate-500">Cotizaciones Totales</div></div></div>
      <div className={card}><div className={icon}>⏱️</div><div><div className="text-2xl font-bold">23</div><div className="text-slate-500">Pendientes</div></div></div>
      <div className={card}><div className={icon}>✅</div><div><div className="text-2xl font-bold">89</div><div className="text-slate-500">Aprobadas</div></div></div>
      <div className={card}><div className={icon}>💲</div><div><div className="text-2xl font-bold">$45,230</div><div className="text-slate-500">Valor Total</div></div></div>
    </div>
  );
}
