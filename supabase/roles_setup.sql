-- ==========================================
-- Configuración de Roles de Usuario
-- ==========================================

-- 1. Crear el tipo ENUM para roles
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'user');

-- 2. Crear tabla user_roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 3. Funciones de Seguridad (Security Definer para evitar recursión RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'supervisor')
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 4. Habilitar RLS en user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Lectura: un usuario puede ver su propio rol
CREATE POLICY "Users can read own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Lectura: admin y supervisor pueden ver todos los roles (Usando la función para evitar recursión)
CREATE POLICY "Admin and supervisor can read all roles" ON user_roles
    FOR SELECT USING (is_admin_or_supervisor());

-- Escritura: solo la service_role (API del servidor) puede insertar/actualizar roles
-- (No se crea política de INSERT/UPDATE para anon/authenticated → solo el servidor puede hacerlo)

-- ==========================================
-- 4. Actualizar políticas RLS de ESCRITURA en productos
-- ==========================================

-- Eliminar si existía una política de escritura permisiva previa
DROP POLICY IF EXISTS "Permitir inserción anónima a productos" ON productos;
DROP POLICY IF EXISTS "Permitir actualización anónima a productos" ON productos;

-- Solo admin y supervisor pueden insertar productos
CREATE POLICY "Admin y Supervisor pueden insertar productos" ON productos
    FOR INSERT WITH CHECK (is_admin_or_supervisor());

-- Solo admin y supervisor pueden actualizar productos
CREATE POLICY "Admin y Supervisor pueden actualizar productos" ON productos
    FOR UPDATE USING (is_admin_or_supervisor());

-- Solo admin puede eliminar productos
CREATE POLICY "Solo Admin puede eliminar productos" ON productos
    FOR DELETE USING (is_admin());

-- ==========================================
-- 4.1 Políticas para Compatibilidad
-- ==========================================
CREATE POLICY "Admin y Supervisor pueden insertar compatibilidad" ON compatibilidad
    FOR INSERT WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Admin y Supervisor pueden actualizar compatibilidad" ON compatibilidad
    FOR UPDATE USING (is_admin_or_supervisor());

CREATE POLICY "Admin y Supervisor pueden eliminar compatibilidad" ON compatibilidad
    FOR DELETE USING (is_admin_or_supervisor());

-- ==========================================
-- 4.2 Políticas para Imágenes de Productos
-- ==========================================
CREATE POLICY "Admin y Supervisor pueden insertar imagenes_productos" ON productos_imagenes
    FOR INSERT WITH CHECK (is_admin_or_supervisor());

CREATE POLICY "Admin y Supervisor pueden actualizar imagenes_productos" ON productos_imagenes
    FOR UPDATE USING (is_admin_or_supervisor());

CREATE POLICY "Admin y Supervisor pueden eliminar imagenes_productos" ON productos_imagenes
    FOR DELETE USING (is_admin_or_supervisor());

-- ==========================================
-- 5. Actualizar políticas de Supabase Storage
-- Reemplaza las políticas anónimas del storage_setup.sql
-- ==========================================

-- Eliminar políticas anónimas de desarrollo
DROP POLICY IF EXISTS "Permitir subida anónima a productos_imagenes (SOLO DESARROLLO)" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización anónima a productos_imagenes (SOLO DESARROLLO)" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación anónima a productos_imagenes (SOLO DESARROLLO)" ON storage.objects;

-- Solo admin y supervisor pueden subir imágenes
CREATE POLICY "Admin y Supervisor pueden subir imágenes"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'productos_imagenes'
        AND is_admin_or_supervisor()
    );

-- Admin y supervisor pueden actualizar imágenes
CREATE POLICY "Admin y Supervisor pueden actualizar imágenes"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'productos_imagenes'
        AND is_admin_or_supervisor()
    );

-- Solo admin puede eliminar imágenes
CREATE POLICY "Solo Admin puede eliminar imágenes"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'productos_imagenes'
        AND is_admin()
    );

-- ==========================================
-- 6. Función auxiliar para obtener el rol del usuario actual
-- Útil para llamar desde el cliente: SELECT get_my_role();
-- ==========================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role::TEXT FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;
