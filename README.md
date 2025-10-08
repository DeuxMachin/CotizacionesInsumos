# MiPortalVentas - Dashboard

Un dashboard web moderno para la gestión integral de cotizaciones, notas de venta, obras, clientes potenciales y reuniones en el sector de productos de construcción. Optimizado para empresas que vendan productos, con enfoque en eficiencia, trazabilidad y automatización.

##  Características Principales

- **Gestión de Cotizaciones**: Creación rápida de cotizaciones con conversión automática a notas de venta.
- **Seguimiento de Obras**: Vista organizada de proyectos constructivos con estados y etapas claras.
- **Clientes Potenciales (Targets)**: Registro y seguimiento de oportunidades con geolocalización opcional.
- **Reuniones y Auditoría**: Control administrativo de visitas a obras para dueños.
- **Dashboard Interactivo**: KPIs en tiempo real, filtros avanzados y reportes exportables.
- **Automatización**: Envío automático de cotizaciones por correo y notificaciones.
- **Acceso Segmentado**: Roles diferenciados (vendedor, administrador, dueño) con permisos específicos.
- **Responsive Design**: Optimizado para computadoras y dispositivos móviles.
- **Geocodificación Integrada**: API interna para búsqueda y reverse geocoding usando Nominatim, con optimizaciones de debounce, cancelación y cache.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14+ con App Router, React 18, TypeScript
- **Estilos**: Tailwind CSS con diseño responsivo y temas personalizados
- **Backend**: Supabase (PostgreSQL, autenticación, real-time)
- **Hosting**: Vercel (despliegue escalable e integrado)

## 📋 Requisitos Previos

- Node.js 18+ y pnpm
- Cuenta en Supabase para base de datos
- Variables de entorno configuradas (ver `.env.local.example`)

## 🚀 Instalación y Desarrollo

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/DeuxMachin/CotizacionesInsumos.git
   cd cotizacionesinsumos
   ```

2. **Instala dependencias**:
   ```bash
   pnpm install
   ```

3. **Configura variables de entorno**:
   Copia `.env.local.example` a `.env.local` y completa los valores requeridos (Supabase URL, keys, etc.).

4. **Ejecuta en desarrollo**:
   ```bash
   pnpm dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Construye para producción**:
   ```bash
   pnpm build
   pnpm start
   ```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Rutas y páginas (Next.js App Router)
│   ├── api/               # Endpoints de API (geocoding, obras, etc.)
│   ├── dashboard/         # Páginas del dashboard principal
│   └── layout.tsx         # Layout raíz con providers
├── features/              # Módulos funcionales
│   ├── obras/             # Gestión de obras constructivas
│   ├── quotes/            # Cotizaciones y notas de venta
│   ├── targets/           # Clientes potenciales
│   ├── clients/           # Gestión de clientes
│   └── navigation/        # Navegación y header
├── services/              # Servicios de datos (Supabase)
├── hooks/                 # Hooks personalizados
├── shared/                # Componentes y utilidades compartidas
└── components/            # Componentes globales (Footer, etc.)
```

## 🎯 Metodología y Equipo

Este proyecto sigue la metodología **Scrum** para desarrollo ágil:

- **Scrum Master**: Edward Contreras (liderazgo del proceso)
- **Desarrollador**: Christian Ferrer (implementación técnicas)
- **Ceremonias**: Daily Stand-ups, Sprint Planning, Reviews y Retrospectives semanales
- **Herramientas**: Git para control de versiones, issues para backlog


## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Scrum Master**: Edward Contreras
- **Email**: mathias.contreras.a@gmail.com
- **LinkedIn**: [Perfil de Edward](https://linkedin.com/in/edward-contreras) 

Para soporte técnico o consultas sobre el proyecto, contacta al Scrum Master.

---

