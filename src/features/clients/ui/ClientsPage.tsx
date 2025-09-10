"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/navigation';
import { type ClientExtended, type ClientStatus, mapRowToClientExtended } from "../model/clientsExtended";
import type { ClienteRow } from '../model/clients';
import { Toast } from "@/shared/ui/Toast";
import { useAuth } from "@/features/auth/model/useAuth";
import { useActionAuthorization } from "@/middleware/AuthorizationMiddleware";
import { ClientFiltersPanel } from "./ClientFiltersPanel";
import { 
  FiUsers, 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiPlus,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiActivity,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";


// Types para componentes
interface ClientCardProps {
  client: ClientExtended;
  getStatusColor: GetStatusColor;
  formatMoney: (amount: number) => string;
  onEliminar: (clientId: number) => void;
  onVerDetalle: (client: ClientExtended) => void;
  financial?: { movimientos: number; porCobrar: number };
}

interface ClientsTableProps {
  clients: ClientExtended[];
  getStatusColor: GetStatusColor;
  formatMoney: (amount: number) => string;
  onEliminar: (clientId: number) => void;
  onVerDetalle: (client: ClientExtended) => void;
  financialMap: Record<number, { movimientos: number; porCobrar: number }>;
}

interface GetStatusColor {
  (status: ClientStatus): { bg: string; text: string };
}




function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

export function ClientsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canCreate, canDelete } = useActionAuthorization();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<ClientStatus[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientExtended[]>([]);
  interface QuoteAgg { total: number; estadoTotals: Record<string, number>; }
  interface QuoteRow { cliente_principal_id?: number | null; total_final?: number | null; total_neto?: number | null; estado?: string | null; }
  const [quotesAgg, setQuotesAgg] = useState<Record<number, QuoteAgg>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Fetch de clientes
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true); setError(null);
        const url = searchTerm.length > 1 ? `/api/clientes?search=${encodeURIComponent(searchTerm)}` : '/api/clientes';
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Error al cargar clientes');
        const body = await res.json();
  const rows = (body.data || []) as ClienteRow[];
  setClients(rows.map(r => mapRowToClientExtended(r)));
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'Error desconocido';
        console.error(e); setError(msg); Toast.error('No se pudieron cargar los clientes');
      } finally { setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [searchTerm]);

  // Cargar agregados de cotizaciones (suma total_final y por estado) para todos los clientes visibles (simple: traer todas y agrupar client-side)
  useEffect(() => {
    let cancelled = false;
    async function loadQuotes() {
      try {
        setQuotesLoading(true);
        const res = await fetch('/api/cotizaciones');
        if (!res.ok) throw new Error('Error al cargar cotizaciones');
        const body = await res.json();
        const list: QuoteRow[] = (body.data || []) as QuoteRow[];
        const agg: Record<number, QuoteAgg> = {};
        for (const q of list) {
          const cid = q.cliente_principal_id ?? undefined;
          if (!cid) continue;
          if (!agg[cid]) agg[cid] = { total: 0, estadoTotals: {} };
          const amount = (q.total_final ?? q.total_neto ?? 0) || 0;
          agg[cid].total += amount;
          const est = q.estado ?? 'borrador';
          agg[cid].estadoTotals[est] = (agg[cid].estadoTotals[est] || 0) + amount;
        }
        if (!cancelled) setQuotesAgg(agg);
      } catch (e) {
        console.error(e);
      } finally { if (!cancelled) setQuotesLoading(false); }
    }
    loadQuotes();
    return () => { cancelled = true; };
  }, []);
  
  const pageSize = 9; // 3 filas x 3 columnas
  const isAdmin = user?.rol?.toLowerCase() === 'admin';

  // Filtros y datos procesados
  const data = useMemo(() => {
    let out = [...clients];
    
    // Aplicar filtro de estado
    if (selectedStates.length > 0) {
      out = out.filter((c) => selectedStates.includes(c.status));
    }
    
    // Aplicar filtro de región
    if (selectedRegions.length > 0) {
      out = out.filter((c) => selectedRegions.includes(c.region));
    }
    return out;
  }, [clients, selectedStates, selectedRegions]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clients.length;
    const vigentes = clients.filter(c => c.status === 'vigente').length;
    const morosos = clients.filter(c => c.status === 'moroso').length;
    const inactivos = clients.filter(c => c.status === 'inactivo').length;
    // Financiero: usamos agregados de cotizaciones.
    // Asunción temporal: totalFacturado = suma de cotizaciones en estado 'aprobada'
    // PorCobrar = suma de cotizaciones en estado 'enviada' + 'borrador' (potenciales) + 'aprobada' aún no convertidas (sin tabla de pagos todavía)
    let totalFacturado = 0;
    let totalPorCobrar = 0;
    Object.values(quotesAgg).forEach(v => {
      const aprobada = v.estadoTotals['aprobada'] || 0;
      totalFacturado += aprobada;
      const enviada = v.estadoTotals['enviada'] || 0;
      const borrador = v.estadoTotals['borrador'] || 0;
      const aprobadaPend = aprobada; // hasta tener pagos se suma también a por cobrar
      totalPorCobrar += enviada + borrador + aprobadaPend;
    });
    return { total, vigentes, morosos, inactivos, totalFacturado, totalPorCobrar };
  }, [clients, quotesAgg]);

  // Mapa financiero por cliente para reutilizar en tarjetas y tabla
  const financialByClient = useMemo(() => {
    const m: Record<number, { movimientos: number; porCobrar: number }> = {};
    for (const [cidStr, v] of Object.entries(quotesAgg)) {
      const cid = Number(cidStr);
      const et = v.estadoTotals;
      const movimientos = v.total;
      const porCobrar = (et['borrador'] || 0) + (et['enviada'] || 0) + (et['aprobada'] || 0);
      m[cid] = { movimientos, porCobrar };
    }
    return m;
  }, [quotesAgg]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page]);

  // Reset pagination cuando cambian filtros
  useEffect(() => { setPage(1); }, [searchTerm, selectedStates, selectedRegions]);

  // Filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (selectedStates.length > 0) count++;
    if (selectedRegions.length > 0) count++;
    if (searchTerm) count++;
    return count;
  }, [selectedStates, selectedRegions, searchTerm]);

  // Obtener regiones únicas
  const regiones = useMemo(() => {
    const regionesSet = new Set(clients.map(client => client.region).filter(Boolean));
    return Array.from(regionesSet).sort();
  }, [clients]);

  // Obtener color según estado
  const getStatusColor: GetStatusColor = (status: ClientStatus) => {
    const colores: Record<ClientStatus, { bg: string; text: string }> = {
      vigente: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      moroso: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      inactivo: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
    };
    return colores[status] ?? colores.vigente; // fallback defensivo
  };

  // Handlers
  const handleEliminar = async () => {
    if (!canDelete('clients')) {
      Toast.error('No tienes permisos para eliminar clientes');
      return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      // Aquí iría la lógica real de eliminación
      Toast.success('Cliente eliminado exitosamente');
    }
  };

  const handleVerDetalle = (client: ClientExtended) => {
    router.push(`/dashboard/clientes/${client.id}`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStates([]);
    setSelectedRegions([]);
  };

  const goToPage = (pageNum: number) => {
    setPage(pageNum);
  };

  const goToNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const goToPrevPage = () => {
    if (page > 1) setPage(page - 1);
  };



  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <FiUsers className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              Gestión de Clientes
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isAdmin ? 'Vista completa de todos los clientes del sistema' : 'Administra tu cartera de clientes'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 relative"
            >
              <FiFilter className="w-4 h-4" />
              Filtros
              {filtrosActivos > 0 && (
                <span 
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                >
                  {filtrosActivos}
                </span>
              )}
            </button>
            {canCreate('clients') && (
              <button 
                onClick={() => router.push('/dashboard/clientes/nuevo')}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Nuevo Cliente
              </button>
            )}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Buscar por razón social, RUT, contacto, dirección o comuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'grid' ? { color: 'var(--text-secondary)' } : {}}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="w-1 h-1 rounded-full bg-current"></div>
                <div className="w-1 h-1 rounded-full bg-current"></div>
                <div className="w-1 h-1 rounded-full bg-current"></div>
                <div className="w-1 h-1 rounded-full bg-current"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-orange-500 text-white' : ''}`}
              style={viewMode !== 'table' ? { color: 'var(--text-secondary)' } : {}}
            >
              <div className="w-4 h-4 flex flex-col gap-0.5">
                <div className="w-4 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Filtros Activos */}
        {filtrosActivos > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Filtros activos:
            </span>
            {selectedStates.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
                Estados: {selectedStates.length}
                <button
                  onClick={() => setSelectedStates([])}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            {selectedRegions.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}>
                Regiones: {selectedRegions.length}
                <button
                  onClick={() => setSelectedRegions([])}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            {searchTerm && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm" 
                   style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>
                Búsqueda activa
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ 
                color: 'var(--text-muted)',
                textDecoration: 'underline'
              }}
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded flex-shrink-0"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiUsers className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {stats.total}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Total Clientes
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
              className="p-2 rounded flex-shrink-0"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiActivity className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {stats.vigentes}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Vigentes
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
              className="p-2 rounded flex-shrink-0"
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiClock className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {stats.morosos}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Morosos
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
              className="p-2 rounded flex-shrink-0"
              style={{ backgroundColor: 'var(--neutral-bg)', color: 'var(--neutral-text)' }}
            >
              <FiUsers className="w-5 h-5" />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xl md:text-2xl font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {stats.inactivos}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Inactivos
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
              style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
            >
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCLP(stats.totalFacturado)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Total Facturado
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
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatCLP(stats.totalPorCobrar)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Por Cobrar
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes - Vista Grid */}
      {loading && (
        <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>Cargando clientes...</div>
      )}
      {!loading && viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageData.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              getStatusColor={getStatusColor}
              formatMoney={formatCLP}
              onEliminar={handleEliminar}
              onVerDetalle={handleVerDetalle}
              financial={financialByClient[client.id]}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <ClientsTable 
            clients={pageData}
            getStatusColor={getStatusColor}
            formatMoney={formatCLP}
            onEliminar={handleEliminar}
            onVerDetalle={handleVerDetalle}
            financialMap={financialByClient}
          />
        )
      )}

      {/* Mensaje cuando no hay clientes */}
  {!loading && pageData.length === 0 && (
        <div className="text-center py-12">
          <FiUsers className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No se encontraron clientes
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm || selectedStates.length > 0 || selectedRegions.length > 0
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm w-full sm:w-auto text-center sm:text-left" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, data.length)} de {data.length} clientes
          </div>

          {/* Paginación comprimida */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={goToPrevPage}
              disabled={page === 1}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              aria-label="Página anterior"
            >
              <FiChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {/* Números de página (ocultar en pantallas muy pequeñas) */}
            <div className="hidden xs:flex items-center gap-1 max-w-full overflow-x-auto scrollbar-thin px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {(() => {
                // Grupos de 10 páginas: 1-10, 11-20, 21-30...
                const groupIndex = Math.floor((page - 1) / 10); // índice de grupo (0,1,2...)
                const start = groupIndex * 10 + 1;              // primera página del grupo
                const end = Math.min(start + 9, totalPages);     // última página del grupo (máx 10 botones)
                const buttons: React.ReactNode[] = [];

                for (let p = start; p <= end; p++) {
                  const isCurrent = p === page;
                  buttons.push(
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`min-w-[36px] px-2 sm:px-3 py-2 text-sm font-medium rounded-lg transition ${isCurrent ? 'text-white' : 'border'}`}
                      style={isCurrent ? { backgroundColor: 'var(--accent-primary)' } : { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      aria-current={isCurrent ? 'page' : undefined}
                      aria-label={`Página ${p}`}
                    >{p}</button>
                  );
                }

                return buttons; // solo los 10 (o menos) números del grupo actual
              })()}
            </div>

            {/* Resumen compacto para móviles */}
            <div className="xs:hidden text-xs px-2" style={{ color: 'var(--text-secondary)' }}>
              Pág {page}/{totalPages}
            </div>

            <button
              onClick={goToNextPage}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-2 sm:px-3 py-2 text-sm font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              aria-label="Página siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Panel de Filtros */}
      {showFilters && (
        <ClientFiltersPanel
          isOpen={showFilters}
          selectedStates={selectedStates}
          setSelectedStates={setSelectedStates}
          selectedRegions={selectedRegions}
          setSelectedRegions={setSelectedRegions}
          regiones={regiones}
          onClose={() => setShowFilters(false)}
          onClear={handleClearFilters}
        />
      )}
    </div>
  );
}

// Componente para tarjeta individual de cliente
function ClientCard({ client, getStatusColor, formatMoney, onEliminar, onVerDetalle, financial }: ClientCardProps) {
  const { canEdit, canDelete } = useActionAuthorization();
  const statusColor = getStatusColor(client.status);
  const totalMovimientos = financial?.movimientos ?? (client.paid + client.pending + client.partial + client.overdue);
  const totalPorCobrar = financial?.porCobrar ?? (client.pending + client.partial + client.overdue);
  
  return (
    <div
      onClick={() => onVerDetalle(client)}
      className="rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)'
      }}
    >
      <div className="p-6">
        {/* Header con título y estado */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {client.razonSocial}
          </h3>
          <span 
            className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap"
            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
          >
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </span>
        </div>

        {/* RUT y Giro */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded" 
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              RUT: {client.rut}
            </span>
          </div>
          <p className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
            {client.giro}
          </p>
        </div>

        {/* Ubicación */}
        <div className="flex items-start gap-2 mb-4">
          <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div className="min-w-0">
            <p className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
              {client.direccion}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {client.comuna}, {client.region}
            </p>
          </div>
        </div>

        {/* Contacto */}
        {client.contactoNombre && (
          <div className="flex items-center gap-2 mb-4">
            <FiPhone className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <div className="min-w-0">
              <span className="text-sm font-medium block truncate" style={{ color: 'var(--text-primary)' }}>
                {client.contactoNombre}
              </span>
              {client.contactoEmail && (
                <span className="text-xs block truncate" style={{ color: 'var(--text-muted)' }}>
                  {client.contactoEmail}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Información financiera */}
        <div 
          className="grid grid-cols-2 gap-4 py-3 border-t border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Movimientos</p>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {formatMoney(totalMovimientos)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Por Cobrar</p>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--warning-text)' }}>
              {formatMoney(totalPorCobrar)}
            </p>
          </div>
        </div>

        {/* Detalles adicionales */}
        <div className="flex items-center justify-between mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div>
            Crédito: {formatMoney(client.creditLine)}
          </div>
          <div>
            Descuento: {client.discount}%
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVerDetalle(client);
              }}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Ver detalles"
            >
              <FiEye className="w-4 h-4" />
            </button>
            {canEdit('clients') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  Toast.info(`Editando ${client.razonSocial}`);
                }}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                title="Editar"
              >
                <FiEdit3 className="w-4 h-4" />
              </button>
            )}
            {canDelete('clients') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminar(client.id);
                }}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                title="Eliminar"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {client.tipoEmpresa}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para vista de tabla
function ClientsTable({ clients, getStatusColor, formatMoney, onEliminar, onVerDetalle, financialMap }: ClientsTableProps) {
  const { canEdit, canDelete } = useActionAuthorization();
  
  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full min-w-[800px]">
          <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Ubicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Total Movimientos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {clients.map((client) => {
              const statusColor = getStatusColor(client.status);
              const fin = financialMap[client.id];
              const totalMovimientos = fin?.movimientos ?? (client.paid + client.pending + client.partial + client.overdue);
              const totalPorCobrar = fin?.porCobrar ?? (client.pending + client.partial + client.overdue);
              
              return (
                <tr 
                  key={client.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onVerDetalle(client)}
                  style={{ backgroundColor: 'var(--card-bg)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg)'}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                        {client.razonSocial}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        RUT: {client.rut}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {client.contactoNombre || '-'}
                      </div>
                      {client.contactoEmail && (
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {client.contactoEmail}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                    >
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {client.comuna}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {client.region}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>{formatMoney(totalMovimientos)}</div>
                    <div className="text-xs" style={{ color: 'var(--warning-text)' }}>Por Cobrar: {formatMoney(totalPorCobrar)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerDetalle(client);
                        }}
                        className="p-1 rounded transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Ver detalles"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      {canEdit('clients') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            Toast.info(`Editando ${client.razonSocial}`);
                          }}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          title="Editar"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete('clients') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEliminar(client.id);
                          }}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientsPage;
