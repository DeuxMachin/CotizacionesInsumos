"use client";

import { useState } from "react";
import { FiBarChart, FiDownload, FiCalendar, FiFileText, FiUsers, FiDollarSign, FiTrendingUp, FiFilter, FiSettings } from "react-icons/fi";
import { useAdminStats } from '@/hooks/useSupabase';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'users' | 'quotes' | 'financial' | 'system';
  lastGenerated: Date;
  size: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
}

const availableReports: Report[] = [
  {
    id: 'clients-history',
    name: 'Historial de Clientes',
    description: 'Reporte detallado del historial y actividad de clientes en el sistema',
    type: 'users',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24),
    size: '2.3 MB',
    icon: FiUsers,
    gradientFrom: '#3B82F6',
    gradientTo: '#1D4ED8'
  },
  {
    id: 'quotes-summary',
    name: 'Resumen de Cotizaciones',
    description: 'Estadísticas y análisis de cotizaciones generadas',
    type: 'quotes',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 12),
    size: '4.1 MB',
    icon: FiFileText,
    gradientFrom: '#10B981',
    gradientTo: '#047857'
  },
  {
    id: 'financial-analysis',
    name: 'Análisis Financiero',
    description: 'Reporte financiero con ingresos, gastos y proyecciones',
    type: 'financial',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 48),
    size: '1.8 MB',
    icon: FiDollarSign,
    gradientFrom: '#8B5CF6',
    gradientTo: '#7C3AED'
  },
  {
    id: 'works-history',
    name: 'Historial de Obras',
    description: 'Registro detallado del historial y progreso de obras del sistema',
    type: 'system',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 6),
    size: '856 KB',
    icon: FiTrendingUp,
    gradientFrom: '#F59E0B',
    gradientTo: '#D97706'
  }
];

const dateRanges = [
  { value: 'last-7-days', label: 'Últimos 7 días' },
  { value: 'last-30-days', label: 'Últimos 30 días' },
  { value: 'last-3-months', label: 'Últimos 3 meses' },
  { value: 'last-year', label: 'Último año' },
  { value: 'custom', label: 'Personalizado' }
];

const formats = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'excel', label: 'Excel', icon: '📊' }
];

export function ReportsManagement() {
  const { data: adminStats, loading: loadingStats } = useAdminStats();
  const [reports] = useState<Report[]>(availableReports);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState('last-30-days');
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Reporte generado exitosamente');
    } finally {
      setIsGenerating(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header con gradiente */}
        <div 
          className="rounded-2xl p-8 text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FiBarChart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Reportes y Analíticas
              </h1>
              <p className="text-indigo-100 text-lg">
                Genera y descarga reportes detallados del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas principales mejoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
              >
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {loadingStats ? (
                    <div className="animate-pulse bg-gray-200 rounded w-16 h-8"></div>
                  ) : (
                    (adminStats?.cotizaciones.total || 0).toLocaleString('es-CL')
                  )}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--success-text)' }}>
                  {loadingStats ? '' : `+${adminStats?.cotizaciones.nuevasUltimoMes || 0} este mes`}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cotizaciones Este Mes</div>
          </div>

          <div 
            className="rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}
              >
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {loadingStats ? (
                    <div className="animate-pulse bg-gray-200 rounded w-20 h-8"></div>
                  ) : (
                    `$${((adminStats?.cotizaciones.valorTotal || 0) / 1000000).toFixed(1)}M`
                  )}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--success-text)' }}>
                  {loadingStats ? '' : `${adminStats?.cotizaciones.aprobadas || 0} aprobadas`}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ingresos Estimados</div>
          </div>

          <div 
            className="rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
              >
                <FiUsers className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {loadingStats ? (
                    <div className="animate-pulse bg-gray-200 rounded w-12 h-8"></div>
                  ) : (
                    adminStats?.usuarios.activos || 0
                  )}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--success-text)' }}>
                  {loadingStats ? '' : `+${adminStats?.usuarios.activosRecientes || 0} activos recientes`}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Usuarios Activos</div>
          </div>

          <div 
            className="rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="p-3 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
              >
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {loadingStats ? (
                    <div className="animate-pulse bg-gray-200 rounded w-16 h-8"></div>
                  ) : (
                    `${((adminStats?.cotizaciones.aprobadas || 0) / Math.max((adminStats?.cotizaciones.total || 1), 1) * 100).toFixed(1)}%`
                  )}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--success-text)' }}>
                  {loadingStats ? '' : `${adminStats?.clientes.nuevosUltimoMes || 0} clientes nuevos`}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tasa de Aprobación</div>
          </div>
        </div>

        {/* Generador de reportes mejorado */}
        <div 
          className="rounded-2xl shadow-xl border overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-8 py-6 border-b"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)'
            }}
          >
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <div 
                className="p-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <FiFilter className="w-5 h-5 text-white" />
              </div>
              Generar Reporte Personalizado
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Configura los parámetros para generar tu reporte</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Rango de Fechas
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Formato de Exportación
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {formats.map(fmt => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.icon} {fmt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-3 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  <FiFilter className="w-5 h-5" />
                  Filtros Avanzados
                </button>
              </div>
            </div>

            {showFilters && (
              <div 
                className="rounded-xl p-6 mb-6 border"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FiSettings className="w-5 h-5" />
                  Filtros Avanzados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Estado de Cotizaciones
                    </label>
                    <select 
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">Todas</option>
                      <option value="pending">Pendientes</option>
                      <option value="approved">Aprobadas</option>
                      <option value="rejected">Rechazadas</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Rango de Montos
                    </label>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        placeholder="Mínimo" 
                        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <input 
                        type="number" 
                        placeholder="Máximo" 
                        className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reportes disponibles mejorados */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <div 
                className="p-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}
              >
                <FiFileText className="w-6 h-6 text-white" />
              </div>
              Reportes Disponibles
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {reports.map((report) => {
              const Icon = report.icon;
              const isCurrentlyGenerating = isGenerating === report.id;
              
              return (
                <div 
                  key={report.id}
                  className="group rounded-2xl shadow-lg hover:shadow-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{ 
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div 
                        className="p-4 rounded-xl border shadow-md"
                        style={{ 
                          background: `linear-gradient(135deg, ${report.gradientFrom}, ${report.gradientTo})`,
                          borderColor: 'var(--border-subtle)',
                          color: 'white'
                        }}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Último reporte
                        </div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatDate(report.lastGenerated)}
                        </div>
                        <div 
                          className="text-xs px-2 py-1 rounded-full mt-2"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {report.size}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {report.name}
                    </h3>
                    
                    <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                      {report.description}
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={isCurrentlyGenerating}
                        className={`
                          flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg text-white
                          ${isCurrentlyGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
                        `}
                        style={{ 
                          background: isCurrentlyGenerating 
                            ? 'var(--bg-tertiary)' 
                            : 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                        }}
                      >
                        {isCurrentlyGenerating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <FiDownload className="w-5 h-5" />
                            Generar Reporte
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historial de reportes mejorado */}
        <div 
          className="rounded-2xl shadow-xl border overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-8 py-6 border-b"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border)'
            }}
          >
            <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <div 
                className="p-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
              >
                <FiCalendar className="w-6 h-6 text-white" />
              </div>
              Historial de Reportes
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Reportes generados recientemente
            </p>
          </div>
          
          <div className="p-8">
            <div className="space-y-4">
              {[
                { name: 'Reporte Financiero Marzo 2024', date: '15/03/2024 14:30', size: '2.1 MB', format: 'PDF', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' },
                { name: 'Historial de Clientes Febrero 2024', date: '01/03/2024 09:15', size: '1.8 MB', format: 'Excel', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
                { name: 'Cotizaciones Q1 2024', date: '28/02/2024 16:45', size: '3.2 MB', format: 'PDF', gradient: 'linear-gradient(135deg, #10B981, #047857)' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="group flex items-center justify-between p-6 rounded-xl hover:shadow-md transition-all duration-200 border"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-xl"
                      style={{ background: item.gradient }}
                    >
                      <FiFileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      <div className="text-sm flex items-center gap-2 mt-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>{item.date}</span>
                        <span>•</span>
                        <span className="font-medium">{item.size}</span>
                        <span>•</span>
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {item.format}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="px-4 py-2 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                  >
                    <FiDownload className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsManagement;
