"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEye, FiFileText, FiCalendar, FiDollarSign, FiUser, FiSearch, FiArrowLeft } from 'react-icons/fi';
import { NotasVentaService, SalesNoteRecord } from '@/services/notasVentaService';
import { useQuotes } from '@/features/quotes/model/useQuotes';

export default function SalesNotesPage() {
  const router = useRouter();
  const { formatMoney } = useQuotes();

  const [salesNotes, setSalesNotes] = useState<SalesNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar notas de venta
  useEffect(() => {
    loadSalesNotes();
  }, []);

  const loadSalesNotes = async () => {
    try {
      setLoading(true);
      const notes = await NotasVentaService.getAll();
      setSalesNotes(notes);
    } catch (e: unknown) {
      console.error('Error cargando notas de venta', e);
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar notas de venta por búsqueda
  const filteredNotes = salesNotes.filter(note =>
    (note.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (note.cliente_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    (note.cotizacion_id?.toString().includes(searchTerm) ?? false)
  );

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return { bg: 'var(--success-bg)', text: 'var(--success-text)' };
      case 'creada':
        return { bg: 'var(--warning-bg)', text: 'var(--warning-text)' };
      default:
        return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Cargando notas de venta...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Notas de Venta
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Gestiona las notas de venta y conversiones de cotizaciones
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/cotizaciones')}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all duration-200 flex items-center text-sm sm:text-base font-medium shadow-sm hover:shadow-md border-2"
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                borderColor: '#007bff',
                border: '2px solid #007bff'
              }}
            >
              <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Buscar por folio, cliente o cotización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border" style={{
            backgroundColor: 'var(--error-bg)',
            borderColor: 'var(--error)',
            color: 'var(--error-text)'
          }}>
            Error cargando notas de venta: {error}
          </div>
        )}

        {/* Sales Notes List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {filteredNotes.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <FiFileText className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <h3 className="text-base sm:text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {searchTerm ? 'No se encontraron notas de venta' : 'No hay notas de venta'}
              </h3>
              <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Las notas de venta aparecerán aquí cuando conviertas cotizaciones aceptadas'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Folio
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Cliente
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Fecha
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Total
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Estado
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Cotización
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filteredNotes.map((note) => {
                    const statusColors = getStatusColor(note.estado || 'borrador');
                    return (
                      <tr key={note.id} className="hover:bg-opacity-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiFileText className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                            <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                              {note.folio || 'Sin folio'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center min-w-0">
                            <FiUser className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                            <span className="truncate text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                              {note.cliente_razon_social || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                              {note.fecha_emision ? new Date(note.fecha_emision).toLocaleDateString('es-CL') : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiDollarSign className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                            <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--primary)' }}>
                              {formatMoney(note.total)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.text
                            }}
                          >
                            {note.estado || 'borrador'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {note.cotizacion_id ? `COT${note.cotizacion_id.toString().padStart(6, '0')}` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => router.push(`/dashboard/notas-venta/${note.id}`)}
                            className="px-2 sm:px-3 py-1 rounded-lg transition-colors text-xs sm:text-sm"
                            style={{
                              color: 'var(--primary)',
                              border: '1px solid var(--primary)',
                              backgroundColor: 'transparent'
                            }}
                          >
                            <FiEye className="w-3 sm:w-4 h-3 sm:h-4 inline mr-1" />
                            <span className="hidden xs:inline">Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}