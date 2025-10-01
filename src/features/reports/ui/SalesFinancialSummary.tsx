"use client";

import { useEffect, useState } from 'react';
import { ReportPeriod, ReportType } from '@/app/dashboard/reportes/page';
import { supabase } from '@/lib/supabase';
import { FiDollarSign, FiFileText, FiTrendingUp, FiPercent } from 'react-icons/fi';

interface SalesFinancialSummaryProps {
  period: ReportPeriod;
  reportType: ReportType;
}

interface FinancialData {
  totalVentas: number;
  totalNeto: number;
  totalIva: number;
  totalExento: number;
  cantidadVentas: number;
  ticketPromedio: number;
}

interface CotizacionRecord {
  total_final: number;
  total_neto: number;
  iva_monto: number;
}

interface NotaVentaRecord {
  total: number;
  subtotal_neto_post_desc: number;
  iva_monto: number;
}

export function SalesFinancialSummary({ period, reportType }: SalesFinancialSummaryProps) {
  const [data, setData] = useState<FinancialData>({
    totalVentas: 0,
    totalNeto: 0,
    totalIva: 0,
    totalExento: 0,
    cantidadVentas: 0,
    ticketPromedio: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const startDate = new Date();

        switch (period) {
          case 'Última semana':
            startDate.setDate(now.getDate() - 6);
            break;
          case 'Último mes':
            startDate.setDate(now.getDate() - 29);
            break;
          case 'Últimos 3 meses':
            startDate.setDate(now.getDate() - 89);
            break;
          case 'Últimos 6 meses':
            startDate.setDate(now.getDate() - 179);
            break;
          case 'Último año':
            startDate.setDate(now.getDate() - 364);
            break;
        }

        // Query cotizaciones o notas_venta según el tipo, con columnas existentes
        const tableName = reportType === 'cotizaciones' ? 'cotizaciones' : 'notas_venta';
        // Campos válidos por tabla
        const selectFields = reportType === 'cotizaciones'
          ? 'total_final, total_neto, iva_monto'
          : 'total, subtotal_neto_post_desc, iva_monto';

        // Usar la columna de fecha adecuada
        const dateColumn = reportType === 'cotizaciones' ? 'created_at' : 'fecha_emision';

        const { data: records, error } = await supabase
          .from(tableName)
          .select(selectFields)
          .gte(dateColumn, startDate.toISOString())
          .lte(dateColumn, now.toISOString());

        if (error) throw error;

        let totalVentas = 0;
        let totalNeto = 0;
        let totalIva = 0;
        const totalExento = 0; // Actualmente no se muestra, mantenemos 0 por compatibilidad

        if (reportType === 'cotizaciones') {
          totalVentas = (records as CotizacionRecord[] || []).reduce((sum, rec) => sum + (Number(rec.total_final) || 0), 0);
          totalNeto   = (records as CotizacionRecord[] || []).reduce((sum, rec) => sum + (Number(rec.total_neto) || 0), 0);
          totalIva    = (records as CotizacionRecord[] || []).reduce((sum, rec) => sum + (Number(rec.iva_monto) || 0), 0);
          // totalExento no existe en cotizaciones, se deja en 0
        } else {
          totalVentas = (records as NotaVentaRecord[] || []).reduce((sum, rec) => sum + (Number(rec.total) || 0), 0);
          totalNeto   = (records as NotaVentaRecord[] || []).reduce((sum, rec) => sum + (Number(rec.subtotal_neto_post_desc) || 0), 0);
          totalIva    = (records as NotaVentaRecord[] || []).reduce((sum, rec) => sum + (Number(rec.iva_monto) || 0), 0);
          // totalExento no se expone en notas_venta, mantener 0
        }

        const cantidadVentas = (records || []).length;
        const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

        setData({
          totalVentas,
          totalNeto,
          totalIva,
          totalExento,
          cantidadVentas,
          ticketPromedio
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('Error cargando datos financieros:', msg);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [period, reportType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const cards = [
    {
      title: reportType === 'cotizaciones' ? 'Total Cotizado' : 'Total Ventas',
      value: formatCurrency(data.totalVentas),
      icon: FiDollarSign,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      title: 'Subtotal Neto',
      value: formatCurrency(data.totalNeto),
      icon: FiFileText,
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.1)'
    },
    {
      title: 'IVA',
      value: formatCurrency(data.totalIva),
      icon: FiPercent,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(data.ticketPromedio),
      subtitle: `${data.cantidadVentas} ${reportType === 'cotizaciones' ? 'cotizaciones' : 'ventas'}`,
      icon: FiTrendingUp,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse p-4 sm:p-6 rounded-xl border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
            <div className="h-4 bg-gray-300 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-300 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Resumen Financiero
        </h2>
        <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          {reportType === 'cotizaciones' 
            ? 'Información consolidada de montos cotizados en el período'
            : 'Información consolidada de ventas realizadas en el período'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="p-4 sm:p-6 rounded-xl border transition-all hover:shadow-lg"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {card.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: card.color }}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div
                className="p-2 sm:p-3 rounded-lg"
                style={{ backgroundColor: card.bgColor }}
              >
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
