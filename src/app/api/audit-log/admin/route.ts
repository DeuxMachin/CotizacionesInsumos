import { NextRequest, NextResponse } from 'next/server'
import { AuditLogger, AuditLogEntry } from '@/services/auditLogger'
import { getUserContext } from '@/lib/auth-context'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Máximo 50 por página
    const search = searchParams.get('search') || ''
    const eventType = searchParams.get('eventType') || ''
    const dateRange = searchParams.get('dateRange') || ''
    const exportFormat = searchParams.get('export') || ''

  // Obtener contexto del usuario actual (basado en JWT, sin fallback)
  const userContext = await getUserContext(request)
    
    console.log('🔍 API Admin Audit Log - User Context:', {
      userContext,
      isAdmin: userContext?.isAdmin,
      email: userContext?.email,
      id: userContext?.id
    })
    
    if (!userContext) {
      console.log('❌ No user context found')
      return NextResponse.json({
        success: false,
        error: 'Usuario no autenticado.'
      }, { status: 401 })
    }
    
    if (!userContext.isAdmin) {
      console.log('❌ User is not admin:', userContext.email)
      return NextResponse.json({
        success: false,
        error: 'Acceso denegado. Solo administradores pueden acceder a este endpoint.'
      }, { status: 403 })
    }
    
    console.log('✅ Admin access granted for:', userContext.email)

    // Calcular offset para paginación
    const offset = (page - 1) * limit

    // Preparar filtros
    const filters = {
      search: search.trim(),
      eventType: eventType.trim(),
      dateRange: dateRange.trim(),
      limit,
      offset
    }

    // Si se solicita exportación, obtener todos los registros
    if (exportFormat === 'csv') {
      const allActivities = await AuditLogger.getFilteredActivities({
        ...filters,
        limit: 10000, // Límite alto para exportación
        offset: 0
      })

      // Generar CSV
      const csvHeader = 'Fecha,Usuario,Evento,Descripción,Detalles\n'
      const csvRows = allActivities.map((activity: AuditLogEntry) => {
        const date = new Date(activity.created_at || '').toLocaleString('es-ES')
        const user = typeof activity.detalles?.user_email === 'string' ? activity.detalles.user_email : 'N/A'
        const evento = activity.evento || 'N/A'
        const descripcion = (activity.descripcion || '').replace(/"/g, '""') // Escapar comillas
        const detalles = JSON.stringify(activity.detalles || {}).replace(/"/g, '""')
        
        return `"${date}","${user}","${evento}","${descripcion}","${detalles}"`
      }).join('\n')

      const csvContent = csvHeader + csvRows

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Obtener actividades filtradas y total
    const [activities, totalCount] = await Promise.all([
      AuditLogger.getFilteredActivities(filters),
      AuditLogger.getFilteredActivitiesCount(filters)
    ])

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        eventType,
        dateRange
      }
    })
  } catch (error) {
    console.error('Error fetching admin audit log:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el registro de auditoría'
    }, { status: 500 })
  }
}
