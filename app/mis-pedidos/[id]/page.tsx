"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import NavBar from '@/components/NavBar';

interface PedidoItem {
  id_item: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  producto_sku: string;
  producto_nombre: string;
  producto_imagen: string;
}

interface Pedido {
  id: string;
  user_id: string;
  estado: string;
  total_calculado: number;
  notas_cliente: string;
  created_at: string;
  pedido_items: PedidoItem[];
}

const ESTADOS_MAP: Record<string, { label: string, color: string, step: number }> = {
  'pendiente_revision': { label: 'Pendiente de Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', step: 1 },
  'en_preparacion': { label: 'En Preparación', color: 'bg-blue-100 text-blue-800 border-blue-200', step: 2 },
  'enviado': { label: 'Enviado', color: 'bg-purple-100 text-purple-800 border-purple-200', step: 3 },
  'entregado': { label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200', step: 4 },
  'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', step: 0 }
};

export default function MisPedidosDetallePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPedidoDetalle = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        user_id,
        estado,
        total_calculado,
        notas_cliente,
        created_at,
        pedido_items (
          id_item,
          producto_id,
          cantidad,
          precio_unitario,
          producto_sku,
          producto_nombre,
          producto_imagen
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id) // Seguridad extra aunque haya RLS
      .single();

    if (error || !data) {
      console.error("Error al cargar pedido:", error);
      router.push('/mis-pedidos');
      return;
    }

    setPedido(data as Pedido);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchPedidoDetalle();

    supabase.auth.getUser().then(({ data: { user } }) => {
       if(user) {
          const subs = supabase.channel(`mis_pedidos_detalle_${id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, () => {
               fetchPedidoDetalle();
            }).subscribe();
            
          return () => { supabase.removeChannel(subs) };
       }
    });

  }, [fetchPedidoDetalle, id]);


  if (loading || !pedido) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033a0]"></div>
        </div>
      </>
    );
  }

  const infoEstado = ESTADOS_MAP[pedido.estado] || { label: pedido.estado, color: 'bg-gray-100 text-gray-800', step: 0 };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Cabecera Intermedia */}
          <div className="mb-6">
            <Link href="/mis-pedidos" className="inline-flex items-center text-sm font-medium text-[#0033a0] hover:underline mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Mis Pedidos
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Pedido #{pedido.id.substring(0,8).toUpperCase()}
              </h1>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                 <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${infoEstado.color}`}>
                    Estado Actual: {infoEstado.label}
                 </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Izquierda (Ítems y Notas) */}
            <div className="lg:col-span-2 space-y-6">
               
              {/* Tracker de Estado (Solo si no está cancelado) */}
              {pedido.estado !== 'cancelado' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Seguimiento</h3>
                  <div className="relative">
                    <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-100">
                      <div style={{ width: `${(infoEstado.step / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#0033a0] transition-all duration-700 ease-out"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium px-2">
                      <div className={`flex flex-col items-center ${infoEstado.step >= 1 ? 'text-[#0033a0]' : ''}`}>
                         <span className="font-bold">Revisión</span>
                      </div>
                      <div className={`flex flex-col items-center ${infoEstado.step >= 2 ? 'text-[#0033a0]' : ''}`}>
                         <span className="font-bold">Preparación</span>
                      </div>
                      <div className={`flex flex-col items-center ${infoEstado.step >= 3 ? 'text-[#0033a0]' : ''}`}>
                         <span className="font-bold">Enviado</span>
                      </div>
                      <div className={`flex flex-col items-center ${infoEstado.step >= 4 ? 'text-[#0033a0]' : ''}`}>
                         <span className="font-bold">Entregado</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Productos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Productos del Pedido ({pedido.pedido_items.length})</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {pedido.pedido_items.map((item) => (
                    <li key={item.id_item} className="p-6 flex flex-col sm:flex-row gap-6">
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <img
                          src={item.producto_imagen || '/placeholder-product.png'}
                          alt={item.producto_nombre}
                          className="w-full h-full object-center object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{item.producto_nombre}</h4>
                            <p className="mt-1 text-sm text-gray-500 font-mono">SKU: {item.producto_sku}</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">${(item.precio_unitario * item.cantidad).toLocaleString('es-CL')}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-md">
                            Cantidad: <span className="font-medium text-gray-900">{item.cantidad} x ${item.precio_unitario.toLocaleString('es-CL')}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notas */}
              {pedido.notas_cliente && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Tus Notas e Instrucciones</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 border border-gray-100 rounded-lg">{pedido.notas_cliente}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha (Resumen y Costos) */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Resumen y Pagos</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Subtotal Ítems</span>
                      <span className="font-medium text-gray-900">${pedido.total_calculado.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Costo Envío</span>
                      <span className="font-medium text-gray-900">Por coordinar</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total a Pagar</span>
                      <span className="text-xl font-black text-[#0033a0]">${pedido.total_calculado.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Fecha de Ingreso</p>
                    <p className="font-medium text-sm text-gray-900 mb-4 block">
                      {new Date(pedido.created_at).toLocaleString('es-CL', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
