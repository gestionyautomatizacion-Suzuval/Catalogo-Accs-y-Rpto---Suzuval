"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

interface Pedido {
  id: string;
  estado: string;
  total_calculado: number;
  created_at: string;
  items_count: number;
}

const ESTADOS_MAP: Record<string, { label: string, color: string, step: number }> = {
  'pendiente_revision': { label: 'Pendiente de Revisión', color: 'bg-yellow-100 text-yellow-800', step: 1 },
  'en_preparacion': { label: 'En Preparación', color: 'bg-blue-100 text-blue-800', step: 2 },
  'enviado': { label: 'Enviado', color: 'bg-purple-100 text-purple-800', step: 3 },
  'entregado': { label: 'Entregado', color: 'bg-green-100 text-green-800', step: 4 },
  'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800', step: 0 }
};

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Traer todos los pedidos que NO sean borrador o guardado
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, estado, total_calculado, created_at, pedido_items(count)')
      .eq('user_id', user.id)
      .neq('estado', 'borrador')
      .neq('estado', 'guardado')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted = data.map(d => ({
        id: d.id,
        estado: d.estado,
        total_calculado: d.total_calculado,
        created_at: d.created_at,
        items_count: d.pedido_items[0].count
      }));
      setPedidos(formatted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  if (loading) {
    return (
      <>
      <NavBar />
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033a0]"></div>
      </div>
      </>
    );
  }

  return (
    <>
    <NavBar />
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Mis Pedidos</h1>

        {pedidos.length === 0 ? (
           <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes pedidos en curso</h3>
             <p className="text-gray-500 mb-6">Parece que aún no has finalizado ninguna compra.</p>
             <Link href="/" className="inline-flex items-center text-[#0033a0] font-medium hover:underline">
               Explorar el catálogo
             </Link>
           </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map(pedido => {
              const infoEstado = ESTADOS_MAP[pedido.estado] || { label: pedido.estado, color: 'bg-gray-100 text-gray-800', step: 0 };
              
              return (
                <div key={pedido.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Número de Orden</p>
                      <p className="font-bold text-gray-900">#{pedido.id.substring(0,8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha Ingreso</p>
                      <p className="font-medium text-gray-900">{new Date(pedido.created_at).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Pagado</p>
                      <p className="font-bold text-gray-900">${pedido.total_calculado.toLocaleString('es-CL')}</p>
                    </div>
                    <div>
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${infoEstado.color}`}>
                          {infoEstado.label}
                       </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {/* Timeline Visual (solo si no está cancelado) */}
                    {pedido.estado !== 'cancelado' && (
                      <div className="relative mb-4">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                          <div style={{ width: `${(infoEstado.step / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#0033a0] transition-all duration-500"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
                          <span className={infoEstado.step >= 1 ? 'text-[#0033a0] font-bold' : ''}>Revisión</span>
                          <span className={infoEstado.step >= 2 ? 'text-[#0033a0] font-bold' : ''}>Preparación</span>
                          <span className={infoEstado.step >= 3 ? 'text-[#0033a0] font-bold' : ''}>Enviado</span>
                          <span className={infoEstado.step >= 4 ? 'text-[#0033a0] font-bold' : ''}>Entregado</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 text-sm text-gray-600 flex justify-between items-center border-t border-gray-100 pt-4">
                      <span>Este pedido contiene {pedido.items_count} producto(s) integrados.</span>
                      <button className="text-[#0033a0] font-medium hover:underline text-sm">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
