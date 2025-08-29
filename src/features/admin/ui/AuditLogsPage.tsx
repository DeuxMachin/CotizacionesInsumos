"use client";

import { useState, useEffect } from "react";
import { useAuditLogger, type AuditEvent, type AuditEventType } from "@/shared/lib/auditLogger";
import { FiClock, FiUser, FiActivity, FiAlertTriangle, FiDownload, FiFilter } from "react-icons/fi";

export function AuditLogsPage() {
  const { getEvents, getRecentEvents } = useAuditLogger();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [filters, setFilters] = useState({
    eventType: '' as AuditEventType | '',
    resource: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const allEvents = getEvents();
    setEvents(allEvents);
    setFilteredEvents(allEvents);
  }, []); // Eliminar getEvents de las dependencias

  useEffect(() => {
    let filtered = events;

    if (filters.eventType) {
      filtered = filtered.filter(e => e.eventType === filters.eventType);
    }
    if (filters.resource) {
      filtered = filtered.filter(e => e.resource.toLowerCase().includes(filters.resource.toLowerCase()));
    }
    if (filters.userId) {
      filtered = filtered.filter(e => 
        e.userId.toLowerCase().includes(filters.userId.toLowerCase()) ||
        e.userEmail.toLowerCase().includes(filters.userId.toLowerCase())
      );
    }
    if (filters.startDate) {
      filtered = filtered.filter(e => e.timestamp >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(e => e.timestamp <= new Date(filters.endDate));
    }

    setFilteredEvents(filtered);
  }, [filters, events]);

  const getEventIcon = (eventType: AuditEventType) => {
    switch (eventType) {
      case 'LOGIN':
      case 'LOGOUT':
        return <FiUser className="w-4 h-4" />;
      case 'UNAUTHORIZED_ACCESS':
      case 'PERMISSION_DENIED':
        return <FiAlertTriangle className="w-4 h-4" />;
      default:
        return <FiActivity className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: AuditEventType) => {
    switch (eventType) {
      case 'LOGIN':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'LOGOUT':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'CREATE':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30';
      case 'UPDATE':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'DELETE':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'UNAUTHORIZED_ACCESS':
      case 'PERMISSION_DENIED':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const exportLogs = () => {
    const data = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-theme-card rounded-xl p-6 border border-theme-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center">
              <FiActivity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-theme-primary">Logs de Auditoría</h1>
              <p className="text-theme-secondary">
                Registro de actividades del sistema ({filteredEvents.length} eventos)
              </p>
            </div>
          </div>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-theme-button text-theme-button-text rounded-lg hover:bg-theme-button-hover transition-colors flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-theme-card rounded-xl p-6 border border-theme-subtle">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="w-5 h-5 text-theme-secondary" />
          <h3 className="font-semibold text-theme-primary">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Tipo de Evento
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value as AuditEventType }))}
              className="w-full p-2 border border-theme-subtle rounded-lg bg-theme-card text-theme-primary focus:ring-2 focus:ring-theme-accent focus:border-theme-accent"
            >
              <option value="">Todos</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="VIEW">Ver</option>
              <option value="EXPORT">Exportar</option>
              <option value="UNAUTHORIZED_ACCESS">Acceso No Autorizado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Recurso
            </label>
            <input
              type="text"
              value={filters.resource}
              onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
              placeholder="Filtrar por recurso..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              placeholder="ID o email..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Fecha Desde
            </label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Fecha Hasta
            </label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilters({ eventType: '', resource: '', userId: '', startDate: '', endDate: '' })}
            className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
        <div className="max-h-96 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FiActivity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron eventos con los filtros aplicados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getEventColor(event.eventType)}`}>
                      {getEventIcon(event.eventType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {event.eventType}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {event.resource}/{event.action}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <FiClock className="w-4 h-4" />
                          {event.timestamp.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <FiUser className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {event.userEmail}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            ({event.userRole})
                          </span>
                        </div>
                        
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div className="text-gray-600 dark:text-gray-400">
                            {JSON.stringify(event.details, null, 0).substring(0, 100)}
                            {JSON.stringify(event.details).length > 100 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
