-- ==========================================
-- Configuración de Supabase Storage para Imágenes de Productos
-- ==========================================

-- 1. Crear el Bucket "productos_imagenes"
-- Nota: Asegúrate de ejecutar esto en el SQL Editor de tu proyecto Supabase.
insert into storage.buckets (id, name, public) 
values ('productos_imagenes', 'productos_imagenes', true);

-- 2. Políticas de Seguridad (RLS) para el Bucket
-- Estas políticas controlan quién puede leer y subir archivos.

-- Permitir acceso de lectura PÚBLICO a las imágenes de los productos
create policy "Lectura pública de imágenes de productos"
  on storage.objects for select
  using ( bucket_id = 'productos_imagenes' );

-- Permitir a usuarios anónimos subir imágenes (Solo para fase de desarrollo/pruebas locales)
-- ATENCIÓN MEGA IMPORTANTE: Para producción, DEBES cambiar esto para que solo usuarios autenticados con rol de Supervisor puedan subir.
create policy "Permitir subida anónima a productos_imagenes (SOLO DESARROLLO)"
  on storage.objects for insert
  with check ( bucket_id = 'productos_imagenes' );

-- Permitir actualización anónima (SOLO DESARROLLO)
create policy "Permitir actualización anónima a productos_imagenes (SOLO DESARROLLO)"
  on storage.objects for update
  using ( bucket_id = 'productos_imagenes' );

-- Permitir eliminación anónima (SOLO DESARROLLO)
create policy "Permitir eliminación anónima a productos_imagenes (SOLO DESARROLLO)"
  on storage.objects for delete
  using ( bucket_id = 'productos_imagenes' );
