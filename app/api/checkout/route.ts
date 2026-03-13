import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { pedidoId, notas } = await req.json();

    if (!pedidoId) {
      return NextResponse.json({ error: 'El ID del pedido es obligatorio' }, { status: 400 });
    }

    // 1. Obtener el pedido actual (debe estar en borrador)
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, estado')
      .eq('id', pedidoId)
      .eq('user_id', user.id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado o no autorizado' }, { status: 404 });
    }

    if (pedido.estado !== 'borrador' && pedido.estado !== 'guardado') {
      return NextResponse.json({ error: 'El pedido ya fue procesado' }, { status: 400 });
    }

    // 2. Obtener los ítems para validar precios actuales vs los guardados
    const { data: items, error: itemsError } = await supabase
      .from('pedido_items')
      .select('id, cantidad, precio_unitario_guardado, producto_id, productos(precio, precio_oferta)')
      .eq('pedido_id', pedidoId);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    let totalActualizado = 0;

    // 3. (Opcional) Aquí verificaríamos inventario si la regla fuera estricta ahora.
    // 4. Calcular el total real a partir de la DB (evitando manipulaciones cliente)
    for (const item of items) {
      const prod: any = Array.isArray(item.productos) ? item.productos[0] : item.productos;
      const precioVigente = prod?.precio_oferta || prod?.precio;
      totalActualizado += precioVigente * item.cantidad;

      // Actualizar el item_precio_guardado para reflejar el momento de cierre
      if (item.precio_unitario_guardado !== precioVigente) {
        await supabase
          .from('pedido_items')
          .update({ precio_unitario_guardado: precioVigente })
          .eq('id', item.id);
      }
    }

    // 5. Cambiar el estado de Pedido a 'pendiente_revision'
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        estado: 'pendiente_revision',
        total_calculado: totalActualizado,
        notas_cliente: notas || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pedidoId);

    if (updateError) {
      throw updateError;
    }

    // 6. Generar notificación interna visible en el header del supervisor
    await supabase.from('notificaciones_internas').insert({
      rol_destino: 'supervisor',
      tipo: 'NUEVO_PEDIDO',
      mensaje: `Nuevo pedido #${pedidoId.substring(0,8)} ha sido ingresado al sistema.`,
      referencia_id: pedidoId
    });

    // Listo. El webhook de base de datos se encargará de disparar las confirmaciones por EMAIL.
    return NextResponse.json({ success: true, pedidoId, total: totalActualizado });

  } catch (error: any) {
    console.error('Error en checkout:', error);
    return NextResponse.json({ error: 'Error procesando el pedido' }, { status: 500 });
  }
}
