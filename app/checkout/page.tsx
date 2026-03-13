"use client";

import { useState } from 'react';
import { useCart } from '@/components/providers/CartProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

export default function CheckoutPage() {
  const { pedidoId, items, total, loading, clearCart, refreshCart } = useCart();
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMess, setErrorMess] = useState('');
  const router = useRouter();

  if (loading) {
    return (
      <>
      <NavBar />
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0033a0]"></div>
      </div>
      </>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <>
      <NavBar />
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">No tienes ningún producto en proceso. Explora nuestro catálogo y agrega lo que necesites.</p>
        <Link href="/" className="bg-[#0033a0] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors">
          Volver al Catálogo
        </Link>
      </div>
      </>
    );
  }

  if (success) {
    return (
      <>
      <NavBar />
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Registrado!</h1>
          <p className="text-gray-600 mb-6 font-medium">Id: #{pedidoId?.substring(0,8)}</p>
          <p className="text-gray-500 mb-8">
            Tu pedido ha pasado a estado <strong>Pendiente de Revisión</strong>. Hemos notificado al supervisor y enviado un correo con los detalles a tu bandeja de entrada.
          </p>
          <div className="space-y-3">
            <Link href="/mis-pedidos" className="block w-full bg-[#0033a0] text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-md">
              Hacer seguimiento de mi pedido
            </Link>
            <Link href="/" className="block w-full bg-gray-50 text-gray-700 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
      </>
    );
  }

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setErrorMess('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId,
          notas
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar la solicitud.');
      }

      // Vaciamos el estado local del carrito (pero no la DB porque ya migró a pendiente)
      setSuccess(true);
      refreshCart(); // Esto lo dejará en null o cargará el nuevo borrador vacío si creamos uno nuevo luego
    } catch (err: any) {
      setErrorMess(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <NavBar />
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-[#0033a0] mb-8 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Seguir Comprando
        </Link>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">Finalizar Compra</h1>

        {errorMess && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMess}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg sm:rounded-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
          
          {/* Columna Izquierda: Formulario y Notas */}
          <div className="p-8 md:w-1/2 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Detalles de Entrega</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                    Notas o Instrucciones para el Supervisor
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="notas"
                      name="notas"
                      rows={4}
                      className="shadow-sm focus:ring-[#0033a0] focus:border-[#0033a0] block w-full sm:text-sm border-gray-300 rounded-md p-3"
                      placeholder="Ej. Entregar en sucursal Viña del Mar, incluir mangueras adicionales..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Transacción Segura. El pago se coordinará internamente.
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-[#0033a0] hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>

          {/* Columna Derecha: Resumen */}
          <div className="bg-gray-50 p-8 md:w-1/2 border-l border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen de la Orden</h2>
            
            <div className="flow-root mb-6">
              <ul role="list" className="-my-6 divide-y divide-gray-200 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <li key={item.id_item} className="py-6 flex">
                    <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden bg-white">
                      <img
                        src={item.producto_imagen || '/placeholder-product.png'}
                        alt={item.producto_nombre}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>

                    <div className="ml-4 flex-1 flex flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3 className="line-clamp-2 pr-4">{item.producto_nombre}</h3>
                          <p className="ml-4 tabular-nums w-24 text-right">${(item.precio_unitario * item.cantidad).toLocaleString('es-CL')}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">SKU: {item.producto_sku}</p>
                      </div>
                      <div className="flex-1 flex items-end justify-between text-sm">
                        <p className="text-gray-500 bg-gray-200 px-2 py-1 rounded">Cant: {item.cantidad}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between text-base text-gray-500">
                <p>Subtotal antes de impuestos</p>
                <p className="font-medium text-gray-900">${total.toLocaleString('es-CL')}</p>
              </div>
              <div className="flex justify-between text-base text-gray-500">
                <p>Costo de Envío</p>
                <p className="font-medium text-gray-900">Por calcular</p>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                <p>Total a Verificar</p>
                <p>${total.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
