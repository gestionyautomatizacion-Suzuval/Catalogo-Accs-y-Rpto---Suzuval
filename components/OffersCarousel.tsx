"use client";

import { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface OffersCarouselProps {
    productos: any[];
    onAddToCart: (id: string) => void;
}

export default function OffersCarousel({ productos, onAddToCart }: OffersCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [productos]);

    // Autoplay logic
    useEffect(() => {
        if (!productos || productos.length === 0) return;
        const interval = setInterval(() => {
            scroll('right', true);
        }, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [productos]);

    const scroll = (direction: 'left' | 'right', isAuto = false) => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        
        if (direction === 'right') {
            // Check if we reached the end
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                // Infinite loop: go back to the start smoothly
                scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
            }
        } else {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    if (!productos || productos.length === 0) return null;

    return (
        <div className="mb-12 relative w-full overflow-hidden bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center bg-red-500 text-white p-2 rounded-xl shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ofertas Especiales</h2>
                    <p className="text-red-500 font-semibold text-sm">Aprovecha estos increíbles descuentos</p>
                </div>
            </div>

            <div className="relative group">
                {/* Flecha Izquierda */}
                <button
                    onClick={() => scroll('left')}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-[#0033a0] hover:bg-[#0033a0] hover:text-white transition-all transform -translate-x-1/2 md:translate-x-0 ${
                        showLeftArrow ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none'
                    }`}
                    aria-label="Desplazar a la izquierda"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4 pt-2 px-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style jsx>{`
                        .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {productos.map((product) => (
                        <div key={product.id} className="snap-start shrink-0 w-[150px] sm:w-[170px] transition-transform duration-300 hover:-translate-y-1">
                            <ProductCard
                                id={product.id}
                                sku={product.sku}
                                nombre={product.nombre}
                                descripcion={product.descripcion}
                                precio={product.precio}
                                precioOferta={product.precio_oferta}
                                stock={product.stock}
                                categoriaNombre={product.categorias_items?.nombre || 'General'}
                                imagenUrl={product.imagen_url}
                                onAddToCart={onAddToCart}
                                layout="compact"
                            />
                        </div>
                    ))}
                </div>

                {/* Flecha Derecha */}
                <button
                    onClick={() => scroll('right')}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-[#0033a0] hover:bg-[#0033a0] hover:text-white transition-all transform translate-x-1/2 md:-translate-x-0 ${
                        showRightArrow ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none'
                    }`}
                    aria-label="Desplazar a la derecha"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
