"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/shared/ui/Toast";
import { FiArrowLeft, FiPackage } from "react-icons/fi";
import { getCategories } from "@/features/stock/model/inventory";
import type { Database } from "@/lib/supabase";
import Link from "next/link";

type Category = Database['public']['Tables']['producto_tipos']['Row'];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    sku: '',
    descripcion: '',
    unidad: '',
    tipo_id: null as number | null,
    afecto_iva: false,
    moneda: '',
    costo_unitario: null as number | null,
    precio_neto: null as number | null,
    precio_venta: null as number | null,
    control_stock: false,
    ficha_tecnica: '',
    estado: 'disponible',
    activo: true
  });

  // Cargar categorías al montar el componente
  useState(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error cargando categorías:', error);
        Toast.error('Error al cargar las categorías');
      }
    };
    loadCategories();
  });

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validaciones básicas
      if (!formData.nombre.trim()) {
        Toast.error('El nombre del producto es obligatorio');
        return;
      }

      if (!formData.unidad.trim()) {
        Toast.error('La unidad del producto es obligatoria');
        return;
      }

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sku: formData.sku || null,
          descripcion: formData.descripcion || null,
          moneda: formData.moneda || null,
          costo_unitario: formData.costo_unitario || undefined,
          precio_neto: formData.precio_neto || undefined,
          precio_venta: formData.precio_venta || undefined,
          ficha_tecnica: formData.ficha_tecnica || null,
          tipo_id: formData.tipo_id || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el producto');
      }

      Toast.success('Producto creado exitosamente');
      router.push('/dashboard/stock');
    } catch (error) {
      console.error('Error creando producto:', error);
      Toast.error(error instanceof Error ? error.message : 'Error al crear el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/stock"
          className="btn-secondary p-2"
          title="Volver al catálogo"
        >
          <FiArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-theme-text-primary flex items-center gap-3">
            <FiPackage />
            Nuevo Producto
          </h1>
          <p className="text-theme-text-muted mt-1">
            Agregar un nuevo producto al catálogo
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-theme-card rounded-xl border border-theme-border p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-6">
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Código SKU (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Unidad *
                </label>
                <input
                  type="text"
                  required
                  className="form-input w-full"
                  value={formData.unidad}
                  onChange={(e) => handleInputChange('unidad', e.target.value)}
                  placeholder="ej: kg, unidad, litro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Categoría
                </label>
                <select
                  className="form-input w-full"
                  value={formData.tipo_id || ''}
                  onChange={(e) => handleInputChange('tipo_id', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Descripción
                </label>
                <textarea
                  className="form-input w-full"
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Descripción del producto (opcional)"
                />
              </div>
            </div>
          </div>

          {/* Información de precios */}
          <div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-6">
              Información de Precios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Moneda
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={formData.moneda}
                  onChange={(e) => handleInputChange('moneda', e.target.value)}
                  placeholder="ej: CLP, USD (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full"
                  value={formData.costo_unitario || ''}
                  onChange={(e) => handleInputChange('costo_unitario', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Costo de adquisición (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Precio Neto
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full"
                  value={formData.precio_neto || ''}
                  onChange={(e) => handleInputChange('precio_neto', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Precio neto (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Precio Venta
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input w-full"
                  value={formData.precio_venta || ''}
                  onChange={(e) => handleInputChange('precio_venta', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Precio de venta (opcional)"
                />
              </div>
            </div>
          </div>

          {/* Configuración */}
          <div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-6">
              Configuración
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="afecto_iva"
                  checked={formData.afecto_iva}
                  onChange={(e) => handleInputChange('afecto_iva', e.target.checked)}
                  className="rounded border-theme-border"
                />
                <label htmlFor="afecto_iva" className="text-sm text-theme-text-primary">
                  Afecto a IVA
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="control_stock"
                  checked={formData.control_stock}
                  onChange={(e) => handleInputChange('control_stock', e.target.checked)}
                  className="rounded border-theme-border"
                />
                <label htmlFor="control_stock" className="text-sm text-theme-text-primary">
                  Control de Stock
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => handleInputChange('activo', e.target.checked)}
                  className="rounded border-theme-border"
                />
                <label htmlFor="activo" className="text-sm text-theme-text-primary">
                  Producto Activo
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Estado
                </label>
                <select
                  className="form-input w-full"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                >
                  <option value="disponible">Disponible</option>
                  <option value="no_disponible">No Disponible</option>
                  <option value="agotado">Agotado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme-text-primary mb-2">
                  Ficha Técnica
                </label>
                <textarea
                  className="form-input w-full"
                  rows={4}
                  value={formData.ficha_tecnica}
                  onChange={(e) => handleInputChange('ficha_tecnica', e.target.value)}
                  placeholder="Información técnica del producto (opcional)"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-theme-border">
            <Link
              href="/dashboard/stock"
              className="btn-secondary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}