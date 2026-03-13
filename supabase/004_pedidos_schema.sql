-- ==========================================
-- 1. Crear el tipo ENUM para estados de pedido
-- ==========================================
CREATE TYPE estado_pedido AS ENUM ('borrador', 'guardado', 'pendiente_revision', 'en_preparacion', 'enviado', 'entregado', 'cancelado');

-- ==========================================
-- 2. Crear tabla pedidos
-- ==========================================
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    estado estado_pedido NOT NULL DEFAULT 'borrador',
    notas_cliente TEXT,
    total_calculado DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. Crear tabla pedido_items
-- ==========================================
CREATE TABLE pedido_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario_guardado DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pedido_id, producto_id)
);

-- ==========================================
-- 4. Crear tabla notificaciones_internas
-- ==========================================
CREATE TABLE notificaciones_internas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, 
    rol_destino user_role, -- Usamos el enum user_role creado en roles_setup.sql ('admin', 'supervisor', 'user')
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    referencia_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id IS NOT NULL OR rol_destino IS NOT NULL)
);

-- ==========================================
-- 5. Row Level Security (RLS)
-- ==========================================
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_internas ENABLE ROW LEVEL SECURITY;

-- 5.1 Políticas para Pedidos

-- Usuarios pueden ver sus propios pedidos o todos si es supervisor/admin
CREATE POLICY "Usuarios ven sus propios pedidos" ON pedidos 
    FOR SELECT USING (auth.uid() = user_id OR is_admin_or_supervisor());

-- Usuarios pueden crear sus propios pedidos
CREATE POLICY "Usuarios crean sus propios pedidos" ON pedidos 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios actualizan sus pedidos a cualquier estado (necesario para pasar de borrador a pendiente_revision)
-- Supervisores y admins pueden actualizar cualquier pedido
CREATE POLICY "Actualizar pedidos" ON pedidos 
    FOR UPDATE USING (
        (auth.uid() = user_id) OR 
        is_admin_or_supervisor()
    );

-- Usuarios pueden eliminar pedidos SOLO en borrador
CREATE POLICY "Eliminar pedidos borrador" ON pedidos 
    FOR DELETE USING (
        auth.uid() = user_id AND estado = 'borrador'
    );

-- 5.2 Políticas para Pedido Items

-- Ver items de pedidos propios o de todos si es supervisor
CREATE POLICY "Ver items pedidos" ON pedido_items 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = pedido_items.pedido_id AND pedidos.user_id = auth.uid()) OR
        is_admin_or_supervisor()
    );

-- Insertar items si eres el dueño del pedido
CREATE POLICY "Insertar items" ON pedido_items 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = pedido_items.pedido_id AND pedidos.user_id = auth.uid())
    );

-- Actualizar items
CREATE POLICY "Actualizar items" ON pedido_items 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = pedido_items.pedido_id AND pedidos.user_id = auth.uid())
    );

-- Eliminar items
CREATE POLICY "Eliminar items" ON pedido_items 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = pedido_items.pedido_id AND pedidos.user_id = auth.uid())
    );

-- 5.3 Políticas para Notificaciones Internas

-- Ver notificaciones propias o por rol
CREATE POLICY "Ver notificaciones" ON notificaciones_internas 
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (rol_destino IS NOT NULL AND (
            (rol_destino = 'admin' AND is_admin()) OR
            (rol_destino = 'supervisor' AND is_admin_or_supervisor())
        ))
    );

-- Actualizar (marcar como leída) las propias
CREATE POLICY "Actualizar notificaciones" ON notificaciones_internas 
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (rol_destino IS NOT NULL AND (
            (rol_destino = 'admin' AND is_admin()) OR
            (rol_destino = 'supervisor' AND is_admin_or_supervisor())
        ))
    );

-- Insertar notificaciones (cualquiera puede insertarlas para reportar eventos)
CREATE POLICY "Insertar notificaciones libre" ON notificaciones_internas 
    FOR INSERT WITH CHECK (true);

-- Eliminar notificaciones
CREATE POLICY "Eliminar notificaciones" ON notificaciones_internas 
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (rol_destino IS NOT NULL AND (
            (rol_destino = 'admin' AND is_admin()) OR
            (rol_destino = 'supervisor' AND is_admin_or_supervisor())
        ))
    );
