"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserWithRole {
    id: string;
    email: string;
    nombre: string;
    role: string;
    created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    user: 'Usuario',
};

const ROLE_STYLES: Record<string, string> = {
    admin: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    supervisor: 'bg-blue-50 text-blue-700 border-blue-200',
    user: 'bg-green-50 text-green-700 border-green-200',
};

export default function UsuariosPage() {
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentRole, setCurrentRole] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        // Obtener mi rol
        const { data: myRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (myRole) setCurrentRole(myRole.role);

        // Obtener usuarios via API (el servidor hace la consulta con service_role)
        const res = await fetch('/api/users/list');
        if (res.ok) {
            const data = await res.json();
            // Filtrar: supervisor no ve admins ni otros supervisors
            const filtered = myRole?.role === 'admin'
                ? data.users
                : data.users.filter((u: UserWithRole) => u.role === 'user');
            setUsers(filtered);
        }

        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentRole === 'admin'
                            ? 'Administra supervisores y usuarios del sistema'
                            : 'Administra los usuarios del sistema'}
                    </p>
                </div>
                <Link
                    href="/dashboard/usuarios/nuevo"
                    className="bg-[#0033a0] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Crear Usuario
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Usuario</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Rol</th>
                                <th className="px-6 py-4 font-semibold">Creado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No hay usuarios registrados.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className={`bg-white border-b hover:bg-gray-50 ${u.id === currentUserId ? 'bg-blue-50/40' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#0033a0]/10 flex items-center justify-center text-[#0033a0] font-semibold text-sm">
                                                    {(u.nombre || u.email).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {u.nombre || '—'}
                                                    {u.id === currentUserId && (
                                                        <span className="ml-2 text-xs text-blue-500 font-normal">(tú)</span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLES[u.role] || ROLE_STYLES.user}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(u.created_at).toLocaleDateString('es-CL', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
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
