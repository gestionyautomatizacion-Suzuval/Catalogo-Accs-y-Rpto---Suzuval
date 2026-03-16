"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserWithRole {
    id: string;
    email: string;
    nombre: string;
    role: string;
    estado?: string;
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
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
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
        const res = await fetch('/api/users/list', { cache: 'no-store' });
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

    const handleDelete = async (user: UserWithRole) => {
        if (!confirm(`¿Estás seguro de eliminar al usuario ${user.email}?\nEsta acción es irreversible.`)) {
            return;
        }

        setDeleteLoading(user.id);
        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== user.id));
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar usuario');
            }
        } catch (error) {
            alert('Error de red al intentar eliminar.');
        } finally {
            setDeleteLoading(null);
        }
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
                                <th className="px-6 py-4 font-semibold">Estado</th>
                                <th className="px-6 py-4 font-semibold">Creado</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
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
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                u.estado === 'suspendido' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                                {u.estado === 'suspendido' ? 'Suspendido' : 'Activo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(u.created_at).toLocaleDateString('es-CL', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Edit Button: Visible for admin, or for supervisor if target is not admin */}
                                                {(currentRole === 'admin' || (currentRole === 'supervisor' && u.role !== 'admin')) && u.id !== currentUserId && (
                                                    <Link
                                                        href={`/dashboard/usuarios/${u.id}/editar`}
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </Link>
                                                )}
                                                
                                                {/* Delete Button: Visible only for admin */}
                                                {currentRole === 'admin' && u.id !== currentUserId && (
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        disabled={deleteLoading === u.id}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Eliminar"
                                                    >
                                                        {deleteLoading === u.id ? (
                                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
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
