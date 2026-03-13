-- Agregar columnas para registrar el nombre y email del cliente de forma persistente
-- al momento de confirmar un pedido, evitando la necesidad de hacer JOINs complejos con auth.users

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_nombre VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255);
