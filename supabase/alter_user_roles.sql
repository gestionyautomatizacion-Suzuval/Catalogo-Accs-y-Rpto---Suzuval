-- Ejecutar en Supabase SQL Editor
ALTER TABLE user_roles 
ADD COLUMN estado VARCHAR(20) DEFAULT 'activo' 
CHECK (estado IN ('activo', 'suspendido'));
