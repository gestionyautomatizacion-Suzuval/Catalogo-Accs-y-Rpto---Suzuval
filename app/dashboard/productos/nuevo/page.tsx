import ProductForm from '@/components/dashboard/ProductForm';
import Link from 'next/link';

export default function NuevoProductoPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center space-x-4">
                <Link href="/dashboard/productos" className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registrar Nuevo Producto</h1>
                    <p className="text-sm text-gray-500 mt-1">Completa los datos del accesorio y su compatibilidad</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <ProductForm />
                </div>
            </div>
        </div>
    );
}
