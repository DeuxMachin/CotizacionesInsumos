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
  FiDownload
} from "react-icons/fi";
import { AuditLogEntry } from "@/services/auditLogger";
import { formatRelativeTime } from '@/hooks/useAuditLog';

type ActivityIcon = "quote" | "approved" | "client" | "updated" | "login" | "logout" | "obra" | "target" | "sale" | "refresh" | "tool" | "dollar" | "activity";

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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function AuditLogManagement() {
  const [activities, setActivities] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Lista de tipos de eventos para el filtro
  const eventTypes = [
    { value: '', label: 'Todos los eventos' },
    { value: 'user_login', label: 'Inicio de sesión' },
    { value: 'cotizacion_creada', label: 'Cotización creada' },
    { value: 'cotizacion_actualizada', label: 'Cotización actualizada' },
    { value: 'cliente_creado', label: 'Cliente creado' },
    { value: 'cliente_updated', label: 'Cliente actualizado' },
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
        ...(searchTerm && { search: searchTerm }),
        ...(selectedEventType && { eventType: selectedEventType }),
        ...(selectedDateRange && { dateRange: selectedDateRange }),
      });

      // Crear headers similares a los que usa el RecentActivity que funciona
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': 'b8f4a8d2-7e92-4e1a-9f5c-3d2a8b7e1234',
        'x-user-email': 'admin@empresa.com',
        'x-user-name': 'Administrador Sistema'
      };

      console.log('🔍 Fetching audit log with headers:', headers);

      const response = await fetch(`/api/audit-log/admin?${params}`, { headers });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 API Result:', result);
        if (result.success) {
          setActivities(result.data || []);
          setPagination(prev => ({
            ...prev,
            totalPages: result.pagination?.totalPages || 1,
            totalItems: result.pagination?.totalItems || 0
          }));
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
  }, [pagination.currentPage, selectedEventType, selectedDateRange]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchAuditLog();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedEventType && { eventType: selectedEventType }),
        ...(selectedDateRange && { dateRange: selectedDateRange }),
        export: 'csv'
      });

      // Usar los mismos headers que en fetchAuditLog
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': 'b8f4a8d2-7e92-4e1a-9f5c-3d2a8b7e1234',
        'x-user-email': 'admin@empresa.com',
        'x-user-name': 'Administrador Sistema'
      };

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

  return (
    <div className="space-y-4 md:space-y-6 px-4 sm:px-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Registro de Auditoría
        </h1>
        <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
          Visualiza y administra todas las actividades del sistema con acceso completo de administrador.
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div 
        className="rounded-xl p-4 md:p-6 w-full overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)' 
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
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
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm max-w-full"
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
              className="form-select w-full max-w-full"
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
              className="form-select w-full max-w-full"
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>

          {/* Acciones */}
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2 md:gap-2 w-full">
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full md:w-auto max-w-full"
            >
              <FiSearch className="w-4 h-4 flex-shrink-0" />
              Buscar
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm w-full md:w-auto max-w-full"
            >
              <FiDownload className="w-4 h-4 flex-shrink-0" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de actividades */}
      <div 
        className="rounded-xl overflow-hidden w-full"
        style={{ 
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Encabezado de la tabla */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b w-full" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Actividades del Sistema
            </h3>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {pagination.totalItems} registros total
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 w-full">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
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
              <p style={{ color: 'var(--text-secondary)' }}>No se encontraron registros</p>
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
                    className="py-3 md:py-4 flex items-start gap-3 md:gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    {ICONS[iconType]}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium break-words" style={{ color: 'var(--text-primary)' }}>
                        {description}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        <span className="whitespace-nowrap">{formatRelativeTime(activity.created_at || new Date().toISOString())}</span>
                        {userName && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate max-w-[100px] sm:max-w-none">{userName}</span>
                          </>
                        )}
                        {typeof metadata?.folio === 'string' && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-mono truncate max-w-[80px] sm:max-w-none">{metadata.folio}</span>
                          </>
                        )}
                        <span className="hidden sm:inline">•</span>
                        <span className="font-mono text-xs px-1 md:px-2 py-1 rounded whitespace-nowrap" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          {eventType}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Paginación */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 w-full" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-sm text-center sm:text-left" style={{ color: 'var(--text-secondary)' }}>
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
              <span className="px-3 py-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
