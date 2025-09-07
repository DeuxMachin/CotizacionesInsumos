-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bodegas (
  id bigint NOT NULL DEFAULT nextval('bodegas_id_seq'::regclass),
  nombre text NOT NULL UNIQUE,
  ubicacion text,
  CONSTRAINT bodegas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categorias_productos (
  id bigint NOT NULL DEFAULT nextval('categorias_productos_id_seq'::regclass),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  CONSTRAINT categorias_productos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cliente_saldos (
  id bigint NOT NULL DEFAULT nextval('cliente_saldos_id_seq'::regclass),
  cliente_id bigint NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  pagado numeric NOT NULL DEFAULT 0,
  pendiente numeric NOT NULL DEFAULT 0,
  vencido numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cliente_saldos_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_saldos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.cliente_tipos (
  id bigint NOT NULL DEFAULT nextval('cliente_tipos_id_seq'::regclass),
  nombre USER-DEFINED NOT NULL UNIQUE,
  descripcion text,
  CONSTRAINT cliente_tipos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cliente_usuarios (
  cliente_id bigint NOT NULL,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  cliente_tipo_id bigint,
  es_responsable boolean NOT NULL DEFAULT false,
  asignado_por uuid,
  asignado_at timestamp with time zone NOT NULL DEFAULT now(),
  activo boolean NOT NULL DEFAULT true,
  nota text,
  CONSTRAINT cliente_usuarios_pkey PRIMARY KEY (cliente_id, usuario_id),
  CONSTRAINT cliente_usuarios_cliente_tipo_id_fkey FOREIGN KEY (cliente_tipo_id) REFERENCES public.cliente_tipos(id),
  CONSTRAINT cliente_usuarios_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT cliente_usuarios_asignado_por_fkey FOREIGN KEY (asignado_por) REFERENCES public.usuarios(id),
  CONSTRAINT cliente_usuarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.clientes (
  id bigint NOT NULL DEFAULT nextval('clientes_id_seq'::regclass),
  rut text NOT NULL UNIQUE,
  tipo USER-DEFINED NOT NULL DEFAULT 'empresa'::tipo_cliente,
  nombre_razon_social text NOT NULL,
  nombre_fantasia text,
  codigo_interno text,
  giro text,
  direccion text,
  ciudad text,
  comuna text,
  telefono text,
  celular text,
  forma_pago text,
  contacto_pago text,
  email_pago USER-DEFINED,
  telefono_pago text,
  linea_credito numeric NOT NULL DEFAULT 0 CHECK (linea_credito >= 0::numeric),
  descuento_cliente_pct numeric NOT NULL DEFAULT 0 CHECK (descuento_cliente_pct >= 0::numeric AND descuento_cliente_pct <= 100::numeric),
  estado text NOT NULL DEFAULT 'activo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cotizacion_clientes (
  cotizacion_id bigint NOT NULL,
  cliente_id bigint NOT NULL,
  CONSTRAINT cotizacion_clientes_pkey PRIMARY KEY (cotizacion_id, cliente_id),
  CONSTRAINT cotizacion_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT cotizacion_clientes_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizaciones(id)
);
CREATE TABLE public.cotizaciones (
  id bigint NOT NULL DEFAULT nextval('cotizaciones_id_seq'::regclass),
  folio text UNIQUE,
  creada_por uuid,
  cliente_principal_id bigint,
  obra_id bigint,
  estado USER-DEFINED NOT NULL DEFAULT 'borrador'::estado_cot,
  fecha_emision date,
  validez_dias integer NOT NULL DEFAULT 30,
  fecha_vencimiento date,
  moneda text NOT NULL DEFAULT 'CLP'::text,
  forma_pago text,
  observaciones_pago text,
  plazo_entrega text,
  comentario text,
  descuento_global numeric NOT NULL DEFAULT 0,
  monto_exento numeric NOT NULL DEFAULT 0,
  total_bruto numeric NOT NULL DEFAULT 0,
  total_descuento numeric NOT NULL DEFAULT 0,
  total_neto numeric NOT NULL DEFAULT 0,
  iva numeric NOT NULL DEFAULT 0,
  impuesto_adicional numeric NOT NULL DEFAULT 0,
  total_final numeric NOT NULL DEFAULT 0,
  doc_tipo text,
  doc_folio_asociado text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cotizaciones_pkey PRIMARY KEY (id),
  CONSTRAINT cotizaciones_creada_por_fkey FOREIGN KEY (creada_por) REFERENCES public.usuarios(id),
  CONSTRAINT cotizaciones_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id),
  CONSTRAINT cotizaciones_cliente_principal_id_fkey FOREIGN KEY (cliente_principal_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.obra_tamanos (
  id bigint NOT NULL DEFAULT nextval('obra_tamanos_id_seq'::regclass),
  nombre USER-DEFINED NOT NULL UNIQUE,
  descripcion text,
  CONSTRAINT obra_tamanos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.obra_tipos (
  id bigint NOT NULL DEFAULT nextval('obra_tipos_id_seq'::regclass),
  nombre USER-DEFINED NOT NULL UNIQUE,
  descripcion text,
  CONSTRAINT obra_tipos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.obras (
  id bigint NOT NULL DEFAULT nextval('obras_id_seq'::regclass),
  cliente_id bigint,
  nombre text NOT NULL,
  direccion text,
  comuna text,
  ciudad text,
  vendedor_id uuid,
  tipo_obra_id bigint,
  tamano_obra_id bigint,
  CONSTRAINT obras_pkey PRIMARY KEY (id),
  CONSTRAINT obras_tamano_obra_id_fkey FOREIGN KEY (tamano_obra_id) REFERENCES public.obra_tamanos(id),
  CONSTRAINT obras_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT obras_tipo_obra_id_fkey FOREIGN KEY (tipo_obra_id) REFERENCES public.obra_tipos(id),
  CONSTRAINT obras_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.producto_categorias (
  producto_id bigint NOT NULL,
  categoria_id bigint NOT NULL,
  CONSTRAINT producto_categorias_pkey PRIMARY KEY (producto_id, categoria_id),
  CONSTRAINT producto_categorias_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT producto_categorias_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_productos(id)
);
CREATE TABLE public.producto_stock (
  bodega_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  ubicacion text,
  stock_actual numeric NOT NULL DEFAULT 0,
  total_valorizado numeric NOT NULL DEFAULT 0,
  CONSTRAINT producto_stock_pkey PRIMARY KEY (bodega_id, producto_id),
  CONSTRAINT producto_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT producto_stock_bodega_id_fkey FOREIGN KEY (bodega_id) REFERENCES public.bodegas(id)
);
CREATE TABLE public.productos (
  id bigint NOT NULL DEFAULT nextval('productos_id_seq'::regclass),
  sku text UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  unidad text NOT NULL DEFAULT 'unidad'::text,
  codigo_barra text,
  precio_compra numeric DEFAULT 0,
  precio_venta_neto numeric DEFAULT 0,
  estado text NOT NULL DEFAULT 'vigente'::text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT productos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.target_contactos (
  id bigint NOT NULL DEFAULT nextval('target_contactos_id_seq'::regclass),
  target_id bigint NOT NULL,
  nombre text,
  empresa text,
  telefono text CHECK (telefono IS NULL OR telefono ~ '^\+56[0-9]{9}$'::text),
  email USER-DEFINED,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT target_contactos_pkey PRIMARY KEY (id),
  CONSTRAINT target_contactos_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.targets(id)
);
CREATE TABLE public.target_eventos (
  id bigint NOT NULL DEFAULT nextval('target_eventos_id_seq'::regclass),
  target_id bigint NOT NULL,
  tipo text NOT NULL,
  detalle text,
  fecha_evento timestamp with time zone NOT NULL DEFAULT now(),
  creado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT target_eventos_pkey PRIMARY KEY (id),
  CONSTRAINT target_eventos_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.targets(id),
  CONSTRAINT target_eventos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id)
);
CREATE TABLE public.target_notas (
  id bigint NOT NULL DEFAULT nextval('target_notas_id_seq'::regclass),
  target_id bigint NOT NULL,
  nota text NOT NULL,
  creado_por uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT target_notas_pkey PRIMARY KEY (id),
  CONSTRAINT target_notas_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.targets(id),
  CONSTRAINT target_notas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id)
);
CREATE TABLE public.target_tipos (
  id bigint NOT NULL DEFAULT nextval('target_tipos_id_seq'::regclass),
  nombre text NOT NULL UNIQUE,
  descripcion text,
  CONSTRAINT target_tipos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.targets (
  id bigint NOT NULL DEFAULT nextval('targets_id_seq'::regclass),
  titulo text NOT NULL,
  descripcion text,
  estado USER-DEFINED NOT NULL DEFAULT 'pendiente'::estado_target,
  prioridad USER-DEFINED NOT NULL DEFAULT 'media'::prioridad_target,
  tipo_id bigint,
  direccion text,
  comuna text,
  ciudad text,
  region text,
  lat numeric,
  lng numeric,
  creado_por uuid NOT NULL,
  asignado_a uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT targets_pkey PRIMARY KEY (id),
  CONSTRAINT targets_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.target_tipos(id),
  CONSTRAINT targets_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id),
  CONSTRAINT targets_asignado_a_fkey FOREIGN KEY (asignado_a) REFERENCES public.usuarios(id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email USER-DEFINED NOT NULL UNIQUE,
  nombre text,
  apellido text,
  rol USER-DEFINED NOT NULL DEFAULT 'vendedor'::rol,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  password_hash text NOT NULL,
  last_login_at timestamp with time zone,
  password_updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);