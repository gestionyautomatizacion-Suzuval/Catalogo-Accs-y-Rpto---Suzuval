"use client";

import { useEffect, useState } from 'react';
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

export default function NotificationTracker() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Solo admins y supervisores deberían ver esto en el Layout Admin
    // Aquí omitimos la comprobación explícita si este componente solo se renderiza
    // dentro de un Layout protegido por Rol.
    
    // Carga inicial
    const fetchNotificaciones = async () => {
      const { data } = await supabase
        .from('notificaciones_internas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotificaciones(data);
        setUnreadCount(data.filter(n => !n.leida).length);
      }
    };

    fetchNotificaciones();

    // Suscripción Realtime para alertas instantáneas de Supabase
    const subscription = supabase
      .channel('notificaciones_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones_internas' },
        (payload) => {
          const nuevaNotificacion = payload.new as Notificacion;
          setNotificaciones((prev) => [nuevaNotificacion, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
          
          // Opcional: Ejecutar un sonido o toast (si hubiera librería para esto)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const markAsRead = async (id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    await supabase.from('notificaciones_internas').update({ leida: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setUnreadCount(0);
    // Nota: Deberíamos idealmente filtrar solo por los roles asociados al admin actual.
    // Esto es un simplificado didáctico.
    const unreadIds = notificaciones.filter(n => !n.leida).map(n => n.id);
    if(unreadIds.length > 0){
        await supabase.from('notificaciones_internas').update({ leida: true }).in('id', unreadIds);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white rounded-full transition-colors"
      >
        <span className="sr-only">Ver notificaciones</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notificaciones */}
      {isOpen && (
        <div className="absolute right-0 md:left-0 md:right-auto mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-[#0033a0] hover:underline font-medium">
                Marcar leídas
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notificaciones.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No tienes notificaciones recientes.
              </div>
            ) : (
              notificaciones.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-slate-50 transition-colors ${!notif.leida ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      {notif.tipo.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(notif.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug mb-2">
                    {notif.mensaje}
                  </p>
                  <div className="flex justify-between items-center">
                     {notif.referencia_id && (
                        <Link 
                          onClick={() => {
                            if(!notif.leida) markAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          href={`/dashboard/pedidos/${notif.referencia_id}`} 
                          className="text-xs text-[#0033a0] font-medium hover:underline"
                        >
                          Ver Pedido
                        </Link>
                     )}
                     {!notif.leida && (
                        <button 
                          onClick={() => markAsRead(notif.id)} 
                          className="h-2 w-2 rounded-full bg-blue-500 ml-auto"
                          title="Marcar como leída"
                        ></button>
                     )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
