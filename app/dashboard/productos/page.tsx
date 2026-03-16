"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ProductosPage() {
    const [productos, setProductos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [carouselActive, setCarouselActive] = useState(false);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        fetchProductos();
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'offers_carousel_active')
                .single();
            if (data && !error) setCarouselActive(data.value);
        } catch (e) {
            console.error('Error fetching settings:', e);
        }
    };

    const handleToggleCarousel = async () => {
        setToggling(true);
        const newState = !carouselActive;
        // Optimistic UI update
        setCarouselActive(newState); 

        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({ key: 'offers_carousel_active', value: newState });
            
            if (error) {
                // Revert on error
                setCarouselActive(!newState);
                throw error;
            }
        } catch (error) {
            console.error('Error toggling carousel:', error);
            alert('Error al cambiar la configuración. Intenta nuevamente.');
        } finally {
            setToggling(false);
        }
    };

    const fetchProductos = async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    id,
                    sku,
                    nombre,
                    precio,
                    precio_oferta,
                    stock,
                    created_by_name,
                    categorias_items (nombre),
                    compatibilidad (
                        modelos (
                            nombre_especifico,
                            familias (
                                nombre,
                                marcas (nombre)
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
                    <p className="text-sm text-gray-500 mt-1">Administra el catálogo completo, marcas y compatibilidades</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm w-full sm:w-auto">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">Carrusel de Ofertas</span>
                            <span className="text-xs text-gray-500">{carouselActive ? 'Visible al público' : 'Oculto'}</span>
                        </div>
                        <button
                            type="button"
                            disabled={toggling}
                            onClick={handleToggleCarousel}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0033a0] focus:ring-offset-2 ${
                                carouselActive ? 'bg-[#0033a0]' : 'bg-gray-200'
                            } ${toggling ? 'opacity-50 cursor-wait' : ''}`}
                            role="switch"
                            aria-checked={carouselActive}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    carouselActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    <Link
                        href="/dashboard/productos/nuevo"
                        className="bg-[#0033a0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 group w-full sm:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Nuevo Producto
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 backdrop-blur-sm border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold">CÓDIGO / SKU</th>
                                <th scope="col" className="px-6 py-4 font-bold">Producto</th>
                                <th scope="col" className="px-6 py-4 font-bold">Categoría</th>
                                <th scope="col" className="px-6 py-4 font-bold">Marca / Familia</th>
                                <th scope="col" className="px-6 py-4 font-bold">Precio</th>
                                <th scope="col" className="px-6 py-4 font-bold text-center">Stock</th>
                                <th scope="col" className="px-6 py-4 font-bold">Subido Por</th>
                                <th scope="col" className="px-6 py-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : productos.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        No hay productos registrados en el catálogo.
                                    </td>
                                </tr>
                            ) : (
                                productos.map((producto) => {
                                    // Extraer marcas y familias únicas de las compatibilidades
                                    const marcas = Array.from(new Set(producto.compatibilidad?.map((c: any) => c.modelos?.familias?.marcas?.nombre).filter(Boolean))) as string[];
                                    const familias = Array.from(new Set(producto.compatibilidad?.map((c: any) => c.modelos?.familias?.nombre).filter(Boolean))) as string[];

                                    return (
                                        <tr key={producto.id} className="bg-white hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-[#0033a0] bg-blue-50 px-2 py-1 rounded">
                                                    {producto.sku}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 line-clamp-1">{producto.nombre}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                    {producto.categorias_items?.nombre || 'General'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                                                        {marcas.length > 0 ? marcas.join(', ') : 'Multi-marca'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-medium italic">
                                                        {familias.length > 0 ? familias.join(', ') : 'General'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${producto.precio_oferta ? 'text-xs text-gray-400 line-through' : 'text-gray-900 font-bold'}`}>
                                                        ${Math.round(producto.precio).toLocaleString('es-CL')}
                                                    </span>
                                                    {producto.precio_oferta && (
                                                        <span className="text-sm font-black text-red-600">
                                                            ${Math.round(producto.precio_oferta).toLocaleString('es-CL')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg text-xs font-bold border ${
                                                    producto.stock > 10 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : producto.stock > 0 
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {producto.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] shrink-0">
                                                        {(producto.created_by_name || 'S').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600 line-clamp-1 max-w-[120px]" title={producto.created_by_name || 'Sistema Base'}>
                                                        {producto.created_by_name || 'Sistema Base'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link 
                                                    href={`/dashboard/productos/${producto.id}`} 
                                                    className="inline-flex items-center gap-1.5 font-bold text-[#0033a0] hover:text-blue-800 transition-colors p-2 hover:bg-blue-100/50 rounded-lg group-hover:translate-x-[-4px] transition-transform"
                                                >
                                                    Editar
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
