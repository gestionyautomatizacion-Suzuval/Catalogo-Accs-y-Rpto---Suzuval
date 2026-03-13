import Image from 'next/image';

interface ProductCardProps {
    id: string;
    sku: string;
    nombre: string;
    descripcion: string;
    precio: number;
    precioOferta?: number; // Opcional si hay descuento
    stock: number;
    categoriaNombre: string;
    imagenUrl?: string; // Opcional, usará un placeholder si no hay
    onAddToCart: (id: string) => void;
    layout?: 'standard' | 'compact';
}

export default function ProductCard({
    id,
    sku,
    nombre,
    descripcion,
    precio,
    precioOferta,
    stock,
    categoriaNombre,
    imagenUrl,
    onAddToCart,
    layout = 'standard',
}: ProductCardProps) {
    // Formatear precio a CLP (Pesos Chilenos)
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(amount);
    };

    const hasDiscount = precioOferta && precioOferta < precio;
    const currentPrice = hasDiscount ? precioOferta! : precio;

    return (
        <div className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">

            {/* Imagen del Producto */}
            <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center">
                {hasDiscount && (
                    <div className={`absolute top-2 left-2 bg-red-600 text-white uppercase font-bold rounded-sm shadow-md z-10 tracking-widest ${layout === 'compact' ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1.5 top-3 left-3'}`}>
                        OFERTA
                    </div>
                )}
                <div className={`relative w-full h-full cursor-pointer overflow-hidden ${layout === 'compact' ? 'p-2' : 'p-4'}`}>
                    <Image
                        src={imagenUrl || '/placeholder-product.png'} // Asegurarse de tener esta imagen en public/
                        alt={nombre}
                        fill
                        className={`object-contain transition-transform duration-500 group-hover:scale-105 ${layout === 'compact' ? 'p-2' : 'p-4'}`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            </div>

            {/* Contenido / Info */}
            <div className={`flex flex-col flex-grow ${layout === 'compact' ? 'p-3' : 'p-4 md:p-5'}`}>
                {/* Categoría y SKU */}
                <div className="flex justify-between items-center mb-2.5">
                    <span className={`font-bold text-blue-600 uppercase tracking-widest line-clamp-1 pr-2 ${layout === 'compact' ? 'text-[8px]' : 'text-[10px]'}`}>
                        {categoriaNombre}
                    </span>
                    <span className={`text-gray-400 font-medium tracking-wide ${layout === 'compact' ? 'text-[8px]' : 'text-[10px]'}`}>CÓDIGO: {sku}</span>
                </div>

                {/* Título y Descripción */}
                <h3 className={`font-bold text-gray-800 leading-snug line-clamp-2 hover:text-[#0033a0] transition-colors cursor-pointer ${layout === 'compact' ? 'text-xs mb-1' : 'text-[15px] mb-1.5'}`}>
                    {nombre}
                </h3>
                {layout !== 'compact' && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow leading-relaxed">
                        {descripcion}
                    </p>
                )}

                {/* Precios y Stock */}
                <div className={`mt-auto border-t border-gray-50 ${layout === 'compact' ? 'pt-2' : 'pt-4'}`}>
                    <div className="flex items-end justify-between mb-3">
                        <div>
                            {hasDiscount && (
                                <span className={`text-gray-400 line-through block font-medium mb-0.5 ${layout === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                                    {formatPrice(precio)}
                                </span>
                            )}
                            <span className={`font-black text-[#0033a0] tracking-tight ${layout === 'compact' ? 'text-sm' : 'text-lg md:text-xl'}`}>
                                {formatPrice(currentPrice)}
                            </span>
                        </div>

                        <div className={`font-bold rounded-md uppercase tracking-wide flex-shrink-0 ml-2 ${layout === 'compact' ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'} ${stock > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {stock > 0 ? (layout === 'compact' ? stock : `Stock: ${stock}`) : 'Agotado'}
                        </div>
                    </div>

                    {/* Botón Agregar al Carrito */}
                    <button
                        onClick={() => onAddToCart(id)}
                        disabled={stock <= 0}
                        className={`w-full rounded font-bold tracking-wide flex items-center justify-center transition-all duration-300
              ${stock > 0
                                ? 'bg-[#0033a0] hover:bg-blue-800 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            } ${layout === 'compact' ? 'py-1.5 px-2 text-[10px]' : 'py-2.5 px-4 text-sm'}
            `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`${layout === 'compact' ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {stock > 0 ? (layout === 'compact' ? 'Agregar' : 'Agregar al Carrito') : 'Sin Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
}
