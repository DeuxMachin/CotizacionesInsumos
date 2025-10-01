import { Quote, QuoteItem, ClientInfo, DeliveryInfo, CommercialTerms, QuoteStatus, QuoteAmountCalculator } from '@/core/domain/quote/Quote';
import { Database } from '@/lib/supabase';

type CotizacionRow = Database['public']['Tables']['cotizaciones']['Row'];
type CotizacionItemRow = Database['public']['Tables']['cotizacion_items']['Row'];
type CotizacionClienteRow = Database['public']['Tables']['cotizacion_clientes']['Row'];
type CotizacionDespachoRow = Database['public']['Tables']['cotizacion_despachos']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type UsuarioRow = Database['public']['Tables']['usuarios']['Row'];


export interface CotizacionAggregate {
	cotizacion: CotizacionRow;
	items: (CotizacionItemRow & { producto?: { id: number; sku: string | null; nombre: string; ficha_tecnica: string | null } | null })[];
	clientes_adicionales: (CotizacionClienteRow & { cliente?: ClienteRow | null })[];
	despacho?: CotizacionDespachoRow | null;
	cliente_principal?: ClienteRow | null;
	vendedor?: UsuarioRow | null;
}

export function mapCotizacionToDomain(data: CotizacionAggregate): Quote {
	const { cotizacion, items, despacho, cliente_principal, vendedor } = data;

	const client: ClientInfo = cliente_principal ? {
		razonSocial: cliente_principal.nombre_razon_social,
		rut: cliente_principal.rut,
		nombreFantasia: cliente_principal.nombre_fantasia || undefined,
		giro: cliente_principal.giro || '',
		direccion: cliente_principal.direccion || '',
		ciudad: cliente_principal.ciudad || '',
		comuna: cliente_principal.comuna || '',
		telefono: cliente_principal.telefono || undefined,
		email: cliente_principal.email_pago || undefined
	} : {
		razonSocial: 'SIN CLIENTE',
		rut: '',
		giro: '',
		direccion: '',
		ciudad: '',
		comuna: ''
	};

	const quoteItems: QuoteItem[] = items.map((it) => {
		const itemWithProduct: CotizacionItemRow & { producto?: { id: number; sku: string | null; nombre: string; ficha_tecnica: string | null } | null; productos?: { id: number; sku: string | null; nombre: string; ficha_tecnica: string | null } | null } = it;
		const prod = itemWithProduct.producto ?? itemWithProduct.productos ?? null;
		return ({
			id: it.id.toString(),
			productId: it.producto_id || undefined,
			codigo: it.producto_id ? (prod?.sku || `PROD-${it.producto_id}`) : 'ITEM',
			descripcion: it.descripcion || prod?.nombre || 'Item',
			unidad: it.unidad || 'unidad',
			cantidad: Number(it.cantidad),
			precioUnitario: Number(it.precio_unitario_neto),
			descuento: it.descuento_pct ? Number(it.descuento_pct) : undefined,
			subtotal: Number(it.total_neto), // ya viene calculado
			fichaTecnica: prod?.ficha_tecnica || undefined
		});
	});

	const delivery: DeliveryInfo | undefined = despacho ? {
		direccion: despacho.direccion,
		ciudad: despacho.ciudad_texto || '',
		comuna: '',
		fechaEstimada: despacho.fecha_entrega || undefined,
		costoDespacho: Number(despacho.costo) || undefined,
		observaciones: despacho.observaciones || undefined
	} : undefined;

	const terms: CommercialTerms = {
		validezOferta: cotizacion.validez_dias,
		formaPago: cotizacion.forma_pago_texto || cotizacion.condicion_pago_texto || 'Por definir',
		tiempoEntrega: cotizacion.plazo_entrega_texto || 'Por definir',
		observaciones: cotizacion.observaciones_pago || undefined
	};

	// Totales: usamos los snapshot de la cabecera (ya calculados por backend / triggers)
	const subtotal = Number(cotizacion.total_neto);
	const descuentoLineasMonto = Number(cotizacion.total_descuento) || 0;
	const descuentoGlobalMonto = Number(cotizacion.descuento_global_monto) || 0;
	const descuentoTotal = descuentoLineasMonto + descuentoGlobalMonto;
	const iva = Number(cotizacion.iva_monto);
	const total = Number(cotizacion.total_final);

	return {
		id: cotizacion.folio || `COT-${cotizacion.id}`,
		numero: cotizacion.folio || cotizacion.id.toString(),
		cliente: client,
		fechaCreacion: cotizacion.created_at.split('T')[0],
		fechaModificacion: cotizacion.updated_at.split('T')[0],
		estado: (cotizacion.estado as QuoteStatus),
		vendedorId: cotizacion.vendedor_id,
		vendedorNombre: vendedor ? [vendedor.nombre, vendedor.apellido].filter(Boolean).join(' ') || vendedor.email : 'Vendedor',
		items: quoteItems,
		despacho: delivery,
		condicionesComerciales: terms,
		subtotal,
		descuentoTotal,
		descuentoLineasMonto,
		descuentoGlobalMonto,
		iva,
		total,
		obraId: cotizacion.obra_id || undefined,
		notas: undefined, // no existe campo directo en nueva cabecera (podría mapearse desde hash_cotizacion si se desea)
		fechaExpiracion: cotizacion.fecha_vencimiento || undefined
	};
}

export function mergeAndRecalculate(quote: Quote): Quote {
	// Si necesitamos recalcular usando lógica de dominio local
	const costoDespacho = quote.despacho?.costoDespacho || 0;
	const totals = QuoteAmountCalculator.calculateQuoteTotals(quote.items, costoDespacho);
	return { ...quote, subtotal: totals.subtotal, descuentoTotal: totals.descuentoTotal, iva: totals.iva, total: totals.total };
}

