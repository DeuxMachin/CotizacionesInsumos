"use client";

import { useState, useMemo } from "react";
import { useAuditLogger, type AuditEventType } from "@/shared/lib/auditLogger";
import { FiDownload, FiFilter, FiSearch, FiCalendar, FiUser, FiActivity, FiAlertTriangle } from "react-icons/fi";

export function AuditLogsPage() {
  const { getEvents, getRecentEvents } = useAuditLogger();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<AuditEventType | "ALL">("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });

  // Obtener todos los eventos
  const allEvents = getEvents();

  // Obtener usuarios únicos para el filtro
  const uniqueUsers = useMemo(() => {
    const users = new Map();
    allEvents.forEach(event => {
      if (!users.has(event.userId)) {
        users.set(event.userId, {
          id: event.userId,
          email: event.userEmail,
          role: event.userRole
        });
      }
    });
    return Array.from(users.values());
  }, [allEvents]);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    // Filtro por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      events = events.filter(event => 
        event.userEmail.toLowerCase().includes(term) ||
        event.action.toLowerCase().includes(term) ||
        event.resource.toLowerCase().includes(term) ||
        event.eventType.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo de evento
    if (selectedEventType !== "ALL") {
      events = events.filter(event => event.eventType === selectedEventType);
    }

    // Filtro por usuario
    if (selectedUserId !== "ALL") {
      events = events.filter(event => event.userId === selectedUserId);
    }

    // Filtro por rango de fechas
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      events = events.filter(event => event.timestamp >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Final del día
      events = events.filter(event => event.timestamp <= endDate);
    }

    return events;
  }, [allEvents, searchTerm, selectedEventType, selectedUserId, dateRange]);

  // Exportar eventos
  const handleExport = () => {
    const dataStr = JSON.stringify(filteredEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Obtener color del badge según el tipo de evento
  const getEventTypeColor = (eventType: AuditEventType) => {
    switch (eventType) {
      case 'LOGIN':
      case 'LOGOUT':
        return {
          backgroundColor: 'var(--info-bg)',
          color: 'var(--info-text)'
        };
      case 'CREATE':
        return {
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success-text)'
        };
      case 'UPDATE':
        return {
          backgroundColor: 'var(--warning-bg)',
          color: 'var(--warning-text)'
        };
      case 'DELETE':
        return {
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger-text)'
        };
      case 'UNAUTHORIZED_ACCESS':
      case 'PERMISSION_DENIED':
        return {
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger-text)'
        };
      case 'EXPORT':
        return {
          backgroundColor: '#f3e8ff', // purple-100
          color: '#7e22ce'  // purple-700
        };
      default:
        return {
          backgroundColor: 'var(--neutral-bg)',
          color: 'var(--neutral-text)'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-theme-primary">Registro de Auditoría</h2>
          <p className="text-theme-secondary">
            Monitorea actividad del sistema y accesos de usuario
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded" 
              style={{ 
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info-text)'
              }}
            >
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {allEvents.length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Eventos
              </div>
            </div>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success-text)'
              }}
            >
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {uniqueUsers.length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Usuarios Activos
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning-text)'
              }}
            >
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <div 
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {getRecentEvents(24).length}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Últimas 24h
              </div>
            </div>
          </div>
        </div>

        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-theme-primary">
                {allEvents.filter(e => e.eventType === 'UNAUTHORIZED_ACCESS').length}
              </div>
              <div className="text-sm text-theme-secondary">Accesos Denegados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div 
        className="p-4 rounded-lg space-y-4"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="w-4 h-4 text-theme-secondary" />
          <span className="font-medium text-theme-primary">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Tipo de evento */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value as AuditEventType | "ALL")}
            className="input-field"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="LOGIN">Inicios de sesión</option>
            <option value="LOGOUT">Cierres de sesión</option>
            <option value="CREATE">Creaciones</option>
            <option value="UPDATE">Actualizaciones</option>
            <option value="DELETE">Eliminaciones</option>
            <option value="VIEW">Visualizaciones</option>
            <option value="EXPORT">Exportaciones</option>
            <option value="UNAUTHORIZED_ACCESS">Accesos denegados</option>
          </select>

          {/* Usuario */}
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="input-field"
          >
            <option value="ALL">Todos los usuarios</option>
            {uniqueUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email} ({user.role})
              </option>
            ))}
          </select>

          {/* Fecha desde */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input-field flex-1"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input-field flex-1"
            />
          </div>
        </div>

        {/* Limpiar filtros */}
        {(searchTerm || selectedEventType !== "ALL" || selectedUserId !== "ALL" || dateRange.start || dateRange.end) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedEventType("ALL");
              setSelectedUserId("ALL");
              setDateRange({ start: "", end: "" });
            }}
            className="btn-ghost text-sm"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de eventos */}
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Evento</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Recurso</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Acción</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-theme-secondary">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-theme-secondary">
                    No se encontraron eventos que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr 
                    key={event.id}
                    className="hover:bg-theme-secondary/50 transition-colors"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3 text-sm text-theme-primary">
                      <div>{event.timestamp.toLocaleDateString()}</div>
                      <div className="text-xs text-theme-secondary">
                        {event.timestamp.toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-theme-primary">{event.userEmail}</div>
                      <div className="text-xs text-theme-secondary">{event.userRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-primary">{event.resource}</td>
                    <td className="px-4 py-3 text-sm text-theme-secondary">{event.action}</td>
                    <td className="px-4 py-3 text-sm">
                      {event.details && Object.keys(event.details).length > 0 ? (
                        <details>
                          <summary className="cursor-pointer text-theme-secondary hover:text-theme-primary">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 text-xs bg-theme-secondary/30 p-2 rounded overflow-auto max-w-xs">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-theme-muted">Sin detalles</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación o información adicional */}
      <div className="flex justify-between items-center text-sm text-theme-secondary">
        <span>
          Mostrando {filteredEvents.length} de {allEvents.length} eventos
        </span>
        <span>
          Último evento: {allEvents.length > 0 ? allEvents[0].timestamp.toLocaleString() : 'N/A'}
        </span>
      </div>
    </div>
  );
}
