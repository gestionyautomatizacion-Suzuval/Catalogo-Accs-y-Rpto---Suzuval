"use client";

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PedidoItem {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario_guardado: number;
  productos: {
    nombre: string;
    sku: string;
    imagen_url: string;
  };
}

interface Pedido {
  id: string;
  user_id: string;
  estado: string;
  total_calculado: number;
  notas: string;
  created_at: string;
  updated_at: string;
  pedido_items: PedidoItem[];
}

const ESTADOS_MAP: Record<string, { label: string, color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  guardado: { label: 'Guardado', color: 'bg-gray-100 text-gray-800' },
  pendiente_revision: { label: 'Pendiente de Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  en_preparacion: { label: 'En Preparación', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  enviado: { label: 'Enviado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  entregado: { label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' }
};

const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  pendiente_revision: ['en_preparacion', 'cancelado'],
  en_preparacion: ['enviado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: []
};

export default function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const fetchPedido = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items(
          *,
          productos(nombre, sku, imagen_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
       console.error(error);
    } else {
       setPedido(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPedido();
    
    // Suscripción al pedido actual en caso de que alguien más lo edite
    const subs = supabase.channel(`pedido_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, () => {
         fetchPedido();
      }).subscribe();
      
    return () => { supabase.removeChannel(subs) };
  }, [id]);

  const handleUpdateStatus = async (nuevoEstado: string) => {
    if (!confirm(`¿Estás seguro de cambiar el estado a ${ESTADOS_MAP[nuevoEstado].label}?`)) return;
    
    setIsUpdating(true);
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      // Registrar notificación para el cliente u otro administrador
      await supabase.from('notificaciones_internas').insert({
        tipo: `pedido_${nuevoEstado}`,
        mensaje: `El pedido #${id.substring(0,8)} ahora está ${ESTADOS_MAP[nuevoEstado].label}`,
        referencia_id: id
      });
      await fetchPedido();
    }
    setIsUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033a0]"></div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-40">
        <h2 className="text-2xl font-bold text-gray-800">Pedido no encontrado</h2>
        <Link href="/dashboard/pedidos" className="text-[#0033a0] hover:underline mt-4 block">Volver a Pedidos</Link>
      </div>
    );
  }

  const estadoActualInfo = ESTADOS_MAP[pedido.estado] || { label: pedido.estado, color: 'bg-gray-100' };
  const accionesPermitidas = TRANSICIONES_PERMITIDAS[pedido.estado] || [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
         <div className="flex items-center gap-4">
             <Link href="/dashboard/pedidos" className="text-gray-400 hover:text-gray-800 transition-colors bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
             </Link>
             <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
               Pedido #{pedido.id.substring(0,8).toUpperCase()}
               <span className={`px-3 py-1 text-xs font-bold rounded-full border ${estadoActualInfo.color}`}>
                  {estadoActualInfo.label}
               </span>
             </h1>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Column - Products */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Productos ({pedido.pedido_items?.length || 0})</h3>
               </div>
               <div className="divide-y divide-gray-100">
                  {pedido.pedido_items?.map(item => (
                     <div key={item.id} className="p-6 flex items-center hover:bg-slate-50 transition-colors">
                        <div className="h-16 w-16 flex-shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden p-1">
                           <img src={item.productos?.imagen_url || '/placeholder.png'} alt={item.productos?.nombre} className="h-full w-full object-contain" />
                        </div>
                        <div className="ml-4 flex-1">
                           <h4 className="text-sm font-bold text-gray-900">{item.productos?.nombre || 'Producto Desconocido'}</h4>
                           <p className="text-xs text-gray-500 mt-0.5">SKU: {item.productos?.sku || 'N/A'}</p>
                           <p className="text-sm text-gray-700 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">x{item.cantidad}</p>
                        </div>
                        <div className="ml-4 text-right">
                           <p className="text-sm font-bold text-gray-900">${(item.precio_unitario_guardado * item.cantidad).toLocaleString('es-CL')}</p>
                           <p className="text-xs text-gray-400 mt-1">${item.precio_unitario_guardado.toLocaleString('es-CL')} c/u</p>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Monto Total Estimado</span>
                  <span className="text-2xl font-black text-[#0033a0]">${pedido.total_calculado.toLocaleString('es-CL')}</span>
               </div>
            </div>

            {/* Notas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Notas / Instrucciones del Cliente</h3>
               </div>
               <div className="p-6">
                  {pedido.notas ? (
                     <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{pedido.notas}</p>
                  ) : (
                     <p className="text-gray-400 text-sm italic">Sin notas provistas por el cliente.</p>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar Column - Info & Actions */}
         <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-[#001a5c] text-white">
                  <h3 className="text-lg font-bold text-white">Acciones Operativas</h3>
               </div>
               <div className="p-6">
                  {accionesPermitidas.length > 0 ? (
                     <div className="space-y-3">
                        {accionesPermitidas.map(nuevoEstado => (
                           <button
                              key={nuevoEstado}
                              onClick={() => handleUpdateStatus(nuevoEstado)}
                              disabled={isUpdating}
                              className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all
                                 ${nuevoEstado === 'cancelado' 
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                    : 'bg-[#0033a0] text-white hover:bg-blue-800 shadow-md hover:shadow-lg'
                                 }
                                 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                           >
                              {isUpdating ? 'Procesando...' : `Marcar como ${ESTADOS_MAP[nuevoEstado].label}`}
                           </button>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
                         <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Pedido Finalizado
                         </p>
                         <p className="text-xs text-gray-400 mt-1">Este pedido no admite más transiciones.</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Detalles Internos</h3>
               </div>
               <div className="p-6 space-y-4 text-sm">
                  <div>
                     <p className="text-gray-500 mb-1">ID Completo</p>
                     <p className="font-mono text-xs text-gray-900 bg-gray-100 p-2 rounded break-all">{pedido.id}</p>
                  </div>
                  <div>
                     <p className="text-gray-500 mb-1">ID Cliente (Usuario Auth)</p>
                     <p className="font-mono text-xs text-gray-900 bg-gray-100 p-2 rounded break-all">{pedido.user_id}</p>
                  </div>
                  <div>
                     <p className="text-gray-500 mb-1">Fecha Creación</p>
                     <p className="text-gray-900 font-medium">{new Date(pedido.created_at).toLocaleString('es-CL')}</p>
                  </div>
                  <div>
                     <p className="text-gray-500 mb-1">Última Actualización</p>
                     <p className="text-gray-900 font-medium">{new Date(pedido.updated_at).toLocaleString('es-CL')}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
