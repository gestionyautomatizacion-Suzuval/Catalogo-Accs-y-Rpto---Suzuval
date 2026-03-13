import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase-server';
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
import { SupervisorNewOrderEmail } from '@/components/emails/SupervisorNewOrderEmail';
import * as React from 'react';

// Require API Key fallback
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); 

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Verificamos secret de Supabase Webhook (opcional de seguridad)
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Payload de Database Webhooks (Supabase)
    if (payload.type === 'UPDATE' && payload.table === 'pedidos') {
      const oldState = payload.old_record?.estado;
      const newState = payload.record?.estado;
      
      const isNewOrder = (oldState === 'borrador' || oldState === 'guardado') && newState === 'pendiente_revision';
      
      if (isNewOrder) {
        const orderId = payload.record.id;
        const total = payload.record.total_calculado;
        const userId = payload.record.user_id;

        const supabaseAdmin = createAdminClient();

        // 1. Obtener detalles del usuario comprador
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        const customerEmail = userData?.user?.email || 'cliente@ejemplo.com';
        const customerName = userData?.user?.user_metadata?.first_name || 'Cliente';

        // 2. Obtener items del pedido para el correo del cliente
        const { data: items } = await supabaseAdmin
          .from('pedido_items')
          .select('cantidad, precio_unitario_guardado, productos(nombre)')
          .eq('pedido_id', orderId);

        const emailItems = items?.map((item: any) => ({
          nombre: item.productos?.nombre || 'Producto Desconocido',
          cantidad: item.cantidad,
          precio: item.precio_unitario_guardado
        })) || [];

        // 3. Enviar correo al Cliente
        // Nota: Solo funcionará con correos reales si compraste dominio en Resend,
        // o usando la versión de pruebas de Resend hacia correos verificados.
        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: 'Suzuval Pedidos <pedidos@dominio-suzuval.cl>', // Debería ser dominio verificado en Producción
            to: [customerEmail],
            subject: `Confirmación de Pedido #${orderId.substring(0,8)}`,
            react: OrderConfirmationEmail({
              orderId,
              customerName,
              items: emailItems,
              total
            }) as React.ReactElement
          });

          // 4. Enviar correo al supervisor
          const emailSupervisor = process.env.SUPERVISOR_EMAIL || 'supervisor@suzuval.cl';
          await resend.emails.send({
            from: 'Suzuval Info <info@dominio-suzuval.cl>',
            to: [emailSupervisor],
            subject: `Nuevo Pedido Pendiente #${orderId.substring(0,8)}`,
            react: SupervisorNewOrderEmail({
              orderId,
              customerName,
              customerEmail,
              total,
              dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/pedidos`
            }) as React.ReactElement
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en webhook enviar-emails:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
