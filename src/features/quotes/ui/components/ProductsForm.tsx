"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  FiCheck,
  FiX,
  FiChevronUp,
  FiChevronDown
} from 'react-icons/fi';
import { QuoteItem } from '@/core/domain/quote/Quote';
import { useProducts, Product } from '../../model/useProducts';

interface ProductsFormProps {
  items: QuoteItem[];
  onChange: (items: QuoteItem[]) => void;
  errors?: string[];
}

// Toast notification component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <FiCheck className="w-5 h-5" />;
      case 'error': return <FiX className="w-5 h-5" />;
      case 'info': return <FiPackage className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--success-bg)',
          border: 'var(--success-text)',
          text: 'var(--success-text)',
          icon: 'var(--success-text)'
        };
      case 'error':
        return {
          bg: 'var(--error-bg)',
          border: 'var(--error-text)',
          text: 'var(--error-text)',
          icon: 'var(--error-text)'
        };
      case 'info':
        return {
          bg: 'var(--info-bg)',
          border: 'var(--info-text)',
          text: 'var(--info-text)',
          icon: 'var(--info-text)'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300"
      style={{
        backgroundColor: styles.bg,
        border: `2px solid ${styles.border}`,
        color: styles.text,
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '300px'
      }}
    >
      <div className="flex items-center gap-3">
        <div style={{ color: styles.icon }}>
          {getIcon()}
        </div>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity"
          style={{ color: styles.icon }}
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Category selector component
interface CategorySelectorProps {
  categories: { id: number; nombre: string }[];
  selected: number | 'all';
  onSelect: (id: number | 'all') => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, selected, onSelect, isExpanded, onToggleExpanded }) => {

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cemento') || lowerName.includes('concreto')) return '🏗️';
    if (lowerName.includes('acero') || lowerName.includes('metal')) return '🔧';
    if (lowerName.includes('madera') || lowerName.includes('mader')) return '🪵';
    if (lowerName.includes('pintura') || lowerName.includes('paint')) return '🎨';
    if (lowerName.includes('electrico') || lowerName.includes('eléctrico')) return '⚡';
    if (lowerName.includes('fontanería') || lowerName.includes('plom')) return '🚿';
    if (lowerName.includes('aislante') || lowerName.includes('aislam')) return '🧊';
    if (lowerName.includes('herramienta')) return '🔨';
    return '📦';
  };

  const displayCategories = isExpanded ? categories : categories.slice(0, 8);
  const hiddenCount = categories.length - 8;

  const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="space-y-4">
      {/* Categories row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
        <button
          onClick={() => onSelect('all')}
          className={`px-2 py-3 rounded-lg flex flex-col items-center justify-center text-xs gap-1 transition-all hover:shadow-sm min-h-[70px] ${
            selected === 'all' ? 'transform scale-105' : ''
          }`}
          style={{
            backgroundColor: selected === 'all' ? 'var(--accent-bg)' : 'var(--card-bg)',
            color: selected === 'all' ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: `1px solid ${selected === 'all' ? 'var(--accent-primary)' : 'var(--border)'}`,
            boxShadow: selected === 'all' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
          title="Mostrar todas las categorías"
        >
          <span className="text-lg">📂</span>
          <span className="font-medium text-center leading-tight">Todas</span>
        </button>
        {displayCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-2 py-3 rounded-lg flex flex-col items-center justify-center text-xs gap-1 transition-all hover:shadow-sm min-h-[70px] ${
              selected === cat.id ? 'transform scale-105' : ''
            }`}
            style={{
              backgroundColor: selected === cat.id ? 'var(--accent-bg)' : 'var(--card-bg)',
              color: selected === cat.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: `1px solid ${selected === cat.id ? 'var(--accent-primary)' : 'var(--border)'}`,
              boxShadow: selected === cat.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
            title={cat.nombre}
          >
            <span className="text-lg">{getCategoryIcon(cat.nombre)}</span>
            <span className="font-medium text-center leading-tight break-words max-w-full" style={{ fontSize: '10px', lineHeight: '1.2' }}>
              {truncateText(cat.nombre, 12)}
            </span>
          </button>
        ))}
      </div>

      {/* Toggle button - only show if we have more than 8 categories */}
      {categories.length > 8 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-75 hover:opacity-100"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {isExpanded ? (
              <>
                <FiChevronUp size={16} /> Ver menos ({hiddenCount})
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

// Product card component
interface ProductCardProps {
  product: {
    id: number;
    sku: string | null;
    nombre: string;
    unidad: string;
    precio_venta_neto: number | null;
    stock_actual?: number;
  };
  onAdd: () => void;
  isInCart: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, isInCart }) => {
  return (
    <div
      className="group relative border rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        transform: isInCart ? 'scale(0.98)' : 'scale(1)'
      }}
      onClick={onAdd}
    >
      {isInCart && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'var(--success-text)',
            color: 'white'
          }}
        >
          <FiCheck className="w-3 h-3" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
            {product.nombre}
          </h4>
          <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {product.sku || `ID: ${product.id}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {product.unidad}
          </span>
          {product.stock_actual !== undefined && (
            <span className="text-xs" style={{
              color: product.stock_actual > 0 ? 'var(--success-text)' : 'var(--warning-text)'
            }}>
              Stock: {product.stock_actual}
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: 'var(--success-text)' }}>
            ${product.precio_venta_neto?.toLocaleString('es-CL') || '0'}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: isInCart ? 'var(--success-bg)' : 'var(--accent-bg)',
            color: isInCart ? 'var(--success-text)' : 'var(--accent-text)',
            border: `1px solid ${isInCart ? 'var(--success-text)' : 'var(--accent-primary)'}`
          }}
        >
          {isInCart ? (
            <>
              <FiCheck className="w-4 h-4" />
              En carrito
            </>
          ) : (
            <>
              <FiPlus className="w-4 h-4" />
              Agregar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Cart item component
interface CartItemProps {
  item: QuoteItem;
  index: number;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateDiscount: (index: number, discount: number) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  index,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemove,
  onEdit
}) => {
  const subtotal = item.cantidad * item.precioUnitario * (1 - (item.descuento || 0) / 100);

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
            {item.descripcion}
          </h5>
          <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {item.codigo}
          </p>
        </div>

        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(index)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--info-text)' }}
            title="Editar"
          >
            <FiEdit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--danger-text)' }}
            title="Eliminar"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Quantity Controls */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            Cantidad
            <span className="text-xs opacity-60" title="Haz click para editar"> </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(index, Math.max(1, item.cantidad - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              title="Disminuir cantidad"
            >
              <FiMinus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min="1"
              step="1"
              value={item.cantidad}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') return; // Allow empty input temporarily
                const newQuantity = parseInt(value);
                if (!isNaN(newQuantity) && newQuantity >= 1) {
                  onUpdateQuantity(index, newQuantity);
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value === '' || parseInt(value) < 1) {
                  onUpdateQuantity(index, 1); // Reset to 1 if invalid
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur(); // Trigger blur on Enter
                }
              }}
              className="w-16 px-2 py-1 text-sm rounded border text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              title="Cantidad (presiona Enter para confirmar)"
              placeholder="1"
            />
            <button
              onClick={() => onUpdateQuantity(index, item.cantidad + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              title="Aumentar cantidad"
            >
              <FiPlus className="w-3 h-3" />
            </button>
            <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
              {item.unidad}
            </span>
          </div>
        </div>

        {/* Discount */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Descuento
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={item.descuento || ''}
              placeholder="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  // If empty, set to 0
                  onUpdateDiscount(index, 0);
                } else {
                  const numericValue = parseFloat(value);
                  if (!isNaN(numericValue)) {
                    // Ensure value is between 0 and 100
                    const clampedValue = Math.max(0, Math.min(100, numericValue));
                    onUpdateDiscount(index, clampedValue);
                  }
                }
              }}
              onBlur={(e) => {
                // If field is empty on blur, ensure it's 0
                if (e.target.value === '') {
                  onUpdateDiscount(index, 0);
                }
              }}
              onFocus={(e) => {
                // If currently showing 0, clear it for easier editing
                if (e.target.value === '0' || e.target.value === '') {
                  e.target.value = '';
                }
              }}
              className="w-16 px-2 py-1 text-xs rounded border text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
              title="Descuento porcentual (0-100%)"
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>%</span>
          </div>
        </div>

        {/* Price Summary */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              ${item.precioUnitario.toLocaleString('es-CL')} c/u
            </span>
            <span className="font-bold" style={{ color: 'var(--success-text)' }}>
              ${subtotal.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pagination component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)'
        }}
      >
        <FiChevronDown className="w-4 h-4 rotate-90" />
      </button>

      {/* Page numbers */}
      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={`px-3 py-2 rounded-lg border transition-all min-w-[40px] ${
            page === currentPage ? 'transform scale-105' : ''
          } ${page === '...' ? 'cursor-default' : ''}`}
          style={{
            backgroundColor: page === currentPage ? 'var(--accent-bg)' : 'var(--card-bg)',
            borderColor: page === currentPage ? 'var(--accent-primary)' : 'var(--border)',
            color: page === currentPage ? 'var(--accent-text)' : 'var(--text-primary)',
            boxShadow: page === currentPage ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          {page}
        </button>
      ))}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)'
        }}
      >
        <FiChevronDown className="w-4 h-4 -rotate-90" />
      </button>
    </div>
  );
};

export function ProductsForm({ items, onChange }: ProductsFormProps) {
  const { products, types, loading, error } = useProducts();

  // State management
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Alignment refs and state (to align Cart top with Categories row)
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const categoryAnchorRef = useRef<HTMLDivElement | null>(null);
  const [alignOffset, setAlignOffset] = useState(0);

  useEffect(() => {
    const computeOffset = () => {
      if (leftPanelRef.current && categoryAnchorRef.current) {
        try {
          const offset = categoryAnchorRef.current.offsetTop - leftPanelRef.current.offsetTop;
          setAlignOffset(Math.max(0, offset));
        } catch {
          // no-op
        }
      }
    };

    // Compute on mount and when window resizes
    computeOffset();
    const onResize = () => computeOffset();
    window.addEventListener('resize', onResize);
    // Recompute shortly after mount to catch font/layout shifts
    const t = setTimeout(computeOffset, 100);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, []);

  // Form state for custom product
  const [newItem, setNewItem] = useState<Partial<QuoteItem>>({
    codigo: '',
    descripcion: '',
    unidad: 'Unidad',
    cantidad: 1,
    precioUnitario: 0,
    descuento: 0
  });

  // Pagination constants
  const PRODUCTS_PER_PAGE = 9;

  // Toast management
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.tipo_id === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchesTerm = !term ||
        p.nombre.toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [products, selectedCategory, searchTerm]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  // Helper functions
  const calculateSubtotal = (cantidad: number, precioUnitario: number, descuento: number = 0) => {
    const subtotal = cantidad * precioUnitario;
    return subtotal * (1 - descuento / 100);
  };

  const addProductToQuote = (product: Product) => {
    const existingIndex = items.findIndex(item =>
      item.productId === product.id || item.codigo === (product.sku || `PROD-${product.id}`)
    );

    if (existingIndex >= 0) {
      // Product already exists, increase quantity
      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        cantidad: updatedItems[existingIndex].cantidad + 1,
        subtotal: calculateSubtotal(
          updatedItems[existingIndex].cantidad + 1,
          updatedItems[existingIndex].precioUnitario,
          updatedItems[existingIndex].descuento
        )
      };
      onChange(updatedItems);
      addToast(`Cantidad aumentada: ${product.nombre}`, 'info');
    } else {
      // Add new product
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
      addToast(`Producto agregado: ${product.nombre}`, 'success');
    }
  };

  const addCustomProduct = () => {
    if (!newItem.descripcion || !newItem.precioUnitario) {
      addToast('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const customItem: QuoteItem = {
      id: `item-${Date.now()}`,
      codigo: newItem.codigo || `CUSTOM-${Date.now()}`,
      descripcion: newItem.descripcion,
      unidad: newItem.unidad || 'Unidad',
      cantidad: newItem.cantidad || 1,
      precioUnitario: newItem.precioUnitario,
      descuento: newItem.descuento || 0,
      subtotal: calculateSubtotal(
        newItem.cantidad || 1,
        newItem.precioUnitario,
        newItem.descuento || 0
      )
    };

    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = customItem;
      onChange(updatedItems);
      addToast('Producto actualizado correctamente', 'success');
      setEditingIndex(null);
    } else {
      onChange([...items, customItem]);
      addToast(`Producto personalizado agregado: ${customItem.descripcion}`, 'success');
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
    const itemName = items[index].descripcion;
    const updatedItems = items.filter((_, i) => i !== index);
    onChange(updatedItems);
    addToast(`Producto eliminado: ${itemName}`, 'info');
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

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--accent-text)'
            }}
          >
            <FiShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Gestión de Productos
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {totalItems} productos • ${subtotalAmount.toLocaleString('es-CL')} total
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--button-text)',
            border: 'none'
          }}
        >
          <FiPlus className="w-4 h-4" />
          Producto Personalizado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Product Catalog */}
        <div ref={leftPanelRef} className="lg:col-span-2 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Categories */}
          {/* Anchor used to align the Cart top with the start of Categories */}
          <div ref={categoryAnchorRef} />

          {/* Categories Header with Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Categorías
            </h4>

            {/* Category Expansion Toggle Button */}
            {types.length > 8 && (
              <button
                onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-text)',
                  border: `1px solid var(--accent-primary)`
                }}
                title={categoriesExpanded ? "Contraer categorías" : "Expandir categorías"}
                aria-label={categoriesExpanded ? "Contraer categorías" : "Expandir categorías"}
              >
                {categoriesExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {categoriesExpanded ? 'Contraer' : 'Expandir'}
                </span>
              </button>
            )}
          </div>

          <CategorySelector
            categories={types}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            isExpanded={categoriesExpanded}
            onToggleExpanded={() => setCategoriesExpanded(!categoriesExpanded)}
          />

          {/* Products Grid/List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedCategory === 'all' ? 'Todos los productos' : types.find(c => c.id === selectedCategory)?.nombre}
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                  ({filteredProducts.length} productos • Página {currentPage} de {totalPages})
                </span>
              </h4>

              {/* Product View Toggle Buttons */}
              <div className="flex rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 relative flex items-center gap-2 ${
                    viewMode === 'grid' ? 'shadow-inner bg-opacity-90' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'grid' ? 'var(--accent-bg)' : 'var(--card-bg)',
                    color: viewMode === 'grid' ? 'var(--accent-text)' : 'var(--text-secondary)',
                    border: 'none'
                  }}
                  title="Vista de tarjetas"
                  aria-label="Cambiar a vista de tarjetas"
                >
                  <FiGrid className="w-5 h-5" />
                  <span className="text-xs font-medium hidden sm:inline">
                    {viewMode === 'grid' && 'Tarjetas'}
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 border-l transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 relative flex items-center gap-2 ${
                    viewMode === 'list' ? 'shadow-inner bg-opacity-90' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'list' ? 'var(--accent-bg)' : 'var(--card-bg)',
                    color: viewMode === 'list' ? 'var(--accent-text)' : 'var(--text-secondary)',
                    borderColor: 'var(--border)'
                  }}
                  title="Vista de lista"
                  aria-label="Cambiar a vista de lista"
                >
                  <FiList className="w-5 h-5" />
                  <span className="text-xs font-medium hidden sm:inline">
                    {viewMode === 'list' && 'Lista'}
                  </span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
                <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Cargando productos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FiX className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error-text)' }} />
                <p style={{ color: 'var(--error-text)' }}>{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  No se encontraron productos{searchTerm ? ' con esa búsqueda' : ' en esta categoría'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedProducts.map(product => {
                  const isInCart = items.some(item =>
                    item.productId === product.id || item.codigo === (product.sku || `PROD-${product.id}`)
                  );
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => addProductToQuote(product)}
                      isInCart={isInCart}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedProducts.map(product => {
                  const isInCart = items.some(item =>
                    item.productId === product.id || item.codigo === (product.sku || `PROD-${product.id}`)
                  );
                  return (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border)'
                      }}
                      onClick={() => addProductToQuote(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {product.nombre}
                          </h5>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {product.sku || `ID: ${product.id}`} • {product.unidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold" style={{ color: 'var(--success-text)' }}>
                            ${product.precio_venta_neto?.toLocaleString('es-CL') || '0'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addProductToQuote(product);
                            }}
                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            style={{
                              backgroundColor: isInCart ? 'var(--success-bg)' : 'var(--accent-bg)',
                              color: isInCart ? 'var(--success-text)' : 'var(--accent-text)',
                              border: `1px solid ${isInCart ? 'var(--success-text)' : 'var(--accent-primary)'}`
                            }}
                          >
                            {isInCart ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                            {isInCart ? 'En carrito' : 'Agregar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div
          className="lg:col-span-1 mt-0 lg:mt-[var(--align-offset)]"
          style={{ ['--align-offset' as any]: `${alignOffset}px` }}
        >
          <div
            className="border rounded-xl p-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--button-text)'
                }}
              >
                <FiShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  Carrito ({items.length})
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ${subtotalAmount.toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <FiShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Tu carrito está vacío
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Agrega productos desde el catálogo
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdateQuantity={updateItemQuantity}
                    onUpdateDiscount={updateItemDiscount}
                    onRemove={removeItem}
                    onEdit={editItem}
                  />
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                  <span style={{ color: 'var(--success-text)' }}>
                    ${subtotalAmount.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="max-w-md w-full rounded-xl p-6"
            style={{
              backgroundColor: 'var(--card-bg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingIndex !== null ? 'Editar Producto' : 'Producto Personalizado'}
              </h3>
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
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Código <span style={{ color: 'var(--danger-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newItem.codigo || ''}
                  onChange={(e) => setNewItem({...newItem, codigo: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Ej: PROD-001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Descripción <span style={{ color: 'var(--danger-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newItem.descripcion || ''}
                  onChange={(e) => setNewItem({...newItem, descripcion: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Descripción del producto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Unidad
                  </label>
                  <select
                    value={newItem.unidad || 'Unidad'}
                    onChange={(e) => setNewItem({...newItem, unidad: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border"
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
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.cantidad || 1}
                    onChange={(e) => setNewItem({...newItem, cantidad: parseFloat(e.target.value) || 1})}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Precio Unitario <span style={{ color: 'var(--danger-text)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.precioUnitario || 0}
                    onChange={(e) => setNewItem({...newItem, precioUnitario: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newItem.descuento || 0}
                    onChange={(e) => setNewItem({...newItem, descuento: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg border"
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

            <div className="flex gap-3 mt-8">
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
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={addCustomProduct}
                className="flex-1 py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--button-text)',
                  border: 'none'
                }}
              >
                {editingIndex !== null ? 'Actualizar Producto' : 'Agregar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}