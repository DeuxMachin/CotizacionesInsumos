import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import ExcelJS from 'exceljs';
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

    // Consultar clientes con información de tipos
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select(`
        *,
        cliente_tipos:cliente_tipo_id (
          id,
          nombre,
          descripcion
        )
      `)
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
    const wb = new ExcelJS.Workbook();

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
        'Código Interno': cliente.codigo_interno || '',
        'Razón Social': cliente.nombre_razon_social,
        'Nombre Fantasía': cliente.nombre_fantasia || '',
        'Tipo de Cliente': cliente.cliente_tipos?.nombre || 'No especificado',
        'Giro': cliente.giro || '',
        'Dirección': cliente.direccion || '',
        'Ciudad': cliente.ciudad || '',
        'Comuna': cliente.comuna || '',
        'Teléfono': cliente.telefono || '',
        'Celular': cliente.celular || '',
        'Email': cliente.email || '',
        'Email Pago': cliente.email_pago || '',
        'Contacto Pago': cliente.contacto_pago || '',
        'Teléfono Pago': cliente.telefono_pago || '',
        'Forma Pago': cliente.forma_pago || '',
        'Línea Crédito': cliente.linea_credito || 0,
        'Descuento %': cliente.descuento_cliente_pct || 0,
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

    // === HOJA 2: RESUMEN DE COTIZACIONES POR CLIENTE ===
    const cotizacionesPorCliente = clientesData.map(cliente => {
      const cotizacionesCliente = cotizacionesData?.filter(c => c.cliente_principal_id === cliente.id) || [];

      if (cotizacionesCliente.length === 0) {
        return {
          'ID Cliente': cliente.id,
          'RUT': cliente.rut,
          'Código Interno': cliente.codigo_interno || '',
          'Razón Social': cliente.nombre_razon_social,
          'Nombre Fantasía': cliente.nombre_fantasia || '',
          'Tipo de Cliente': cliente.cliente_tipos?.nombre || 'No especificado',
          'Giro': cliente.giro || '',
          'Ciudad': cliente.ciudad || '',
          'Comuna': cliente.comuna || '',
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
        'Código Interno': cliente.codigo_interno || '',
        'Razón Social': cliente.nombre_razon_social,
        'Nombre Fantasía': cliente.nombre_fantasia || '',
        'Tipo de Cliente': cliente.cliente_tipos?.nombre || 'No especificado',
        'Giro': cliente.giro || '',
        'Ciudad': cliente.ciudad || '',
        'Comuna': cliente.comuna || '',
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

    // Crear hojas de Excel
    // Hoja 1: Clientes
    const wsClientes = wb.addWorksheet('Clientes');
    const clientesHeaders = Object.keys(clientesResumen[0] || {});
    wsClientes.addRow(clientesHeaders);
    clientesResumen.forEach(row => {
      wsClientes.addRow(Object.values(row));
    });

    // Estilizar encabezados de la hoja de clientes
    wsClientes.getRow(1).font = { bold: true };
    wsClientes.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };

    // Configurar anchos de columna para clientes
    wsClientes.columns = [
      { width: 8 }, // ID
      { width: 12 }, // RUT
      { width: 8 }, // Tipo
      { width: 15 }, // Código Interno
      { width: 25 }, // Razón Social
      { width: 20 }, // Nombre Fantasía
      { width: 20 }, // Tipo de Cliente
      { width: 20 }, // Giro
      { width: 25 }, // Dirección
      { width: 15 }, // Ciudad
      { width: 15 }, // Comuna
      { width: 15 }, // Teléfono
      { width: 15 }, // Celular
      { width: 25 }, // Email
      { width: 25 }, // Email Pago
      { width: 20 }, // Contacto Pago
      { width: 15 }, // Teléfono Pago
      { width: 20 }, // Forma Pago
      { width: 12 }, // Línea Crédito
      { width: 10 }, // Descuento %
      { width: 10 }, // Estado
      { width: 12 }, // Total Cotizaciones
      { width: 15 }, // Monto Total
      { width: 12 }, // Borrador
      { width: 12 }, // Enviadas
      { width: 12 }, // Aceptadas
      { width: 12 }, // Rechazadas
      { width: 12 }, // Expiradas
      { width: 12 }  // Fecha Creación
    ];

    // Hoja 2: Resumen por Cliente
    const wsCotizaciones = wb.addWorksheet('Resumen por Cliente');
    const cotizacionesHeaders = Object.keys(cotizacionesPorCliente[0] || {});
    wsCotizaciones.addRow(cotizacionesHeaders);
    cotizacionesPorCliente.forEach(row => {
      wsCotizaciones.addRow(Object.values(row));
    });

    // Estilizar encabezados de la hoja de cotizaciones
    wsCotizaciones.getRow(1).font = { bold: true };
    wsCotizaciones.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };

    // Configurar anchos de columna para cotizaciones
    wsCotizaciones.columns = [
      { width: 8 }, // ID Cliente
      { width: 12 }, // RUT
      { width: 15 }, // Código Interno
      { width: 25 }, // Razón Social
      { width: 20 }, // Nombre Fantasía
      { width: 20 }, // Tipo de Cliente
      { width: 20 }, // Giro
      { width: 15 }, // Ciudad
      { width: 15 }, // Comuna
      { width: 12 }, // Total Cotizaciones
      { width: 15 }, // Monto Total Cotizado
      { width: 15 }, // Promedio por Cotización
      { width: 12 }, // Cotizaciones Borrador
      { width: 12 }, // Cotizaciones Enviadas
      { width: 12 }, // Cotizaciones Aceptadas
      { width: 12 }, // Cotizaciones Rechazadas
      { width: 12 }, // Cotizaciones Expiradas
      { width: 12 }, // Fecha Primera Cotización
      { width: 12 }, // Fecha Última Cotización
      { width: 30 }, // Vendedores Involucrados
      { width: 10 }  // Estado Cliente
    ];

    // Hoja 3: Estadísticas
    const wsEstadisticas = wb.addWorksheet('Estadísticas');
    const estadisticasHeaders = Object.keys(estadisticas[0] || {});
    wsEstadisticas.addRow(estadisticasHeaders);
    estadisticas.forEach(row => {
      wsEstadisticas.addRow(Object.values(row));
    });

    // Estilizar encabezados de la hoja de estadísticas
    wsEstadisticas.getRow(1).font = { bold: true };
    wsEstadisticas.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };

    // Configurar anchos de columna para estadísticas
    wsEstadisticas.columns = [
      { width: 25 }, // Métrica
      { width: 15 }  // Valor
    ];

    // Generar el buffer del archivo
    const buffer = await wb.xlsx.writeBuffer();

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
