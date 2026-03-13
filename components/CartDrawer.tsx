"use client";

import { useCart } from './providers/CartProvider';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { items, cartCount, total, isOpen, setIsOpen, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Background */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#0033a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Tu Carrito ({cartCount})
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033a0]"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-lg">Tu carrito está vacío</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[#0033a0] hover:underline font-medium"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id_item} className="flex gap-4 border-b border-gray-100 pb-4">
                  <div className="h-20 w-20 relative flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                    <Image
                      src={item.producto_imagen || '/placeholder-product.png'}
                      alt={item.producto_nombre}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.producto_nombre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">SKU: {item.producto_sku}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button 
                          onClick={() => updateQuantity(item.id_item, item.cantidad - 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        >-</button>
                        <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 bg-gray-50">
                          {item.cantidad}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id_item, item.cantidad + 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        >+</button>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900">
                          ${(item.precio_unitario * item.cantidad).toLocaleString('es-CL')}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.id_item)}
                          className="text-xs text-red-500 hover:underline mt-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
              <span>Subtotal</span>
              <span>${total.toLocaleString('es-CL')}</span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Impuestos y costos de envío calculados en el checkout.
            </p>
            <button 
              onClick={() => {
                setIsOpen(false);
                router.push('/checkout');
              }}
              className="w-full bg-[#0033a0] hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex justify-center items-center gap-2"
            >
              Ir al Checkout
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold py-3 px-4 rounded-lg shadow-sm transition-colors flex justify-center items-center gap-2"
            >
              Seguir Comprando
            </button>
            <button 
              onClick={clearCart}
              className="w-full text-sm text-gray-500 hover:text-red-500 transition-colors pt-2"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
