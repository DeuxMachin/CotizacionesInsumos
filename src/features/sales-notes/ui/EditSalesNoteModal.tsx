'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiCalendar, FiDollarSign, FiUser, FiMapPin, FiFileText } from 'react-icons/fi';
import { SalesNoteRecord } from '@/services/notasVentaService';
import { Modal } from '@/shared/ui/Modal';

interface EditSalesNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesNote: SalesNoteRecord | null;
  onSave: (updates: {
    numero_serie?: string | null;
    folio?: string | null;
    fecha_emision?: string;
    forma_pago_final?: string | null;
    plazo_pago?: string | null;
    cliente_rut?: string | null;
    cliente_razon_social?: string | null;
    cliente_giro?: string | null;
    cliente_direccion?: string | null;
    cliente_comuna?: string | null;
    cliente_ciudad?: string | null;
  }) => Promise<void>;
}

export function EditSalesNoteModal({ isOpen, onClose, salesNote, onSave }: EditSalesNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    numero_serie: '',
    folio: '',
    fecha_emision: '',
    forma_pago_final: '',
    plazo_pago: '',
    cliente_rut: '',
    cliente_razon_social: '',
    cliente_giro: '',
    cliente_direccion: '',
    cliente_comuna: '',
    cliente_ciudad: ''
  });

  useEffect(() => {
    if (isOpen && salesNote) {
      setFormData({
        numero_serie: salesNote.Numero_Serie || '',
        folio: salesNote.folio || '',
        fecha_emision: salesNote.fecha_emision || '',
        forma_pago_final: salesNote.forma_pago_final || '',
        plazo_pago: salesNote.plazo_pago || '',
        cliente_rut: salesNote.cliente_rut || '',
        cliente_razon_social: salesNote.cliente_razon_social || '',
        cliente_giro: salesNote.cliente_giro || '',
        cliente_direccion: salesNote.cliente_direccion || '',
        cliente_comuna: salesNote.cliente_comuna || '',
        cliente_ciudad: salesNote.cliente_ciudad || ''
      });
    }
  }, [isOpen, salesNote]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const updates = {
        numero_serie: formData.numero_serie || undefined,
        folio: formData.folio || undefined,
        fecha_emision: formData.fecha_emision || undefined,
        forma_pago_final: formData.forma_pago_final || undefined,
        plazo_pago: formData.plazo_pago || undefined,
        cliente_rut: formData.cliente_rut || undefined,
        cliente_razon_social: formData.cliente_razon_social || undefined,
        cliente_giro: formData.cliente_giro || undefined,
        cliente_direccion: formData.cliente_direccion || undefined,
        cliente_comuna: formData.cliente_comuna || undefined,
        cliente_ciudad: formData.cliente_ciudad || undefined
      };
      
      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar los cambios');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!salesNote) return null;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-semibold flex items-center" style={{ color: 'var(--text-primary)' }}>
            <FiSave className="w-6 h-6 mr-2" />
            Editar Nota de Venta
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <FiX className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Sección: Datos del Documento */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
              <FiFileText className="w-5 h-5 mr-2" />
              Datos del Documento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Número de Serie
                </label>
                <input
                  type="text"
                  name="numero_serie"
                  value={formData.numero_serie}
                  onChange={handleChange}
                  placeholder="Ej: NV-000001"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Folio
                </label>
                <input
                  type="text"
                  name="folio"
                  value={formData.folio}
                  onChange={handleChange}
                  placeholder="Ej: NV-2025-001"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  <FiCalendar className="w-4 h-4 inline mr-2" />
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  name="fecha_emision"
                  value={formData.fecha_emision}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sección: Condiciones Comerciales */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
              <FiDollarSign className="w-5 h-5 mr-2" />
              Condiciones Comerciales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Forma de Pago
                </label>
                <input
                  type="text"
                  name="forma_pago_final"
                  value={formData.forma_pago_final}
                  onChange={handleChange}
                  placeholder="Ej: Contado, Crédito 30 días"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Plazo de Pago
                </label>
                <input
                  type="text"
                  name="plazo_pago"
                  value={formData.plazo_pago}
                  onChange={handleChange}
                  placeholder="Ej: 30 días"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sección: Información del Cliente */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
              <FiUser className="w-5 h-5 mr-2" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  RUT
                </label>
                <input
                  type="text"
                  name="cliente_rut"
                  value={formData.cliente_rut}
                  onChange={handleChange}
                  placeholder="Ej: 12.345.678-9"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Razón Social
                </label>
                <input
                  type="text"
                  name="cliente_razon_social"
                  value={formData.cliente_razon_social}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Giro
                </label>
                <input
                  type="text"
                  name="cliente_giro"
                  value={formData.cliente_giro}
                  onChange={handleChange}
                  placeholder="Ej: Construcción, Retail"
                  className="w-full px-4 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center" style={{ color: 'var(--text-secondary)' }}>
                <FiMapPin className="w-4 h-4 mr-2" />
                Dirección
              </h4>
              <div className="space-y-3 pl-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="cliente_direccion"
                    value={formData.cliente_direccion}
                    onChange={handleChange}
                    placeholder="Calle y número"
                    className="w-full px-4 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Comuna
                    </label>
                    <input
                      type="text"
                      name="cliente_comuna"
                      value={formData.cliente_comuna}
                      onChange={handleChange}
                      placeholder="Ej: Santiago"
                      className="w-full px-4 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="cliente_ciudad"
                      value={formData.cliente_ciudad}
                      onChange={handleChange}
                      placeholder="Ej: Santiago"
                      className="w-full px-4 py-2 rounded-lg border transition-colors"
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
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex gap-4 mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-2 rounded-lg font-medium transition-colors text-sm"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 px-6 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: isSubmitting ? 'var(--bg-secondary)' : 'var(--primary)',
              color: isSubmitting ? 'var(--text-secondary)' : 'white',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            <FiSave className="w-4 h-4" />
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
