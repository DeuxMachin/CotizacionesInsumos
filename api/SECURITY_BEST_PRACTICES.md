# Mejores Prácticas de Seguridad - API de Cotizaciones

## 🔒 Estado Actual y Recomendaciones

### 1. **Configuración Actual (DESARROLLO)**
- ✅ Funciona correctamente
- ⚠️ Todos los roles tienen acceso completo a todas las tablas
- ⚠️ RLS está deshabilitado
- ⚠️ El rol `anon` puede acceder a todo

### 2. **Configuración Recomendada para PRODUCCIÓN**

#### A. **Permisos de Base de Datos**
```sql
-- Solo el service_role debería tener acceso completo
-- anon y authenticated NO deberían acceder directamente
```

#### B. **Variables de Entorno**
```env
# Nunca subas estas a Git
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx  # Solo para cliente web (si tienes)
SUPABASE_SERVICE_ROLE_KEY=xxx  # SOLO en el backend, NUNCA en el cliente
```

#### C. **Arquitectura Segura**
```
Cliente Web/App → API Express (con service_role) → Supabase
         ↑              ↓
         └── Autenticación JWT
```

### 3. **Implementación de Seguridad en tu API**

#### A. **Agregar Autenticación JWT**
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Usar en rutas protegidas
router.get('/api/clientes', authMiddleware, async (req, res) => {
  // Solo usuarios autenticados pueden acceder
});
```

#### B. **Validación de Datos**
```javascript
// Instalar: npm install express-validator
const { body, validationResult } = require('express-validator');

router.post('/api/clientes',
  authMiddleware,
  [
    body('rut').isString().trim().notEmpty(),
    body('nombre_razon_social').isString().trim().notEmpty(),
    body('email_pago').optional().isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Procesar...
  }
);
```

#### C. **Rate Limiting**
```javascript
// Instalar: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests
});

app.use('/api/', limiter);
```

#### D. **Sanitización de Consultas**
```javascript
// Ya estás usando Supabase que previene SQL injection
// Pero siempre valida y sanitiza inputs
const { escape } = require('validator');

const searchTerm = escape(req.query.search || '');
```

### 4. **Configuración de RLS en Supabase**

Para cuando implementes autenticación directa con Supabase:

```sql
-- Ejemplo: Solo el dueño puede ver sus cotizaciones
CREATE POLICY "Usuarios ven sus propias cotizaciones"
ON cotizaciones FOR SELECT
USING (creada_por = auth.uid());

-- Ejemplo: Vendedores ven solo sus clientes asignados
CREATE POLICY "Vendedores ven sus clientes"
ON clientes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cliente_usuarios
    WHERE cliente_usuarios.cliente_id = clientes.id
    AND cliente_usuarios.usuario_id = auth.uid()
    AND cliente_usuarios.activo = true
  )
);
```

### 5. **Checklist de Seguridad**

- [ ] Habilitar RLS en todas las tablas
- [ ] Revocar permisos de `anon` y `authenticated`
- [ ] Implementar autenticación JWT en la API
- [ ] Agregar validación de datos
- [ ] Implementar rate limiting
- [ ] Configurar CORS correctamente
- [ ] Usar HTTPS en producción
- [ ] Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- [ ] Logs de auditoría para acciones críticas
- [ ] Backup regular de la base de datos

### 6. **Variables de Entorno para Producción**

```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx  # Guardar en gestor de secretos

# Seguridad
JWT_SECRET=xxx  # Generar con: openssl rand -base64 32
BCRYPT_ROUNDS=10

# CORS
FRONTEND_URL=https://tu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX=100
```

### 7. **Próximos Pasos**

1. **Para Desarrollo**: Puedes mantener la configuración actual
2. **Antes de Producción**: 
   - Ejecutar `secure-permissions.sql`
   - Implementar autenticación
   - Agregar validación y sanitización
   - Configurar HTTPS

## 🚨 IMPORTANTE

**NUNCA** hagas esto en producción:
- Dar permisos completos al rol `anon`
- Desactivar RLS sin políticas
- Exponer el `SERVICE_ROLE_KEY` al cliente
- Confiar en datos del cliente sin validar
- Guardar contraseñas en texto plano
