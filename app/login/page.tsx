"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Si ya hay sesión activa, redirigir al dashboard
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.push('/dashboard/productos');
        });
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                setError('Email o contraseña incorrectos.');
            } else if (error.message.includes('Email not confirmed')) {
                setError('Por favor confirma tu email antes de ingresar.');
            } else {
                setError('Error al iniciar sesión. Intenta nuevamente.');
            }
            setLoading(false);
        } else {
            router.push('/dashboard/productos');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#001a5c] via-[#0033a0] to-[#0052cc] flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-[#0044cc]/20 blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-[#001a5c]/40 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 border border-white/30 mb-4 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm8 7a1 1 0 01-1 1H8a1 1 0 010-2h4a1 1 0 011 1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">
                            Suzuval <span className="font-light text-blue-200">Admin</span>
                        </h1>
                        <p className="text-blue-200/80 text-sm mt-1">Panel de Gestión del Catálogo</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@suzuval.cl"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-1.5">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all text-sm pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200/60 hover:text-white transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-white text-[#0033a0] font-semibold rounded-xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-sm tracking-wide"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-[#0033a0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Ingresando...
                                </span>
                            ) : 'Ingresar al Panel'}
                        </button>
                    </form>

                    <p className="text-center text-blue-300/50 text-xs mt-6">
                        Acceso exclusivo para personal autorizado Suzuval
                    </p>
                </div>
            </div>
        </div>
    );
}
