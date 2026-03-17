"use client";

import ProductCard from '@/components/ProductCard';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/providers/CartProvider';
import NavBar from '@/components/NavBar';
import OffersCarousel from '@/components/OffersCarousel';
import ProductModal from '@/components/ProductModal';

export default function Home() {
  const { addToCart } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCarousel, setShowCarousel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ categories: string[]; brands: string[]; families: string[] }>({
    categories: [],
    brands: [],
    families: []
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'offers_carousel_active')
        .single();
      if (data) setShowCarousel(data.value);
    } catch (error) {
       console.error('Error fetching settings:', error);
    }
  };

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
          productos_imagenes (url),
          compatibilidad (
            modelo_id,
            modelos (
              familia_id,
              familias (marca_id)
            )
          )
        `)
        .gt('stock', 0); // Solo mostrar productos con stock mayor a 0

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

      // Aplicar filtro de marcas y familias (esto requiere filtrar en cliente o un join más complejo en Supabase)
      if (activeFilters.brands.length > 0 || activeFilters.families.length > 0) {
        filteredData = filteredData.filter(producto => {
          const compatibilidades = producto.compatibilidad || [];
          
          let matchesBrand = true;
          let matchesFamily = true;

          // Si hay filtros de marca activos, el producto debe tener al menos una compatibilidad de esa marca
          if (activeFilters.brands.length > 0) {
            const productBrands = compatibilidades.map((c: any) => c.modelos?.familias?.marca_id);
            matchesBrand = activeFilters.brands.some(brandId => productBrands.includes(brandId));
          }

          // Si hay filtros de familia activos, el producto debe tener al menos una compatibilidad de esa familia específica
          if (activeFilters.families.length > 0) {
            const productFamilies = compatibilidades.map((c: any) => c.modelos?.familia_id);
            matchesFamily = activeFilters.families.some(familyId => productFamilies.includes(familyId));
          }

          return matchesBrand && matchesFamily;
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

  const handleFilterChange = useCallback((filters: { categories: string[]; brands: string[]; families: string[] }) => {
    setActiveFilters(filters);
  }, []);

  // Obtener solo productos en oferta y que tengan stock
  const productosEnOferta = productos.filter(p => p.precio_oferta && p.precio_oferta > 0 && p.stock > 0);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <NavBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} showSearch={true} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {showCarousel && !searchQuery && activeFilters.categories.length === 0 && activeFilters.brands.length === 0 && activeFilters.families.length === 0 && (
          <OffersCarousel 
            productos={productosEnOferta} 
            onAddToCart={handleAddToCart} 
            onClickCard={(product: any) => setSelectedProduct(product)}
          />
        )}
        
        <div className="flex flex-col md:flex-row gap-12 mt-4">
          {/* Sidebar de Filtros */}
          <Sidebar onFilterChange={handleFilterChange} />

          {/* Listado de Productos */}
          <div className="flex-1 min-w-0">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo de Accesorios y Repuestos'}
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
                  onClick={() => {setSearchQuery(''); setActiveFilters({categories:[], brands:[], families:[]})}}
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
                    onClickCard={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Producto */}
      {selectedProduct && (
        <ProductModal 
          producto={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart} 
        />
      )}
    </main>
  );
}
