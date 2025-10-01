"use client";

import { useState, useEffect } from 'react';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiUserPlus, 
  FiEdit3, 
  FiLogIn, 
  FiLogOut,
  FiHome,
  FiTarget,
  FiRefreshCw,
  FiTool,
  FiDollarSign,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiDownload,
  FiUserMinus
} from "react-icons/fi";
import { AuditLogEntry } from "@/services/auditLogger";
import { formatRelativeTime } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';

type ActivityIcon = "quote" | "approved" | "client" | "updated" | "login" | "logout" | "obra" | "target" | "sale" | "refresh" | "tool" | "dollar" | "activity" | "client-deleted";

const ICONS: Record<ActivityIcon, React.ReactElement> = {
  quote: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
      <FiFileText className="w-4 h-4" />
    </div>
  ),
  approved: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiCheckCircle className="w-4 h-4" />
    </div>
  ),
  client: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
      <FiUserPlus className="w-4 h-4" />
    </div>
  ),
  updated: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
      <FiEdit3 className="w-4 h-4" />
    </div>
  ),
  login: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
      <FiLogIn className="w-4 h-4" />
    </div>
  ),
  logout: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
      <FiLogOut className="w-4 h-4" />
    </div>
  ),
  obra: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
      <FiHome className="w-4 h-4" />
    </div>
  ),
  target: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>
      <FiTarget className="w-4 h-4" />
    </div>
  ),
  sale: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiDollarSign className="w-4 h-4" />
    </div>
  ),
  refresh: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
      <FiRefreshCw className="w-4 h-4" />
    </div>
  ),
  tool: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
      <FiTool className="w-4 h-4" />
    </div>
  ),
  dollar: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
      <FiDollarSign className="w-4 h-4" />
    </div>
  ),
  activity: (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(107,114,128,0.1)", color: "#6b7280" }}>
      <FiActivity className="w-4 h-4" />
    </div>
  ),
  "client-deleted": (
    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
      <FiUserMinus className="w-4 h-4" />
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
    case 'cliente_actualizado':
    case 'cliente_updated':
      return 'updated';
    case 'cliente_eliminado':
    case 'cliente_deleted':
      return 'client-deleted';
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface UnifiedAuditLogProps {
  /** Modo de vista: 'dashboard' para vista resumida, 'admin' para vista completa con filtros */
  mode?: 'dashboard' | 'admin';
  /** Número máximo de elementos a mostrar en modo dashboard */
  limit?: number;
  /** Título personalizado */
  title?: string;
  /** Si mostrar el botón de actualizar */
  showRefresh?: boolean;
}

export default function UnifiedAuditLog({ 
  mode = 'dashboard', 
  limit = 10, 
  title,
  showRefresh = true 
}: UnifiedAuditLogProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modo admin
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: mode === 'admin' ? 20 : limit
  });

  // Lista de tipos de eventos para el filtro (solo en modo admin)
  const eventTypes = [
    { value: '', label: 'Todos los eventos' },
    { value: 'user_login', label: 'Inicio de sesión' },
    { value: 'cotizacion_creada', label: 'Cotización creada' },
    { value: 'cotizacion_actualizada', label: 'Cotización actualizada' },
    { value: 'cliente_creado', label: 'Cliente creado' },
    { value: 'cliente_actualizado', label: 'Cliente actualizado' },
    { value: 'cliente_eliminado', label: 'Cliente eliminado' },
    { value: 'obra_creada', label: 'Obra creada' },
    { value: 'nota_venta_creada', label: 'Nota de venta creada' },
  ];

  const dateRanges = [
    { value: '', label: 'Todo el tiempo' },
    { value: '1d', label: 'Último día' },
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' },
  ];

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...(mode === 'admin' && searchTerm && { search: searchTerm }),
        ...(mode === 'admin' && selectedEventType && { eventType: selectedEventType }),
        ...(mode === 'admin' && selectedDateRange && { dateRange: selectedDateRange }),
      });

      // Crear headers de autenticación
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Agregar información del usuario si existe
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email;
        if (user.name) {
          headers['x-user-name'] = user.name;
        }
      }

      // Determinar endpoint según modo y permisos
      const endpoint = (mode === 'admin' && user?.isAdmin) 
        ? `/api/audit-log/admin?${params}` 
        : `/api/audit-log?${params}`;

      console.log('🔍 Fetching audit log:', { endpoint, mode, isAdmin: user?.isAdmin });

      const response = await fetch(endpoint, { headers });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 API Result:', result);
        if (result.success) {
          setActivities(result.data || []);
          if (mode === 'admin') {
            setPagination(prev => ({
              ...prev,
              totalPages: result.pagination?.totalPages || 1,
              totalItems: result.pagination?.totalItems || 0
            }));
          }
        } else {
          setError('Error al cargar los datos');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        setError(`Error del servidor (${response.status})`);
      }
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLog();
  }, [pagination.currentPage, selectedEventType, selectedDateRange, mode]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchAuditLog();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleExport = async () => {
    if (mode !== 'admin' || !user?.isAdmin) return;
    
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedEventType && { eventType: selectedEventType }),
        ...(selectedDateRange && { dateRange: selectedDateRange }),
        export: 'csv'
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email;
        if (user.name) {
          headers['x-user-name'] = user.name;
        }
      }

      const response = await fetch(`/api/audit-log/admin?${params}`, { headers });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting audit log:', error);
    }
  };

  const getTitle = () => {
    if (title) return title;
    return mode === 'admin' ? 'Registro de Auditoría' : 'Actividad Reciente';
  };

  const getDescription = () => {
    if (mode === 'admin') {
      return user?.isAdmin 
        ? 'Visualiza y administra todas las actividades del sistema con acceso completo de administrador.'
        : 'Visualiza tu actividad reciente en el sistema.';
    }
    return 'Últimas actividades realizadas en el sistema';
  };

  // Renderizado para modo dashboard con tarjeta
  if (mode === 'dashboard') {
    return (
      <div 
        className="rounded-xl p-6"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Encabezado de la tarjeta */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {getTitle()}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {getDescription()}
            </p>
          </div>
          {showRefresh && (
            <button
              onClick={fetchAuditLog}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Actualizar actividad"
            >
              <FiRefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {/* Contenido de actividades */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <FiActivity className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchAuditLog}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <FiActivity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p style={{ color: 'var(--text-secondary)' }}>
              No hay actividad reciente para mostrar
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {activities.map((activity, idx) => {
              const eventType = activity.evento;
              const description = activity.descripcion;
              const userEmail = typeof activity.detalles?.user_email === 'string' ? activity.detalles.user_email : undefined;
              const userName = (typeof activity.detalles?.user_name === 'string' ? activity.detalles.user_name : undefined) || 
                             (userEmail ? userEmail.split('@')[0] : undefined) || 'Usuario';
              const metadata = activity.detalles;

              const statusChange = (typeof activity.detalles?.estado_anterior === 'string' && typeof activity.detalles?.estado_nuevo === 'string') ? {
                old: activity.detalles.estado_anterior,
                new: activity.detalles.estado_nuevo
              } : undefined;

              const iconType = getIconForEvent(eventType, statusChange);

              return (
                <li 
                  key={activity.id || idx} 
                  className={`py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors animate-slideUp`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {ICONS[iconType]}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {description}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                      <span>{formatRelativeTime(activity.created_at || new Date().toISOString())}</span>
                      {userEmail && (
                        <>
                          <span>•</span>
                          <span>{userEmail}</span>
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
      </div>
    );
  }

  // Renderizado para modo admin
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {getTitle()}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {getDescription()}
          </p>
        </div>
        {showRefresh && (
          <button
            onClick={fetchAuditLog}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Actualizar actividad"
          >
            <FiRefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        )}
      </div>

      {/* Filtros y búsqueda (solo en modo admin) */}
      {mode === 'admin' && user?.isAdmin && (
        <div 
          className="rounded-xl p-6"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)' 
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Búsqueda
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar en descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Tipo de evento */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Tipo de evento
              </label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="form-select"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Rango de fechas */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Periodo
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="form-select"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Acciones */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FiSearch className="w-4 h-4" />
                Buscar
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <FiDownload className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de actividades */}
      <div 
        className="rounded-xl overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Encabezado de la tabla (solo en modo admin) */}
        {mode === 'admin' && (
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Actividades del Sistema
              </h3>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {pagination.totalItems} registros total
              </div>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: mode === 'admin' ? 10 : 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <FiActivity className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchAuditLog}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <FiActivity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p style={{ color: 'var(--text-secondary)' }}>
                {mode === 'admin' ? 'No se encontraron registros' : 'No hay actividad reciente para mostrar'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity, idx) => {
                const eventType = activity.evento;
                const description = activity.descripcion;
                const userEmail = typeof activity.detalles?.user_email === 'string' ? activity.detalles.user_email : undefined;
                const userName = (typeof activity.detalles?.user_name === 'string' ? activity.detalles.user_name : undefined) || 
                               (userEmail ? userEmail.split('@')[0] : undefined) || 'Usuario';
                const metadata = activity.detalles;

                const statusChange = (typeof activity.detalles?.estado_anterior === 'string' && typeof activity.detalles?.estado_nuevo === 'string') ? {
                  old: activity.detalles.estado_anterior,
                  new: activity.detalles.estado_nuevo
                } : undefined;

                const iconType = getIconForEvent(eventType, statusChange);

                // Información adicional específica por tipo de evento (solo en modo admin)
                const getAdditionalInfo = () => {
                  if (mode !== 'admin') return [];
                  
                  const details = [];
                  
                  // Información común
                  if (typeof metadata?.folio === 'string') {
                    details.push(`Folio: ${metadata.folio}`);
                  }
                  
                  // Información específica de clientes
                  if (eventType.includes('cliente') && typeof metadata?.rut === 'string') {
                    details.push(`RUT: ${metadata.rut}`);
                  }
                  
                  // Información de cambios
                  if (metadata?.cambios && typeof metadata.cambios === 'object') {
                    const cambios = metadata.cambios as Record<string, { anterior: unknown; nuevo: unknown }>;
                    const cambiosTexto = Object.entries(cambios).map(([campo, { anterior, nuevo }]) => 
                      `${campo}: "${anterior}" → "${nuevo}"`
                    ).join(', ');
                    if (cambiosTexto) {
                      details.push(`Cambios: ${cambiosTexto}`);
                    }
                  }
                  
                  // Información de estados
                  if (statusChange) {
                    details.push(`Estado: ${statusChange.old} → ${statusChange.new}`);
                  }
                  
                  return details;
                };

                const additionalInfo = getAdditionalInfo();

                return (
                  <li 
                    key={activity.id || idx} 
                    className="py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    {ICONS[iconType]}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {description}
                      </div>
                      
                      {/* Información adicional detallada (solo modo admin) */}
                      {mode === 'admin' && additionalInfo.length > 0 && (
                        <div className="text-xs mt-1 space-y-1" style={{ color: 'var(--text-muted)' }}>
                          {additionalInfo.map((info, infoIdx) => (
                            <div key={infoIdx} className="text-xs">
                              {info}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                        <span>{formatRelativeTime(activity.created_at || new Date().toISOString())}</span>
                        {userEmail && (
                          <>
                            <span>•</span>
                            <span>{userEmail}</span>
                          </>
                        )}
                        {mode === 'admin' && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                              {eventType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Paginación (solo en modo admin) */}
        {mode === 'admin' && !loading && !error && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Página {pagination.currentPage} de {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                {pagination.currentPage}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
