"use client";

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiCheckCircle, FiShoppingCart, FiAlertCircle, FiFileText, FiPackage } from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { useQuotes } from '@/features/quotes/model/useQuotes';
import { NotasVentaService } from '@/services/notasVentaService';
import type { QuoteItem } from '@/core/domain/quote/Quote';
import { ProductsForm } from '@/features/quotes/ui/components/ProductsForm';

function ConvertQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getQuoteById, formatMoney, loading } = useQuotes();

  const quoteId = searchParams.get('quoteId');
  const quote = quoteId ? getQuoteById(quoteId) : null;

  // Estados para selección de productos
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numeroSerie, setNumeroSerie] = useState<string>('');
  const [formaPago, setFormaPago] = useState<string>('');

  // Inicializar selectedItems con los productos de la cotización
  useEffect(() => {
    if (quote && quote.items) {
      setSelectedItems(quote.items);
    }
  }, [quote]);

  // Verificar si la cotización ya fue convertida
  useEffect(() => {
    if (quote && quote.estado === 'aceptada') {
      // Buscar si ya existe una nota de venta para esta cotización
      const checkExistingNote = async () => {
        try {
          const cotizacionNumericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);
          if (cotizacionNumericId) {
            const existingNote = await NotasVentaService.getByCotizacionId(cotizacionNumericId);
            if (existingNote) {
              // Si ya existe una nota de venta, redirigir a la lista de notas de venta
              alert('Esta cotización ya fue convertida a nota de venta.');
              router.push('/dashboard/notas-venta');
            }
          }
        } catch (error) {
          console.warn('Error verificando nota de venta existente:', error);
        }
      };
      checkExistingNote();
    }
  }, [quote, router]);

  // Función para convertir la cotización
  const handleConvert = useCallback(async () => {
    if (!quote || !selectedItems.length) return;

    setIsConverting(true);
    setError(null);

    try {
      const cotizacionNumericId = await NotasVentaService.getCotizacionNumericIdByFolio(quote.id);

      // Obtener el obra_id de la cotización
      let obraId: number | null = null;
      if (cotizacionNumericId) {
        const { data: cotizacionData, error: cotizacionError } = await supabase
          .from('cotizaciones')
          .select('obra_id')
          .eq('id', cotizacionNumericId)
          .single();

        if (cotizacionError) {
          console.warn('Error obteniendo obra_id de la cotización:', cotizacionError);
        } else {
          obraId = cotizacionData?.obra_id || null;
        }
      }

      // Obtener el ID numérico del cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id, rut, nombre_razon_social')
        .eq('rut', quote.cliente.rut)
        .single();

      console.log('Cliente encontrado:', clienteData);

      console.log('Convirtiendo cotización:', {
        quoteId: quote.id,
        cotizacionNumericId,
        clienteData,
        numeroSerie,
        quoteVendedorId: quote.vendedorId
      });

      console.log('Convirtiendo cotización:', {
        quoteId: quote.id,
        cotizacionNumericId,
        clienteData,
        numeroSerie,
        quoteVendedorId: quote.vendedorId
      });

      console.log('Convirtiendo cotización:', {
        quoteId: quote.id,
        cotizacionNumericId,
        clienteData,
        numeroSerie,
        quoteVendedorId: quote.vendedorId
      });

      const createdNote = await NotasVentaService.convertFromQuote(quote, {
        formaPago: formaPago || undefined,
        cotizacionDbId: cotizacionNumericId || undefined,
        clientePrincipalId: clienteData!.id,
        obraId: obraId || undefined,
        itemsOverride: selectedItems,
        finalizarInmediatamente: false, // Crear con estado "creada", no "confirmada"
        numeroSerie: numeroSerie || undefined, // Pass numero serie if provided
      });

      // Si la nota de venta pertenece a una obra, actualizar el material_vendido
      if (obraId && createdNote.total) {
        // Primero obtener el valor actual
        const { data: obraData, error: obraFetchError } = await supabase
          .from('obras')
          .select('material_vendido')
          .eq('id', obraId)
          .single();

        if (obraFetchError) {
          console.error('Error obteniendo material_vendido actual de la obra:', obraFetchError);
        } else {
          const currentMaterialVendido = obraData?.material_vendido || 0;
          const newMaterialVendido = currentMaterialVendido + createdNote.total;

          const { error: obraUpdateError } = await supabase
            .from('obras')
            .update({ material_vendido: newMaterialVendido })
            .eq('id', obraId);

          if (obraUpdateError) {
            console.error('Error actualizando material_vendido de la obra:', obraUpdateError);
            // No lanzamos error aquí para no detener el flujo
          } else {
            console.log(`Actualizado material_vendido de la obra ${obraId}: ${currentMaterialVendido} -> ${newMaterialVendido}`);
          }
        }
      }

      // Cambiar el estado de la cotización a 'aceptada' si no lo está ya
      if (quote.estado !== 'aceptada') {
        const { error: updateQuoteError } = await supabase
          .from('cotizaciones')
          .update({ estado: 'aceptada' })
          .eq('id', cotizacionNumericId);

        if (updateQuoteError) {
          console.warn('Error actualizando estado de la cotización:', updateQuoteError);
        } else {
          console.log('Cotización actualizada a estado aceptada');
        }
      }

      // Redirigir a la página de detalle de la nota de venta creada
      router.push(`/dashboard/notas-venta/${createdNote.id}`);

    } catch (e: unknown) {
      console.error('Error convirtiendo cotización a nota de venta', e);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
    } finally {
      setIsConverting(false);
    }
  }, [quote, selectedItems, router, numeroSerie, formaPago]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Cargando cotización...
          </h3>
        </div>
      </div>
    );
  }

  // No quote found or not accepted
  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--error)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Cotización no encontrada
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            La cotización solicitada no existe o no está disponible.
          </p>
          <button
            onClick={() => router.push('/dashboard/cotizaciones')}
            className="mt-4 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--button-text)',
              border: 'none'
            }}
          >
            <FiArrowLeft className="w-4 h-4 inline mr-2" />
            Volver a Cotizaciones
          </button>
        </div>
      </div>
    );
  }

  // Conversión permitida en cualquier estado de cotización

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors mr-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Convertir Cotización a Nota de Venta
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Cotización {quote.id} - Convierte los productos seleccionados en una nota de venta
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quote Summary */}
        <div className="bg-white rounded-lg shadow-sm border mb-6" style={{ borderColor: 'var(--border)' }}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiShoppingCart className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Resumen de la Cotización
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cliente</p>
                <p style={{ color: 'var(--text-primary)' }}>{quote.cliente?.razonSocial || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--primary)' }}>
                  {formatMoney(quote.total)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Estado</p>
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: quote.estado === 'aceptada' ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color: quote.estado === 'aceptada' ? 'var(--success-text)' : 'var(--warning-text)'
                  }}
                >
                  {quote.estado}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Productos</p>
                <p style={{ color: 'var(--text-primary)' }}>{quote.items.length} ítems</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Configuration */}
        <div className="bg-white rounded-lg shadow-sm border mb-6" style={{ borderColor: 'var(--border)' }}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiFileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Configuración del Documento
            </h2>
            <div className="mb-4 p-3 rounded-lg border" style={{
              backgroundColor: 'var(--info-bg)',
              borderColor: 'var(--info)',
              color: 'var(--info-text)'
            }}>
              <FiAlertCircle className="w-4 h-4 inline mr-2" />
              <strong>Nota:</strong> La nota de venta se creará con estado &quot;Creada&quot;. Una vez creada, podrás revisarla y confirmarla desde el detalle de la nota de venta.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Número de Serie
                </label>
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  placeholder="Ej: NV-0001 "
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Opcional: Si no se especifica, se generará automáticamente desde document_series.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Forma de Pago
                </label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="">Seleccionar forma de pago</option>
                  <option value="Contado">Contado</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Crédito 60 días">Crédito 60 días</option>
                  <option value="Crédito 90 días">Crédito 90 días</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Selection */}
        <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: 'var(--border)' }}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiPackage className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              Productos a Incluir
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Modifica las cantidades, agrega nuevos productos o elimina los que no necesites. Una vez convertida, se creará automáticamente el documento CxC correspondiente.
            </p>

            <ProductsForm
              items={selectedItems}
              onChange={setSelectedItems}
            />

            {error && (
              <div className="mt-4 p-4 rounded-lg border" style={{
                backgroundColor: 'var(--error-bg)',
                borderColor: 'var(--error)',
                color: 'var(--error-text)'
              }}>
                <FiAlertCircle className="w-5 h-5 inline mr-2" />
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent'
                }}
                disabled={isConverting}
              >
                Cancelar
              </button>

              <button
                onClick={handleConvert}
                disabled={isConverting || selectedItems.length === 0}
                className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--button-text)',
                  border: 'none'
                }}
              >
                {isConverting ? (
                  <>
                    <div
                      className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 mr-2 inline-block"
                      style={{
                        borderLeftColor: 'var(--button-text)',
                        borderRightColor: 'var(--button-text)',
                        borderBottomColor: 'var(--button-text)'
                      }}
                    />
                    Creando Nota de Venta...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4 mr-2 inline" />
                    Crear Nota de Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConvertQuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-300"></div>
      </div>
    }>
      <ConvertQuoteContent />
    </Suspense>
  );
}