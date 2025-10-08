"use client";

import { useState, useEffect } from "react";
import { ReportPeriod } from "@/app/dashboard/reportes/page";
import { supabase } from "@/lib/supabase";

interface ClientStatusChartProps {
  period: ReportPeriod;
}

interface ClientStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
  icon: string;
}

// Datos mock para el estado de clientes
const mockClientStatusData: ClientStatusData[] = [
  {
    status: "Activos",
    count: 156,
    percentage: 78,
    color: "#10b981",
    description: "Clientes con actividad reciente",
    icon: "✓"
  },
  {
    status: "Prospectos",
    count: 34,
    percentage: 17,
    color: "#06b6d4",
    description: "Clientes potenciales en proceso",
    icon: "◐"
  },
  {
    status: "Inactivos",
    count: 10,
    percentage: 5,
    color: "#6b7280",
    description: "Sin actividad en el período",
    icon: "○"
  }
];

export function ClientStatusChart({ period }: ClientStatusChartProps) {
  const [clientStatusData, setClientStatusData] = useState<ClientStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClientStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determinar rango de fechas según el período
        const now = new Date();
        const startDate = new Date();
        
        switch (period) {
          case 'Última semana':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'Último mes':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'Últimos 3 meses':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'Últimos 6 meses':
            startDate.setMonth(now.getMonth() - 6);
            break;
          case 'Último año':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setMonth(now.getMonth() - 6);
        }
        
        // Obtener cotizaciones del período
        const { data: cotizaciones, error: cotError } = await supabase
          .from('cotizaciones')
          .select('cliente_principal_id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', now.toISOString());
        
        if (cotError) throw new Error(`Error al obtener cotizaciones: ${cotError.message}`);
        
        // Obtener notas de venta del período
        const { data: notasVenta, error: notasError } = await supabase
          .from('notas_venta')
          .select('cliente_principal_id')
          .gte('fecha_emision', startDate.toISOString())
          .lte('fecha_emision', now.toISOString());
        
        if (notasError) throw new Error(`Error al obtener notas de venta: ${notasError.message}`);
        
        // Obtener IDs únicos de clientes con actividad en el período
        const clientesConActividad = new Set<number>();
        (cotizaciones || []).forEach(cot => {
          if (cot.cliente_principal_id) clientesConActividad.add(cot.cliente_principal_id);
        });
        (notasVenta || []).forEach(nota => {
          if (nota.cliente_principal_id) clientesConActividad.add(nota.cliente_principal_id);
        });
        
        // Obtener información de clientes
        const { data: todosClientes, error: clientesError } = await supabase
          .from('clientes')
          .select('id, estado');
        
        if (clientesError) throw new Error(`Error al obtener clientes: ${clientesError.message}`);
        
        // Categorizar clientes
        const estadosCount: Record<string, number> = {
          'Activos': 0,
          'Prospectos': 0,
          'Sin Actividad': 0
        };
        
        (todosClientes || []).forEach(cliente => {
          // Cliente activo = tiene actividad en el período
          if (clientesConActividad.has(cliente.id)) {
            estadosCount['Activos']++;
          } 
          // Prospecto = no tiene actividad pero su estado es prospecto
          else if (cliente.estado === 'prospecto') {
            estadosCount['Prospectos']++;
          } 
          // Sin actividad = no tiene actividad en el período
          else {
            estadosCount['Sin Actividad']++;
          }
        });
        
        // Calcular total
        const total = Object.values(estadosCount).reduce((sum, count) => sum + count, 0);
        
        // Si no hay clientes, mostrar mensaje apropiado
        if (total === 0) {
          setClientStatusData([]);
          setLoading(false);
          return;
        }
        
        // Formatear datos
        const formattedData: ClientStatusData[] = [
          {
            status: 'Activos',
            count: estadosCount['Activos'],
            percentage: Math.round((estadosCount['Activos'] / total) * 100),
            color: '#10b981',
            description: `Con ${clientesConActividad.size > 0 ? 'cotizaciones o ventas' : 'actividad'} en el período`,
            icon: '✓'
          },
          {
            status: 'Prospectos',
            count: estadosCount['Prospectos'],
            percentage: Math.round((estadosCount['Prospectos'] / total) * 100),
            color: '#06b6d4',
            description: 'Sin actividad, marcados como prospectos',
            icon: '◐'
          },
          {
            status: 'Sin Actividad',
            count: estadosCount['Sin Actividad'],
            percentage: Math.round((estadosCount['Sin Actividad'] / total) * 100),
            color: '#6b7280',
            description: 'Sin cotizaciones ni ventas en el período',
            icon: '○'
          }
        ];
        
        setClientStatusData(formattedData);
      } catch (err) {
        console.error('Error cargando estado de clientes:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
        setClientStatusData([]);
      } finally {
        setLoading(false);
      }
    };

    loadClientStatus();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="flex-1 h-4 bg-gray-300 rounded"></div>
                <div className="w-12 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p style={{ color: 'var(--text-danger)' }}>Error: {error}</p>
      </div>
    );
  }

  // Si no hay datos reales, mostrar mensaje
  if (clientStatusData.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No hay clientes registrados
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Agrega clientes para ver estadísticas de actividad
        </p>
      </div>
    );
  }

  const dataToShow = clientStatusData;
  const totalClients = dataToShow.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Estados con barras horizontales mejoradas */}
      <div className="space-y-4">
        {dataToShow.map((status, index) => (
          <div 
            key={status.status}
            className="group p-4 rounded-lg transition-all hover:scale-[1.01]"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {/* Header del estado */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: status.color }}
                >
                  {status.icon}
                </div>
                <div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {status.status}
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {status.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {status.count}
                </span>
                <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
                  ({status.percentage}%)
                </span>
              </div>
            </div>

            {/* Barra de progreso con animación */}
            <div className="relative">
              <div 
                className="h-4 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div 
                  className="h-full transition-all duration-1000 ease-out rounded-full relative"
                  style={{ 
                    backgroundColor: status.color,
                    width: `${status.percentage}%`
                  }}
                >
                  {/* Efecto de gradiente */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`
                    }}
                  />
                </div>
              </div>
              
              {/* Indicador de porcentaje */}
              <div 
                className="absolute right-2 top-0.5 text-xs font-bold text-white"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
              >
                {status.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas adicionales mejoradas */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="p-4 rounded-lg text-center group hover:scale-105 transition-transform"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="mb-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              Σ
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalClients}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total clientes
            </p>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg text-center group hover:scale-105 transition-transform"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="mb-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              +
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{Math.floor(totalClients * 0.08)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Nuevos este mes
            </p>
          </div>
        </div>
      </div>

      {/* Métricas de conversión */}
      <div 
        className="p-4 rounded-lg"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                %
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tasa de conversión
              </span>
            </div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              67%
            </span>
          </div>
        </div>
        
        <div 
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 relative"
            style={{ width: '67%' }}
          >
            <div 
              className="absolute inset-0 bg-white bg-opacity-20 rounded-full"
              style={{
                background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`
              }}
            />
          </div>
        </div>
        
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Prospectos convertidos a clientes activos
        </p>
      </div>
    </div>
  );
}
