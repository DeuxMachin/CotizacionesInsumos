import { FiDownload, FiBarChart2 } from "react-icons/fi";
import { ReportPeriod } from "@/app/dashboard/reportes/page";

interface ReportsHeaderProps {
  selectedPeriod: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
}

const periods: ReportPeriod[] = [
  "Último mes",
  "Últimos 3 meses", 
  "Últimos 6 meses",
  "Último año"
];

export function ReportsHeader({ selectedPeriod, onPeriodChange }: ReportsHeaderProps) {
  const handleExport = () => {
    // Aquí implementaremos la funcionalidad de exportar
    alert("Función de exportar en desarrollo");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-3 sm:px-4 py-2">
      {/* Título y descripción */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
          <FiBarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Reportes
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Analiza el rendimiento y genera reportes detallados
          </p>
        </div>
      </div>

      {/* Controles del período y exportar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Selector de período */}
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
            className="appearance-none px-4 py-2.5 pr-10 rounded-lg border text-sm font-medium min-w-[160px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            {periods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Botón exportar */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95"
          style={{ 
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent-text)'
          }}
        >
          <FiDownload className="w-4 h-4" />
          Exportar
        </button>
      </div>
    </div>
  );
}
