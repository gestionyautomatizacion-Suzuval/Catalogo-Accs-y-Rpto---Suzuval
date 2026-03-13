"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  referencia_id: string;
}

export default function AuditoriaHistoricaPage() {
  const [logs, setLogs] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notificaciones_internas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
        setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const subs = supabase.channel('auditoria_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones_internas' }, () => {
         fetchLogs();
      }).subscribe();
      
    return () => { supabase.removeChannel(subs) };
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Panel de Auditoría Histórica</h1>
           <p className="text-gray-500 text-sm mt-1">Registro de transiciones de pedidos y notificaciones del sistema.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#001a5c]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Tipo de Evento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Referencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center border-l-4 border-[#0033a0]">
                    <div className="flex items-center justify-center gap-3 text-blue-800 font-medium">
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                       Cargando registros...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-medium text-gray-900">
                            {new Date(log.created_at).toLocaleDateString('es-CL')}
                         </div>
                         <div className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleTimeString('es-CL')}
                         </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wide">
                            {log.tipo.replace('_', ' ')}
                         </span>
                     </td>
                     <td className="px-6 py-4">
                         <div className="text-sm text-gray-900">{log.mensaje}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {log.referencia_id ? (
                           <Link 
                              href={`/dashboard/pedidos/${log.referencia_id}`}
                              className="inline-flex items-center gap-1 text-[#0033a0] hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition-colors group"
                           >
                              <span>Ver Pedido</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                           </Link>
                        ) : (
                           <span className="text-gray-400 italic text-xs">Sin referencia</span>
                        )}
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
