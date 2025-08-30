# Refactoring de la Estructura de Rutas y Seguridad

Este proyecto ha sido actualizado para utilizar una estructura de rutas jerárquica que aprovecha el sistema de App Router de Next.js, y se han implementado mejoras de seguridad.

## Cambios Realizados

1. **Nueva Estructura de Rutas:**
   - `/dashboard` - Dashboard principal
   - `/dashboard/cotizaciones` - Gestión de cotizaciones
   - `/dashboard/clientes` - Gestión de clientes
   - `/dashboard/obras` - Gestión de obras
   - `/dashboard/posibles-targets` - Posibles targets
   - `/dashboard/stock` - Control de stock
   - `/dashboard/reportes` - Reportes y análisis
   - `/admin` - Panel de administración
   - `/admin/usuarios` - Gestión de usuarios
   - `/admin/auditoria` - Logs de auditoría
   - `/admin/configuracion` - Configuración del sistema

2. **Layouts Compartidos:**
   - Se implementaron layouts específicos para `/dashboard` y `/admin` que mantienen elementos UI comunes como sidebar, header y navegación.

3. **Navegación Mejorada:**
   - Se agregó un componente de breadcrumbs para facilitar la navegación entre niveles.
   - El sidebar ahora usa `<Link>` para navegar entre rutas en lugar de cambiar un estado global.
   - Se mantiene coherencia visual y de experiencia de usuario entre secciones.
   - Se solucionó la redundancia entre "Home" y "Dashboard" en la navegación de breadcrumbs.

4. **Organización del Código:**
   - Se separó la lógica de presentación (layouts, páginas) de la lógica de negocio (componentes funcionales).
   - Se actualizaron los componentes para trabajar con el sistema de rutas de Next.js.

5. **Mejoras de Seguridad:**
   - **Redirección al Login:** La página principal ahora redirige al login si el usuario no está autenticado.
   - **Protección de Rutas:** Todas las rutas de la aplicación están protegidas y verifican la autenticación.
   - **Cierre de Sesión por Inactividad:** Se implementó un sistema que cierra la sesión automáticamente después de 10 minutos de inactividad.
   - **Seguimiento de Actividad:** Se registra la actividad del usuario para mantener la sesión activa mientras hay interacción.
   - **Alertas de Cierre de Sesión:** Se notifica al usuario antes de cerrar la sesión por inactividad.

## Beneficios

1. **Mejor Experiencia de Usuario:**
   - Los usuarios pueden navegar con el botón "Atrás" del navegador.
   - Las URL son significativas y pueden ser compartidas.
   - La estructura de breadcrumbs permite entender la jerarquía de navegación.

2. **Mantenibilidad:**
   - Separación clara de responsabilidades entre rutas.
   - Estructura más organizada y escalable.
   - Mejor compatibilidad con las características de Next.js.

3. **Seguridad Mejorada:**
   - Prevención de acceso no autorizado a rutas protegidas.
   - Protección contra el acceso no deseado por inactividad.
   - Mejor flujo de autenticación y redirección.

## Próximos Pasos

1. Conectar con la base de datos para obtener datos reales.
2. Implementar las funciones pendientes (como creación de clientes, gestión de obras, etc.)
3. Refinar los componentes de UI para optimizar la experiencia móvil.
4. Implementar medidas de seguridad adicionales cuando se conecte a la base de datos.
