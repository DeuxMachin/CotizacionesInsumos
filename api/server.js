const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta básica
app.get('/', (req, res) => {
  res.json({
    message: 'API de Cotizaciones funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime()
  });
});

// Rutas de la API
const quotesRoutes = require('./routes/quotes');
const clientesRoutes = require('./routes/clientes');
const productosRoutes = require('./routes/productos');
const obrasRoutes = require('./routes/obras');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/quotes', quotesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba de conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const { queryHelpers } = require('./config/database');
    const healthCheck = await queryHelpers.healthCheck();
    
    if (!healthCheck.success) {
      throw new Error(healthCheck.error);
    }
    
    // Intentar obtener info básica de una tabla
    let tableInfo = {};
    try {
      const totalClientes = await queryHelpers.getCount('clientes');
      tableInfo.total_clientes = totalClientes;
    } catch (tableError) {
      tableInfo.table_error = tableError.message;
      tableInfo.note = 'Conexión establecida pero tabla puede tener RLS activo';
    }
    
    res.json({
      success: true,
      message: 'Conexión a Supabase establecida',
      data: {
        ...tableInfo,
        timestamp: new Date().toISOString(),
        supabase_url: process.env.SUPABASE_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error de conexión a la base de datos',
      message: error.message,
      details: 'Verifica que el SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY sean correctos'
    });
  }
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Ruta de prueba funcionando correctamente',
    data: {
      server: 'Express.js',
      timestamp: new Date().toISOString()
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor'
  });
});

// Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
const startServer = async () => {
  // Probar conexión a la base de datos
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ No se pudo conectar a la base de datos');
    console.log('Verifica tus variables de entorno en el archivo .env');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 API ejecutándose en http://localhost:${PORT}`);
    console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = app;
