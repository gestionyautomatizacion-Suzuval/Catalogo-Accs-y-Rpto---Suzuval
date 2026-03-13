-- Habilitar extensión pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Tablas de Jerarquía de Vehículos
-- ==========================================

-- Tabla: marcas
CREATE TABLE marcas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: familias
CREATE TABLE familias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca_id UUID NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(marca_id, nombre)
);

-- Tabla: modelos
CREATE TABLE modelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    familia_id UUID NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
    nombre_especifico VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Tabla de Vehículos de Clientes y Categorías
-- ==========================================

-- Tabla: vehiculos_clientes
CREATE TABLE vehiculos_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nro_interno_7_digitos VARCHAR(7) UNIQUE,
    nro_chasis_vin VARCHAR(17) UNIQUE,
    modelo_id UUID NOT NULL REFERENCES modelos(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (nro_interno_7_digitos IS NOT NULL OR nro_chasis_vin IS NOT NULL)
);

-- Tabla: categorias_items
CREATE TABLE categorias_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- ==========================================
-- 3. Tabla de Productos y Compatibilidad
-- ==========================================

-- Tabla: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0,
    precio_oferta DECIMAL(10, 2),
    stock INTEGER NOT NULL DEFAULT 0,
    categoria_item_id UUID NOT NULL REFERENCES categorias_items(id) ON DELETE RESTRICT,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: compatibilidad
CREATE TABLE compatibilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    modelo_id UUID NOT NULL REFERENCES modelos(id) ON DELETE CASCADE,
    UNIQUE(producto_id, modelo_id)
);

-- Tabla: productos_imagenes
CREATE TABLE productos_imagenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. Row Level Security (RLS)
-- ==========================================

-- Habilitar RLS
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura Pública (Usuarios Anónimos/Autenticados pueden leer el catálogo)
CREATE POLICY "Lectura pública de marcas" ON marcas FOR SELECT USING (true);
CREATE POLICY "Lectura pública de familias" ON familias FOR SELECT USING (true);
CREATE POLICY "Lectura pública de modelos" ON modelos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de categorias" ON categorias_items FOR SELECT USING (true);
CREATE POLICY "Lectura pública de productos" ON productos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de compatibilidad" ON compatibilidad FOR SELECT USING (true);
CREATE POLICY "Lectura pública de imagenes_productos" ON productos_imagenes FOR SELECT USING (true);
CREATE POLICY "Lectura pública de vehiculos" ON vehiculos_clientes FOR SELECT USING (true);

-- (Las políticas de escritura para Supervisores se agregarían aquí verificando el rol del usuario auth.uid())

-- ==========================================
-- 5. Datos de Referencia Iniciales
-- ==========================================

-- Insertar Categorías
INSERT INTO categorias_items (nombre) VALUES
('ACCESORIO DE SEGURIDAD'),
('COMFORT'),
('EMBELLECIMIENTO'),
('REPUESTOS'),
('ACEITES'),
('NEUMATICOS'),
('KIT LIMPIEZA');

-- Insertar Marcas y Familias
DO $$
DECLARE
    marca_changan UUID;
    marca_dfsk UUID;
    marca_gwm UUID;
    marca_mazda UUID;
    marca_renault UUID;
    marca_suzuki UUID;
BEGIN
    -- CHANGAN
    INSERT INTO marcas (nombre) VALUES ('CHANGAN') RETURNING id INTO marca_changan;
    INSERT INTO familias (marca_id, nombre) VALUES
        (marca_changan, 'ALSVIN'), (marca_changan, 'CS15'), (marca_changan, 'CS35'), 
        (marca_changan, 'CS55'), (marca_changan, 'DEEPAL'), (marca_changan, 'HUNTER'), 
        (marca_changan, 'M201'), (marca_changan, 'MD201'), (marca_changan, 'MD301 PLUS'), 
        (marca_changan, 'MS201'), (marca_changan, 'MS301 PLUS'), (marca_changan, 'UNI-K'), 
        (marca_changan, 'UNI_T'), (marca_changan, 'X7 PLUS');

    -- DFSK
    INSERT INTO marcas (nombre) VALUES ('DFSK') RETURNING id INTO marca_dfsk;
    INSERT INTO familias (marca_id, nombre) VALUES
        (marca_dfsk, '500'), (marca_dfsk, '560'), (marca_dfsk, '580'), 
        (marca_dfsk, '600'), (marca_dfsk, 'CARGO'), (marca_dfsk, 'D1'), (marca_dfsk, 'Z9');

    -- GWM
    INSERT INTO marcas (nombre) VALUES ('GREAT WALL / GWM') RETURNING id INTO marca_gwm;
    INSERT INTO familias (marca_id, nombre) VALUES
        (marca_gwm, 'ORA'), (marca_gwm, 'TANK'), (marca_gwm, 'HAVAL H6'), 
        (marca_gwm, 'HAVAL H7'), (marca_gwm, 'JOLION'), (marca_gwm, 'POER'), (marca_gwm, 'WINGLE 7');

    -- MAZDA
    INSERT INTO marcas (nombre) VALUES ('MAZDA') RETURNING id INTO marca_mazda;
    INSERT INTO familias (marca_id, nombre) VALUES
        (marca_mazda, 'BT-50'), (marca_mazda, 'CX-3'), (marca_mazda, 'CX30'), 
        (marca_mazda, 'CX-5'), (marca_mazda, 'CX-60'), (marca_mazda, 'CX-90'), 
        (marca_mazda, 'MAZDA 6'), (marca_mazda, 'MAZDA 3'), (marca_mazda, 'MX-5');

    -- RENAULT
    INSERT INTO marcas (nombre) VALUES ('RENAULT') RETURNING id INTO marca_renault;
    INSERT INTO familias (marca_id, nombre) VALUES
        (marca_renault, 'ARKANA'), (marca_renault, 'DUSTER'), (marca_renault, 'KOLEOS'), 
        (marca_renault, 'KWID'), (marca_renault, 'OROCH');

    -- SUZUKI
    INSERT INTO marcas (nombre) VALUES ('SUZUKI') RETURNING id INTO marca_suzuki;
    INSERT INTO familias (marca_id, nombre) VALUES
        (marca_suzuki, 'CARRY'), (marca_suzuki, 'CELERIO'), (marca_suzuki, 'DZIRE'), 
        (marca_suzuki, 'JIMNY'), (marca_suzuki, 'ALTO'), (marca_suzuki, 'BALENO'), 
        (marca_suzuki, 'FRONX'), (marca_suzuki, 'GRAND VITARA'), (marca_suzuki, 'SWIFT'), 
        (marca_suzuki, 'SPRESSO'), (marca_suzuki, 'XL7');
END $$;
