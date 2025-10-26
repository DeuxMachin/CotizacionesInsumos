import React from 'react';
import { FiEye, FiFileText, FiCalendar, FiDollarSign, FiUser, FiEdit2, FiX } from 'react-icons/fi';
import { SalesNoteRecord } from '@/services/notasVentaService';

interface SalesNotesListProps {
  salesNotes: SalesNoteRecord[];
  onViewNote: (noteId: number) => void;
  onEditNote?: (noteId: number) => void;
  onCancelNote?: (noteId: number) => void;
  formatMoney: (amount: number) => string;
}

export function SalesNotesList({ salesNotes, onViewNote, onEditNote, onCancelNote, formatMoney }: SalesNotesListProps) {
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'facturada':
        return { bg: 'var(--success-bg)', text: 'var(--success-text)' };
      case 'factura_parcial':
        return { bg: '#FFF4E5', text: '#FF8C00' };
      case 'creada':
        return { bg: 'var(--warning-bg)', text: 'var(--warning-text)' };
      case 'cancelada':
        return { bg: 'var(--error-bg)', text: 'var(--error-text)' };
      case 'borrador':
        return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' };
      default:
        return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)' };
    }
  };

  // Determina si se pueden editar o cancelar
  const canEdit = (estado?: string) => estado && ['creada'].includes(estado);
  const canCancel = (estado?: string) => estado && ['creada', 'borrador'].includes(estado);

  if (salesNotes.length === 0) {
    return (
      <div className="p-8 text-center">
        <FiFileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          No hay notas de venta
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Las notas de venta aparecerán aquí cuando conviertas cotizaciones aceptadas
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Folio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Cotización
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {salesNotes.map((note) => {
            const statusColors = getStatusColor(note.estado || 'borrador');
            return (
              <tr key={note.id} className="hover:bg-opacity-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiFileText className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {note.folio || 'Sin folio'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiUser className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>
                      {note.cliente_razon_social || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>
                      {note.fecha_emision ? new Date(note.fecha_emision).toLocaleDateString('es-CL') : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiDollarSign className="w-4 h-4 mr-2" style={{ color: 'var(--text-secondary)' }} />
                    <span className="font-medium" style={{ color: 'var(--primary)' }}>
                      {formatMoney(note.total)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {note.cotizacion_id ? `COT${note.cotizacion_id.toString().padStart(6, '0')}` : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewNote(note.id)}
                      className="px-3 py-1 rounded-lg transition-colors text-sm"
                      style={{
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                        backgroundColor: 'transparent'
                      }}
                      title="Ver detalles"
                    >
                      <FiEye className="w-4 h-4 inline mr-1" />
                      Ver
                    </button>

                    {canEdit(note.estado) && onEditNote && (
                      <button
                        onClick={() => onEditNote(note.id)}
                        className="px-3 py-1 rounded-lg transition-colors text-sm"
                        style={{
                          color: 'white',
                          backgroundColor: 'var(--primary)',
                          border: '1px solid var(--primary)'
                        }}
                        title="Editar nota de venta"
                      >
                        <FiEdit2 className="w-4 h-4 inline mr-1" />
                        Editar
                      </button>
                    )}

                    {canCancel(note.estado) && onCancelNote && (
                      <button
                        onClick={() => onCancelNote(note.id)}
                        className="px-3 py-1 rounded-lg transition-colors text-sm"
                        style={{
                          color: 'white',
                          backgroundColor: 'var(--error)',
                          border: '1px solid var(--error)'
                        }}
                        title="Cancelar nota de venta"
                      >
                        <FiX className="w-2 h-4 inline mr-1" />
                        Cancelar
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
  );
}