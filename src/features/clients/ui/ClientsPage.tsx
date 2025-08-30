"use client";

import { useEffect, useMemo, useState } from "react";
import { clientsExtended, type ClientExtended, type ClientStatus } from "../model/clientsExtended";
import { BRAND } from "@/shared/ui/brand";
import { Toast } from "@/shared/ui/Toast";
import { quotesData } from "@/features/quotes/model/mock";
import { useAuth } from "@/features/auth/model/useAuth";
import { useActionAuthorization } from "@/middleware/AuthorizationMiddleware";
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
  FiMail,
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
  onEliminar: (clientId: string) => void;
  onVerDetalle: (client: ClientExtended) => void;
}

interface ClientsTableProps {
  clients: ClientExtended[];
  getStatusColor: GetStatusColor;
  formatMoney: (amount: number) => string;
  onEliminar: (clientId: string) => void;
  onVerDetalle: (client: ClientExtended) => void;
}

interface GetStatusColor {
  (status: ClientStatus): { bg: string; text: string };
}

interface FiltrosClientes {
  busqueda?: string;
  estado?: ClientStatus[];
  region?: string[];
}

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
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete, canExport } = useActionAuthorization();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<ClientStatus[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedClient, setSelectedClient] = useState<ClientExtended | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  const pageSize = 12; // Más elementos por página como en ObrasPage
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Filtros y datos procesados
  const data = useMemo(() => {
    let out = [...clientsExtended];
    
    // Aplicar filtro de estado
    if (selectedStates.length > 0) {
      out = out.filter((c) => selectedStates.includes(c.status));
    }
    
    // Aplicar filtro de región
    if (selectedRegions.length > 0) {
      out = out.filter((c) => selectedRegions.includes(c.region));
    }
    
    // Aplicar búsqueda
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      out = out.filter(
        (c) =>
          c.razonSocial.toLowerCase().includes(q) ||
          c.rut.toLowerCase().includes(q) ||
          (c.fantasyName?.toLowerCase().includes(q) ?? false) ||
          (c.contactoNombre?.toLowerCase().includes(q) ?? false) ||
          c.direccion.toLowerCase().includes(q) ||
          c.comuna.toLowerCase().includes(q)
      );
    }
    return out;
  }, [searchTerm, selectedStates, selectedRegions]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clientsExtended.length;
    const vigentes = clientsExtended.filter(c => c.status === 'vigente').length;
    const morosos = clientsExtended.filter(c => c.status === 'moroso').length;
    const inactivos = clientsExtended.filter(c => c.status === 'inactivo').length;
    const totalFacturado = clientsExtended.reduce((sum, c) => sum + c.paid + c.pending + c.partial + c.overdue, 0);
    const totalPorCobrar = clientsExtended.reduce((sum, c) => sum + c.pending + c.partial + c.overdue, 0);
    
    return { total, vigentes, morosos, inactivos, totalFacturado, totalPorCobrar };
  }, []);

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
    const regionesSet = new Set(clientsExtended.map(client => client.region));
    return Array.from(regionesSet).sort();
  }, []);

  // Obtener color según estado
  const getStatusColor: GetStatusColor = (status: ClientStatus) => {
    const colores = {
      vigente: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
      moroso: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
      inactivo: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
    };
    return colores[status];
  };

  // Handlers
  const handleEliminar = async (clientId: string) => {
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
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedClient(null);
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

  if (selectedClient && isDetailModalOpen) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={handleCloseModal}
        onEdit={() => Toast.info("Editar cliente próximamente")}
        onDelete={() => handleEliminar(selectedClient.id)}
        canEdit={canEdit('clients')}
        canDelete={canDelete('clients')}
      />
    );
  }

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
                onClick={() => Toast.info('Nueva funcionalidad próximamente')}
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
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
            >
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
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
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}
            >
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
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
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' }}
            >
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
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
              className="p-2 rounded"
              style={{ backgroundColor: 'var(--neutral-bg)', color: 'var(--neutral-text)' }}
            >
              <FiUsers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
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
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageData.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              getStatusColor={getStatusColor}
              formatMoney={formatCLP}
              onEliminar={handleEliminar}
              onVerDetalle={handleVerDetalle}
            />
          ))}
        </div>
      ) : (
        <ClientsTable 
          clients={pageData}
          getStatusColor={getStatusColor}
          formatMoney={formatCLP}
          onEliminar={handleEliminar}
          onVerDetalle={handleVerDetalle}
        />
      )}

      {/* Mensaje cuando no hay clientes */}
      {pageData.length === 0 && (
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
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Mostrando {((page - 1) * pageSize) + 1} a{' '}
            {Math.min(page * pageSize, data.length)} de{' '}
            {data.length} clientes
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={page === 1}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <FiChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === page;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isCurrentPage 
                        ? 'text-white' 
                        : 'border'
                    }`}
                    style={isCurrentPage 
                      ? { backgroundColor: 'var(--accent-primary)' }
                      : { 
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-secondary)'
                        }
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNextPage}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Siguiente
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Panel de Filtros */}
      {showFilters && (
        <FiltersPanel
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
function ClientCard({ client, getStatusColor, formatMoney, onEliminar, onVerDetalle }: ClientCardProps) {
  const { canEdit, canDelete } = useActionAuthorization();
  const statusColor = getStatusColor(client.status);
  const totalMovimientos = client.paid + client.pending + client.partial + client.overdue;
  
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
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Movimientos</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatMoney(totalMovimientos)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Por Cobrar</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--warning-text)' }}>
              {formatMoney(client.pending + client.partial + client.overdue)}
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
function ClientsTable({ clients, getStatusColor, formatMoney, onEliminar, onVerDetalle }: ClientsTableProps) {
  const { canEdit, canDelete } = useActionAuthorization();
  
  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
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
              const totalMovimientos = client.paid + client.pending + client.partial + client.overdue;
              
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
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatMoney(totalMovimientos)}
                    </div>
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

// Componente del panel de filtros
function FiltersPanel({ 
  selectedStates, 
  setSelectedStates, 
  selectedRegions, 
  setSelectedRegions, 
  regiones, 
  onClose, 
  onClear 
}: {
  selectedStates: ClientStatus[];
  setSelectedStates: (states: ClientStatus[]) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  regiones: string[];
  onClose: () => void;
  onClear: () => void;
}) {
  const estados: ClientStatus[] = ['vigente', 'moroso', 'inactivo'];

  const handleStateChange = (state: ClientStatus) => {
    setSelectedStates(
      selectedStates.includes(state)
        ? selectedStates.filter(s => s !== state)
        : [...selectedStates, state]
    );
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegions(
      selectedRegions.includes(region)
        ? selectedRegions.filter(r => r !== region)
        : [...selectedRegions, region]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Filtros Avanzados
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Estados */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Estados
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {estados.map((estado) => (
                  <label key={estado} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStates.includes(estado)}
                      onChange={() => handleStateChange(estado)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Regiones */}
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                Regiones
              </h4>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {regiones.map((region) => (
                  <label key={region} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region)}
                      onChange={() => handleRegionChange(region)}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {region}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={onClear}
              className="btn-secondary flex-1"
            >
              Limpiar Filtros
            </button>
            <button
              onClick={onClose}
              className="btn-primary flex-1"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate"|"emerald"|"amber"|"rose" }) {
  const tones: Record<string, string> = {
    slate: "text-slate-800",
    emerald: "text-emerald-800", 
    amber: "text-amber-800",
    rose: "text-rose-800",
  };
  
  const bgTones: Record<string, string> = {
    slate: "var(--neutral-bg)",
    emerald: "var(--success-bg)",
    amber: "var(--warning-bg)", 
    rose: "var(--danger-bg)",
  };
  
  return (
    <div 
      className={`rounded-xl p-3 sm:p-4 ${tones[tone]}`}
      style={{ 
        backgroundColor: bgTones[tone],
        border: '1px solid var(--border)'
      }}
    >
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-semibold text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-32 sm:w-40 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm break-words hyphens-auto min-w-0" style={{ color: 'var(--text-primary)' }}>{value || "-"}</div>
    </div>
  );
}

function ClientDetail({ 
  client, 
  onBack, 
  onEdit, 
  onDelete,
  canEdit,
  canDelete 
}: { 
  client: ClientExtended; 
  onBack: ()=>void; 
  onEdit: ()=>void; 
  onDelete: ()=>void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const clientQuotes = useMemo(() => {
    // match by razonSocial or contact; in real app use client id
    return quotesData.filter(q => q.client.toLowerCase().includes(client.razonSocial.toLowerCase().split(" ")[0]));
  }, [client.razonSocial]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="text-base sm:text-xl font-bold display-font break-words hyphens-auto" style={{ color: 'var(--text-primary)' }}>
              {client.razonSocial}
            </h3>
            <div className="mt-0.5 sm:mt-0"><StatusBadge status={client.status} /></div>
          </div>
          <div className="text-xs sm:text-sm">
            <span className="inline-block px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              RUT: {client.rut}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button className="btn-secondary text-sm" onClick={onBack}>
            <FiChevronLeft className="w-4 h-4 mr-1" />
            Volver
          </button>
          {canEdit && (
            <button className="btn-secondary text-sm" onClick={onEdit}>
              <FiEdit3 className="w-4 h-4 mr-1" />
              Editar
            </button>
          )}
          {canDelete && (
            <button className="btn-secondary text-sm" onClick={onDelete}>
              <FiTrash2 className="w-4 h-4 mr-1" />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pagado" value={formatCLP(client.paid)} tone="emerald" />
        <StatCard label="Pendiente" value={formatCLP(client.pending)} tone="amber" />
        <StatCard label="Parcial" value={formatCLP(client.partial)} tone="slate" />
        <StatCard label="Vencido" value={formatCLP(client.overdue)} tone="rose" />
      </div>

      <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
        {/* Información de la empresa */}
        <div 
          className="md:col-span-2 rounded-xl p-3 sm:p-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Información de la empresa</h4>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            <InfoRow label="Giro" value={client.giro} />
            <InfoRow label="Dirección" value={client.direccion} />
            <InfoRow label="Región" value={client.region} />
            <InfoRow label="Ciudad" value={client.ciudad} />
            <InfoRow label="Comuna" value={client.comuna} />
            <InfoRow label="Tipo de empresa" value={client.tipoEmpresa} />
          </div>
        </div>

        {/* Condiciones de pago */}
        <div 
          className="rounded-xl p-3 sm:p-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Condiciones de pago</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Días adicionales</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{client.additionalDays}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Línea de crédito</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCLP(client.creditLine)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Crédito usado</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCLP(client.credit)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Retención</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{client.retention}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--text-secondary)' }}>Descuento</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{client.discount}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        {/* Contacto comercial */}
        <div 
          className="rounded-xl p-3 sm:p-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Contacto</h4>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            <InfoRow label="Nombre" value={client.contactoNombre} />
            <InfoRow label="Email" value={client.contactoEmail || client.email} />
            <InfoRow label="Teléfono" value={client.contactoTelefono || client.phone} />
            <InfoRow label="Móvil" value={client.mobile} />
          </div>
        </div>

        {/* Responsable de pagos */}
        <div 
          className="rounded-xl p-3 sm:p-4"
          style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
        >
          <h4 className={`font-semibold mb-3 ${BRAND.accentText}`}>Responsable de pagos</h4>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            <InfoRow label="Nombre" value={client.paymentResponsible} />
            <InfoRow label="Email" value={client.paymentEmail} />
            <InfoRow label="Teléfono" value={client.paymentPhone} />
            <InfoRow label="Medio de pago" value={client.transferInfo} />
          </div>
        </div>
      </div>

      {/* Cotizaciones del cliente */}
      <div 
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold ${BRAND.accentText}`}>Cotizaciones del cliente</h4>
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ver todas</label>
            <input 
              type="checkbox" 
              className="translate-y-[1px]" 
              checked={showAllQuotes} 
              onChange={(e)=>setShowAllQuotes(e.target.checked)} 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <th className="p-2 text-left" style={{ color: 'var(--text-primary)' }}>Número</th>
                <th className="p-2 text-left" style={{ color: 'var(--text-primary)' }}>Fecha</th>
                <th className="p-2 text-left" style={{ color: 'var(--text-primary)' }}>Estado</th>
                <th className="p-2 text-left" style={{ color: 'var(--text-primary)' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {(showAllQuotes ? clientQuotes : clientQuotes.slice(0, 5)).map((q) => (
                <tr key={q.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-2" style={{ color: 'var(--text-primary)' }}>{q.id}</td>
                  <td className="p-2" style={{ color: 'var(--text-primary)' }}>{q.date}</td>
                  <td className="p-2">
                    <span className={`text-xs font-semibold rounded-2xl px-2 py-0.5 ${q.status === 'pending' ? 'text-amber-700 bg-amber-100' : q.status === 'approved' ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                      {{pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada'}[q.status]}
                    </span>
                  </td>
                  <td className="p-2 font-medium" style={{ color: 'var(--text-primary)' }}>{formatCLP(Math.round(q.amount))}</td>
                </tr>
              ))}
              {clientQuotes.length === 0 && (
                <tr>
                  <td className="p-3 text-center" colSpan={4} style={{ color: 'var(--text-muted)' }}>
                    Sin cotizaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientsPage;
