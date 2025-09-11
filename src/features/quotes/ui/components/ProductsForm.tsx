"use client";

import React, { useState, useMemo } from 'react';
import { 
  FiPackage, 
  FiPlus, 
  FiMinus, 
  FiTrash2, 
  FiEdit3, 
  FiSearch,
  FiGrid,
  FiList,
  FiShoppingCart,
  FiChevronUp,
  FiChevronDown,
  FiTrendingDown
} from 'react-icons/fi';
import { QuoteItem } from '@/core/domain/quote/Quote';
import { useProducts } from '../../model/useProducts';

interface ProductsFormProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  errors?: string[];
}

// Fallback icon
const categoryIcon = (name: string) => {
  if (/cement/i.test(name)) return '🏗️';
  if (/ladrill|bloque/i.test(name)) return '�';
  if (/acero|fierro|metal/i.test(name)) return '�';
  if (/mader/i.test(name)) return '🪵';
  if (/pintur|paint/i.test(name)) return '🎨';
  if (/herramient/i.test(name)) return '�';
  if (/aisl/i.test(name)) return '🧊';
  if (/electr/i.test(name)) return '⚡';
  if (/sanit/i.test(name)) return '🚿';
  return '📦';
};

interface CategoryScrollerProps {
  categories: { id: number; nombre: string }[];
  selected: number | 'all';
  onSelect: (id: number | 'all') => void;
}

const CategoryScroller: React.FC<CategoryScrollerProps> = ({ categories, selected, onSelect }) => {
  // State for tracking expanded state
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Calculate which categories to display
  const displayCategories = isExpanded ? categories : categories.slice(0, 8);
  const hiddenCount = categories.length - 8;
  
  return (
    <div className="space-y-4">
      {/* Categories row */}
      <div className="flex flex-wrap gap-2 py-1">
        <CategoryChip 
          label="Todas" 
          icon="🗂️" 
          active={selected==='all'} 
          onClick={() => onSelect('all')} 
        />
        {displayCategories.map(cat => (
          <CategoryChip 
            key={cat.id} 
            label={cat.nombre} 
            icon={categoryIcon(cat.nombre)} 
            active={selected===cat.id} 
            onClick={() => onSelect(cat.id)} 
          />
        ))}
      </div>
      
      {/* Toggle button - only show if we have more than 8 categories */}
      {categories.length > 8 && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all"
            style={{
              backgroundColor: 'var(--accent-bg)', 
              borderColor: 'var(--accent-primary)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-text)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {isExpanded ? (
              <>
                <FiChevronUp size={16} /> Ver menos
              </>
            ) : (
              <>
                <FiChevronDown size={16} /> Ver más ({hiddenCount})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

interface CategoryChipProps { label: string; icon: string; active: boolean; onClick: () => void }
const CategoryChip: React.FC<CategoryChipProps> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center min-w-[90px] text-xs gap-1 transition-all hover:shadow-sm ${active ? 'transform scale-105' : ''}`}
    style={{
      backgroundColor: active ? 'var(--accent-bg)' : 'var(--card-bg)',
      color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
      border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border)'}`,
      boxShadow: active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
    }}
  >
    <span className="text-base">{icon}</span>
    <span className="truncate max-w-[80px] font-medium" title={label}>{label}</span>
  </button>
);

export function ProductsForm({ items, onChange }: ProductsFormProps) {
  const { products, categories, loading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dense, setDense] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  
  // Agregamos estado para descuento global
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  
  const [newItem, setNewItem] = useState<Partial<QuoteItem>>({
    codigo: '',
    descripcion: '',
    unidad: 'Unidad',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0
  });

  const filteredProducts = useMemo(() => {
    const base = products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.categorias.some(c => c.id === selectedCategory);
      const term = searchTerm.toLowerCase();
      const matchesTerm = !term || p.nombre.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
    // Reset page if filter changes reduces total
    if ((page - 1) * PAGE_SIZE >= base.length) setPage(1);
    return base;
  }, [products, selectedCategory, searchTerm]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const calculateSubtotal = (cantidad: number, precioUnitario: number, descuento: number = 0) => {
    const subtotal = cantidad * precioUnitario;
    const descuentoAmount = subtotal * (descuento / 100);
    return subtotal - descuentoAmount;
  };

  const addProductToQuote = (product: { id: number; sku: string | null; nombre: string; unidad: string; precio_venta_neto: number | null; }) => {
    const newQuoteItem: QuoteItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      codigo: product.sku || `PROD-${product.id}`,
      descripcion: product.nombre,
      unidad: product.unidad,
      cantidad: 1,
      precioUnitario: product.precio_venta_neto || 0,
      descuento: 0,
      subtotal: product.precio_venta_neto || 0
    };

    onChange([...items, newQuoteItem]);
  };

  const addCustomProduct = () => {
    if (!newItem.codigo || !newItem.descripcion || !newItem.precioUnitario) return;

    const customItem: QuoteItem = {
      id: `item-${Date.now()}`,
      codigo: newItem.codigo!,
      descripcion: newItem.descripcion!,
      unidad: newItem.unidad!,
      cantidad: newItem.cantidad!,
      precioUnitario: newItem.precioUnitario!,
      descuento: newItem.descuento || 0,
      subtotal: calculateSubtotal(newItem.cantidad!, newItem.precioUnitario!, newItem.descuento)
    };

    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = customItem;
      onChange(updatedItems);
      setEditingIndex(null);
    } else {
      onChange([...items, customItem]);
    }

      setNewItem({
        codigo: '',
        descripcion: '',
        unidad: 'Unidad',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0
      });
      setShowAddForm(false);
    };

    const updateItemQuantity = (index: number, cantidad: number) => {
      if (cantidad < 1) return;
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        cantidad,
        subtotal: calculateSubtotal(cantidad, updatedItems[index].precioUnitario, updatedItems[index].descuento)
      };
      onChange(updatedItems);
    };

    const updateItemDiscount = (index: number, descuento: number) => {
      if (descuento < 0 || descuento > 100) return;
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        descuento,
        subtotal: calculateSubtotal(updatedItems[index].cantidad, updatedItems[index].precioUnitario, descuento)
      };
      onChange(updatedItems);
    };

    const removeItem = (index: number) => {
      const updatedItems = items.filter((_, i) => i !== index);
      onChange(updatedItems);
    };

    const editItem = (index: number) => {
      const item = items[index];
      setNewItem({
        codigo: item.codigo,
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento
      });
      setEditingIndex(index);
      setShowAddForm(true);
    };

    const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const globalDiscountAmount = Math.round((subtotalAmount * globalDiscount) / 100);
  const totalAmount = subtotalAmount - globalDiscountAmount;

  return (
    <div className="space-y-6">

            {/* Paginación */}
            {!loading && filteredProducts.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 text-xs">
                <span style={{color:'var(--text-secondary)'}}>Página {page} / {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-40" style={{borderColor:'var(--border)'}}>Anterior</button>
                  <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded disabled:opacity-40" style={{borderColor:'var(--border)'}}>Siguiente</button>
                  <button onClick={()=>setDense(d=>!d)} className="px-2 py-1 border rounded" style={{borderColor:'var(--border)'}}>{dense ? 'Espaciado' : 'Compacto'}</button>
                </div>
              </div>
            )}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <FiPackage className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Productos y Servicios
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Seleccione los productos que incluirá en la cotización
          </p>
        </div>
      </div>

      {/* Resumen rápido */}
      {items.length > 0 && (
        <div className="p-5 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--accent-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Resumen de Cotización
            </h3>
            <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
              {items.length} {items.length === 1 ? 'Producto' : 'Productos'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Cantidad Total
              </span>
              <span className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                {totalItems.toLocaleString('es-CL')}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Subtotal
              </span>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                ${subtotalAmount.toLocaleString('es-CL')}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Total Final
              </span>
              <span className="text-2xl font-bold" style={{ color: 'var(--success-text)' }}>
                ${totalAmount.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
          
          {/* Descuento Global */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h4 className="text-md font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Descuento Global
            </h4>
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Discount Controls */}
              <div className="flex flex-col w-full md:w-auto gap-2">
                <div className="flex items-center">
                  {/* Presets */}
                  <div className="flex gap-1 mr-3">
                    {[0, 5, 10, 15, 20].map(value => (
                      <button
                        key={value}
                        onClick={() => setGlobalDiscount(value)}
                        className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-all ${
                          globalDiscount === value ? 'transform scale-110' : ''
                        }`}
                        style={{
                          backgroundColor: globalDiscount === value ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: globalDiscount === value ? 'white' : 'var(--text-secondary)',
                          border: `1px solid ${globalDiscount === value ? 'var(--accent-primary)' : 'var(--border)'}`,
                          boxShadow: globalDiscount === value ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                        }}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom input */}
                  <div className="flex items-center shadow-sm rounded-lg overflow-hidden" style={{ border: '1px solid var(--accent-primary)' }}>
                    <button 
                      onClick={() => setGlobalDiscount(Math.max(0, globalDiscount - 1))} 
                      className="px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--accent-bg)',
                        color: 'var(--accent-text)'
                      }}
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-14 px-2 py-2 text-center"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        border: 'none',
                        outline: 'none'
                      }}
                    />
                    <button 
                      onClick={() => setGlobalDiscount(Math.min(100, globalDiscount + 1))} 
                      className="px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--accent-bg)',
                        color: 'var(--accent-text)'
                      }}
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                    <div className="px-3 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white'
                      }}
                    >
                      %
                    </div>
                  </div>
                </div>
                
                {/* Discount amount display */}
                {globalDiscount > 0 && (
                  <div className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                    <FiTrendingDown className="w-4 h-4" /> 
                    Ahorro: ${globalDiscountAmount.toLocaleString('es-CL')}
                  </div>
                )}
              </div>
              
              {/* Total after discount */}
              <div className="bg-gradient-to-r from-green-50 to-transparent p-3 rounded-lg flex flex-col items-end" style={{ borderLeft: '3px solid var(--success-text)' }}>
                <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Total con descuento
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--success-text)' }}>
                  ${totalAmount.toLocaleString('es-CL')}
                </div>
                {globalDiscountAmount > 0 && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Original: ${subtotalAmount.toLocaleString('es-CL')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo - Categorías y productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Categorías */}
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Productos
            </h3>
            <CategoryScroller 
              categories={categories} 
              selected={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </div>

          {/* Búsqueda y vista */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-accent' : ''}`}
                style={{
                  backgroundColor: viewMode === 'grid' ? 'var(--accent-bg)' : 'var(--card-bg)',
                  color: viewMode === 'grid' ? 'var(--accent-text)' : 'var(--text-secondary)'
                }}
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 border-l ${viewMode === 'list' ? 'bg-accent' : ''}`}
                style={{
                  backgroundColor: viewMode === 'list' ? 'var(--accent-bg)' : 'var(--card-bg)',
                  color: viewMode === 'list' ? 'var(--accent-text)' : 'var(--text-secondary)',
                  borderColor: 'var(--border)'
                }}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium" style={{ color: 'var(--text-primary)' }}>
                {(selectedCategory === 'all' ? 'Todos los productos' : categories.find(c => c.id === selectedCategory)?.nombre) || ''}
                <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>({filteredProducts.length})</span>
              </h4>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary flex items-center gap-2 text-sm px-3 py-2"
              >
                <FiPlus className="w-4 h-4" />
                Producto Personalizado
              </button>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1" style={{scrollbarWidth:'thin'}}>
                {loading && <p className="col-span-full text-sm" style={{color:'var(--text-secondary)'}}>Cargando...</p>}
                {error && <p className="col-span-full text-sm" style={{color:'var(--danger-text)'}}>{error}</p>}
                {!loading && paginated.map(product => (
                  <div key={product.id} className={`border rounded-lg ${dense ? 'p-3' : 'p-4'} hover:shadow-sm transition-shadow`} style={{ backgroundColor:'var(--card-bg)', borderColor:'var(--border)' }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-xs sm:text-sm truncate" style={{ color:'var(--text-primary)' }}>{product.nombre}</h5>
                        <p className="text-[10px] sm:text-xs font-mono" style={{ color:'var(--text-secondary)' }}>{product.sku || `ID:${product.id}`}</p>
                      </div>
                      <button onClick={()=>addProductToQuote(product)} className="btn-primary p-2 ml-2" title="Agregar a cotización">
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span style={{ color:'var(--text-secondary)' }}>{product.unidad}</span>
                      <span className="font-semibold" style={{ color:'var(--success-text)' }}>${(product.precio_venta_neto||0).toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto" style={{ borderColor:'var(--border)' }}>
                <div className="divide-y" style={{ backgroundColor:'var(--card-bg)' }}>
                  {loading && <div className="p-4 text-sm" style={{color:'var(--text-secondary)'}}>Cargando...</div>}
                  {error && <div className="p-4 text-sm" style={{color:'var(--danger-text)'}}>{error}</div>}
                  {!loading && paginated.map(product => (
                    <div key={product.id} className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate" style={{ color:'var(--text-primary)' }}>{product.nombre}</h5>
                        <p className="text-xs font-mono" style={{ color:'var(--text-secondary)' }}>{(product.sku||`ID:${product.id}`)} - {product.unidad}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold" style={{ color:'var(--success-text)' }}>${(product.precio_venta_neto||0).toLocaleString('es-CL')}</span>
                        <button onClick={()=>addProductToQuote(product)} className="btn-primary flex items-center gap-2 px-3 py-2">
                          <FiShoppingCart className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && filteredProducts.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 text-xs">
                <span style={{color:'var(--text-secondary)'}}>Página {page} / {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-40" style={{borderColor:'var(--border)'}}>Anterior</button>
                  <button disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded disabled:opacity-40" style={{borderColor:'var(--border)'}}>Siguiente</button>
                  <button onClick={()=>setDense(d=>!d)} className="px-2 py-1 border rounded" style={{borderColor:'var(--border)'}}>{dense ? 'Espaciado' : 'Compacto'}</button>
                </div>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No se encontraron productos en esta categoría</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Productos agregados */}
        <div>
          <div 
            className="sticky top-4 border rounded-lg p-4"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Productos Agregados ({items.length})
            </h3>

            {items.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                <FiShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay productos agregados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h6 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {item.descripcion}
                        </h6>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {item.codigo}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => editItem(index)}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <FiEdit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Cantidad */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(index, item.cantidad - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center border"
                          style={{ borderColor: 'var(--border)' }}
                          disabled={item.cantidad <= 1}
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center" style={{ color: 'var(--text-primary)' }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(index, item.cantidad + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                        <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>
                          {item.unidad}
                        </span>
                      </div>

                      {/* Descuento */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Desc:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.descuento || 0}
                          onChange={(e) => updateItemDiscount(index, parseFloat(e.target.value) || 0)}
                          className="w-12 px-1 py-1 text-xs rounded border"
                          style={{
                            backgroundColor: 'var(--input-bg)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>%</span>
                      </div>

                      {/* Precios */}
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          ${item.precioUnitario.toLocaleString('es-CL')} c/u
                        </p>
                        <p className="font-semibold text-sm" style={{ color: 'var(--success-text)' }}>
                          ${item.subtotal.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar producto personalizado */}
  {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div 
            className="max-w-md w-full rounded-lg p-6"
            style={{ backgroundColor: 'var(--card-bg)' }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingIndex !== null ? 'Editar Producto' : 'Agregar Producto Personalizado'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Código
                </label>
                <input
                  type="text"
                  value={newItem.codigo || ''}
                  onChange={(e) => setNewItem({...newItem, codigo: e.target.value})}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Ej: PROD-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={newItem.descripcion || ''}
                  onChange={(e) => setNewItem({...newItem, descripcion: e.target.value})}
                  className="w-full px-3 py-2 rounded border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Descripción del producto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Unidad
                  </label>
                  <select
                    value={newItem.unidad || 'Unidad'}
                    onChange={(e) => setNewItem({...newItem, unidad: e.target.value})}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="m³">m³</option>
                    <option value="m²">m²</option>
                    <option value="m">m</option>
                    <option value="kg">kg</option>
                    <option value="Saco">Saco</option>
                    <option value="Caja">Caja</option>
                    <option value="Rollo">Rollo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.cantidad || 1}
                    onChange={(e) => setNewItem({...newItem, cantidad: parseFloat(e.target.value) || 1})}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Precio Unitario
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.precioUnitario || 0}
                    onChange={(e) => setNewItem({...newItem, precioUnitario: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newItem.descuento || 0}
                    onChange={(e) => setNewItem({...newItem, descuento: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingIndex(null);
                  setNewItem({
                    codigo: '',
                    descripcion: '',
                    unidad: 'Unidad',
                    cantidad: 1,
                    precioUnitario: 0,
                    descuento: 0
                  });
                }}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={addCustomProduct}
                className="flex-1 btn-primary"
                disabled={!newItem.codigo || !newItem.descripcion || !newItem.precioUnitario}
              >
                {editingIndex !== null ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}