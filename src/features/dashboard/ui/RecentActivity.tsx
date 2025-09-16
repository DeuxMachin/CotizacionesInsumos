"use client";

import { 
  FiFileText, 
  FiCheckCircle, 
  FiUserPlus, 
  FiEdit3, 
  FiLogIn, 
  FiLogOut,
  FiHome,
  FiTarget,
  FiShoppingCart,
  FiRefreshCw,
  FiTool,
  FiDollarSign,
  FiActivity
} from "react-icons/fi";
import { useAuditLog, formatRelativeTime } from '@/hooks/useAuditLog';
import { AuditLogEntry } from "@/services/auditLogger";

type ActivityIcon = "quote" | "approved" | "client" | "updated" | "login" | "logout" | "obra" | "target" | "sale" | "refresh" | "tool" | "dollar" | "activity";

const ICONS: Record<ActivityIcon, React.ReactElement> = {
  quote: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
      <FiFileText className="w-5 h-5" />
    </div>
  ),
  approved: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiCheckCircle className="w-5 h-5" />
    </div>
  ),
  client: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
      <FiUserPlus className="w-5 h-5" />
    </div>
  ),
  updated: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
      <FiEdit3 className="w-5 h-5" />
    </div>
  ),
  login: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
      <FiLogIn className="w-5 h-5" />
    </div>
  ),
  logout: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
      <FiLogOut className="w-5 h-5" />
    </div>
  ),
  obra: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
      <FiHome className="w-5 h-5" />
    </div>
  ),
  target: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
      <FiTarget className="w-5 h-5" />
    </div>
  ),
  sale: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiDollarSign className="w-5 h-5" />
    </div>
  ),
  refresh: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
      <FiRefreshCw className="w-5 h-5" />
    </div>
  ),
  tool: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
      <FiTool className="w-5 h-5" />
    </div>
  ),
  dollar: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiDollarSign className="w-5 h-5" />
    </div>
  ),
  activity: (
    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
      <FiActivity className="w-5 h-5" />
    </div>
  )
};

// Función para mapear eventos de audit log a iconos
function getIconForEvent(eventType: string, statusChange?: { old: string; new: string }): ActivityIcon {
  switch (eventType) {
    case 'user_login':
      return 'login';
    case 'user_logout':
      return 'logout';
    case 'cotizacion_creada':
    case 'cotizacion_created':
      return 'quote';
    case 'cotizacion_actualizada':
    case 'cotizacion_status_changed':
      if (statusChange?.new === 'aceptada' || statusChange?.new === 'aprobada') {
        return 'approved';
      }
      return 'refresh';
    case 'cotizacion_updated':
      return 'updated';
    case 'cliente_creado':
    case 'cliente_created':
      return 'client';
    case 'cliente_updated':
      return 'updated';
    case 'obra_creada':
    case 'obra_created':
      return 'obra';
    case 'obra_updated':
      return 'tool';
    case 'target_creado':
    case 'target_created':
      return 'target';
    case 'target_updated':
      return 'target';
    case 'nota_venta_creada':
    case 'nota_venta_created':
      return 'sale';
    case 'producto_created':
    case 'producto_updated':
      return 'updated';
    case 'sistema_inicio':
    case 'tabla_creada':
      return 'activity';
    default:
      return 'activity';
  }
}

export function RecentActivity() {
  const { activities, loading, error, refresh, userContext } = useAuditLog(15);

  if (loading) {
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

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-subtle)' 
      }}
    >
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="section-title text-lg sm:text-xl">Actividad Reciente</h3>
            {userContext && (
              <span 
                className={`px-2 py-1 text-xs rounded-full font-medium ${
                  userContext.isAdmin 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}
              >
                {userContext.isAdmin ? 'Vista completa' : 'Vista personal'}
              </span>
            )}
          </div>
          <p className="text-sm text-theme-secondary">
            {error ? 'Mostrando datos de ejemplo' : 
             userContext?.isAdmin ? 'Todos los eventos del sistema' : 'Sus eventos personales'}
          </p>
        </div>
        {!loading && (
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Actualizar actividad"
          >
            <FiRefreshCw className="w-4 h-4 text-theme-secondary" />
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <FiActivity className="w-12 h-12 text-theme-secondary mx-auto mb-3 opacity-50" />
          <p className="text-theme-secondary">No hay actividad reciente para mostrar</p>
        </div>
      ) : (
        <ul className="divide-y divide-theme-primary">
          {activities.map((activity, idx) => {
            // Mapear campos de la base de datos a los esperados por el componente
            const eventType = activity.evento;
            const description = activity.descripcion;
            const userEmail = typeof activity.detalles?.user_email === 'string' ? activity.detalles.user_email : undefined;
            const userName = (typeof activity.detalles?.user_name === 'string' ? activity.detalles.user_name : undefined) || 
                           (userEmail ? userEmail.split('@')[0] : undefined) || 'Usuario';
            const metadata = activity.detalles;

            console.log('🔍 Activity data:', { eventType, description, userName, metadata, activity });

            const statusChange = (typeof activity.detalles?.estado_anterior === 'string' && typeof activity.detalles?.estado_nuevo === 'string') ? {
              old: activity.detalles.estado_anterior,
              new: activity.detalles.estado_nuevo
            } : undefined;

            const iconType = getIconForEvent(eventType, statusChange);

            return (
              <li 
                key={activity.id || idx} 
                className="py-4 flex items-start gap-3 sm:gap-4 animate-slideUp hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors" 
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {ICONS[iconType]}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-theme-primary">
                    {description}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-theme-secondary mt-0.5">
                    <span>{formatRelativeTime(activity.created_at || new Date().toISOString())}</span>
                    {userName && (
                      <>
                        <span>•</span>
                        <span>{userName}</span>
                      </>
                    )}
                    {typeof metadata?.folio === 'string' && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{metadata.folio}</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            ⚠️ No se pudo conectar con el sistema de auditoría. Mostrando datos de ejemplo.
          </p>
        </div>
      )}
    </div>
  );
}
