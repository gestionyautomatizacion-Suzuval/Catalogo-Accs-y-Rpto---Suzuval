"use client";

import { useState } from 'react';
import Image from 'next/image';

interface ProductModalProps {
    producto: any;
    onClose: () => void;
    onAddToCart: (id: string) => void;
}

export default function ProductModal({ producto, onClose, onAddToCart }: ProductModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [failedImages, setFailedImages] = useState<number[]>([]);

    // Obtener la imagen principal y las secundarias
    // Asumimos que la imagen principal viene en imagen_url y las extras en productos_imagenes
    const primaryImage = producto.imagen_url || '/placeholder-product.png';
    const secondaryImages = producto.productos_imagenes?.map((img: any) => img.url) || [];
    
    // Todas las imágenes (principal primero, luego las secundarias si no está duplicada)
    const allImages = [primaryImage, ...secondaryImages.filter((url: string) => url !== primaryImage)];

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    };

    const hasDiscount = producto.precio_oferta && producto.precio_oferta < producto.precio;
    const currentPrice = hasDiscount ? producto.precio_oferta! : producto.precio;

    // Extraer marcas y familias de las compatibilidades
    const marcas = Array.from(new Set(producto.compatibilidad?.map((c: any) => c.modelos?.familias?.marcas?.nombre).filter(Boolean))) as string[];
    const familias = Array.from(new Set(producto.compatibilidad?.map((c: any) => c.modelos?.familias?.nombre).filter(Boolean))) as string[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}>
            {/* Modal Container */}
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Botón Cerrar */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Left Side: Images */}
                <div className="w-full md:w-1/2 p-6 flex flex-col bg-gray-50 rounded-l-2xl">
                    <div className="relative w-full aspect-square bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {hasDiscount && (
                            <div className="absolute top-3 left-3 bg-red-600 text-white uppercase font-bold rounded-sm shadow-md z-10 tracking-widest text-[10px] px-2 py-1.5">
                                OFERTA
                            </div>
                        )}
                        <Image
                            src={failedImages.includes(currentImageIndex) ? '/placeholder-product.png' : allImages[currentImageIndex]}
                            alt={producto.nombre}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            onError={() => setFailedImages(prev => [...prev, currentImageIndex])}
                        />
                    </div>
                    
                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {allImages.map((img: string, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`relative w-20 h-20 shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                                        currentImageIndex === index ? 'border-[#0033a0] shadow-md' : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <Image
                                        src={failedImages.includes(index) ? '/placeholder-product.png' : img}
                                        alt={`Miniatura ${index + 1}`}
                                        fill
                                        className="object-contain bg-white pb-1 pt-1"
                                        onError={() => setFailedImages(prev => [...prev, index])}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Details */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col pt-8 md:pt-8">
                    <div className="flex justify-between items-start mb-2 mr-8">
                        <span className="font-bold text-blue-600 uppercase tracking-widest text-xs">
                            {producto.categorias_items?.nombre || 'General'}
                        </span>
                        <span className="text-gray-400 font-medium tracking-wide text-xs">SKU: {producto.sku}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                        {producto.nombre}
                    </h2>

                    {/* Precio y Stock */}
                    <div className="flex items-end justify-between mb-6 pb-4 border-b border-gray-100">
                        <div>
                            {hasDiscount && (
                                <span className="text-gray-400 line-through block font-medium text-sm mb-1">
                                    {formatPrice(producto.precio)}
                                </span>
                            )}
                            <span className="font-black text-[#0033a0] tracking-tight text-3xl">
                                {formatPrice(currentPrice)}
                            </span>
                        </div>
                        <div className={`font-bold rounded-md uppercase tracking-wide px-3 py-1.5 text-xs ${producto.stock > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {producto.stock > 0 ? `Stock: ${producto.stock} uds` : 'Agotado'}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="mb-6 flex-grow">
                        <h3 className="font-bold text-gray-800 text-sm mb-2 uppercase tracking-wide">Descripción</h3>
                        <div className="text-sm text-gray-600 leading-relaxed max-w-none whitespace-pre-line">
                            {producto.descripcion ? producto.descripcion : "No hay descripción disponible para este producto."}
                        </div>
                    </div>

                    {/* Compatibilidad */}
                    {(marcas.length > 0 || familias.length > 0) && (
                        <div className="mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <h3 className="font-bold text-[#0033a0] text-sm mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                Compatibilidad
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                {marcas.length > 0 && (
                                    <div>
                                        <span className="block font-medium text-gray-500 mb-1">Marca:</span>
                                        <span className="font-semibold">{marcas.join(', ')}</span>
                                    </div>
                                )}
                                {familias.length > 0 && (
                                    <div>
                                        <span className="block font-medium text-gray-500 mb-1">Modelos:</span>
                                        <span className="font-semibold">{familias.join(', ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Botón Agregar al Carrito */}
                    <div className="mt-auto">
                        <button
                            onClick={() => {
                                onAddToCart(producto.id);
                                onClose(); // Opcional: cerrar el modal al agregar, o mostrar notificación
                            }}
                            disabled={producto.stock <= 0}
                            className={`w-full rounded-xl font-bold tracking-widest uppercase flex items-center justify-center transition-all duration-300 py-4 text-sm shadow-md hover:shadow-lg
              ${producto.stock > 0
                                    ? 'bg-[#0033a0] hover:bg-blue-800 text-white hover:-translate-y-1'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock Disponible'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
