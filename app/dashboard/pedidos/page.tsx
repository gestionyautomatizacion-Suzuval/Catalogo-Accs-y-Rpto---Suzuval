"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Pedido {
  id: string;
  user_id: string;
  estado: string;
  total_calculado: number;
  created_at: string;
  auth_users?: { email: string };
}

const ESTADOS_MAP: Record<string, { label: string, badge: string }> = {
  borrador: { label: 'Borrador', badge: 'bg-gray-100 text-gray-800' },
  guardado: { label: 'Guardado', badge: 'bg-gray-100 text-gray-800' },
  pendiente_revision: { label: 'Pendiente de Revisión', badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  en_preparacion: { label: 'En Preparación', badge: 'bg-blue-100 text-blue-800 border border-blue-200' },
  enviado: { label: 'Enviado', badge: 'bg-purple-100 text-purple-800 border border-purple-200' },
  entregado: { label: 'Entregado', badge: 'bg-green-100 text-green-800 border border-green-200' },
  cancelado: { label: 'Cancelado', badge: 'bg-red-100 text-red-800 border border-red-200' }
};

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos_activos'); // 'todos_activos', 'historial', 'todos'

  const fetchPedidos = async () => {
    setLoading(true);
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        user_id,
        estado,
        total_calculado,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (filterEstado === 'todos_activos') {
      query = query.in('estado', ['pendiente_revision', 'en_preparacion', 'enviado']);
    } else if (filterEstado === 'historial') {
      query = query.in('estado', ['entregado', 'cancelado']);
    }
    // Si es 'todos', no filtramos por estado (trae borradores también).

    const { data, error } = await query;

    if (!error && data) {
        // En supabase si queremos hacer join con auth.users, la mejor práctica en el cliente es usar una función RPC 
        // o mapear los emails luego usando una tabla "perfiles_publicos", pero asumiremos que el UUID es útil 
        // por ahora o mostraremos solo la parte abreviada, para evitar sobre-ingeniería en RLS de auth.users
        
         setPedidos(data as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();

    const subs = supabase.channel('pedidos_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
         fetchPedidos();
      }).subscribe();
      
    return () => { supabase.removeChannel(subs) };
  }, [filterEstado]);

  const filteredPedidos = pedidos.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Buscar por ID de pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0033a0] focus:border-transparent outline-none text-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
             <button
                onClick={() => setFilterEstado('todos_activos')}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${filterEstado === 'todos_activos' ? 'bg-[#0033a0] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
             >
                Activos / Pendientes
             </button>
             <button
                onClick={() => setFilterEstado('historial')}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${filterEstado === 'historial' ? 'bg-[#0033a0] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
             >
                Historial (Finalizados)
             </button>
             <button
                onClick={() => setFilterEstado('todos')}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${filterEstado === 'todos' ? 'bg-[#0033a0] text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
             >
                Todos
             </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ID Pedido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033a0]"></div>
                  </td>
                </tr>
              ) : filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron pedidos con estos filtros.
                  </td>
                </tr>
              ) : (
                filteredPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#0033a0]">#{pedido.id.substring(0,8).toUpperCase()}</div>
                      <div className="text-xs text-gray-500 font-mono" title={pedido.user_id}>Cliente: {pedido.user_id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(pedido.created_at).toLocaleString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute:'2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${pedido.total_calculado.toLocaleString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ESTADOS_MAP[pedido.estado]?.badge || 'bg-gray-100'}`}>
                        {ESTADOS_MAP[pedido.estado]?.label || pedido.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/dashboard/pedidos/${pedido.id}`}
                        className="text-[#0033a0] hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                      >
                        Administrar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
