"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiUsers,
  FiMapPin,
  FiClock,
  FiFilter,
  FiSearch,
  FiEye,
  FiX,
  FiCalendar,
  FiUser,
  FiPlay,
  FiCheckCircle,
  FiRefreshCw
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";

interface LocationData {
  lat?: number;
  lng?: number;
  address?: string;
}

interface ApiReunionData {
  id: number;
  obraId?: number;
  obra_id?: number;
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  userRole?: string;
  obraNombre?: string;
  obra_nombre?: string;
  tipo?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status?: string;
  location?: string | LocationData;
  notas?: string;
}

interface ReunionData {
  id: number;
  obraId: number;
  userId: string;
  userName: string;
  userRole?: string;
  obraNombre: string;
  tipo: string;
  startTime: Date;
  endTime?: Date;
  status: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  notas?: string;
}

export default function ReunionesDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { createHeaders } = useAuthHeaders();
  const [reuniones, setReuniones] = useState<ReunionData[]>([]);
  const [loading, setLoading] = useState(false); // Cambiar a false por defecto
  const [updating, setUpdating] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Referencia para comparar cambios sin causar re-renders
  const reunionesRef = useRef<ReunionData[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [showFilters, setShowFilters] = useState(false);

  const isOwner = user?.role === 'dueño';

  // Función para cargar reuniones
  const loadReuniones = useCallback(async (isBackgroundUpdate = false) => {
    try {
      // Solo mostrar loading para carga inicial, no para background updates
      if (!isBackgroundUpdate && !initialLoadDone) {
        setLoading(true);
      } else if (isBackgroundUpdate) {
        setUpdating(true);
      }

      const response = await fetch('/api/reuniones', {
        headers: createHeaders()
      });

      if (response.ok) {
        const data = await response.json();

        // Transformar los datos
        const transformedData = data.map((reunion: ApiReunionData) => {
          // Validar y convertir fechas (API nueva usa camelCase)
          const startTime = reunion.startTime ? new Date(reunion.startTime) : (reunion.start_time ? new Date(reunion.start_time) : new Date());
          const endTime = reunion.endTime ? new Date(reunion.endTime) : (reunion.end_time ? new Date(reunion.end_time) : undefined);

          // Verificar que las fechas sean válidas
          if (isNaN(startTime.getTime())) {
            console.warn('Fecha de inicio inválida para reunión:', reunion.id, reunion.startTime || reunion.start_time);
          }
          if (endTime && isNaN(endTime.getTime())) {
            console.warn('Fecha de fin inválida para reunión:', reunion.id, reunion.endTime || reunion.end_time);
          }

          return {
            id: reunion.id,
            obraId: reunion.obraId ?? reunion.obra_id,
            userId: reunion.userId ?? reunion.user_id,
            userName: reunion.userName ?? reunion.user_name ?? 'Usuario',
            userRole: reunion.userRole,
            obraNombre: reunion.obraNombre ?? reunion.obra_nombre ?? 'Obra',
            tipo: reunion.tipo || 'reunion',
            startTime,
            endTime,
            status: reunion.status,
            location: reunion.location ? (typeof reunion.location === 'string' ? JSON.parse(reunion.location) : reunion.location) : undefined,
            notas: reunion.notas
          };
        });

        // Comparar si hay cambios reales (basado en IDs y timestamps)
        const currentIds = reunionesRef.current.map((r: ReunionData) => `${r.id}-${r.endTime?.getTime() || r.startTime.getTime()}`).sort();
        const newIds = transformedData.map((r: ReunionData) => `${r.id}-${r.endTime?.getTime() || r.startTime.getTime()}`).sort();
        const hasChanges = currentIds.join(',') !== newIds.join(',');

        if (hasChanges) {
          console.log('🔄 Actualizando reuniones:', isBackgroundUpdate ? 'background' : 'initial', transformedData.length, 'reuniones');
          setReuniones(transformedData);
          reunionesRef.current = transformedData; // Actualizar la referencia
        } else if (!isBackgroundUpdate) {
          console.log('✅ Reuniones cargadas (sin cambios):', transformedData.length);
        }
      } else {
        console.error('Error al cargar reuniones:', response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar reuniones:', error);
    } finally {
      // Solo quitar loading para carga inicial
      if (!isBackgroundUpdate && !initialLoadDone) {
        setLoading(false);
        setInitialLoadDone(true);
      } else if (isBackgroundUpdate) {
        setUpdating(false);
      }
    }
  }, [createHeaders, initialLoadDone]);

  // Mantener sincronizada la referencia con el estado
  useEffect(() => {
    reunionesRef.current = reuniones;
  }, [reuniones]);

  // Cargar reuniones iniciales (rápido, sin bloquear UI)
  useEffect(() => {
    if (user && !initialLoadDone) {
      loadReuniones(false);
    }
  }, [user, loadReuniones, initialLoadDone]);

  // Polling en segundo plano cada 30 segundos (solo después de carga inicial)
  useEffect(() => {
    if (!user || !initialLoadDone) return;

    const interval = setInterval(() => {
      loadReuniones(true);
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user, loadReuniones, initialLoadDone]);

  // Filtrar reuniones según el modo de vista
  const filteredReuniones = useMemo(() => {
    let baseReuniones = reuniones;

    // Filtrar por estado según el modo
    if (viewMode === 'active') {
      baseReuniones = reuniones.filter(reunion => reunion.status === 'abierta');
    } else {
      baseReuniones = reuniones.filter(reunion => reunion.status === 'cerrada');
    }

    // Aplicar otros filtros
    return baseReuniones.filter(reunion => {
      const matchesSearch = !searchTerm ||
        reunion.obraNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reunion.userName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUser = !selectedUser || reunion.userId === selectedUser;

      // Si no es dueño, solo mostrar sus propias reuniones
      const hasPermission = user?.role === 'dueño' || reunion.userId === user?.id;

      return matchesSearch && matchesUser && hasPermission;
    });
  }, [reuniones, searchTerm, selectedUser, user, viewMode]);

  // Obtener usuarios únicos para el filtro
  const uniqueUsers = useMemo(() => {
    const users = new Map();
    reuniones.forEach(reunion => {
      if (reunion.userName && !users.has(reunion.userId)) {
        users.set(reunion.userId, {
          id: reunion.userId,
          name: reunion.userName
        });
      }
    });
    return Array.from(users.values());
  }, [reuniones]);

  const handleCheckout = async (obraId: number) => {
    try {
      const response = await fetch(`/api/reuniones/checkout/${obraId}`, {
        method: 'POST',
        headers: createHeaders()
      });

      if (response.ok) {
        // Recargar las reuniones inmediatamente después del checkout
        await loadReuniones(false);
      } else {
        console.error('Error al finalizar reunión:', response.statusText);
      }
    } catch (error) {
      console.error('Error al finalizar reunión:', error);
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    // Validar fechas
    if (!startTime || isNaN(startTime.getTime())) {
      return 'Fecha inválida';
    }

    // Si hay endTime válido, usarlo; de lo contrario, usar ahora (en curso)
    const end = endTime && !isNaN(endTime.getTime()) ? endTime : new Date();
    let diff = end.getTime() - startTime.getTime();

    if (diff < 0) {
      return 'Fecha futura';
    }

    // Evitar mostrar 0m cuando end == start en reuniones finalizadas
    if (endTime && !isNaN(endTime.getTime()) && diff === 0) {
      diff = 60 * 1000; // contar al menos 1 minuto
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading && !initialLoadDone) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Control de Reuniones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gestiona las reuniones en obras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            {reuniones.filter(r => r.status === 'abierta').length} activas
          </span>
          <button
            onClick={() => loadReuniones(false)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Actualizar reuniones"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {updating && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-gray-600"></div>
              Actualizando...
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiUsers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Reuniones Activas</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {reuniones.filter(r => r.status === 'abierta').length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiClock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Hoy</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {reuniones.filter(r => {
                  const today = new Date();
                  const reunionDate = r.startTime;
                  return reunionDate.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiMapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Con Ubicación</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {reuniones.filter(r => r.location).length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiCalendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Esta Semana</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {reuniones.filter(r => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return r.startTime >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 p-1 border rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        <button
          onClick={() => setViewMode('active')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
          style={viewMode === 'active' ? {} : { color: 'var(--text-secondary)' }}
        >
          Activas ({reuniones.filter(r => r.status === 'abierta').length})
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            viewMode === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
          style={viewMode === 'history' ? {} : { color: 'var(--text-secondary)' }}
        >
          Historial ({reuniones.filter(r => r.status === 'cerrada').length})
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por obra o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-200' : ''
          }`}
          style={{
            backgroundColor: showFilters ? 'var(--primary-light)' : 'var(--card-bg)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)'
          }}
        >
          <FiFilter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Filtros expandidos */}
      {showFilters && (
        <div className="p-4 border rounded-lg" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Usuario
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Todos los usuarios</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reuniones */}
      <div className="space-y-4">
        {filteredReuniones.length === 0 ? (
          <div className="text-center py-12">
            <FiUsers className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {viewMode === 'active' ? 'No hay reuniones activas' : 'No hay reuniones en el historial'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm || selectedUser 
                ? `No se encontraron ${viewMode === 'active' ? 'reuniones activas' : 'reuniones'} con los filtros aplicados.` 
                : !initialLoadDone
                  ? 'Cargando reuniones...'
                  : viewMode === 'active' 
                    ? 'Las reuniones activas aparecerán aquí.' 
                    : 'El historial de reuniones aparecerá aquí.'
              }
            </p>
          </div>
        ) : (
          filteredReuniones.map((reunion) => (
            <ReunionCard
              key={reunion.id}
              reunion={reunion}
              onCheckout={viewMode === 'active' ? () => handleCheckout(reunion.obraId) : undefined}
              onViewObra={() => router.push(`/dashboard/obras/${reunion.obraId}`)}
              formatDuration={formatDuration}
              isActive={viewMode === 'active'}
              isOwner={user?.role === 'dueño'}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ReunionCardProps {
  reunion: ReunionData;
  onCheckout?: () => void;
  onViewObra: () => void;
  formatDuration: (startTime: Date, endTime?: Date) => string;
  isActive: boolean;
  isOwner: boolean;
}

function ReunionCard({ reunion, onCheckout, onViewObra, formatDuration, isActive, isOwner }: ReunionCardProps) {
  return (
    <div className="p-4 sm:p-6 border rounded-lg hover:shadow-md transition-all duration-200" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header con información principal */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2 rounded-lg flex-shrink-0 ${isActive ? 'bg-green-100' : 'bg-blue-100'}`}>
              <FiUsers className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {reunion.obraNombre || 'Obra sin nombre'}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <FiUser className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                    {reunion.userName || 'Usuario desconocido'}{reunion.userRole ? ` · ${reunion.userRole}` : ''}
                  </span>
                </div>
                {isOwner && (
                  <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium border border-orange-200">
                    Dueño
                  </span>
                )}
                {reunion.status === 'abierta' && (
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium border border-green-200">
                    Activa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Información de tiempo y estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {!isActive && (
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <div className="min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Fecha y Horario
                  </span>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {reunion.startTime && reunion.endTime && !isNaN(reunion.startTime.getTime()) && !isNaN(reunion.endTime.getTime())
                      ? `${reunion.startTime.toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })} ${reunion.startTime.toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - ${reunion.endTime.toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}`
                      : 'Fechas inválidas'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <FiClock className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="min-w-0">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isActive ? 'En curso' : 'Duración'}
                </span>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {formatDuration(reunion.startTime, reunion.endTime)}
                </p>
              </div>
            </div>

            {isActive && (
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 flex-shrink-0 text-green-500" />
                <div className="min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Iniciada
                  </span>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {reunion.startTime && !isNaN(reunion.startTime.getTime())
                      ? reunion.startTime.toLocaleString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Fecha inválida'}
                  </p>
                </div>
              </div>
            )}

            {isOwner && reunion.location && (
              <div className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <div className="min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Ubicación
                  </span>
                  <p className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                    {reunion.location.address ||
                     (reunion.location.lat && reunion.location.lng ?
                       `${reunion.location.lat.toFixed(4)}, ${reunion.location.lng.toFixed(4)}` :
                       'Registrada')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Estado de la reunión */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {isActive ? 'Reunión Activa' : 'Reunión Finalizada'}
            </div>
            {reunion.tipo && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {reunion.tipo}
              </div>
            )}
          </div>

          {/* Notas si existen */}
          {reunion.notas && (
            <div className="mb-4 p-3 rounded-lg bg-gray-50" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-medium">Notas:</span> {reunion.notas}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            onClick={onViewObra}
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <FiEye className="w-4 h-4" />
            <span className="hidden sm:inline">Ver Obra</span>
          </button>

          {isActive && onCheckout && (
            <button
              onClick={onCheckout}
              className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <FiX className="w-4 h-4" />
              <span className="hidden sm:inline">Finalizar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}