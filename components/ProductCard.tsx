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
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1.5 rounded-sm shadow-md z-10 tracking-widest">
                        OFERTA
                    </div>
                )}
                <div className="relative w-full h-full cursor-pointer overflow-hidden p-4">
                    <Image
                        src={imagenUrl || '/placeholder-product.png'} // Asegurarse de tener esta imagen en public/
                        alt={nombre}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105 p-4"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            </div>

            {/* Contenido / Info */}
            <div className="flex flex-col flex-grow p-4 md:p-5">
                {/* Categoría y SKU */}
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest line-clamp-1 pr-2">
                        {categoriaNombre}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium tracking-wide">CÓDIGO: {sku}</span>
                </div>

                {/* Título y Descripción */}
                <h3 className="text-[15px] font-bold text-gray-800 leading-snug mb-1.5 line-clamp-2 hover:text-[#0033a0] transition-colors cursor-pointer">
                    {nombre}
                </h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-grow leading-relaxed">
                    {descripcion}
                </p>

                {/* Precios y Stock */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through block font-medium mb-0.5">
                                    {formatPrice(precio)}
                                </span>
                            )}
                            <span className="text-lg md:text-xl font-black text-[#0033a0] tracking-tight"> {/* Azul Suzuval aproximado */}
                                {formatPrice(currentPrice)}
                            </span>
                        </div>

                        <div className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${stock > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {stock > 0 ? `Stock: ${stock}` : 'Agotado'}
                        </div>
                    </div>

                    {/* Botón Agregar al Carrito */}
                    <button
                        onClick={() => onAddToCart(id)}
                        disabled={stock <= 0}
                        className={`w-full py-2.5 px-4 rounded text-sm font-bold tracking-wide flex items-center justify-center transition-all duration-300
              ${stock > 0
                                ? 'bg-[#0033a0] hover:bg-blue-800 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
            `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
}
