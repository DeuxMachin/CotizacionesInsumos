"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllInventory, searchInventory, getCategories, createCategory, updateCategory, deleteCategory, formatCLP, type InventoryItem } from "../model/inventory";
import { Toast } from "@/shared/ui/Toast";
import { downloadFileFromResponse } from "@/lib/download";
import type { Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthHeaders } from "@/hooks/useAuthHeaders";
import Link from "next/link";
import { ProductosService } from "@/services/productosService";

type Category = Database['public']['Tables']['producto_tipos']['Row'];

type User = {
  id?: string;
  rol?: string; // legacy DB field
  role?: string; // normalized alias
};

export default function StockPage() {
  const { user } = useAuth();
  const { createHeaders } = useAuthHeaders();
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [sortBy, setSortBy] = useState<"nombre" | "precio_venta" | "costo_unitario">("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Estado para modal de edición
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Gestión de categorías (modales)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [updatingCategory, setUpdatingCategory] = useState(false);

  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Estado para modal de guía
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Eliminar producto
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [deleteProductConfirmText, setDeleteProductConfirmText] = useState('');
  const [openRowMenuId, setOpenRowMenuId] = useState<number | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [inventoryData, categoriesData] = await Promise.all([
          getAllInventory(),
          getCategories()
        ]);
        setData(inventoryData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error cargando datos:', error);
        Toast.error('Error al cargar el catálogo de productos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Efecto de búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        try {
          const allData = await getAllInventory();
          setData(allData);
        } catch (error) {
          console.error('Error cargando todos los productos:', error);
        }
        return;
      }

      try {
        const searchResults = await searchInventory(searchQuery);
        setData(searchResults);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        Toast.error('Error en la búsqueda');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtrar y ordenar productos
  const filteredAndSortedItems = useMemo(() => {
    let result = [...data];

    // Filtro por categoría
    if (selectedCategory !== 'todas') {
      const categoryId = Number(selectedCategory);
      if (!isNaN(categoryId)) {
        result = result.filter(item => item.tipo_id === categoryId);
      }
    }

    // Ordenamiento
    result.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortBy) {
        case 'nombre':
          aValue = a.nombre || '';
          bValue = b.nombre || '';
          break;
        case 'precio_venta':
          aValue = a.precio_venta || 0;
          bValue = b.precio_venta || 0;
          break;
        case 'costo_unitario':
          aValue = a.costo_unitario || 0;
          bValue = b.costo_unitario || 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      const comparison = (aValue as number) - (bValue as number);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, selectedCategory, sortBy, sortDirection]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedItems.slice(start, start + itemsPerPage);
  }, [filteredAndSortedItems, currentPage]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  // Función para manejar edición de producto
  const handleEditProduct = (product: InventoryItem) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // Estadísticas del catálogo
  const catalogStats = useMemo(() => {
    const totalProducts = filteredAndSortedItems.length;
    const totalValue = filteredAndSortedItems.reduce((sum, item) => sum + (item.precio_venta || 0), 0);
    const totalCost = filteredAndSortedItems.reduce((sum, item) => sum + (item.costo_unitario || 0), 0);
    const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;
    
    return {
      totalProducts,
      totalValue,
      totalCost,
      avgPrice
    };
  }, [filteredAndSortedItems]);

  const handleExport = async () => {
    try {
      if (!user?.id) {
        Toast.error('Usuario no identificado');
        return;
      }

      const response = await fetch(`/api/downloads/stock?userId=${user.id}`, {
        headers: createHeaders()
      });
      if (!response.ok) throw new Error('Error en exportación');
      
      await downloadFileFromResponse(
        response, 
        `catalogo_productos_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      Toast.success('Catálogo exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      Toast.error('Error al exportar el catálogo');
    }
  };

  // Handlers Categorías
  const openCreateCategory = () => {
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
    setShowCreateCategoryModal(true);
    setShowCategoryMenu(false);
  };

  const openEditCategory = () => {
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
    // Preseleccionar la categoría actualmente filtrada si es válida
    const currentId = selectedCategory !== 'todas' ? Number(selectedCategory) : null;
    setEditingCategoryId(currentId);
    const current = currentId ? categories.find(c => c.id === currentId) : undefined;
    setEditCategoryName(current?.nombre ?? "");
    setShowEditCategoryModal(true);
    setShowCategoryMenu(false);
  };

  const openDeleteCategory = () => {
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
    const currentId = selectedCategory !== 'todas' ? Number(selectedCategory) : null;
    setDeletingCategoryId(currentId);
    setDeleteConfirmText("");
    setShowDeleteCategoryModal(true);
    setShowCategoryMenu(false);
  };

  const handleCreateCategory = async () => {
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
    const name = newCategoryName.trim();
    if (!name) { Toast.error('El nombre no puede estar vacío'); return; }
    setCreatingCategory(true);
    try {
      await createCategory(name);
      Toast.success('Categoría creada');
      const cats = await getCategories();
      setCategories(cats);
      setNewCategoryName("");
      setShowCreateCategoryModal(false);
    } catch (e) {
      console.error(e);
      Toast.error(e instanceof Error ? e.message : 'Error creando categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleUpdateCategory = async () => {
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
    if (!editingCategoryId) { Toast.error('Selecciona una categoría'); return; }
    const name = editCategoryName.trim();
    if (!name) { Toast.error('El nombre no puede estar vacío'); return; }
    setUpdatingCategory(true);
    try {
      await updateCategory(editingCategoryId, name);
      Toast.success('Categoría actualizada');
      const [cats, inv] = await Promise.all([getCategories(), getAllInventory()]);
      setCategories(cats);
      setData(inv);
      setShowEditCategoryModal(false);
    } catch (e) {
      console.error(e);
      Toast.error(e instanceof Error ? e.message : 'Error actualizando categoría');
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
    if (!deletingCategoryId) { Toast.error('Selecciona una categoría'); return; }
    const sel = categories.find(c => c.id === deletingCategoryId);
    if (!sel) { Toast.error('Categoría inválida'); return; }
    if (deleteConfirmText.trim().toLowerCase() !== 'borrar') { Toast.error('Escribe "Borrar" para confirmar'); return; }
    setDeletingCategory(true);
    try {
      await deleteCategory(deletingCategoryId);
      Toast.success('Categoría eliminada');
      const cats = await getCategories();
      setCategories(cats);
      if (String(deletingCategoryId) === selectedCategory) {
        setSelectedCategory('todas');
        const inv = await getAllInventory();
        setData(inv);
      }
      setShowDeleteCategoryModal(false);
    } catch (e) {
      console.error(e);
      Toast.error(e instanceof Error ? e.message : 'Error eliminando categoría');
    } finally {
      setDeletingCategory(false);
    }
  };

  // Funciones para editar productos
  const handleSaveProduct = async (updatedProduct: Partial<InventoryItem>) => {
    if (!editingProduct) return;

    // Verificar permisos de administrador o dueño
    const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    if (!isAdminOrOwner) {
      Toast.error('Acceso denegado: Solo los administradores y dueños pueden editar productos. Contacta a un administrador si necesitas realizar cambios.');
      return;
    }

    try {
      // Función helper para convertir undefined y strings vacíos a null donde corresponda
      const nullifyUndefined = (value: string | number | boolean | null | undefined) => {
        if (value === undefined) return null;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
      };

      // Preparar los datos asegurando que undefined y strings vacíos se conviertan a null
      const cleanData = {
        nombre: nullifyUndefined(updatedProduct.nombre) ? String(nullifyUndefined(updatedProduct.nombre)).trim() : null,
        sku: nullifyUndefined(updatedProduct.sku),
        descripcion: nullifyUndefined(updatedProduct.descripcion),
        unidad: nullifyUndefined(updatedProduct.unidad) ? String(nullifyUndefined(updatedProduct.unidad)).trim() : null,
        tipo_id: nullifyUndefined(updatedProduct.tipo_id),
        afecto_iva: nullifyUndefined(updatedProduct.afecto_iva) ?? false,
        moneda: nullifyUndefined(updatedProduct.moneda),
        costo_unitario: nullifyUndefined(updatedProduct.costo_unitario),
        precio_neto: nullifyUndefined(updatedProduct.precio_neto),
        precio_venta: nullifyUndefined(updatedProduct.precio_venta),
        control_stock: nullifyUndefined(updatedProduct.control_stock) ?? false,
        ficha_tecnica: nullifyUndefined(updatedProduct.ficha_tecnica),
        estado: nullifyUndefined(updatedProduct.estado) || 'disponible',
        activo: nullifyUndefined(updatedProduct.activo) || true
      };

      // Actualizar en la base de datos
      const response = await fetch(`/api/productos/${editingProduct.id}`, {
        method: 'PUT',
        headers: createHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el producto');
      }

      const updatedProductData = await response.json();

      // Actualizar el estado local
      const updatedData = data.map(item =>
        item.id === editingProduct.id
          ? { ...item, ...updatedProductData }
          : item
      );
      setData(updatedData);

      Toast.success('Producto actualizado exitosamente');
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      Toast.error(error instanceof Error ? error.message : 'Error al actualizar el producto');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-accent-primary"></div>
          <p className="text-theme-text-muted">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-3 sm:px-4">
      {/* Header simplificado y más amigable - responsive */}
      <div 
        className="border-b px-3 sm:px-6 py-5 sm:py-8"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--border)' 
        }}
      >
  <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 w-full">
          <div className="text-center lg:text-left">
            <h1 
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              📦 Productos
            </h1>
            <p 
              className="text-base sm:text-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Gestiona y consulta tu catálogo de productos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full lg:w-auto">
            {/* Vista simplificada - quitar el toggle complejo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowGuideModal(true)}
                className="px-4 sm:px-6 py-3 rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
                style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' }}
                title="Guía de productos"
              >
                ❓ Guía
              </button>

              {(['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '')) && (
                <Link
                  href="/dashboard/stock/nuevo"
                  className="px-4 sm:px-6 py-3 rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)', 
                    color: 'white' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden xs:inline">Agregar Producto</span>
                  <span className="xs:hidden">Agregar</span>
                </Link>
              )}

              <button
                className="px-4 sm:px-6 py-3 rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
                style={{ 
                  backgroundColor: 'var(--success-bg)', 
                  color: 'var(--success-text)' 
                }}
                onClick={handleExport}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--success-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--success-bg)'}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden xs:inline">Exportar</span>
                <span className="xs:hidden">Export</span>
              </button>

              {(['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '')) && (
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryMenu(v => !v)}
                    className="px-4 sm:px-6 py-3 rounded-lg transition-colors duration-200 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base border"
                    style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                    aria-haspopup="menu"
                    aria-expanded={showCategoryMenu}
                  >
                    📁 Categorías
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {showCategoryMenu && (
                    <div className="absolute left-0 mt-2 w-56 rounded-lg border shadow-lg z-30 overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                      <button onClick={openCreateCategory} className="block w-full text-left px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>➕ Crear nueva</button>
                      <button onClick={openEditCategory} className="block w-full text-left px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>✏️ Editar</button>
                      <button onClick={openDeleteCategory} className="block w-full text-left px-4 py-2 text-sm" style={{ color: 'var(--error-text)' }}>🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas simplificadas - responsive */}
  <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-3 sm:px-0">
        <div 
          className="rounded-xl border-2 p-4 sm:p-6 text-center"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border)' 
          }}
        >
          <div 
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: 'var(--accent-primary)' }}
          >
            {catalogStats.totalProducts}
          </div>
          <div 
            className="text-base sm:text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Total de Productos
          </div>
        </div>

        <div 
          className="rounded-xl border-2 p-4 sm:p-6 text-center"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border)' 
          }}
        >
          <div 
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: 'var(--success-text)' }}
          >
            {formatCLP(catalogStats.totalValue)}
          </div>
          <div 
            className="text-base sm:text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Valor Total en Venta
          </div>
        </div>

        <div 
          className="rounded-xl border-2 p-4 sm:p-6 text-center"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--border)' 
          }}
        >
          <div 
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: 'var(--warning-text)' }}
          >
            {formatCLP(catalogStats.avgPrice)}
          </div>
          <div 
            className="text-base sm:text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Precio Promedio
          </div>
        </div>
      </div>

      {/* Filtros simplificados - responsive */}
      <div 
        className="max-w-7xl mx-auto rounded-xl border-2 p-4 sm:p-6 mb-6 mx-3 sm:mx-0"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--border)' 
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
              🔍 Buscar Productos
            </label>
            <input
              type="text"
              placeholder="Escribe el nombre del producto..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-base sm:text-lg transition-colors"
              style={{ 
                borderColor: 'var(--border)', 
                backgroundColor: 'var(--input-bg)', 
                color: 'var(--text-primary)' 
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
              📁 Categoría
            </label>
            <select
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-base sm:text-lg transition-colors"
              style={{ 
                borderColor: 'var(--border)', 
                backgroundColor: 'var(--input-bg)', 
                color: 'var(--text-primary)' 
              }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-base sm:text-lg font-semibold mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
              📊 Ordenar Por
            </label>
            <div className="flex gap-2 sm:gap-3">
              <select
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg text-base sm:text-lg transition-colors"
                style={{ 
                  borderColor: 'var(--border)', 
                  backgroundColor: 'var(--input-bg)', 
                  color: 'var(--text-primary)' 
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="nombre">Nombre</option>
                <option value="precio_venta">Precio de Venta</option>
                <option value="costo_unitario">Costo</option>
              </select>
              <button
                className="px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--button-secondary-bg)', 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-primary)' 
                }}
                onClick={() => setSortDirection(dir => dir === 'asc' ? 'desc' : 'asc')}
                title={sortDirection === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información de resultados simplificada - responsive */}
  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 px-3 sm:px-0">
        <div className="text-lg sm:text-xl font-medium mb-2 sm:mb-0" style={{ color: 'var(--text-primary)' }}>
          {searchQuery ? (
            <>Mostrando resultados para: <span className="font-bold" style={{ color: 'var(--accent-primary)' }}> &quot;{searchQuery}&quot;</span></>
          ) : (
            'Todos los productos'
          )}
          <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
            ({filteredAndSortedItems.length} productos)
          </span>
        </div>
      </div>

      {/* Vista de productos - solo grid para simplicidad */}
  <ProductGrid products={paginatedItems} onEdit={handleEditProduct} onAskDelete={(id) => setConfirmDeleteProductId(id)} user={user} openRowMenuId={openRowMenuId} setOpenRowMenuId={setOpenRowMenuId} />

      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredAndSortedItems.length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Estado vacío */}
      {filteredAndSortedItems.length === 0 && !loading && (
        <EmptyState searchQuery={searchQuery} />
      )}

      {/* Modal de edición de producto */}
      {showEditModal && editingProduct && (
        <ProductEditModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={handleCloseEditModal}
        />
      )}
      {/* Crear categoría */}
      {showCreateCategoryModal && (
        <CreateCategoryModal
          isOpen={showCreateCategoryModal}
          onClose={() => setShowCreateCategoryModal(false)}
          onCreate={handleCreateCategory}
          categoryName={newCategoryName}
          setCategoryName={setNewCategoryName}
          creating={creatingCategory}
        />
      )}

      {/* Editar categoría */}
      {showEditCategoryModal && (
        <EditCategoryModal
          isOpen={showEditCategoryModal}
          onClose={() => setShowEditCategoryModal(false)}
          categories={categories}
          categoryId={editingCategoryId}
          setCategoryId={setEditingCategoryId}
          name={editCategoryName}
          setName={setEditCategoryName}
          onConfirm={handleUpdateCategory}
          loading={updatingCategory}
        />
      )}

      {/* Eliminar categoría */}
      {showDeleteCategoryModal && (
        <DeleteCategoryModal
          isOpen={showDeleteCategoryModal}
          onClose={() => setShowDeleteCategoryModal(false)}
          categories={categories}
          categoryId={deletingCategoryId}
          setCategoryId={setDeletingCategoryId}
          confirmText={deleteConfirmText}
          setConfirmText={setDeleteConfirmText}
          onConfirm={handleDeleteCategory}
          loading={deletingCategory}
        />
      )}

      {/* Confirmar eliminación de producto */}
          {confirmDeleteProductId !== null && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Eliminar producto</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p style={{ color: 'var(--text-primary)' }}>Esta acción marcará el producto como inactivo. Escribe <strong>&quot;Borrar&quot;</strong> para confirmar.</p>
                  <input
                    value={deleteProductConfirmText}
                    onChange={(e) => setDeleteProductConfirmText(e.target.value)}
                    placeholder="Escribe Borrar para confirmar"
                    className="w-full px-4 py-2 border-2 rounded-lg"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="p-6 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => { setConfirmDeleteProductId(null); setDeleteProductConfirmText(''); }} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-primary)' }} disabled={deletingProduct}>Cancelar</button>
                  <button
                    onClick={async () => {
                      const isAdminOrOwner = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
                      if (!isAdminOrOwner) { Toast.error('Solo administradores y dueños'); return; }
                      if (confirmDeleteProductId === null) return;
                      if (deleteProductConfirmText.trim().toLowerCase() !== 'borrar') { Toast.error('Escribe Borrar para confirmar'); return; }
                      try {
                        setDeletingProduct(true);
                        await ProductosService.delete(confirmDeleteProductId);
                        setData(prev => prev.filter(p => p.id !== confirmDeleteProductId));
                        Toast.success('Producto eliminado');
                        setConfirmDeleteProductId(null);
                        setDeleteProductConfirmText('');
                      } catch (e) {
                        console.error(e);
                        Toast.error(e instanceof Error ? e.message : 'Error eliminando producto');
                      } finally {
                        setDeletingProduct(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-white"
                    style={{ backgroundColor: 'var(--error-bg)' }}
                    disabled={deletingProduct}
                  >
                    {deletingProduct ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de guía */}
          {showGuideModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>📚 Guía de Productos</h3>
                </div>
                <div className="p-6 space-y-4">
                  <p style={{ color: 'var(--text-primary)' }}>Bienvenido al apartado de productos. Aquí puedes gestionar tu catálogo de insumos y materiales.</p>
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>💡 Tips útiles:</h4>
                  <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    <li>Usa la búsqueda para encontrar productos rápidamente por nombre.</li>
                    <li>Filtra por categoría para organizar mejor tu inventario.</li>
                    <li>Ordena los productos por nombre, precio de venta o costo unitario.</li>
                    <li><strong>Haz clic en el nombre o categoría de un producto</strong> para expandir el texto completo si aparece truncado (con &hellip;).</li>
                    <li>Solo administradores pueden editar, crear o eliminar productos y categorías.</li>
                    <li>Exporta tu catálogo a Excel para análisis externos.</li>
                    <li>Recuerda que eliminar un producto lo marca como inactivo, no lo borra permanentemente.</li>
                    <li>Si tienes dudas, contacta al soporte o revisa la documentación.</li>
                  </ul>
                </div>
                <div className="p-6 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => setShowGuideModal(false)} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}>Entendido</button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
function ProductGrid({ products, onEdit, onAskDelete, user, openRowMenuId, setOpenRowMenuId }: { products: InventoryItem[]; onEdit: (product: InventoryItem) => void; onAskDelete: (id: number) => void; user: User | null; openRowMenuId: number | null; setOpenRowMenuId: (id: number | null) => void }) {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 px-3 sm:px-0 items-stretch w-full">
      {products.map(product => (
        <ProductCard key={product.id} product={product} onEdit={onEdit} onAskDelete={onAskDelete} user={user} openRowMenuId={openRowMenuId} setOpenRowMenuId={setOpenRowMenuId} />
      ))}
    </div>
  );
}

// Componente para tarjeta de producto mejorada para usuarios no técnicos
function ProductCard({ product, onEdit, onAskDelete, user, openRowMenuId, setOpenRowMenuId }: { product: InventoryItem; onEdit: (product: InventoryItem) => void; onAskDelete: (id: number) => void; user: User | null; openRowMenuId: number | null; setOpenRowMenuId: (id: number | null) => void }) {
  const menuOpen = openRowMenuId === product.id;
  const [expandedName, setExpandedName] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(false);
  return (
    <div 
      className="rounded-xl border-2 overflow-hidden hover:shadow-lg transition-all duration-300 min-h-[350px] sm:min-h-[400px] h-full flex flex-col group"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--border)' 
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Header con información principal - responsive */}
      <div 
        className="p-4 sm:p-6 border-b bg-gradient-to-r"
        style={{ 
          borderColor: 'var(--border)', 
          background: 'linear-gradient(to right, var(--card-bg), var(--card-bg))' 
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 min-h-[120px]">
            {/* Nombre del producto - responsive - altura fija para alineación */}
            <div className="h-16 mb-2 sm:mb-3 flex items-start">
              <h3 className={`text-lg sm:text-2xl font-bold leading-tight w-full ${expandedName ? '' : 'line-clamp-2'} cursor-pointer`} style={{ color: 'var(--text-primary)' }} onClick={() => setExpandedName(!expandedName)} title={product.nombre}>
                {product.nombre}
              </h3>
            </div>

            {/* Categoría - badge responsive - siempre reservar espacio para alineación */}
            <div className="h-8 flex items-center mb-2 overflow-hidden">
              {product.tipo ? (
                <span 
                  className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${expandedCategory ? '' : 'truncate'} max-w-full cursor-pointer`}
                  style={{ 
                    backgroundColor: 'var(--accent-bg)', 
                    color: 'var(--accent-text)', 
                    borderColor: 'var(--accent-primary)' 
                  }}
                  onClick={() => setExpandedCategory(!expandedCategory)}
                  title={product.tipo.nombre}
                >
                  📁 {product.tipo.nombre}
                </span>
              ) : null}
            </div>

            {/* Código (SKU) siempre visible con placeholder) */}
            <p 
              className="text-xs sm:text-sm mt-2 sm:mt-3 font-mono px-2 sm:px-3 py-1 rounded inline-block"
              style={{ 
                color: 'var(--text-secondary)', 
                backgroundColor: 'var(--input-bg)' 
              }}
            >
              {`Código: ${product.sku && product.sku.toString().trim() ? product.sku : '—'}`}
            </p>
          </div>

          {/* Botón de editar - responsive */}
          {(['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '')) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(product)}
                className="p-2 sm:p-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex-shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                title="Editar producto"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={() => setOpenRowMenuId(menuOpen ? null : product.id)}
                  className="p-2 sm:p-3 rounded-lg border flex-shrink-0"
                  style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title="Más acciones"
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border shadow-lg z-30 overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                    <button onClick={() => { setOpenRowMenuId(null); onAskDelete(product.id); }} className="block w-full text-left px-4 py-2 text-sm" style={{ color: 'var(--error-text)' }}>🗑️ Eliminar</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal - responsive */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        {/* Descripción: siempre reservamos el espacio para alinear */}
        <div className="mb-6">
          <p 
            className="leading-relaxed text-base h-[64px] overflow-hidden"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.descripcion && product.descripcion.trim().length > 0 ? product.descripcion : '\u00A0'}
          </p>
        </div>

        {/* Precios - sección destacada y clara */}
        <div 
          className="border rounded-xl p-5 mb-6 h-[200px] flex flex-col"
          style={{ 
            backgroundColor: 'var(--success-bg)', 
            borderColor: 'var(--success-border)' 
          }}
        >
          <h4 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--success-text)' }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Precios
          </h4>

          <div className="space-y-3 flex-1 flex flex-col justify-between">
            {/* Precio de venta - más destacado */}
            {product.precio_venta && (
              <div 
                className="flex items-center justify-between p-3 rounded-lg border mb-auto"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--success-border)' 
                }}
              >
                <span className="text-lg font-bold" style={{ color: 'var(--success-text)' }}>Precio de Venta</span>
                <span className="text-2xl font-bold text-right w-[120px]" style={{ color: 'var(--success-text)' }}>
                  {formatCLP(product.precio_venta)}
                </span>
              </div>
            )}

            {/* Precio neto */}
            {product.precio_neto && (
              <div 
                className="flex items-center justify-between p-2 rounded mt-auto"
                style={{ backgroundColor: 'var(--input-bg)' }}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Precio Neto</span>
                <span className="text-lg font-semibold text-right w-[120px]" style={{ color: 'var(--text-primary)' }}>
                  {formatCLP(product.precio_neto)}
                </span>
              </div>
            )}

            {/* Costo */}
            {product.costo_unitario && (
              <div 
                className="flex items-center justify-between p-2 rounded mt-1"
                style={{ backgroundColor: 'var(--input-bg)' }}
              >
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Costo</span>
                <span className="text-sm text-right w-[120px]" style={{ color: 'var(--text-secondary)' }}>
                  {formatCLP(product.costo_unitario)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer con información adicional - responsive */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {product.unidad}
            </span>

            {product.moneda && (
              <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {product.moneda}
              </span>
            )}
          </div>

          {/* Estado del producto */}
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: product.activo ? 'var(--success-bg)' : 'var(--error-bg)',
              color: product.activo ? 'var(--success-text)' : 'var(--error-text)',
              borderColor: product.activo ? 'var(--success-border)' : 'var(--error-border)'
            }}
          >
            {product.activo ? '✓ Disponible' : '✗ No disponible'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Modal crear categoría
function CreateCategoryModal({
  isOpen,
  onClose,
  onCreate,
  categoryName,
  setCategoryName,
  creating
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  categoryName: string;
  setCategoryName: (v: string) => void;
  creating: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Crear nueva categoría</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Nombre</label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej: Materiales"
              className="w-full px-4 py-2 border-2 rounded-lg"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
              maxLength={100}
            />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-primary)' }} disabled={creating}>Cancelar</button>
          <button onClick={onCreate} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--accent-primary)' }} disabled={creating || !categoryName.trim()}>
            {creating ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal editar categoría (con selección)
function EditCategoryModal({
  isOpen,
  onClose,
  categories,
  categoryId,
  setCategoryId,
  name,
  setName,
  onConfirm,
  loading
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  categoryId: number | null;
  setCategoryId: (id: number | null) => void;
  name: string;
  setName: (v: string) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Editar categoría</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Selecciona categoría</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                setCategoryId(id);
                const sel = categories.find(c => c.id === id);
                setName(sel?.nombre ?? '');
              }}
              className="w-full px-4 py-2 border-2 rounded-lg"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">Selecciona...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && !!categoryId && !!name.trim()) {
                  onConfirm();
                }
              }}
              className="w-full px-4 py-2 border-2 rounded-lg"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
              maxLength={100}
              autoFocus
            />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-primary)' }} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-primary)' }} 
            disabled={loading || !categoryId || !name.trim()}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal eliminar categoría (con selección)
function DeleteCategoryModal({
  isOpen,
  onClose,
  categories,
  categoryId,
  setCategoryId,
  confirmText,
  setConfirmText,
  onConfirm,
  loading
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  categoryId: number | null;
  setCategoryId: (id: number | null) => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!isOpen) return null;
  const selected = categories.find(c => c.id === (categoryId ?? -1));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Eliminar categoría</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Selecciona categoría</label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                setCategoryId(id);
                setConfirmText('');
              }}
              className="w-full px-4 py-2 border-2 rounded-lg"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
            >
              <option value="">Selecciona...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <p style={{ color: 'var(--text-primary)' }}>Escribe <strong>&quot;Borrar&quot;</strong> para habilitar la acción de eliminación.</p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              const canDelete = !loading && !!categoryId && !!selected && confirmText.trim().toLowerCase() === 'borrar';
              if (e.key === 'Enter' && canDelete) {
                onConfirm();
              }
            }}
            placeholder="Escribe Borrar para confirmar"
            className="w-full px-4 py-2 border-2 rounded-lg"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }}
            autoFocus
          />
        </div>
        <div className="p-6 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--button-secondary-bg)', color: 'var(--text-primary)' }} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--error-bg, #dc2626)' }} 
            disabled={loading || !categoryId || !selected || confirmText.trim().toLowerCase() !== 'borrar'}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de paginación simplificada
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div 
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 rounded-xl border-2 p-6"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--border)' 
      }}
    >
      <div className="text-base sm:text-lg" style={{ color: 'var(--text-primary)' }}>
        Mostrando <span className="font-bold">{startItem}-{endItem}</span> de <span className="font-bold">{totalItems}</span> productos
      </div>

      <div className="flex items-center gap-3">
        <button
          className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          style={{ 
            backgroundColor: 'var(--button-secondary-bg)', 
            color: 'var(--text-primary)' 
          }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Anterior
        </button>

        <div className="flex items-center gap-2">
          {/* Páginas simplificadas - mostrar máximo 5 páginas */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                style={{
                  backgroundColor: pageNum === currentPage ? 'var(--accent-primary)' : 'var(--button-secondary-bg)',
                  color: pageNum === currentPage ? 'white' : 'var(--text-primary)'
                }}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          style={{ 
            backgroundColor: 'var(--button-secondary-bg)', 
            color: 'var(--text-primary)' 
          }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}// Componente para estado vacío mejorado
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div 
      className="text-center py-16 rounded-xl border-2"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--border)' 
      }}
    >
      <div className="text-8xl mb-6">📦</div>
      <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        {searchQuery ? 'No encontramos productos' : 'No hay productos aún'}
      </h3>
      <p className="text-xl mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
        {searchQuery
          ? `No encontramos productos que coincidan con "${searchQuery}". Intenta con otros términos.`
          : 'Cuando agregues productos, aparecerán aquí para que puedas gestionarlos fácilmente.'
        }
      </p>
      {!searchQuery && (
        <Link
          href="/dashboard/stock/nuevo"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-lg transition-colors duration-200 font-semibold text-lg shadow-md hover:shadow-lg"
          style={{ 
            backgroundColor: 'var(--accent-primary)', 
            color: 'white' 
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Primer Producto
        </Link>
      )}
    </div>
  );
}

// Componente modal para editar producto
function ProductEditModal({
  product,
  categories,
  onSave,
  onClose
}: {
  product: InventoryItem;
  categories: Category[];
  onSave: (updatedProduct: Partial<InventoryItem>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    nombre: product.nombre,
    sku: product.sku || '',
    descripcion: product.descripcion || '',
    unidad: product.unidad,
    tipo_id: product.tipo_id || null,
    afecto_iva: product.afecto_iva || false,
    moneda: product.moneda || '',
    costo_unitario: product.costo_unitario || null,
    precio_neto: product.precio_neto || null,
    precio_venta: product.precio_venta || null,
    control_stock: product.control_stock || false,
    ficha_tecnica: product.ficha_tecnica || '',
    estado: product.estado || 'disponible',
    activo: product.activo || true
  });

  const [saving, setSaving] = useState(false);

  // Reset form data when product changes
  useEffect(() => {
    setFormData({
      nombre: product.nombre || '',
      sku: product.sku || '',
      descripcion: product.descripcion || '',
      unidad: product.unidad || '',
      tipo_id: product.tipo_id || null,
      afecto_iva: product.afecto_iva ?? false,
      moneda: product.moneda || '',
      costo_unitario: product.costo_unitario || null,
      precio_neto: product.precio_neto || null,
      precio_venta: product.precio_venta || null,
      control_stock: product.control_stock ?? false,
      ficha_tecnica: product.ficha_tecnica || '',
      estado: product.estado || 'disponible',
      activo: product.activo || true
    });
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-theme-card rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-theme-text-primary">
            Editar Producto
          </h2>
          <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text-primary transition-colors p-2 hover:bg-theme-bg-secondary rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-theme-text-primary mb-4">
                Información Básica
              </h3>
            </div>

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
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-theme-text-primary mb-2">
                Descripción
              </label>
              <textarea
                className="form-input w-full"
                rows={3}
                maxLength={200}
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
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

            {/* Precios */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-theme-text-primary mb-4">
                Información de Precios
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-primary mb-2">
                Moneda
              </label>
              <input
                type="text"
                className="form-input w-full"
                placeholder="ej: CLP, USD"
                value={formData.moneda}
                onChange={(e) => handleInputChange('moneda', e.target.value)}
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
              />
            </div>

            {/* Configuración */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-theme-text-primary mb-4">
                Configuración
              </h3>
            </div>

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
                placeholder="Información técnica del producto..."
                value={formData.ficha_tecnica}
                onChange={(e) => handleInputChange('ficha_tecnica', e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Actions - Fixed at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t border-theme-border bg-theme-card flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => document.querySelector('form')?.requestSubmit()}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
