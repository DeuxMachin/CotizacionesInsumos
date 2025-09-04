"use client";

import { useState } from "react";
import { FiDatabase, FiHardDrive, FiActivity, FiRefreshCw, FiDownload, FiUpload, FiTrash2, FiAlertTriangle } from "react-icons/fi";

interface DatabaseStats {
  size: string;
  tables: number;
  records: number;
  lastBackup: Date;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
}

const mockStats: DatabaseStats = {
  size: "2.3 GB",
  tables: 25,
  records: 127450,
  lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
  performance: 'good'
};

export function DatabaseManagement() {
  const [stats, setStats] = useState<DatabaseStats>(mockStats);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastOperation, setLastOperation] = useState<string>('');

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // Simular optimización
      await new Promise(resolve => setTimeout(resolve, 3000));
      setLastOperation('Optimización completada exitosamente');
      setTimeout(() => setLastOperation(''), 5000);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simular respaldo
      await new Promise(resolve => setTimeout(resolve, 4000));
      setStats(prev => ({ ...prev, lastBackup: new Date() }));
      setLastOperation('Respaldo creado exitosamente');
      setTimeout(() => setLastOperation(''), 5000);
    } finally {
      setIsBackingUp(false);
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPerformanceText = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'fair': return 'Regular';
      case 'poor': return 'Deficiente';
      default: return 'Desconocido';
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
    <div className="space-y-8 max-w-6xl animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
            <FiDatabase className="w-6 h-6" />
          </div>
          Gestión de Base de Datos
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Supervisa y administra la base de datos del sistema
        </p>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="p-6 rounded-xl text-center"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg inline-block mb-3">
            <FiHardDrive className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.size}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tamaño Total
          </div>
        </div>

        <div 
          className="p-6 rounded-xl text-center"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg inline-block mb-3">
            <FiDatabase className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.tables}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tablas
          </div>
        </div>

        <div 
          className="p-6 rounded-xl text-center"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg inline-block mb-3">
            <FiActivity className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.records.toLocaleString()}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Registros
          </div>
        </div>

        <div 
          className="p-6 rounded-xl text-center"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg inline-block mb-3">
            <FiActivity className="w-6 h-6" />
          </div>
          <div className={`text-2xl font-bold ${getPerformanceColor(stats.performance)}`}>
            {getPerformanceText(stats.performance)}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Rendimiento
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Database Operations */}
        <div 
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Operaciones de Base de Datos
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className={`
                w-full p-4 rounded-lg border-2 border-dashed transition-all
                hover:border-solid hover:shadow-md
                ${isOptimizing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              `}
              style={{ 
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div className="flex items-center justify-center gap-3">
                {isOptimizing ? (
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <FiRefreshCw className="w-5 h-5 text-blue-500" />
                )}
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {isOptimizing ? 'Optimizando...' : 'Optimizar Base de Datos'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Mejora el rendimiento reorganizando índices
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className={`
                w-full p-4 rounded-lg border-2 border-dashed transition-all
                hover:border-solid hover:shadow-md
                ${isBackingUp ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
              `}
              style={{ 
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div className="flex items-center justify-center gap-3">
                {isBackingUp ? (
                  <div className="w-5 h-5 border-2 border-green-200 border-t-green-500 rounded-full animate-spin" />
                ) : (
                  <FiDownload className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {isBackingUp ? 'Creando Respaldo...' : 'Crear Respaldo'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Genera una copia de seguridad completa
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Backup Status */}
        <div 
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
        >
          <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Estado de Respaldos
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                <FiDownload className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Último Respaldo
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(stats.lastBackup)}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Programación de Respaldos
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Los respaldos automáticos se ejecutan diariamente a las 2:00 AM
              </p>
            </div>

            {lastOperation && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <FiActivity className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-200">
                    {lastOperation}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Operations */}
      <div 
        className="p-6 rounded-xl"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
          Operaciones Avanzadas
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <button
            className="p-4 text-left border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-solid hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiUpload className="w-5 h-5 text-blue-500" />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Importar Datos
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Cargar datos desde archivos externos
            </p>
          </button>

          <button
            className="p-4 text-left border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-solid hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiDownload className="w-5 h-5 text-green-500" />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Exportar Datos
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Descargar datos en diversos formatos
            </p>
          </button>

          <button
            className="p-4 text-left border border-dashed border-red-300 dark:border-red-600 rounded-lg hover:border-solid hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <FiTrash2 className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-600 dark:text-red-400">
                Limpiar Datos Antiguos
              </span>
            </div>
            <p className="text-sm text-red-500">
              Eliminar registros obsoletos
            </p>
          </button>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Precaución
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Las operaciones avanzadas pueden afectar la integridad de los datos. 
                Asegúrate de tener un respaldo reciente antes de proceder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatabaseManagement;
