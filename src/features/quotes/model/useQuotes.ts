"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Quote, 
  QuoteStatus, 
  QuoteFilters, 
  QuotePaginationConfig, 
  QuoteStatusValidator,
  QuoteIdGenerator,
  QuoteAmountCalculator,

} from '@/core/domain/quote/Quote';
import { useAuth } from '@/features/auth/model/useAuth';

// Mock data - En el futuro se reemplazará por llamadas a API
const mockQuotes: Quote[] = [
  {
    id: "COT-2024-001",
    numero: "2024-001",
    cliente: {
      razonSocial: "CONSTRUCTORA LARRAIN DOMINGUES SPA",
      rut: "76.459.290-5",
      nombreFantasia: "CONSTRUCTORA LDZ",
      giro: "CONSTRUCCION",
      direccion: "FLOR DE AZUSENAS 111 OF 61 LAS CONDES",
      ciudad: "Santiago",
      comuna: "Las Condes",
      telefono: "942683117",
      email: "contacto@constructoraldz.cl",
      nombreContacto: "GONZALO PARRA",
      telefonoContacto: "942683117"
    },
    fechaCreacion: "2024-08-29",
    fechaModificacion: "2024-08-29",
    estado: "borrador",
    vendedorId: "MARCO001",
    vendedorNombre: "MARCO PRADO",
    items: [
      {
        id: "item-001",
        codigo: "CEM-001",
        descripcion: "Cemento Portland 25kg",
        unidad: "Saco",
        cantidad: 100,
        precioUnitario: 8500,
        descuento: 5,
        subtotal: 807500
      },
      {
        id: "item-002",
        codigo: "ARE-001",
        descripcion: "Arena Lavada m3",
        unidad: "m3",
        cantidad: 50,
        precioUnitario: 15000,
        subtotal: 750000
      }
    ],
    despacho: {
      direccion: "FRANCIA 421",
      ciudad: "Temuco",
      comuna: "Temuco",
      fechaEstimada: "2024-09-15",
      costoDespacho: 50000,
      observaciones: "Entregar en horario de oficina"
    },
    condicionesComerciales: {
      validezOferta: 30,
      formaPago: "30 días fecha factura",
      tiempoEntrega: "15 días hábiles",
      garantia: "6 meses por defectos de fabricación",
      observaciones: "Precios no incluyen IVA"
    },
    subtotal: 1557500,
    descuentoTotal: 42500,
    iva: 305505,
    total: 1913005,
    notas: "Cotización para obra nueva en Temuco",
    fechaExpiracion: "2024-09-28"
  },
  {
    id: "COT-2024-002",
    numero: "2024-002",
    cliente: {
      razonSocial: "PLAZA PROPIEDADES LTDA",
      rut: "77410570-0",
      giro: "INMOBILIARIA",
      direccion: "AV PROVIDENCIA 2592",
      ciudad: "Santiago",
      comuna: "Providencia",
      telefono: "223456789",
      email: "compras@plazapropiedades.cl"
    },
    fechaCreacion: "2024-08-28",
    fechaModificacion: "2024-08-29",
    estado: "enviada",
    vendedorId: "CHRISTIAN001",
    vendedorNombre: "Christian Balboa",
    items: [
      {
        id: "item-003",
        codigo: "LAD-001",
        descripcion: "Ladrillo Princesa 18x14x29cm",
        unidad: "Unidad",
        cantidad: 5000,
        precioUnitario: 450,
        subtotal: 2250000
      }
    ],
    condicionesComerciales: {
      validezOferta: 15,
      formaPago: "Contado contra entrega",
      tiempoEntrega: "7 días hábiles",
      observaciones: "Precio incluye flete"
    },
    subtotal: 2250000,
    descuentoTotal: 0,
    iva: 427500,
    total: 2677500,
    fechaExpiracion: "2024-09-12"
  }
];

interface UseQuotesReturn {
  // Estado
  quotes: Quote[];
  todasLasCotizaciones: Quote[];
  loading: boolean;
  error: string | null;
  
  // Estadísticas
  estadisticas: {
    total: number;
    borradores: number;
    enviadas: number;
    aceptadas: number;
    rechazadas: number;
    expiradas: number;
    montoTotal: number;
  };
  
  // Filtros y paginación
  filtros: QuoteFilters;
  setFiltros: (filtros: QuoteFilters) => void;
  paginationConfig: QuotePaginationConfig;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  
  // Acciones CRUD
  crearCotizacion: (cotizacion: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'>) => Promise<boolean>;
  actualizarCotizacion: (id: string, cotizacion: Partial<Quote>) => Promise<boolean>;
  eliminarCotizacion: (id: string) => Promise<boolean>;
  duplicarCotizacion: (id: string) => Promise<boolean>;
  cambiarEstado: (id: string, nuevoEstado: QuoteStatus) => Promise<boolean>;
  
  // Utilidades
  formatMoney: (amount: number) => string;
  getStatusColor: (status: QuoteStatus) => { bg: string; text: string };
  getQuoteById: (id: string) => Quote | null;
  canEdit: (cotizacion: Quote) => boolean;
  canDelete: (cotizacion: Quote) => boolean;
  
  // Info del usuario
  userId: string | null;
  userName: string | null;
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 10;

export function useQuotes(): UseQuotesReturn {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Estado local
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<QuoteFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar cotizaciones iniciales
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        // Filtrar cotizaciones según permisos de usuario
        let quotesToLoad = mockQuotes;
        if (!isAdmin && user?.id) {
          quotesToLoad = mockQuotes.filter(quote => quote.vendedorId === user.id);
        }
        
        setAllQuotes(quotesToLoad);
        setError(null);
      } catch (err) {
        setError('Error al cargar las cotizaciones');
        console.error('Error loading quotes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, [isAdmin, user?.id]);

  // Filtrar cotizaciones
  const filteredQuotes = useMemo(() => {
    let filtered = [...allQuotes];

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const searchTerm = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(quote =>
        quote.numero.toLowerCase().includes(searchTerm) ||
        quote.cliente.razonSocial.toLowerCase().includes(searchTerm) ||
        quote.cliente.rut.includes(searchTerm) ||
        quote.cliente.nombreFantasia?.toLowerCase().includes(searchTerm) ||
        quote.vendedorNombre.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por estado
    if (filtros.estado && filtros.estado.length > 0) {
      filtered = filtered.filter(quote => filtros.estado!.includes(quote.estado));
    }

    // Filtro por vendedor
    if (filtros.vendedor) {
      filtered = filtered.filter(quote => quote.vendedorId === filtros.vendedor);
    }

    // Filtro por cliente
    if (filtros.cliente) {
      filtered = filtered.filter(quote => 
        quote.cliente.razonSocial.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }

    // Filtros de fecha
    if (filtros.fechaDesde) {
      filtered = filtered.filter(quote => quote.fechaCreacion >= filtros.fechaDesde!);
    }
    if (filtros.fechaHasta) {
      filtered = filtered.filter(quote => quote.fechaCreacion <= filtros.fechaHasta!);
    }

    return filtered.sort((a, b) => new Date(b.fechaModificacion).getTime() - new Date(a.fechaModificacion).getTime());
  }, [allQuotes, filtros]);

  // Paginación
  const paginationConfig: QuotePaginationConfig = useMemo(() => {
    const totalItems = filteredQuotes.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    return {
      currentPage,
      itemsPerPage: ITEMS_PER_PAGE,
      totalItems,
      totalPages
    };
  }, [filteredQuotes.length, currentPage]);

  const quotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuotes, currentPage]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const stats = {
      total: allQuotes.length,
      borradores: allQuotes.filter(q => q.estado === 'borrador').length,
      enviadas: allQuotes.filter(q => q.estado === 'enviada').length,
      aceptadas: allQuotes.filter(q => q.estado === 'aceptada').length,
      rechazadas: allQuotes.filter(q => q.estado === 'rechazada').length,
      expiradas: allQuotes.filter(q => q.estado === 'expirada').length,
      montoTotal: allQuotes.reduce((sum, q) => sum + q.total, 0)
    };
    return stats;
  }, [allQuotes]);

  // Funciones de paginación
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= paginationConfig.totalPages) {
      setCurrentPage(page);
    }
  }, [paginationConfig.totalPages]);

  const goToNextPage = useCallback(() => {
    if (currentPage < paginationConfig.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, paginationConfig.totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Acciones CRUD
  const crearCotizacion = async (nuevaCotizacion: Omit<Quote, 'id' | 'numero' | 'fechaCreacion' | 'fechaModificacion'>): Promise<boolean> => {
    try {
      const now = new Date().toISOString().split('T')[0];
      const maxNum = Math.max(...allQuotes.map(q => parseInt(q.numero.split('-')[1]) || 0), 0);
      
      const cotizacion: Quote = {
        ...nuevaCotizacion,
        id: QuoteIdGenerator.generate(maxNum + 1),
        numero: `2024-${(maxNum + 1).toString().padStart(3, '0')}`,
        fechaCreacion: now,
        fechaModificacion: now
      };

      setAllQuotes(prev => [cotizacion, ...prev]);
      return true;
    } catch (error) {
      console.error('Error creating quote:', error);
      return false;
    }
  };

  const actualizarCotizacion = async (id: string, datosActualizados: Partial<Quote>): Promise<boolean> => {
    try {
      const now = new Date().toISOString().split('T')[0];
      setAllQuotes(prev => prev.map(quote => 
        quote.id === id 
          ? { ...quote, ...datosActualizados, fechaModificacion: now }
          : quote
      ));
      return true;
    } catch (error) {
      console.error('Error updating quote:', error);
      return false;
    }
  };

  const eliminarCotizacion = async (id: string): Promise<boolean> => {
    try {
      setAllQuotes(prev => prev.filter(quote => quote.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      return false;
    }
  };

  const duplicarCotizacion = async (id: string): Promise<boolean> => {
    try {
      const cotizacionOriginal = allQuotes.find(q => q.id === id);
      if (!cotizacionOriginal) return false;

      const maxNum = Math.max(...allQuotes.map(q => parseInt(q.numero.split('-')[1]) || 0), 0);
      const now = new Date().toISOString().split('T')[0];

      const cotizacionDuplicada: Quote = {
        ...cotizacionOriginal,
        id: QuoteIdGenerator.generate(maxNum + 1),
        numero: `2024-${(maxNum + 1).toString().padStart(3, '0')}`,
        fechaCreacion: now,
        fechaModificacion: now,
        estado: 'borrador'
      };

      setAllQuotes(prev => [cotizacionDuplicada, ...prev]);
      return true;
    } catch (error) {
      console.error('Error duplicating quote:', error);
      return false;
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: QuoteStatus): Promise<boolean> => {
    try {
      return await actualizarCotizacion(id, { estado: nuevoEstado });
    } catch (error) {
      console.error('Error changing quote status:', error);
      return false;
    }
  };

  // Utilidades
  const formatMoney = (amount: number): string => {
    return QuoteAmountCalculator.formatCurrency(amount);
  };

  const getStatusColor = (status: QuoteStatus) => {
    return QuoteStatusValidator.getStatusColor(status);
  };

  const canEdit = (cotizacion: Quote): boolean => {
    if (isAdmin) return true;
    if (user?.id !== cotizacion.vendedorId) return false;
    return cotizacion.estado === 'borrador';
  };

  const canDelete = (cotizacion: Quote): boolean => {
    if (!isAdmin && user?.id !== cotizacion.vendedorId) return false;
    return cotizacion.estado === 'borrador';
  };

  // Optimización: Retornar la cotización desde el array completo sin filtros adicionales
  // para evitar búsquedas o procesamiento adicional
  const getQuoteById = (id: string): Quote | null => {
    // Buscamos directamente sin filtros adicionales para máxima rapidez
    return mockQuotes.find(quote => quote.id === id) || null;
  };

  return {
    // Estado
    quotes,
    todasLasCotizaciones: allQuotes,
    loading,
    error,
    
    // Estadísticas
    estadisticas,
    
    // Filtros y paginación
    filtros,
    setFiltros,
    paginationConfig,
    goToPage,
    goToNextPage,
    goToPrevPage,
    
    // Acciones CRUD
    crearCotizacion,
    actualizarCotizacion,
    eliminarCotizacion,
    duplicarCotizacion,
    cambiarEstado,
    
    // Utilidades
    formatMoney,
    getStatusColor,
    getQuoteById,
    canEdit,
    canDelete,
    
    // Info del usuario
    userId: user?.id || null,
    userName: user?.name || null,
    isAdmin
  };
}
