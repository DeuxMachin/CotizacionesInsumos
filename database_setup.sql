-- Crear tabla audit_logs si no existe
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Crear tabla document_series si no existe
CREATE TABLE IF NOT EXISTS document_series (
  id SERIAL PRIMARY KEY,
  doc_tipo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  prefijo TEXT NOT NULL,
  ultimo_numero INTEGER DEFAULT 0,
  largo INTEGER DEFAULT 8,
  activo BOOLEAN DEFAULT TRUE,
  UNIQUE(doc_tipo, anio)
);

-- Insertar datos iniciales para document_series si no existen
INSERT INTO document_series (doc_tipo, anio, prefijo, ultimo_numero, largo, activo)
VALUES
  ('COT', 2025, 'COT', 0, 8, TRUE),
  ('NV', 2025, 'NV', 0, 8, TRUE)
ON CONFLICT (doc_tipo, anio) DO NOTHING;
