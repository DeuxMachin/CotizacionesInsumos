"use client";

import React, { useState, useMemo } from 'react';
import type { QuoteStatus } from '@/core/domain/quote/Quote';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiEdit3, 
  FiTrash2, 
  FiPhone,  
  FiUser, 
  FiDollarSign,  
  FiCreditCard, 
  FiClock, 
  FiBriefcase, 
  FiFileText,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiDownload,
  FiCalendar,

  FiChevronDown,
  FiCopy,
  FiMapPin
} from 'react-icons/fi';
import { type ClientExtended, mapRowToClientExtended } from '@/features/clients/model/clientsExtended';
import type { Obra } from '@/features/obras/types/obras';
// Eliminado quotesData mock: ahora se obtienen cotizaciones reales desde la API
import { Badge } from '@/shared/ui/Badge';
import { Toast } from '@/shared/ui/Toast';
import { downloadFileFromResponse } from '@/lib/download';
import { useActionAuthorization } from '@/middleware/AuthorizationMiddleware';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useQuotes } from '@/features/quotes/model/useQuotes';

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0 
  }).format(amount);
}

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

function InfoCard({ title, icon, children, collapsible = false, defaultExpanded = true }: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div 
      className="rounded-lg border overflow-hidden w-full mb-4 sm:mb-6"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div 
        className={`px-4 py-3 flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div 
            className="p-2 rounded flex-shrink-0"
            style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
          >
            {icon}
          </div>
          <h3 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>
        {collapsible && (
          <FiChevronDown 
            className={`w-5 h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        )}
      </div>
      {(!collapsible || isExpanded) && (
        <div className="p-3 sm:p-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number;
  type?: 'text' | 'currency' | 'percentage' | 'phone' | 'email';
  copyable?: boolean;
}

function InfoRow({ label, value, type = 'text', copyable = false }: InfoRowProps) {
  const formatValue = (val: string | number) => {
    if (!val && val !== 0) return '-';
    
    switch (type) {
      case 'currency':
        return formatCLP(Number(val));
      case 'percentage':
        return `${val}%`;
      case 'phone':
        const phoneStr = val.toString();
        if (phoneStr.length === 9) {
          return phoneStr.replace(/(\d{1})(\d{4})(\d{4})/, '+56 $1 $2 $3');
        }
        return phoneStr;
      case 'email':
        return val.toString();
      default:
        return val.toString();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value.toString());
    Toast.success('Copiado al portapapeles');
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="text-sm mb-1 sm:mb-0" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="flex items-center gap-2 max-w-full sm:max-w-[60%]">
        <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {formatValue(value)}
        </span>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="p-1 rounded opacity-60 hover:opacity-100 flex-shrink-0"
            style={{ color: 'var(--text-secondary)' }}
            title="Copiar"
          >
            <FiCopy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface StatCardSimpleProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCardSimple({ label, value, icon, color, bgColor }: StatCardSimpleProps) {
  return (
    <div 
      className="p-4 rounded-lg border flex items-center gap-3"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
    >
      <div 
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-grow">
        <div className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {value}
        </div>
        <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ClientExtended['status'] }) {
  const colors: Record<ClientExtended['status'], { bg: string; text: string }> = {
    vigente: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
    moroso: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
    inactivo: { bg: 'var(--neutral-bg)', text: 'var(--neutral-text)' }
  };

  const labels: Record<ClientExtended['status'], string> = {
    vigente: 'Vigente',
    moroso: 'Moroso',
    inactivo: 'Inactivo'
  };

  // Fallback defensivo por si llega un estado inesperado desde la BD
  const config = colors[status] ?? colors.vigente;
  const label = labels[status] ?? labels.vigente;

  return (
    <span
      className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap inline-flex items-center justify-center"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {label}
    </span>
  );
}

// Tipos mínimos para cotizaciones provenientes del backend
interface QuoteRow {
  id: string;
  folio?: string | null;
  created_at?: string | null;
  fecha_emision?: string | null;
  estado?: string | null;
  total_final?: number | null;
  total_neto?: number | null;
}

interface ClientQuote {
  id: string;
  numero: string;
  fechaCreacion: string;
  estado: QuoteStatus;
  total: number;
}

interface ClientEditForm {
  estado: ClientExtended['status'];
  nombre_razon_social: string;
  nombre_fantasia: string;
  giro: string;
  direccion: string;
  ciudad: string;
  comuna: string;
  contacto_pago: string;
  email_pago: string;
  telefono_pago: string;
  telefono: string;
  celular: string;
  linea_credito: number;
  descuento_cliente_pct: number;
  forma_pago: string;
  cliente_tipo_id: number | null;
}

interface PaymentForm {
  amount: number;
  date: string;
  description: string;
  paymentType: 'parcial' | 'total' | 'adelanto';
  paymentMethod: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro';
  reference: string;
  notes: string;
}

function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { canEdit, canDelete } = useActionAuthorization();
  const { getQuoteById, formatMoney, getStatusColor } = useQuotes();
  
  // Obtener cliente por ID
  const [client, setClient] = React.useState<ClientExtended | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [clientTypes, setClientTypes] = React.useState<Array<{id: number, nombre: string, descripcion?: string | null}>>([]);
  const [formErrors, setFormErrors] = React.useState<Partial<Record<keyof ClientEditForm, string>>>({});
  const [autoEditHandled, setAutoEditHandled] = React.useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [savingPayment, setSavingPayment] = React.useState(false);
  const [paymentErrors, setPaymentErrors] = React.useState<Partial<Record<string, string>>>({});
  const [paymentForm, setPaymentForm] = React.useState<PaymentForm>({
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    description: '',
    paymentType: 'parcial',
    paymentMethod: 'transferencia',
    reference: '',
    notes: ''
  });

  // Form state (se inicializa cuando se abre edición)
  const [form, setForm] = React.useState<ClientEditForm>({
    estado: 'vigente',
    nombre_razon_social: '',
    nombre_fantasia: '',
    giro: '',
    direccion: '',
    ciudad: '',
    comuna: '',
    contacto_pago: '',
    email_pago: '',
    telefono_pago: '',
    telefono: '',
    celular: '',
    linea_credito: 0,
    descuento_cliente_pct: 0,
    forma_pago: '',
    cliente_tipo_id: null
  });

  const openEdit = async () => {
    if (!client) return;
    
    // Cargar tipos de cliente si no están cargados
    if (clientTypes.length === 0) {
      try {
        const res = await fetch('/api/clientes/tipos');
        if (res.ok) {
          const body = await res.json();
          setClientTypes(body.data || []);
        }
      } catch (error) {
        console.error('Error cargando tipos de cliente:', error);
      }
    }
    
    setForm({
      estado: client.status,
      nombre_razon_social: client.razonSocial,
      nombre_fantasia: client.fantasyName || '',
      giro: client.giro || '',
      direccion: client.direccion || '',
      ciudad: client.ciudad || '',
      comuna: client.comuna || '',
      contacto_pago: client.paymentResponsible || client.contactoNombre || '',
      email_pago: client.paymentEmail || client.contactoEmail || '',
      telefono_pago: client.paymentPhone || client.contactoTelefono || '',
      telefono: client.phone || '',
      celular: client.mobile || '',
      linea_credito: client.creditLine || 0,
      descuento_cliente_pct: client.discount || 0,
      forma_pago: client.transferInfo || '',
      cliente_tipo_id: client.clientTypeId || null
    });
    setEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'linea_credito' || name === 'descuento_cliente_pct' ? Number(value) : value }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPaymentForm(f => ({ ...f, [name]: name === 'amount' ? Number(value) : value }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setSavingPayment(true);
    setPaymentErrors({});

    try {
      // Validar el formulario
      const errors: Partial<Record<string, string>> = {};
      if (paymentForm.amount <= 0) {
        errors.amount = 'El monto debe ser mayor a 0';
      }
      if (!paymentForm.date) {
        errors.date = 'La fecha es requerida';
      }
      if (!paymentForm.paymentType) {
        errors.paymentType = 'El tipo de pago es requerido';
      }
      if (!paymentForm.paymentMethod) {
        errors.paymentMethod = 'El método de pago es requerido';
      }

      if (Object.keys(errors).length > 0) {
        setPaymentErrors(errors);
        return;
      }

      // Llamar a la API para registrar el pago
      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cliente_id: client.id,
          monto: paymentForm.amount,
          fecha_pago: paymentForm.date,
          tipo_pago: paymentForm.paymentType,
          metodo_pago: paymentForm.paymentMethod,
          referencia: paymentForm.reference || null,
          descripcion: paymentForm.description || null,
          notas: paymentForm.notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar el pago');
      }

      const result = await response.json();

      // Recargar datos del cliente para actualizar financialTotals
      // Recargar cliente
      const clientRes = await fetch(`/api/clientes/${client.id}`);
      if (clientRes.ok) {
        const clientBody = await clientRes.json();
        setClient(clientBody.data ? mapRowToClientExtended(clientBody.data) : null);
      }

      // Recargar cotizaciones
      const quotesRes = await fetch(`/api/cotizaciones?cliente_id=${client.id}`);
      if (quotesRes.ok) {
        const quotesBody = await quotesRes.json();
        setQuotes((quotesBody.data || []) as QuoteRow[]);
      }

      // Recargar obras
      const obrasRes = await fetch(`/api/obras?cliente_id=${client.id}`);
      if (obrasRes.ok) {
        const obrasBody = await obrasRes.json();
        setObras((obrasBody.data || []) as Obra[]);
      }

      // Mostrar mensaje de éxito
      Toast.success('Pago registrado exitosamente');

      // Resetear formulario y cerrar modal
      setPaymentForm({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentType: 'parcial',
        paymentMethod: 'transferencia',
        reference: '',
        notes: ''
      });
      setShowPaymentModal(false);

      // Mostrar mensaje de éxito (podríamos agregar un toast aquí)

    } catch (error) {
      console.error('Error registrando pago:', error);
      setPaymentErrors({ general: 'Error al registrar el pago. Intente nuevamente.' });
    } finally {
      setSavingPayment(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ClientEditForm, string>> = {};

    if (!form.nombre_razon_social.trim()) {
      errors.nombre_razon_social = 'La razón social es requerida';
    }

    if (form.email_pago && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_pago)) {
      errors.email_pago = 'El email no tiene un formato válido';
    }

    if (form.linea_credito < 0) {
      errors.linea_credito = 'La línea de crédito no puede ser negativa';
    }

    if (form.descuento_cliente_pct < 0 || form.descuento_cliente_pct > 100) {
      errors.descuento_cliente_pct = 'El descuento debe estar entre 0 y 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    if (!validateForm()) {
      Toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/clientes/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const body = await res.json();
      // Actualizar estado local del cliente
      setClient(mapRowToClientExtended(body.data));
      setEditing(false);
      setFormErrors({});
      Toast.success('Actualizado');
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err);
        Toast.error(err.message || 'Error al actualizar');
      } else {
        console.error('Unknown error', err);
        Toast.error('Error al actualizar');
      }
    } finally { setSaving(false); }
  };

  React.useEffect(() => {
    const id = Number(params.id);
    if (Number.isNaN(id)) { setError('ID inválido'); setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        setLoading(true); setError(null);
        const res = await fetch(`/api/clientes/${id}`);
        if (!res.ok) throw new Error('Error al obtener cliente');
        const body = await res.json();
        if (!cancelled) setClient(body.data ? mapRowToClientExtended(body.data) : null);
      } catch (e: unknown) {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'Error desconocido'); }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  // Activar edición automáticamente si viene con ?edit=true
  React.useEffect(() => {
    if (client && !editing && !autoEditHandled && searchParams.get('edit') === 'true' && canEdit('clients')) {
      openEdit();
      setAutoEditHandled(true);
    }
  }, [client, editing, searchParams, canEdit, autoEditHandled]);
  
  // Estado para cotizaciones reales del cliente
  const [quotes, setQuotes] = React.useState<QuoteRow[]>([]);
  const [quotesLoading, setQuotesLoading] = React.useState(false);
  const [quotesError, setQuotesError] = React.useState<string | null>(null);

  // Estado para obras del cliente
  const [obras, setObras] = React.useState<Obra[]>([]);
  const [obrasLoading, setObrasLoading] = React.useState(false);
  const [obrasError, setObrasError] = React.useState<string | null>(null);

  // Cargar cotizaciones del cliente por ID (cliente_principal_id)
  React.useEffect(() => {
    if (!client) return;
    let cancelled = false;
    async function loadQuotes() {
      try {
        setQuotesLoading(true); setQuotesError(null);
        const clientId = client?.id;
        if (!clientId) return;
        const res = await fetch(`/api/cotizaciones?cliente_id=${clientId}`);
        if (!res.ok) throw new Error('Error al cargar cotizaciones');
        const body = await res.json();
        if (!cancelled) setQuotes((body.data || []) as QuoteRow[]);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Error desconocido';
          setQuotesError(msg);
        }
      } finally { if (!cancelled) setQuotesLoading(false); }
    }
    loadQuotes();
    return () => { cancelled = true; };
  }, [client]);

  // Cargar obras del cliente
  React.useEffect(() => {
    if (!client?.id) return;
    let cancelled = false;
    async function loadObras() {
    async function loadObras() {
      if (!client) return;
      try {
        setObrasLoading(true); setObrasError(null);
        const clientId = client.id;
        const res = await fetch(`/api/obras?cliente_id=${clientId}`);
        if (!res.ok) throw new Error('Error al cargar obras');
        const body = await res.json();
        if (!cancelled) setObras((body.data || []) as Obra[]);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Error desconocido';
          setObrasError(msg);
        }
      } finally { if (!cancelled) setObrasLoading(false); }
    }
    }
    loadObras();
    return () => { cancelled = true; };
  }, [client?.id]);

  // Adaptador mínimo para campos usados en la UI (folio/numero, fecha, estado, total)
  const clientQuotes: ClientQuote[] = useMemo(() => {
    const allowed: QuoteStatus[] = ['borrador','enviada','aceptada','rechazada','expirada'];
    return quotes.map((q) => {
      const raw = (q.estado ?? 'borrador') as string;
      const estado: QuoteStatus = (allowed.includes(raw as QuoteStatus) ? raw : 'borrador') as QuoteStatus;
      return {
        id: String(q.id),
        numero: q.folio ?? `COT-${String(q.id)}`,
        fechaCreacion: q.created_at ?? q.fecha_emision ?? new Date().toISOString(),
        estado,
        total: (q.total_final ?? q.total_neto ?? 0) || 0
      };
    });
  }, [quotes]);

  // Totales financieros derivados de cliente_saldos
  const financialTotals = useMemo(() => {
    if (!client) return { paid: 0, pending: 0, partial: 0, overdue: 0, movimientos: 0 };
    // Usar los valores mapeados desde cliente_saldos (último snapshot)
    return {
      paid: client.paid || 0,
      pending: client.pending || 0,
      partial: client.partial || 0, // dinero_cotizado
      overdue: client.overdue || 0,
      movimientos: (client.paid || 0) + (client.pending || 0) + (client.partial || 0) + (client.overdue || 0)
    };
  }, [client]);

  // Función para descargar PDF de cotización
  const handleDownloadQuotePDF = async (quoteNumero: string) => {
    try {
      // Obtener los datos completos de la cotización usando el hook
      const fullQuote = getQuoteById ? getQuoteById(quoteNumero) : null;

      if (!fullQuote) {
        throw new Error('Cotización no encontrada');
      }

      // Generar el PDF
      const pdfResponse = await fetch('/api/pdf/cotizacion/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullQuote)
      });

      if (!pdfResponse.ok) {
        throw new Error('Error al generar el PDF');
      }

      // Descargar el archivo
      const filename = `cotizacion_${quoteNumero}.pdf`;
      await downloadFileFromResponse(pdfResponse, filename);
      Toast.success('PDF descargado exitosamente');

    } catch (error) {
      console.error('Error descargando PDF:', error);
      Toast.error(error instanceof Error ? error.message : 'Error al descargar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando cliente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <FiUser className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Error
          </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={() => router.push('/dashboard/clientes')} className="btn-primary">Volver a Clientes</button>
        </div>
      </div>
    );
  }

  // Si el cliente no existe, mostrar página de error
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <FiUser className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Cliente no encontrado
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            El cliente que buscas no existe o ha sido eliminado
          </p>
          <button 
            onClick={() => router.push('/dashboard/clientes')}
            className="btn-primary"
          >
            Volver a Clientes
          </button>
        </div>
      </div>
    );
  }

  // Reemplazar totales mock por totales basados en cotizaciones
  const totalMovimientos = financialTotals.movimientos;

  const pageContent = (
    <div className="animate-fadeIn pb-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-1 sm:mr-2">
              <button
                onClick={() => router.push('/dashboard/clientes')}
                className="p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
                aria-label="Volver a clientes"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1 w-full">
                <h1 className="text-lg sm:text-xl font-bold leading-tight" style={{ color: 'var(--text-primary)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                  {client.razonSocial}
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  RUT: {client.rut}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 gap-y-2 flex-shrink-0 flex-wrap justify-end">
              <StatusBadge status={client.status} />
              
              {/* Botones de escritorio */}
              <div className="hidden md:flex items-center gap-2">
                {canEdit('clients') && (
                  <button onClick={openEdit} className="btn-secondary flex items-center gap-2">
                    <FiEdit3 className="w-4 h-4" />
                    Editar
                  </button>
                )}
                <button onClick={() => setShowPaymentModal(true)} className="btn-primary flex items-center gap-2">
                  <FiCreditCard className="w-4 h-4" />
                  Registrar Pago
                </button>
                {canDelete('clients') && (
                  <button className="btn-secondary text-red-600 flex items-center gap-2">
                    <FiTrash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
              
              {/* Botones móviles */}
              <div className="flex md:hidden items-center gap-1">
                {canEdit('clients') && (
                  <button 
                    onClick={openEdit}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    title="Editar cliente"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}
                  title="Registrar pago"
                >
                  <FiCreditCard className="w-4 h-4" />
                </button>
                {canDelete('clients') && (
                  <button 
                    className="p-2 rounded-lg transition-colors text-red-600"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    title="Eliminar cliente"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Estadísticas Financieras */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6" role="region" aria-label="Resumen financiero del cliente">
          <StatCardSimple 
            label="Total Pagado"
            value={formatCLP(financialTotals.paid)}
            icon={<FiCheck className="w-4 h-4" />}
            color="var(--success-text)"
            bgColor="var(--success-bg)"
          />
          <StatCardSimple 
            label="Pendiente de Pago"
            value={formatCLP(financialTotals.pending)}
            icon={<FiClock className="w-4 h-4" />}
            color="var(--warning-text)"
            bgColor="var(--warning-bg)"
          />
          <StatCardSimple 
            label="Dinero Cotizado"
            value={formatCLP(financialTotals.partial)}
            icon={<FiDollarSign className="w-4 h-4" />}
            color="var(--neutral-text)"
            bgColor="var(--neutral-bg)"
          />
          <StatCardSimple 
            label="Pagos Vencidos"
            value={formatCLP(financialTotals.overdue)}
            icon={<FiAlertCircle className="w-4 h-4" />}
            color="var(--danger-text)"
            bgColor="var(--danger-bg)"
          />
        </div>
        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            {/* Información Básica */}
            <InfoCard 
              title="Información Básica" 
              icon={<FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="w-full">
                  <InfoRow label="Tipo" value={client.tipoEmpresa || 'Empresa'} />
                  <InfoRow label="Nombre/Razón Social" value={client.razonSocial} />
                  <InfoRow label="Nombre Fantasía" value={client.fantasyName || '-'} />
                  <InfoRow label="RUT" value={client.rut} copyable />
                  <InfoRow label="Giro" value={client.giro || '-'} />
                </div>
                <div className="w-full">
                  <InfoRow label="Región" value={client.region || '-'} />
                  <InfoRow label="Ciudad" value={client.ciudad || '-'} />
                  <InfoRow label="Comuna" value={client.comuna || '-'} />
                  <InfoRow label="Dirección" value={client.direccion || '-'} />
                  <InfoRow label="Tipo de Cliente" value={client.clientType || 'No especificado'} />
                </div>
              </div>
            </InfoCard>

            {/* Información de Contacto */}
            <InfoCard 
              title="Información de Contacto" 
              icon={<FiPhone className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 w-full">
                <div className="w-full">
                  <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base truncate" 
                      style={{ color: 'var(--text-primary)' }}>
                    <FiUser className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Contacto Principal</span>
                  </h4>
                  <InfoRow label="Nombre" value={client.contactoNombre || client.contactName || '-'} />
                  <InfoRow label="Teléfono" value={client.contactoTelefono || client.contactPhone || '-'} type="phone" copyable />
                  <InfoRow label="Email" value={client.contactoEmail || client.email || '-'} type="email" copyable />
                  <InfoRow label="Móvil" value={client.mobile || '-'} type="phone" copyable />
                </div>
                <div className="w-full">
                  <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base truncate"
                      style={{ color: 'var(--text-primary)' }}>
                    <FiCreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Responsable de Pagos</span>
                  </h4>
                  <InfoRow label="Nombre" value={client.paymentResponsible || '-'} />
                  <InfoRow label="Teléfono" value={client.paymentPhone || '-'} type="phone" copyable />
                  <InfoRow label="Email" value={client.paymentEmail || '-'} type="email" copyable />
                  <InfoRow label="Medio de Pago" value={client.transferInfo || '-'} />
                </div>
              </div>
            </InfoCard>

            {/* Historial de Cotizaciones */}
            <InfoCard 
              title={`Historial de Cotizaciones (${quotesLoading ? '...' : clientQuotes.length})`}
              icon={<FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              {quotesError && (
                <div className="text-center py-4 text-sm" style={{ color: 'var(--danger-text)' }}>
                  {quotesError}
                </div>
              )}
              {!quotesError && quotesLoading && (
                <div className="text-center py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Cargando cotizaciones...
                </div>
              )}
              {!quotesLoading && !quotesError && clientQuotes.length > 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para desktop */}
      <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Número</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Fecha</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                          <th className="text-right pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Total</th>
                          <th className="text-center pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientQuotes.map((quote, index) => (
                          <tr 
                            key={quote.id}
                            className="border-b last:border-b-0 hover:bg-opacity-50 transition-colors"
                            style={{ 
                              borderColor: 'var(--border)',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                            }}
                          >
                            <td className="py-3 px-2">
                              <div className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                                {quote.numero}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {quote.id.substring(0, 8)}...
                              </div>
                            </td>
                            <td className="py-3 px-2" style={{ color: 'var(--text-primary)' }}>
                              {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                            </td>
                            <td className="py-3 px-2">
                              <Badge status={quote.estado} />
                            </td>
                            <td className="py-3 px-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatCLP(quote.total)}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center gap-1 justify-center">
                                <button 
                                  onClick={() => router.push(`/dashboard/cotizaciones/${quote.numero}?from=client&client_id=${client.id}`)}
                                  className="btn-secondary text-xs px-2 py-1"
                                >
                                  Ver
                                </button>
                                <button 
                                  onClick={() => handleDownloadQuotePDF(quote.numero)}
                                  className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                                >
                                  <FiDownload className="w-3 h-3" />
                                  PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de tarjetas para móvil */}
      <div className="md:hidden grid grid-cols-1 gap-2.5 w-full">
                    {clientQuotes.map((quote) => (
                      <div 
                        key={quote.id}
        className="p-3 rounded-lg border"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-start justify-between mb-3 w-full">
                          <div className="min-w-0 flex-grow mr-2">
                            <div className="font-medium text-sm truncate" style={{ color: 'var(--accent-primary)' }}>
                              {quote.numero}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {quote.id.substring(0, 8)}...
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge status={quote.estado} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3 w-full">
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(quote.fechaCreacion).toLocaleDateString('es-CL')}
                          </span>
                          <span className="font-medium text-sm truncate ml-2" style={{ color: 'var(--text-primary)' }}>
                            {formatCLP(quote.total)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full">
                          <button 
                            onClick={() => router.push(`/dashboard/cotizaciones/${quote.numero}?from=client&client_id=${client.id}`)}
                            className="btn-secondary text-xs px-3 py-2 flex-1"
                          >
                            Ver
                          </button>
                          <button 
                            onClick={() => handleDownloadQuotePDF(quote.numero)}
                            className="btn-secondary text-xs px-3 py-2 flex-1 flex items-center justify-center gap-1"
                          >
                            <FiDownload className="w-3 h-3" />
                            PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 w-full">
                  <FiFileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Sin cotizaciones
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Este cliente aún no tiene cotizaciones registradas
                  </p>
                </div>
              )}
            </InfoCard>

            {/* Obras Vinculadas */}
            <InfoCard 
              title={`Obras Vinculadas (${obrasLoading ? '...' : obras.length})`}
              icon={<FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              {obrasError && (
                <div className="text-center py-4 text-sm" style={{ color: 'var(--danger-text)' }}>
                  {obrasError}
                </div>
              )}
              {!obrasError && obrasLoading && (
                <div className="text-center py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Cargando obras...
                </div>
              )}
              {!obrasLoading && !obrasError && obras.length > 0 ? (
                <div className="w-full">
                  {/* Vista de tabla para desktop */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Nombre</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Estado</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Etapa</th>
                          <th className="text-left pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Fecha Inicio</th>
                          <th className="text-center pb-3 px-2" style={{ color: 'var(--text-secondary)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obras.map((obra, index) => (
                          <tr 
                            key={obra.id}
                            className="border-b last:border-b-0 hover:bg-opacity-50 transition-colors cursor-pointer"
                            style={{ 
                              borderColor: 'var(--border)',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)'
                            }}
                            onClick={() => router.push(`/dashboard/obras/${obra.id}`)}
                          >
                            <td className="py-3 px-2">
                              <div className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                                {obra.nombreEmpresa}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {obra.direccionObra}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className="px-2 py-1 text-xs font-medium rounded-full" 
                                    style={{ 
                                      backgroundColor: obra.estado === 'activa' ? 'var(--success-bg)' : 
                                                     obra.estado === 'pausada' ? 'var(--warning-bg)' : 'var(--neutral-bg)',
                                      color: obra.estado === 'activa' ? 'var(--success-text)' : 
                                             obra.estado === 'pausada' ? 'var(--warning-text)' : 'var(--neutral-text)'
                                    }}>
                                {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-2" style={{ color: 'var(--text-primary)' }}>
                              {obra.etapaActual.charAt(0).toUpperCase() + obra.etapaActual.slice(1)}
                            </td>
                            <td className="py-3 px-2" style={{ color: 'var(--text-primary)' }}>
                              {obra.fechaInicio.toLocaleDateString('es-CL')}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/obras/${obra.id}`);
                                }}
                                className="btn-secondary text-xs px-3 py-1"
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de tarjetas para móvil */}
                  <div className="md:hidden grid grid-cols-1 gap-2.5 w-full">
                    {obras.map((obra) => (
                      <div 
                        key={obra.id}
                        className="p-3 rounded-lg border cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                        onClick={() => router.push(`/dashboard/obras/${obra.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3 w-full">
                          <div className="min-w-0 flex-grow mr-2">
                            <div className="font-medium text-sm truncate" style={{ color: 'var(--accent-primary)' }}>
                              {obra.nombreEmpresa}
                            </div>
                            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                              {obra.direccionObra}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="px-2 py-1 text-xs font-medium rounded-full" 
                                  style={{ 
                                    backgroundColor: obra.estado === 'activa' ? 'var(--success-bg)' : 
                                                   obra.estado === 'pausada' ? 'var(--warning-bg)' : 'var(--neutral-bg)',
                                    color: obra.estado === 'activa' ? 'var(--success-text)' : 
                                           obra.estado === 'pausada' ? 'var(--warning-text)' : 'var(--neutral-text)'
                                  }}>
                              {obra.estado.charAt(0).toUpperCase() + obra.estado.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3 w-full">
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            Etapa: {obra.etapaActual.charAt(0).toUpperCase() + obra.etapaActual.slice(1)}
                          </span>
                          <span className="text-xs truncate ml-2" style={{ color: 'var(--text-secondary)' }}>
                            Inicio: {obra.fechaInicio.toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/obras/${obra.id}`);
                          }}
                          className="btn-secondary text-xs px-3 py-2 w-full"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 w-full">
                  <FiBriefcase className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Sin obras vinculadas
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Este cliente no tiene obras registradas
                  </p>
                </div>
              )}
            </InfoCard>

          </div>

          {/* Columna lateral */}
          <div>
            {/* Información de Crédito */}
            <InfoCard 
              title="Información de Crédito" 
              icon={<FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="space-y-2.5 sm:space-y-3 w-full">
                <InfoRow label="Crédito Actual" value={client.credit} type="currency" />
                <InfoRow label="Línea de Crédito" value={client.creditLine} type="currency" />
                <InfoRow label="Días Adicionales" value={`${client.additionalDays} días`} />
                <InfoRow label="Descuento" value={client.discount} type="percentage" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-3 border-b" 
                     style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs sm:text-sm font-medium mb-1 sm:mb-0" style={{ color: 'var(--text-secondary)' }}>
                    Restricción al Vencido
                  </span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {client.retention === 'SI' ? (
                      <div className="flex items-center gap-0.5 sm:gap-1" style={{ color: 'var(--danger-text)' }}>
                        <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">SÍ</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 sm:gap-1" style={{ color: 'var(--success-text)' }}>
                        <FiX className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">NO</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Resumen Financiero */}
            <InfoCard 
              title="Resumen Financiero" 
              icon={<FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="space-y-2 sm:space-y-3 w-full">
                <div className="flex items-center justify-between py-1 sm:py-2 w-full">
                  <span className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Total Movimientos</span>
                  <span className="font-bold text-base sm:text-lg truncate ml-2" style={{ color: 'var(--text-primary)' }}>
                    {formatCLP(totalMovimientos)}
                  </span>
                </div>
                <div className="border-t pt-2 sm:pt-3 w-full" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between py-0.5 sm:py-1 w-full">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--success-text)' }}>Pagado</span>
                    <span className="font-medium text-xs sm:text-sm truncate ml-2" style={{ color: 'var(--success-text)' }}>
                      {formatCLP(financialTotals.paid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-0.5 sm:py-1 w-full">
                    <span className="text-xs sm:text-sm" style={{ color: 'var(--warning-text)' }}>Por Cobrar</span>
                    <span className="font-medium text-xs sm:text-sm truncate ml-2" style={{ color: 'var(--warning-text)' }}>
                      {formatCLP(financialTotals.pending)}
                    </span>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Otra Información */}
            <InfoCard 
              title="Otra Información" 
              icon={<FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" />}
            >
              <div className="space-y-2.5 sm:space-y-3 w-full">
                <InfoRow label="Estado" value={client.status} />
                <InfoRow label="Correo(s) Electrónico(s)" value={client.email || client.contactoEmail || '-'} type="email" copyable />
                <InfoRow label="Teléfono" value={client.phone || client.contactoTelefono || '-'} type="phone" copyable />
                <InfoRow label="Celular" value={client.mobile || '-'} type="phone" copyable />
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
  // Render principal con modal de edición
  return (
    <>
      {pageContent}
      <EditModal 
        open={editing} 
        onClose={() => setEditing(false)} 
        onSubmit={handleSubmit} 
        form={form} 
        onChange={handleChange} 
        saving={saving}
        errors={formErrors}
        clientTypes={clientTypes}
        onClientTypeChange={(value) => setForm(f => ({ ...f, cliente_tipo_id: value }))}
      />
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handlePaymentSubmit}
        form={paymentForm}
        onChange={handlePaymentChange}
        saving={savingPayment}
        errors={paymentErrors}
        financialTotals={financialTotals}
      />
    </>
  );
}

// Modal simple inline (sin portal) para edición
interface EditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: ClientEditForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  saving: boolean;
  errors: Partial<Record<keyof ClientEditForm, string>>;
  clientTypes: Array<{id: number, nombre: string, descripcion?: string | null}>;
  onClientTypeChange: (value: number | null) => void;
}

function EditModal({ open, onClose, onSubmit, form, onChange, saving, errors, clientTypes, onClientTypeChange }: EditModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl" 
           style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" 
             style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-bg)' }}>
              <FiEdit3 className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Editar Cliente
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

  <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Estado */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <FiBriefcase className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Estado del Cliente</h3>
            </div>
            <div className="pl-8">
              <select name="estado" value={form.estado} onChange={onChange} className="filter-select">
                <option value="vigente">Vigente</option>
                <option value="moroso">Moroso</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          {/* Información Básica */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <FiUser className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Información Básica</h3>
            </div>
            <div className="pl-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <Field label="Razón Social" name="nombre_razon_social" value={form.nombre_razon_social} onChange={onChange} required error={errors.nombre_razon_social} />
                  <Field label="Nombre Fantasía" name="nombre_fantasia" value={form.nombre_fantasia} onChange={onChange} />
                  <Field label="Giro" name="giro" value={form.giro} onChange={onChange} />
                  <Field label="Dirección" name="direccion" value={form.direccion} onChange={onChange} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Tipo de Cliente
                    </label>
                    <select 
                      name="cliente_tipo_id" 
                      value={form.cliente_tipo_id || ''} 
                      onChange={(e) => onClientTypeChange(e.target.value ? Number(e.target.value) : null)}
                      className="w-full p-3 rounded-lg border bg-transparent transition-colors focus:ring-2 focus:ring-blue-500/20"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Seleccionar tipo...</option>
                      {clientTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field label="Ciudad" name="ciudad" value={form.ciudad} onChange={onChange} />
                  <Field label="Comuna" name="comuna" value={form.comuna} onChange={onChange} />
                  <Field label="Forma de Pago" name="forma_pago" value={form.forma_pago} onChange={onChange} />
                </div>
              </div>
            </div>
          </div>
          {/* Contacto & Pagos */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <FiPhone className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Contacto & Pagos</h3>
            </div>
            <div className="pl-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <Field label="Contacto Pago" name="contacto_pago" value={form.contacto_pago} onChange={onChange} />
                  <Field label="Email Pago" name="email_pago" value={form.email_pago} onChange={onChange} type="email" error={errors.email_pago} />
                  <Field label="Teléfono Pago" name="telefono_pago" value={form.telefono_pago} onChange={onChange} />
                </div>
                <div className="space-y-4">
                  <Field label="Teléfono" name="telefono" value={form.telefono} onChange={onChange} />
                  <Field label="Celular" name="celular" value={form.celular} onChange={onChange} />
                </div>
              </div>
            </div>
          </div>
          {/* Crédito */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <FiCreditCard className="w-5 h-5" style={{ color: 'var(--accent-text)' }} />
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Crédito & Descuentos</h3>
            </div>
            <div className="pl-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Field type="number" label="Línea de Crédito" name="linea_credito" value={form.linea_credito} onChange={onChange} error={errors.linea_credito} />
                <Field type="number" label="Descuento (%)" name="descuento_cliente_pct" value={form.descuento_cliente_pct} onChange={onChange} error={errors.descuento_cliente_pct} />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 order-2 sm:order-1"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button 
              disabled={saving} 
              type="submit" 
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {saving && <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full"></span>}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para registrar pagos
interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: PaymentForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  saving: boolean;
  errors: Partial<Record<string, string>>;
  financialTotals: {
    paid: number;
    pending: number;
    partial: number;
    overdue: number;
  };
}

function PaymentModal({ open, onClose, onSubmit, form, onChange, saving, errors, financialTotals }: PaymentModalProps) {
  if (!open) return null;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calcular el pendiente después del pago
  const calculatePendingAfterPayment = () => {
    return Math.max(0, financialTotals.pending - form.amount);
  };

  // Helper para estilos de input
  const getInputStyles = (hasError: boolean) => ({
    borderColor: hasError ? 'var(--danger-text)' : 'var(--border)',
    color: 'var(--text-primary)',
    '--tw-ring-color': hasError ? 'var(--danger)' : 'var(--accent-primary)',
    '--tw-ring-opacity': '0.3'
  } as React.CSSProperties);

  // Helper para colores del modal
  const getModalBackdropColor = () => 'rgba(0, 0, 0, 0.5)'; // Más sutil que bg-black/60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300"
         style={{
           backgroundColor: getModalBackdropColor(),
           backdropFilter: 'blur(8px)'
         }}>
      <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-300"
           style={{
             backgroundColor: 'var(--card-bg)',
             borderColor: 'var(--border)',
             boxShadow: 'var(--shadow-lg, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1))'
           }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
             style={{
               borderColor: 'var(--border)',
               backgroundColor: 'var(--success-bg)',
               background: 'linear-gradient(135deg, var(--success-bg) 0%, var(--success-bg-secondary, var(--card-bg)) 100%)'
             }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl shadow-sm"
                 style={{
                   backgroundColor: 'var(--success)',
                   border: '2px solid var(--success-border, var(--success))',
                   boxShadow: 'var(--shadow-lg)'
                 }}>
              <FiCreditCard className="w-6 h-6" style={{ color: 'var(--success-text)' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--success-text)' }}>
                Registrar Pago
              </h2>
              <p className="text-sm" style={{ color: 'var(--success-text-secondary, var(--text-secondary))' }}>
                Registra un nuevo pago para este cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              color: 'var(--success-text)',
              backgroundColor: 'var(--success-bg-hover, rgba(255,255,255,0.1))',
              border: '1px solid var(--success-border)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success-hover)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--success-bg-hover, rgba(255,255,255,0.1))';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col h-full max-h-[calc(95vh-140px)]">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* Monto Principal */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--success)' }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--success)', border: '2px solid var(--success-border)' }}>
                  <FiDollarSign className="w-5 h-5" style={{ color: 'var(--success-text)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--success-text)' }}>Monto del Pago</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Monto a Pagar *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      $
                    </span>
                    <input
                      name="amount"
                      type="number"
                      value={form.amount || ''}
                      onChange={onChange}
                      required
                      min="0"
                      step="0.01"
                      className={`w-full pl-8 pr-4 py-4 text-lg rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 font-semibold ${
                        errors.amount ? 'ring-2' : ''
                      }`}
                      style={{
                        borderColor: form.amount > 0 ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: form.amount > 0 ? 'var(--primary-bg)' : 'var(--input-bg)',
                        color: form.amount > 0 ? 'var(--primary-text)' : 'var(--text-primary)',
                        ...getInputStyles(!!errors.amount)
                      }}
                      placeholder="0"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Pendiente Después del Pago
                  </label>
                  <div className="w-full px-4 py-4 text-lg rounded-xl border-2 font-semibold"
                       style={{
                         borderColor: 'var(--success)',
                         backgroundColor: 'var(--success-bg)',
                         color: 'var(--success-text)'
                       }}>
                    {form.amount > 0 ? formatAmount(calculatePendingAfterPayment()) : 'Sin calcular'}
                  </div>
                  {form.amount > 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Monto del pago: {formatAmount(form.amount)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detalles del Pago */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--info)' }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--info)', border: '2px solid var(--info-border)' }}>
                  <FiCalendar className="w-5 h-5" style={{ color: 'var(--info-text)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--info-text)' }}>Detalles del Pago</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Fecha del Pago *
                  </label>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={onChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 font-medium ${
                      errors.date ? 'ring-2' : ''
                    }`}
                    style={{
                      borderColor: form.date ? 'var(--info)' : 'var(--border)',
                      backgroundColor: form.date ? 'var(--info-bg)' : 'var(--input-bg)',
                      color: form.date ? 'var(--info-text)' : 'var(--text-primary)',
                      ...getInputStyles(!!errors.date)
                    }}
                  />
                  {errors.date && (
                    <p className="text-sm flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.date}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Tipo de Pago *
                  </label>
                  <select
                    name="paymentType"
                    value={form.paymentType}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 focus:border-opacity-100 font-medium"
                    style={{
                      borderColor: form.paymentType ? 'var(--warning)' : 'var(--border)',
                      backgroundColor: form.paymentType ? 'var(--warning-bg)' : 'var(--input-bg)',
                      color: form.paymentType ? 'var(--warning-text)' : 'var(--text-primary)',
                      ...getInputStyles(false)
                    }}
                  >
                    <option value="parcial">Pago Parcial</option>
                    <option value="total">Pago Total</option>
                    <option value="adelanto">Adelanto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Método de Pago *
                  </label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 focus:border-opacity-100 font-medium"
                    style={{
                      borderColor: form.paymentMethod ? 'var(--secondary)' : 'var(--border)',
                      backgroundColor: form.paymentMethod ? 'var(--secondary-bg)' : 'var(--input-bg)',
                      color: form.paymentMethod ? 'var(--secondary-text)' : 'var(--text-primary)',
                      ...getInputStyles(false)
                    }}
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Número de Referencia
                  </label>
                  <input
                    name="reference"
                    type="text"
                    value={form.reference}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 focus:border-opacity-100 font-medium"
                    style={{
                      borderColor: form.reference ? 'var(--neutral)' : 'var(--border)',
                      backgroundColor: form.reference ? 'var(--neutral-bg)' : 'var(--input-bg)',
                      color: form.reference ? 'var(--neutral-text)' : 'var(--text-primary)',
                      ...getInputStyles(false)
                    }}
                    placeholder="N° de comprobante, operación, etc."
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b" style={{ borderColor: 'var(--warning)' }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--warning)', border: '2px solid var(--warning-border)' }}>
                  <FiFileText className="w-5 h-5" style={{ color: 'var(--warning-text)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--warning-text)' }}>Información Adicional</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Descripción del Pago
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 focus:border-opacity-100 resize-none font-medium"
                    style={{
                      borderColor: form.description ? 'var(--info)' : 'var(--border)',
                      backgroundColor: form.description ? 'var(--info-bg)' : 'var(--input-bg)',
                      color: form.description ? 'var(--info-text)' : 'var(--text-primary)',
                      ...getInputStyles(false)
                    }}
                    placeholder="Describe el motivo o detalles del pago..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Notas Internas
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-transparent transition-all duration-200 focus:ring-2 hover:border-opacity-80 focus:border-opacity-100 resize-none font-medium"
                    style={{
                      borderColor: form.notes ? 'var(--warning)' : 'var(--border)',
                      backgroundColor: form.notes ? 'var(--warning-bg)' : 'var(--input-bg)',
                      color: form.notes ? 'var(--warning-text)' : 'var(--text-primary)',
                      ...getInputStyles(false)
                    }}
                    placeholder="Notas internas (no visibles para el cliente)..."
                  />
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Resumen del Pago</h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {form.paymentType === 'total' ? 'Pago completo' :
                     form.paymentType === 'parcial' ? 'Pago parcial' : 'Adelanto'}
                    {form.reference && ` • Ref: ${form.reference}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: 'var(--success-text)' }}>
                    {form.amount > 0 ? formatAmount(form.amount) : '$0'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {form.date ? new Date(form.date).toLocaleDateString('es-CL') : 'Sin fecha'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50 dark:bg-gray-800/50"
               style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>

            <div className="flex items-center gap-3">
              {errors.general && (
                <p className="text-sm flex items-center gap-1" style={{ color: 'var(--danger-text)' }}>
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.general}
                </p>
              )}

              <button
                disabled={saving || form.amount <= 0}
                type="submit"
                className="px-8 py-2.5 rounded-lg text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 shadow-lg hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
                }}
              >
                {saving && <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full"></span>}
                <FiCheck className="w-4 h-4" />
                {saving ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: keyof ClientEditForm;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
}

function Field({ label, name, value, onChange, type = 'text', required = false, error }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        className={`w-full p-3 rounded-lg border bg-transparent transition-colors focus:ring-2 focus:ring-blue-500/20 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:border-blue-500'
        }`}
        style={{ borderColor: error ? '#ef4444' : 'var(--border)', color: 'var(--text-primary)' }}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default function ClientDetailPageWrapper() {
  return (
    <ProtectedRoute resource="clients" action="read">
      <ClientDetailPage />
    </ProtectedRoute>
  );
}
