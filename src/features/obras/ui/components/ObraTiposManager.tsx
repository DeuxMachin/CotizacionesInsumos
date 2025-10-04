"use client";

import React, { useState, useEffect } from 'react';
import { FiX, FiEdit2, FiTrash2, FiPlus, FiSave, FiAlertCircle, FiTag } from 'react-icons/fi';
import { supabase, type Database } from '@/lib/supabase';
import { Toast } from '@/shared/ui/Toast';

type ObraTipo = Database['public']['Tables']['obra_tipos']['Row'];

interface ObraTiposManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ObraTiposManager({ isOpen, onClose, onUpdate }: ObraTiposManagerProps) {
  const [tipos, setTipos] = useState<ObraTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState('');
  const [editingDescripcion, setEditingDescripcion] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Cargar tipos de obra
  const loadTipos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('obra_tipos')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setTipos(data || []);
    } catch (error) {
      console.error('Error cargando tipos de obra:', error);
      Toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTipos();
    }
  }, [isOpen]);

  // Crear nuevo tipo
  const handleCreate = async () => {
    if (!nuevoNombre.trim()) {
      Toast.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('obra_tipos')
        .insert({
          nombre: nuevoNombre.trim(),
          descripcion: nuevaDescripcion.trim() || null
        });

      if (error) throw error;

      Toast.success('Categoría creada exitosamente');
      setNuevoNombre('');
      setNuevaDescripcion('');
      setIsCreating(false);
      await loadTipos();
      onUpdate?.();
    } catch (error) {
      console.error('Error creando tipo de obra:', error);
      Toast.error('Error al crear la categoría');
    } finally {
      setSaving(false);
    }
  };

  // Actualizar tipo existente
  const handleUpdate = async () => {
    if (!editingNombre.trim() || editingId === null) {
      Toast.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('obra_tipos')
        .update({
          nombre: editingNombre.trim(),
          descripcion: editingDescripcion.trim() || null
        })
        .eq('id', editingId);

      if (error) throw error;

      Toast.success('Categoría actualizada exitosamente');
      setEditingId(null);
      setEditingNombre('');
      setEditingDescripcion('');
      await loadTipos();
      onUpdate?.();
    } catch (error) {
      console.error('Error actualizando tipo de obra:', error);
      Toast.error('Error al actualizar la categoría');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar tipo
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('obra_tipos')
        .delete()
        .eq('id', id);

      if (error) {
        // Si hay error por constraint (obras usando esta categoría)
        if (error.code === '23503') {
          Toast.error('No se puede eliminar: hay obras usando esta categoría');
        } else {
          throw error;
        }
        return;
      }

      Toast.success('Categoría eliminada exitosamente');
      await loadTipos();
      onUpdate?.();
    } catch (error) {
      console.error('Error eliminando tipo de obra:', error);
      Toast.error('Error al eliminar la categoría');
    } finally {
      setDeleting(null);
    }
  };

  // Iniciar edición
  const startEdit = (tipo: ObraTipo) => {
    setEditingId(tipo.id);
    setEditingNombre(tipo.nombre);
    setEditingDescripcion(tipo.descripcion || '');
    setIsCreating(false);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditingNombre('');
    setEditingDescripcion('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-lg sm:max-w-2xl lg:max-w-3xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-bg)' }}
            >
              <FiTag className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Gestionar Categorías de Obras
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Crea y administra los tipos de obras del sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <FiX className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {/* Botón crear nueva categoría */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full mb-4 p-4 rounded-lg border-2 border-dashed transition-all hover:border-opacity-100 flex items-center justify-center gap-2"
              style={{ 
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-bg)'
              }}
            >
              <FiPlus className="w-5 h-5" />
              <span className="font-medium">Crear Nueva Categoría</span>
            </button>
          )}

          {/* Formulario crear */}
          {isCreating && (
            <div 
              className="mb-4 p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--accent-primary)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Nueva Categoría
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNuevoNombre('');
                    setNuevaDescripcion('');
                  }}
                  className="text-sm" 
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancelar
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Edificación, Infraestructura, Remodelación..."
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={nuevaDescripcion}
                    onChange={(e) => setNuevaDescripcion(e.target.value)}
                    placeholder="Describe el tipo de obra..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={saving || !nuevoNombre.trim()}
                  className="w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white'
                  }}
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Categoría'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de categorías */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent" 
                   style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
              />
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cargando categorías...
              </p>
            </div>
          ) : tipos.length === 0 ? (
            <div className="text-center py-8">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                <FiTag className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No hay categorías creadas
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Comienza creando tu primera categoría de obra
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  className="p-4 rounded-lg border transition-all"
                  style={{ 
                    backgroundColor: editingId === tipo.id ? 'var(--bg-secondary)' : 'var(--card-bg)',
                    borderColor: editingId === tipo.id ? 'var(--accent-primary)' : 'var(--border)'
                  }}
                >
                  {editingId === tipo.id ? (
                    // Modo edición
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                          style={{ 
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--text-primary)'
                          }}
                          autoFocus
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Descripción (opcional)
                        </label>
                        <textarea
                          value={editingDescripcion}
                          onChange={(e) => setEditingDescripcion(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 resize-none"
                          style={{ 
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUpdate}
                          disabled={saving || !editingNombre.trim()}
                          className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ 
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white'
                          }}
                        >
                          <FiSave className="w-4 h-4" />
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="py-2 px-4 rounded-lg font-medium transition-colors"
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Modo vista
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          {tipo.nombre}
                        </h4>
                        {tipo.descripcion && (
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {tipo.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEdit(tipo)}
                          className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                          title="Editar categoría"
                        >
                          <FiEdit2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(tipo.id)}
                          disabled={deleting === tipo.id}
                          className="p-2 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50"
                          style={{ backgroundColor: 'var(--danger-bg)' }}
                          title="Eliminar categoría"
                        >
                          {deleting === tipo.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" style={{ color: 'var(--danger-text)' }} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info footer */}
          <div 
            className="mt-6 p-3 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: 'var(--info-bg)', borderLeft: '3px solid var(--info-text)' }}
          >
            <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--info-text)' }} />
            <div className="text-xs" style={{ color: 'var(--info-text)' }}>
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Las categorías se usan para clasificar las obras en el sistema</li>
                <li>No se pueden eliminar categorías que estén asignadas a obras existentes</li>
                <li>Los cambios se aplican inmediatamente a todas las obras</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="flex items-center justify-end gap-3 p-4 border-t"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)'
          }}
        >
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
