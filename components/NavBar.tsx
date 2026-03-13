"use client";

import Link from 'next/link';
import { useCart } from '@/components/providers/CartProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface NavBarProps {
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  showSearch?: boolean;
}

export default function NavBar({ searchQuery = '', setSearchQuery, showSearch = false }: NavBarProps) {
  const { cartCount, setIsOpen } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setIsAuthenticated(true);
        setUserName(user.user_metadata?.nombre || user.email?.split('@')[0] || '');
        const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
        if (data && (data.role === 'admin' || data.role === 'supervisor')) {
          setIsAdminAuth(true);
        }
      }
    });
  }, []);

  return (
    <header className="bg-[#0033a0] text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-extrabold tracking-wider hover:opacity-90 transition-opacity">
          Suzuval <span className="font-light text-blue-200">Catálogo</span>
        </Link>

        {showSearch && setSearchQuery && (
          <div className="flex-grow w-full md:w-auto max-w-2xl px-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por SKU, Chasis o Producto..."
                className="w-full py-2.5 px-5 rounded-md text-sm text-gray-800 bg-white placeholder-gray-400 border-none focus:outline-none focus:ring-4 focus:ring-blue-400/50 shadow-lg transition-shadow"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#0033a0] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!showSearch && <div className="flex-grow w-full md:w-auto max-w-2xl px-4"></div>}

        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-200 hidden sm:inline-block">Hola, {userName}</span>
              {isAdminAuth && (
                <Link 
                  href="/dashboard/pedidos"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Gestión
                </Link>
              )}
            </div>
          ) : (
            <Link 
              href="/login"
              className="text-sm font-medium hover:text-blue-200 transition-colors"
            >
              Ingresar
            </Link>
          )}

          <div 
            onClick={() => setIsOpen(true)}
            className="relative cursor-pointer hover:bg-blue-800 p-2 rounded transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
