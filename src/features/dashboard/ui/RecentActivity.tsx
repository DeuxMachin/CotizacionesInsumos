"use client";

import { FiFileText, FiCheckCircle, FiUserPlus } from "react-icons/fi";

type Activity = {
  id: string;
  icon: "quote" | "approved" | "client";
  title: string;
  time: string;
};

const ICONS = {
  quote: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(241,90,36,0.1)", color: "#F15A24" }}>
      <FiFileText className="w-5 h-5" />
    </div>
  ),
  approved: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiCheckCircle className="w-5 h-5" />
    </div>
  ),
  client: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
      <FiUserPlus className="w-5 h-5" />
    </div>
  ),
};

const items: Activity[] = [
  { id: "A1", icon: "quote", title: "Nueva cotización creada #COT-2024-001", time: "Hace 2 horas" },
  { id: "A2", icon: "approved", title: "Cotización #COT-2024-002 aprobada", time: "Hace 4 horas" },
  { id: "A3", icon: "client", title: "Nuevo cliente registrado: Empresa ABC Ltda.", time: "Hace 6 horas" },
];

export function RecentActivity() {
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      <div className="mb-4 sm:mb-6">
        <h3 className="section-title text-lg sm:text-xl mb-1">Actividad Reciente</h3>
        <p className="text-sm text-theme-secondary">Últimos eventos del sistema</p>
      </div>

      <ul className="divide-y divide-theme-primary">
        {items.map((a, idx) => (
          <li key={a.id} className="py-4 flex items-start gap-3 sm:gap-4 animate-slideUp" style={{ animationDelay: `${idx * 80}ms` }}>
            {ICONS[a.icon]}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-theme-primary">{a.title}</div>
              <div className="text-xs text-theme-secondary mt-0.5">{a.time}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
