"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoUsuarioPage() {
    const router = useRouter();
    const [currentRole, setCurrentRole] = useState('');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setCurrentRole(data.role);
                // Supervisor solo puede crear usuarios
                if (data.role === 'supervisor') setRole('user');
            }
            setLoading(false);
        };
        loadRole();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, nombre, role }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Error al crear el usuario.');
                return;
            }

            router.push('/dashboard/usuarios');
            router.refresh();
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
                    <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentRole === 'admin'
                            ? 'Puedes crear supervisores y usuarios regulares'
                            : 'Puedes crear usuarios regulares del sistema'}
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
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border"
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Correo electrónico *
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border"
                                        placeholder="usuario@suzuval.cl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-4">
                                Rol y Contraseña
                            </h3>
                            <div className="grid grid-cols-1 gap-5">
                                {/* Selector de rol solo visible para admin */}
                                {currentRole === 'admin' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Rol *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'supervisor', label: 'Supervisor', desc: 'Puede gestionar productos y crear usuarios', icon: '🔑' },
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
                                ) : (
                                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <span className="text-xl">👤</span>
                                        <div>
                                            <p className="text-sm font-medium text-blue-800">Rol: Usuario Regular</p>
                                            <p className="text-xs text-blue-600">Como supervisor, solo puedes crear usuarios regulares</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Contraseña *
                                    </label>
                                    <div className="relative">
                                        <input
                                            required
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border pr-11"
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Confirmar contraseña *
                                    </label>
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border"
                                        placeholder="Repite la contraseña"
                                    />
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
                                {submitting ? 'Creando...' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
