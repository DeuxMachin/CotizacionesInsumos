import { useState, useCallback, useRef, useEffect } from 'react';
import type { Obra } from '../types/obras';

/**
 * Hook personalizado para manejar la funcionalidad del modal de obra
 * Proporciona animaciones suaves y manejo del estado
 */
export function useObraModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Abrir modal con animación
  const openModal = useCallback((obra: Obra) => {
    setSelectedObra(obra);
    setIsOpen(true);
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }, []);

  // Cerrar modal con animación
  const closeModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setSelectedObra(null);
      // Restaurar scroll del body
      document.body.style.overflow = '';
    }, 200);
  }, []);

  // Manejar ESC para cerrar modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isClosing) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isClosing, closeModal]);

  // Limpiar overflow del body al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return {
    isOpen,
    isClosing,
    selectedObra,
    openModal,
    closeModal,
    modalRef
  };
}

/**
 * Hook para manejar animaciones suaves en las transiciones
 */
export function useSmootTransitions() {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  }, []);

  const hide = useCallback((delay = 0) => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, delay);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    show,
    hide
  };
}

/**
 * Hook para manejar el estado de los filtros de manera optimizada
 */
export function useOptimizedFilters<T>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setIsLoading(true);
    
    // Debounce para evitar muchas actualizaciones seguidas
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        ...newFilters
      }));
      setIsLoading(false);
    }, 300);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    filters,
    setFilters,
    updateFilters,
    clearFilters,
    isLoading
  };
}
