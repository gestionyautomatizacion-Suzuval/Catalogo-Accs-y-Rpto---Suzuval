import ProductForm from "@/components/dashboard/ProductForm";
import Link from "next/link";
import { use } from "react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
                    <p className="text-sm text-gray-500 mt-1">Actualiza los detalles y la compatibilidad del producto</p>
                </div>
                <Link
                    href="/dashboard/productos"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2"
                >
                    Volver al Catálogo
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <ProductForm productId={id} />
                </div>
            </div>
        </div>
    );
}
