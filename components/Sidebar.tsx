"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  onFilterChange: (filters: { categories: string[]; brands: string[]; families: string[] }) => void;
}

export default function Sidebar({ onFilterChange }: SidebarProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]); // New state for families
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]); // Selected families
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [catRes, brandRes, famRes] = await Promise.all([
          supabase.from('categorias_items').select('id, nombre').order('nombre'),
          supabase.from('marcas').select('id, nombre').order('nombre'),
          supabase.from('familias').select('id, nombre, marca_id').order('nombre')
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (brandRes.data) setBrands(brandRes.data);
        if (famRes.data) setFamilies(famRes.data);
      } catch (error) {
        console.error('Error loading filters:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFilters();
  }, []);

  useEffect(() => {
    onFilterChange({ categories: selectedCategories, brands: selectedBrands, families: selectedFamilies });
  }, [selectedCategories, selectedBrands, selectedFamilies, onFilterChange]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleBrand = (id: string) => {
    setSelectedBrands(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        // If unchecking a brand, also uncheck its families
        const brandFamilies = families.filter(f => f.marca_id === id).map(f => f.id);
        setSelectedFamilies(currentFam => currentFam.filter(fid => !brandFamilies.includes(fid)));
        return prev.filter(b => b !== id);
      }
      return [...prev, id];
    });
  };

  const toggleFamily = (id: string) => {
    setSelectedFamilies(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedFamilies([]);
  };

  if (loading) {
    return (
      <div className="w-64 space-y-8 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-60 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
      {/* Header Filtros */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0033a0]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          Filtros
        </h2>
        {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Categorías */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
          Categorías
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 group cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="peer h-5 w-5 appearance-none rounded border-2 border-gray-300 transition-all checked:bg-[#0033a0] checked:border-[#0033a0] focus:ring-2 focus:ring-blue-100"
                />
                <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className={`text-sm transition-colors ${selectedCategories.includes(cat.id) ? 'text-[#0033a0] font-semibold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {cat.nombre}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Marcas */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
          Marcas
        </h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {brands.map((brand) => {
            const isBrandSelected = selectedBrands.includes(brand.id);
            const brandFamilies = families.filter(f => f.marca_id === brand.id);
            
            return (
              <div key={brand.id} className="flex flex-col gap-1">
                <label className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isBrandSelected}
                      onChange={() => toggleBrand(brand.id)}
                      className="peer h-5 w-5 appearance-none rounded border-2 border-gray-300 transition-all checked:bg-[#0033a0] checked:border-[#0033a0] focus:ring-2 focus:ring-blue-100"
                    />
                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className={`text-sm transition-colors ${isBrandSelected ? 'text-[#0033a0] font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {brand.nombre}
                  </span>
                </label>
                
                {/* Familias Accordion */}
                <div 
                  className={`pl-8 overflow-hidden transition-all duration-300 ease-in-out ${isBrandSelected ? 'max-h-96 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}
                >
                  <div className="space-y-1.5 border-l-2 border-gray-100 pl-3">
                    {brandFamilies.length > 0 ? (
                      brandFamilies.map((fam) => (
                        <label key={fam.id} className="flex items-center gap-2 group cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={selectedFamilies.includes(fam.id)}
                            onChange={() => toggleFamily(fam.id)}
                            className="h-3.5 w-3.5 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                          />
                          <span className={`text-xs ${selectedFamilies.includes(fam.id) ? 'text-[#0033a0] font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                            {fam.nombre}
                          </span>
                        </label>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Sin familias específicas</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
