"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: userId } = use(params);
    
    const [currentRole, setCurrentRole] = useState('');
    const [nombre, setNombre] = useState('');
    const [role, setRole] = useState('user');
    const [estado, setEstado] = useState('activo');
    const [email, setEmail] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (roleData) {
                setCurrentRole(roleData.role);
            }

            // Cargar datos del usuario a editar
            try {
                const res = await fetch('/api/users/list');
                if (res.ok) {
                    const data = await res.json();
                    const targetUser = data.users.find((u: any) => u.id === userId);
                    if (targetUser) {
                        setNombre(targetUser.nombre || '');
                        setEmail(targetUser.email || '');
                        setRole(targetUser.role || 'user');
                        setEstado(targetUser.estado || 'activo');
                    } else {
                        setError('Usuario no encontrado o sin permisos para verlo.');
                    }
                }
            } catch (err) {
                 setError('Error al cargar datos del usuario.');
            }

            setLoading(false);
        };
        loadData();
    }, [router, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setSubmitting(true);
        
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, role, estado }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Error al actualizar el usuario.');
                return;
            }

            setSuccessMessage('Usuario actualizado exitosamente.');
            setTimeout(() => {
                router.push('/dashboard/usuarios');
                router.refresh();
            }, 1000);
        } catch {
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Cargando...
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center space-x-4">
                <Link href="/dashboard/usuarios" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Modificando a: <span className="font-medium text-gray-700">{email}</span>
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-4">
                                Información del Usuario
                            </h3>
                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nombre completo *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-4">
                                Configuración de Permisos y Acceso
                            </h3>
                            <div className="grid grid-cols-1 gap-5">
                                {currentRole === 'admin' && role !== 'admin' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Rol *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'supervisor', label: 'Supervisor', desc: 'Gestiona productos y usuarios', icon: '🔑' },
                                                { value: 'user', label: 'Usuario', desc: 'Acceso básico al catálogo', icon: '👤' },
                                            ].map((opt) => (
                                                <label
                                                    key={opt.value}
                                                    className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        role === opt.value
                                                            ? 'border-[#0033a0] bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={opt.value}
                                                        checked={role === opt.value}
                                                        onChange={() => setRole(opt.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-xl mb-1">{opt.icon}</span>
                                                    <span className={`font-semibold text-sm ${role === opt.value ? 'text-[#0033a0]' : 'text-gray-800'}`}>
                                                        {opt.label}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Estado del Usuario *
                                    </label>
                                    <select
                                        value={estado}
                                        onChange={(e) => setEstado(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border text-gray-900 bg-white"
                                    >
                                        <option value="activo">Activo (Permitir acceso)</option>
                                        <option value="suspendido">Suspendido (Bloquear acceso)</option>
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Los usuarios suspendidos no podrán iniciar sesión, pero mantendrán su historial en la base de datos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-green-700 text-sm">{successMessage}</p>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100 flex justify-end gap-3">
                            <Link
                                href="/dashboard/usuarios"
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2.5 bg-[#0033a0] text-white rounded-lg text-sm font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
