"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import NotificationTracker from '@/components/NotificationTracker';

const NAV_ITEMS = [
    {
        href: '/dashboard/productos',
        label: 'Gestión de Productos',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm8 7a1 1 0 01-1 1H8a1 1 0 010-2h4a1 1 0 011 1z" clipRule="evenodd" />
            </svg>
        ),
    },
    {
        href: '/dashboard/pedidos',
        label: 'Gestión de Pedidos',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
        ),
    },
    {
        href: '/dashboard/usuarios',
        label: 'Gestión de Usuarios',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
        ),
    },
    {
        href: '/dashboard/auditoria',
        label: 'Auditoría e Historial',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
        ),
    },
];

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    user: 'Usuario',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    supervisor: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
    user: 'bg-green-400/20 text-green-200 border-green-400/30',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string>('');
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setUser(user);

            const { data } = await supabase
                .from('user_roles')
                .select('role, estado')
                .eq('user_id', user.id)
                .single();
            
            if (data) {
                if (data.estado === 'suspendido') {
                    await supabase.auth.signOut();
                    router.push('/login?error=suspendido');
                    return;
                }
                
                setRole(data.role);
                if (data.role === 'user') {
                    router.push('/');
                    return;
                }
            } else {
                router.push('/');
            }
        };
        loadUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const displayName = user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario';

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30
                w-64 bg-[#001a5c] text-white flex flex-col
                transform transition-transform duration-200 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-4 border-b border-white/10 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold tracking-wider">
                            Suzuval <span className="font-light text-blue-300">Admin</span>
                        </h2>
                        <p className="text-blue-400/70 text-xs mt-0.5">Panel de Gestión</p>
                    </div>
                    {/* Renderizamos el tracker que solo los supervisores verán en su layout */}
                    <NotificationTracker />
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-2 space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-white/15 text-white shadow-sm'
                                        : 'text-blue-200 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 py-2">
                    <Link
                        href="/"
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-blue-300/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                        </svg>
                        <span>Ver Catálogo Público</span>
                    </Link>
                </div>

                {/* User info + Logout */}
                <div className="p-3 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{displayName}</p>
                            <p className="text-blue-300/60 text-xs truncate">{user?.email}</p>
                        </div>
                    </div>
                    {role && (
                        <span className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold mb-2 ${ROLE_COLORS[role] || ROLE_COLORS.user}`}>
                            {ROLE_LABELS[role] || role}
                        </span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all border border-transparent hover:border-red-500/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 100-2H4V5h5a1 1 0 100-2H3zm13.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 11H10a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile topbar */}
                <header className="md:hidden bg-[#001a5c] text-white px-4 py-3 flex items-center justify-between shadow-md">
                    <h2 className="text-lg font-bold tracking-wider">
                        Suzuval <span className="font-light text-blue-300">Admin</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <NotificationTracker />
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
