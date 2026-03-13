"use client";

import ProductCard from '@/components/ProductCard';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/providers/CartProvider';
import NavBar from '@/components/NavBar';

export default function Home() {
  const { addToCart } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{ categories: string[]; brands: string[] }>({
    categories: [],
    brands: []
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('productos')
        .select(`
          id,
          sku,
          nombre,
          descripcion,
          precio,
          precio_oferta,
          stock,
          imagen_url,
          categoria_item_id,
          categorias_items (nombre),
          compatibilidad (
            modelo_id,
            modelos (
              familia_id,
              familias (marca_id)
            )
          )
        `);

      // Aplicar búsqueda por SKU o Nombre
      if (searchQuery) {
        query = query.or(`sku.ilike.%${searchQuery}%,nombre.ilike.%${searchQuery}%`);
      }

      // Aplicar filtro de categorías
      if (activeFilters.categories.length > 0) {
        query = query.in('categoria_item_id', activeFilters.categories);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let filteredData = data || [];

      // Aplicar filtro de marcas (esto requiere filtrar en cliente o un join más complejo en Supabase)
      // Dado que la relación producto -> compatibilidad -> modelos -> familias -> marcas es multinivel,
      // la forma más limpia de hacerlo sin complicar el RLS es filtrar el resultado.
      if (activeFilters.brands.length > 0) {
        filteredData = filteredData.filter(producto => {
          const productBrands = producto.compatibilidad?.map((c: any) => 
            c.modelos?.familias?.marca_id
          ) || [];
          return activeFilters.brands.some(brandId => productBrands.includes(brandId));
        });
      }

      setProductos(filteredData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilters]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleAddToCart = async (id: string) => {
    if (!isAuthenticated) {
      alert("Debes iniciar sesión para agregar productos al carrito.");
      return;
    }
    await addToCart(id, 1);
  };

  const handleFilterChange = useCallback((filters: { categories: string[]; brands: string[] }) => {
    setActiveFilters(filters);
  }, []);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <NavBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} showSearch={true} />

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar de Filtros */}
          <Sidebar onFilterChange={handleFilterChange} />

          {/* Listado de Productos */}
          <div className="flex-1 min-w-0">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo de Repuestos y Accesorios'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {productos.length} {productos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-40">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-gray-100 border-t-[#0033a0] animate-spin"></div>
                </div>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="bg-gray-50 p-4 rounded-full mb-4 text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No encontramos lo que buscas</h3>
                <p className="text-gray-500 mt-1">Intenta ajustando los filtros o el término de búsqueda.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setActiveFilters({categories:[], brands:[]})}}
                  className="mt-6 text-[#0033a0] font-medium hover:underline"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {productos.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    sku={product.sku}
                    nombre={product.nombre}
                    descripcion={product.descripcion}
                    precio={product.precio}
                    precioOferta={product.precio_oferta}
                    stock={product.stock}
                    categoriaNombre={product.categorias_items?.nombre || 'General'}
                    imagenUrl={product.imagen_url}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
