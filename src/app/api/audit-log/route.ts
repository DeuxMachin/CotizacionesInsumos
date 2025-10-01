import { NextRequest, NextResponse } from 'next/server'
import { AuditLogger } from '@/services/auditLogger'
import { getUserContext } from '@/lib/auth-context'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('user_id')
    const eventType = searchParams.get('event_type')

  // Obtener contexto del usuario actual (derivado ahora 100% del JWT)
  const userContext = await getUserContext(request)
    
    if (!userContext) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no autenticado'
      }, { status: 401 })
    }

    let activities

    // Determinar filtros basados en permisos del usuario
    if (userContext.isAdmin) {
      // Los administradores pueden ver todos los logs y filtrar por usuario específico
      if (userId) {
        activities = await AuditLogger.getActivityByUser(userId, limit)
      } else if (eventType) {
        activities = await AuditLogger.getActivityByType(eventType, limit)
      } else {
        activities = await AuditLogger.getRecentActivity(limit)
      }
    } else {
      // Los usuarios normales solo ven sus propios logs
      if (eventType) {
        // Filtrar por tipo de evento pero solo del usuario actual
        activities = await AuditLogger.getActivityByUserAndType(userContext.id, eventType, limit)
      } else {
        // Solo logs del usuario actual
        activities = await AuditLogger.getActivityByUser(userContext.id, limit)
      }
    }

    return NextResponse.json({
      success: true,
      data: activities,
      userContext: {
        isAdmin: userContext.isAdmin,
        canViewAll: userContext.isAdmin
      }
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el log de actividad'
    }, { status: 500 })
  }
}
