import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { AuditService } from '@/services/auditService';

export async function GET(request: NextRequest) {
  try {
    // Obtener información del usuario
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID requerido' },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Obtener User Agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Consultar clientes
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientesError) throw clientesError;
    if (!clientesData || clientesData.length === 0) {
      throw new Error('No hay clientes para exportar');
    }

    // Consultar todas las cotizaciones con información necesaria
    const { data: cotizacionesData, error: cotizacionesError } = await supabase
      .from('cotizaciones')
      .select(`
        id,
        folio,
        estado,
        cliente_principal_id,
        fecha_emision,
        total_final,
        total_neto,
        created_at,
        usuarios!cotizaciones_vendedor_id_fkey(nombre, apellido, email)
      `)
      .order('created_at', { ascending: false });

    if (cotizacionesError) throw cotizacionesError;

    // Crear workbook con múltiples hojas
    const wb = XLSX.utils.book_new();

    // === HOJA 1: CLIENTES CON RESUMEN ===
    const clientesResumen = clientesData.map(cliente => {
      // Calcular estadísticas de cotizaciones para este cliente
      const cotizacionesCliente = cotizacionesData?.filter(c => c.cliente_principal_id === cliente.id) || [];
      const totalCotizaciones = cotizacionesCliente.length;
      const totalMonto = cotizacionesCliente.reduce((sum, c) => sum + (c.total_final || c.total_neto || 0), 0);
      const cotizacionesPorEstado = cotizacionesCliente.reduce((acc, c) => {
        const estado = c.estado || 'borrador';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        'ID': cliente.id,
        'RUT': cliente.rut,
        'Tipo': cliente.tipo === 'empresa' ? 'Empresa' : 'Persona',
        'Razón Social': cliente.nombre_razon_social,
        'Nombre Fantasía': cliente.nombre_fantasia || '',
        'Giro': cliente.giro || '',
        'Dirección': cliente.direccion || '',
        'Ciudad': cliente.ciudad || '',
        'Comuna': cliente.comuna || '',
        'Teléfono': cliente.telefono || '',
        'Celular': cliente.celular || '',
        'Email Pago': cliente.email_pago || '',
        'Contacto Pago': cliente.contacto_pago || '',
        'Teléfono Pago': cliente.telefono_pago || '',
        'Forma Pago': cliente.forma_pago || '',
        'Línea Crédito': cliente.linea_credito || 0,
        'Descuento %': cliente.descuento_porcentaje || 0,
        'Estado': cliente.estado || 'vigente',
        'Total Cotizaciones': totalCotizaciones,
        'Monto Total Cotizado': totalMonto,
        'Cotizaciones Borrador': cotizacionesPorEstado.borrador || 0,
        'Cotizaciones Enviadas': cotizacionesPorEstado.enviada || 0,
        'Cotizaciones Aceptadas': cotizacionesPorEstado.aceptada || 0,
        'Cotizaciones Rechazadas': cotizacionesPorEstado.rechazada || 0,
        'Cotizaciones Expiradas': cotizacionesPorEstado.expirada || 0,
        'Fecha Creación': new Date(cliente.created_at).toLocaleDateString('es-CL')
      };
    });

    const wsClientes = XLSX.utils.json_to_sheet(clientesResumen);

    // === HOJA 2: RESUMEN DE COTIZACIONES POR CLIENTE ===
    const cotizacionesPorCliente = clientesData.map(cliente => {
      const cotizacionesCliente = cotizacionesData?.filter(c => c.cliente_principal_id === cliente.id) || [];

      if (cotizacionesCliente.length === 0) {
        return {
          'ID Cliente': cliente.id,
          'RUT': cliente.rut,
          'Razón Social': cliente.nombre_razon_social,
          'Nombre Fantasía': cliente.nombre_fantasia || '',
          'Total Cotizaciones': 0,
          'Monto Total Cotizado': 0,
          'Promedio por Cotización': 0,
          'Cotizaciones Borrador': 0,
          'Cotizaciones Enviadas': 0,
          'Cotizaciones Aceptadas': 0,
          'Cotizaciones Rechazadas': 0,
          'Cotizaciones Expiradas': 0,
          'Fecha Primera Cotización': '',
          'Fecha Última Cotización': '',
          'Vendedores Involucrados': '',
          'Estado Cliente': cliente.estado || 'vigente'
        };
      }

      const totalMonto = cotizacionesCliente.reduce((sum, c) => sum + (c.total_final || c.total_neto || 0), 0);
      const promedioPorCotizacion = totalMonto / cotizacionesCliente.length;

      const cotizacionesPorEstado = cotizacionesCliente.reduce((acc, c) => {
        const estado = c.estado || 'borrador';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Fechas
      const fechas = cotizacionesCliente
        .map(c => new Date(c.created_at))
        .sort((a, b) => a.getTime() - b.getTime());

      const fechaPrimera = fechas.length > 0 ? fechas[0].toLocaleDateString('es-CL') : '';
      const fechaUltima = fechas.length > 0 ? fechas[fechas.length - 1].toLocaleDateString('es-CL') : '';

      // Vendedores únicos
      const vendedoresUnicos = [...new Set(
        cotizacionesCliente
          .map(c => {
            const vendedor = c.usuarios as { nombre?: string; apellido?: string; email?: string };
            return vendedor ? `${vendedor.nombre || ''} ${vendedor.apellido || ''}`.trim() || vendedor.email : '';
          })
          .filter(v => v)
      )].join(', ');

      return {
        'ID Cliente': cliente.id,
        'RUT': cliente.rut,
        'Razón Social': cliente.nombre_razon_social,
        'Nombre Fantasía': cliente.nombre_fantasia || '',
        'Total Cotizaciones': cotizacionesCliente.length,
        'Monto Total Cotizado': totalMonto,
        'Promedio por Cotización': promedioPorCotizacion,
        'Cotizaciones Borrador': cotizacionesPorEstado.borrador || 0,
        'Cotizaciones Enviadas': cotizacionesPorEstado.enviada || 0,
        'Cotizaciones Aceptadas': cotizacionesPorEstado.aceptada || 0,
        'Cotizaciones Rechazadas': cotizacionesPorEstado.rechazada || 0,
        'Cotizaciones Expiradas': cotizacionesPorEstado.expirada || 0,
        'Fecha Primera Cotización': fechaPrimera,
        'Fecha Última Cotización': fechaUltima,
        'Vendedores Involucrados': vendedoresUnicos,
        'Estado Cliente': cliente.estado || 'vigente'
      };
    }).filter(cliente => cliente['Total Cotizaciones'] > 0); // Solo mostrar clientes con cotizaciones

    const wsCotizaciones = XLSX.utils.json_to_sheet(cotizacionesPorCliente);

    // === HOJA 3: ESTADÍSTICAS GENERALES ===
    const estadisticas = [{
      'Métrica': 'Total de Clientes',
      'Valor': clientesData.length
    }, {
      'Métrica': 'Total de Cotizaciones',
      'Valor': cotizacionesData?.length || 0
    }, {
      'Métrica': 'Monto Total Cotizado',
      'Valor': (cotizacionesData || []).reduce((sum, c) => sum + (c.total_final || c.total_neto || 0), 0)
    }, {
      'Métrica': 'Clientes con Cotizaciones',
      'Valor': new Set((cotizacionesData || []).map(c => c.cliente_principal_id).filter(Boolean)).size
    }, {
      'Métrica': 'Clientes sin Cotizaciones',
      'Valor': clientesData.length - new Set((cotizacionesData || []).map(c => c.cliente_principal_id).filter(Boolean)).size
    }];

    // Agregar estadísticas por estado de cotización
    const estadosCotizaciones = (cotizacionesData || []).reduce((acc, c) => {
      const estado = c.estado || 'borrador';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(estadosCotizaciones).forEach(([estado, cantidad]) => {
      estadisticas.push({
        'Métrica': `Cotizaciones ${estado.charAt(0).toUpperCase() + estado.slice(1)}`,
        'Valor': cantidad
      });
    });

    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticas);

    // Configurar anchos de columna para cada hoja
    const colWidthsClientes = [
      { wch: 8 }, // ID
      { wch: 12 }, // RUT
      { wch: 8 }, // Tipo
      { wch: 25 }, // Razón Social
      { wch: 20 }, // Nombre Fantasía
      { wch: 20 }, // Giro
      { wch: 25 }, // Dirección
      { wch: 15 }, // Ciudad
      { wch: 15 }, // Comuna
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Celular
      { wch: 25 }, // Email Pago
      { wch: 20 }, // Contacto Pago
      { wch: 15 }, // Teléfono Pago
      { wch: 20 }, // Forma Pago
      { wch: 12 }, // Línea Crédito
      { wch: 10 }, // Descuento %
      { wch: 10 }, // Estado
      { wch: 12 }, // Total Cotizaciones
      { wch: 15 }, // Monto Total
      { wch: 12 }, // Borrador
      { wch: 12 }, // Enviadas
      { wch: 12 }, // Aceptadas
      { wch: 12 }, // Rechazadas
      { wch: 12 }, // Expiradas
      { wch: 12 }  // Fecha Creación
    ];
    wsClientes['!cols'] = colWidthsClientes;

    const colWidthsCotizaciones = [
      { wch: 8 }, // ID Cliente
      { wch: 12 }, // RUT
      { wch: 25 }, // Razón Social
      { wch: 20 }, // Nombre Fantasía
      { wch: 12 }, // Total Cotizaciones
      { wch: 15 }, // Monto Total Cotizado
      { wch: 15 }, // Promedio por Cotización
      { wch: 12 }, // Cotizaciones Borrador
      { wch: 12 }, // Cotizaciones Enviadas
      { wch: 12 }, // Cotizaciones Aceptadas
      { wch: 12 }, // Cotizaciones Rechazadas
      { wch: 12 }, // Cotizaciones Expiradas
      { wch: 12 }, // Fecha Primera Cotización
      { wch: 12 }, // Fecha Última Cotización
      { wch: 30 }, // Vendedores Involucrados
      { wch: 10 }  // Estado Cliente
    ];
    wsCotizaciones['!cols'] = colWidthsCotizaciones;

    const colWidthsEstadisticas = [
      { wch: 25 }, // Métrica
      { wch: 15 }  // Valor
    ];
    wsEstadisticas['!cols'] = colWidthsEstadisticas;

    // Agregar hojas al workbook
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');
    XLSX.utils.book_append_sheet(wb, wsCotizaciones, 'Resumen por Cliente');
    XLSX.utils.book_append_sheet(wb, wsEstadisticas, 'Estadísticas');

    // Generar el buffer del archivo
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Registrar en document_series (serie de descargas)
  const { registerDownloadSeries } = await import('@/services/documentSeriesService');
  await registerDownloadSeries('clients_excel', 'CEX-');

  // Registrar auditoría
    await AuditService.logDownload(
      userId,
      'clients_excel',
      {
        fileName: `clientes_cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`,
        recordCount: clientesData.length,
        format: 'excel'
      },
      ipAddress,
      userAgent
    );

    // Devolver el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="clientes_cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error en descarga de clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
