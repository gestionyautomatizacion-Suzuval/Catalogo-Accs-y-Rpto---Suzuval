-- Ejecutar en Supabase SQL Editor
ALTER TABLE productos 
ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN created_by_name VARCHAR(255);
