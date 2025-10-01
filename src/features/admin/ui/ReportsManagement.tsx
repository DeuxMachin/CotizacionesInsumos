"use client";

import React, { useState } from "react";
import { FiBarChart, FiDownload, FiCalendar, FiFileText, FiUsers, FiDollarSign, FiTrendingUp, FiFilter, FiSettings, FiInfo, FiCheck, FiX } from "react-icons/fi";
import { useAdminStats } from '@/hooks/useSupabase';
import { useAuth } from "@/contexts/AuthContext";

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
    description: 'Excel detallado con información completa de clientes, historial de cotizaciones y estadísticas por cliente',
    type: 'users',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24),
    size: '2.3 MB',
    icon: FiUsers,
    gradientFrom: '#3B82F6',
    gradientTo: '#1D4ED8'
  },
  {
    id: 'quotes-summary',
    name: 'Resumen Ejecutivo de Cotizaciones',
    description: 'Excel con estadísticas clave: total cotizaciones, ingresos generados, rendimiento por vendedor y tendencias mensuales',
    type: 'quotes',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 12),
    size: '1.2 MB',
    icon: FiFileText,
    gradientFrom: '#10B981',
    gradientTo: '#047857'
  },
  {
    id: 'financial-analysis',
    name: 'Análisis Financiero Completo',
    description: 'Excel con análisis financiero detallado: ingresos, descuentos, IVA, proyecciones y métricas de rentabilidad',
    type: 'financial',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 48),
    size: '1.8 MB',
    icon: FiDollarSign,
    gradientFrom: '#8B5CF6',
    gradientTo: '#7C3AED'
  },
  {
    id: 'works-history',
    name: 'Historial de Stock',
    description: 'Excel con inventario completo, movimientos de stock y estadísticas de productos',
    type: 'system',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 6),
    size: '856 KB',
    icon: FiTrendingUp,
    gradientFrom: '#F59E0B',
    gradientTo: '#D97706'
  }
];

export function ReportsManagement() {
  const { user } = useAuth();
  const { data: adminStats, loading: loadingStats } = useAdminStats();
  const [reports] = useState<Report[]>(availableReports);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    try {
      // Determinar el endpoint según el tipo de reporte
      let endpoint = '';
      let params = '';

      if (reportId === 'clients-history') {
        endpoint = '/api/downloads/clients';
        params = `userId=${user?.id}`;
      } else if (reportId === 'quotes-summary') {
        endpoint = '/api/reports/quotes-summary';
        params = `userId=${user?.id}`;
      } else if (reportId === 'financial-analysis') {
        endpoint = '/api/reports/financial-analysis';
        params = `userId=${user?.id}`;
      } else if (reportId === 'works-history') {
        // Por ahora usar stock como placeholder hasta tener API de obras
        endpoint = '/api/downloads/stock';
        params = `userId=${user?.id}`;
      }

      if (endpoint) {
        // Obtener el userId del contexto de autenticación
        const userId = user?.id;
        if (!userId) {
          setPopupMessage('Usuario no identificado');
          setPopupType('error');
          setShowPopup(true);
          setIsGenerating(null);
          return;
        }

        // Crear URL completa
        const url = `${endpoint}?${params}`;

        // Abrir en nueva pestaña para descarga directa
        window.open(url, '_blank');

        // Mostrar popup de éxito
        setPopupMessage('¡Reporte generado exitosamente! El archivo se descargará en una nueva pestaña.');
        setPopupType('success');
        setShowPopup(true);
      } else {
        // Simular generación para reportes que no tienen endpoint específico
        await new Promise(resolve => setTimeout(resolve, 3000));
        setPopupMessage('¡Reporte generado exitosamente!');
        setPopupType('success');
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      setPopupMessage('Error al generar el reporte. Por favor, inténtalo de nuevo.');
      setPopupType('error');
      setShowPopup(true);
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
    <div className="min-h-screen px-3 sm:px-6 py-4 sm:py-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header con gradiente */}
        <div
          className="rounded-2xl p-5 sm:p-8 shadow-xl"
          style={{
            background: 'var(--orange-gradient)',
            color: 'white'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <FiBarChart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Reportes y Analíticas
              </h1>
              <p className="text-sm sm:text-lg text-orange-100">
                Genera y descarga reportes detallados del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Estadísticas principales mejoradas */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div 
            className="rounded-xl p-4 sm:p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
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
            className="rounded-xl p-4 sm:p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
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
            className="rounded-xl p-4 sm:p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
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
            className="rounded-xl p-4 sm:p-6 shadow-lg border hover:shadow-xl transition-all duration-300"
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

        {/* Información adicional */}
        <div
          className="rounded-xl p-4 sm:p-6 border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className="p-2 rounded-lg flex-shrink-0"
              style={{
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info-text)'
              }}
            >
              <FiInfo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                ¿Cómo funcionan los reportes?
              </h3>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>• Los reportes se generan automáticamente con los datos más recientes</li>
                <li>• Cada reporte incluye toda la información disponible en el sistema</li>
                <li>• Los archivos se descargan en una nueva pestaña del navegador</li>
                <li>• Si tienes problemas, contacta al administrador del sistema</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reportes disponibles - Diseño simplificado */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
              Reportes Disponibles
            </h2>
            <p className="text-sm sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
              Selecciona el reporte que necesitas generar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {reports.map((report) => {
              const Icon = report.icon;
              const isCurrentlyGenerating = isGenerating === report.id;

              // Determinar el tipo de archivo que se descarga
              const getFileType = (id: string) => {
                if (id === 'clients-history') return 'XLSX';
                if (id === 'quotes-summary') return 'XLSX';
                if (id === 'financial-analysis') return 'XLSX';
                return 'XLSX';
              };

              const getFileTypeColor = (id: string) => {
                return id.includes('summary') || id.includes('financial') ? 'var(--success-text)' : 'var(--info-text)';
              };

              return (
                <div
                  key={report.id}
                  className="group relative rounded-2xl border-2 hover:border-orange-300 transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-subtle)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Badge de tipo de archivo */}
                  <div
                    className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: getFileTypeColor(report.id) === 'var(--success-text)' ? 'var(--success-bg)' : 'var(--info-bg)',
                      color: getFileTypeColor(report.id)
                    }}
                  >
                    {getFileType(report.id)}
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div
                        className="p-2 sm:p-3 rounded-lg flex-shrink-0"
                        style={{
                          background: report.type === 'users' ? 'var(--blue-gradient)' :
                                     report.type === 'quotes' ? 'var(--green-gradient)' :
                                     report.type === 'financial' ? 'var(--purple-gradient)' :
                                     'var(--orange-gradient)'
                        }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {report.name}
                        </h3>
                        <span
                          className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: report.type === 'users' ? 'var(--info-bg)' :
                                           report.type === 'quotes' ? 'var(--success-bg)' :
                                           report.type === 'financial' ? 'var(--warning-bg)' : 'var(--neutral-bg)',
                            color: report.type === 'users' ? 'var(--info-text)' :
                                  report.type === 'quotes' ? 'var(--success-text)' :
                                  report.type === 'financial' ? 'var(--warning-text)' : 'var(--neutral-text)'
                          }}
                        >
                          {report.type === 'users' ? 'Clientes' :
                           report.type === 'quotes' ? 'Cotizaciones' :
                           report.type === 'financial' ? 'Financiero' : 'Sistema'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed mb-4 sm:mb-6" style={{ color: 'var(--text-secondary)' }}>
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Tamaño aproximado: <span className="font-medium">{report.size}</span>
                      </div>

                      <button
                        disabled={isCurrentlyGenerating}
                        onClick={() => !isCurrentlyGenerating && handleGenerateReport(report.id)}
                        className={`
                          px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                          ${isCurrentlyGenerating
                            ? 'cursor-not-allowed'
                            : 'shadow-md hover:shadow-lg'
                          }
                        `}
                        style={{
                          backgroundColor: isCurrentlyGenerating ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                          color: isCurrentlyGenerating ? 'var(--text-muted)' : 'white'
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrentlyGenerating) {
                            e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrentlyGenerating) {
                            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                          }
                        }}
                      >
                        {isCurrentlyGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <FiDownload className="w-4 h-4" />
                            Descargar
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
      </div>

      {/* Popup elegante */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-md w-full rounded-2xl shadow-2xl border-2 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: popupType === 'success' ? 'var(--success)' : 'var(--danger)'
            }}
          >
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{
                backgroundColor: popupType === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)'
              }}
            >
              <div
                className="p-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: popupType === 'success' ? 'var(--success)' : 'var(--danger)'
                }}
              >
                {popupType === 'success' ? (
                  <FiCheck className="w-5 h-5 text-white" />
                ) : (
                  <FiX className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold text-lg"
                  style={{
                    color: popupType === 'success' ? 'var(--success-text)' : 'var(--danger-text)'
                  }}
                >
                  {popupType === 'success' ? '¡Éxito!' : 'Error'}
                </h3>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
              >
                <FiX className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="px-6 pb-6">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {popupMessage}
              </p>
              <button
                onClick={() => setShowPopup(false)}
                className="mt-4 w-full px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: popupType === 'success' ? 'var(--success)' : 'var(--danger)',
                  color: 'white'
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsManagement;
