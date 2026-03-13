"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Tipo del item local (combinación de datos de pedido_items y productos)
export interface CartItem {
  id_item: string; // ID en la tabla pedido_items
  producto_id: string; // ID en la tabla productos
  cantidad: number;
  precio_unitario: number;
  producto_nombre: string;
  producto_sku: string;
  producto_imagen?: string;
}

interface CartContextType {
  pedidoId: string | null;
  items: CartItem[];
  cartCount: number;
  total: number;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addToCart: (producto_id: string, cantidad?: number) => Promise<void>;
  updateQuantity: (id_item: string, nueva_cantidad: number) => Promise<void>;
  removeFromCart: (id_item: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Escuchar cambios de Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      if (!session) {
        setItems([]);
        setPedidoId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función principal para cargar el carrito
  const fetchActiveCart = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Buscar si hay un pedido en estado "borrador" para este usuario
      let { data: pedidoBorrador, error: pedidoError } = await supabase
        .from('pedidos')
        .select('id')
        .eq('user_id', userId)
        .eq('estado', 'borrador')
        .maybeSingle(); // maybeSingle para que no tire error si no existe

      if (pedidoError) throw pedidoError;

      // 2. Si hay pedido, buscar sus productos
      if (pedidoBorrador) {
        setPedidoId(pedidoBorrador.id);
        
        const { data: cartItems, error: itemsError } = await supabase
          .from('pedido_items')
          .select(`
            id,
            producto_id,
            cantidad,
            precio_unitario_guardado,
            productos (
              nombre,
              sku,
              imagen_url,
              precio,
              precio_oferta
            )
          `)
          .eq('pedido_id', pedidoBorrador.id);

        if (itemsError) throw itemsError;

        // Formatear items
        const formattedItems: CartItem[] = (cartItems || []).map(item => {
          const prod: any = item.productos;
          // Actualizamos visualmente con el precio vigente en caso de ofertas relámpago
          const precioVigente = prod?.precio_oferta || prod?.precio || item.precio_unitario_guardado;
          
          return {
            id_item: item.id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: precioVigente,
            producto_nombre: prod?.nombre || 'Producto Desconocido',
            producto_sku: prod?.sku || 'N/A',
            producto_imagen: prod?.imagen_url
          };
        });

        setItems(formattedItems);
      } else {
        // No hay carrito activo
        setPedidoId(null);
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Ejecutar cuando el usuario cambia
  useEffect(() => {
    fetchActiveCart();
  }, [fetchActiveCart]);

  // Helpers internos para obtener o crear el pedído Borrador
  const getOrCreateActiveOrder = async (): Promise<string | null> => {
    if (!userId) {
      // Podríamos redirigir a Login o manejar un carrito en localStorage para anónimos, 
      // pero por ahora bloqueamos el carrito a usuarios registrados por simplicidad.
      alert('Debes iniciar sesión para agregar al carrito');
      return null;
    }

    if (pedidoId) return pedidoId;

    try {
      // Intentar crear uno nuevo
      const { data, error } = await supabase
        .from('pedidos')
        .insert({ user_id: userId, estado: 'borrador' })
        .select('id')
        .single();
        
      if (error) throw error;
      
      setPedidoId(data.id);
      return data.id;
    } catch (error) {
      // Si dio error de clave única u otros, intentar re-fetch (race conditions)
      console.error('Error creando pedido borrador, reintentando fetch:', error);
      await fetchActiveCart();
      return pedidoId; // Retornará null si también falló el re-fetch
    }
  };


  const addToCart = async (producto_id: string, cantidad: number = 1) => {
    const ordenId = await getOrCreateActiveOrder();
    if (!ordenId) return;

    try {
      // Verificar precio actual del producto
      const { data: prodData } = await supabase
        .from('productos')
        .select('precio, precio_oferta')
        .eq('id', producto_id)
        .single();
        
      const precioBase = prodData?.precio_oferta || prodData?.precio || 0;

      // Verificamos si ya existe el producto en el borrador
      const existe = items.find(i => i.producto_id === producto_id);

      if (existe) {
        // UPDATE (Upsert manual controlado)
        await supabase
          .from('pedido_items')
          .update({ 
            cantidad: existe.cantidad + cantidad,
            precio_unitario_guardado: precioBase
          })
          .eq('id', existe.id_item);
      } else {
        // INSERT
        await supabase
          .from('pedido_items')
          .insert({
            pedido_id: ordenId,
            producto_id: producto_id,
            cantidad: cantidad,
            precio_unitario_guardado: precioBase
          });
      }

      // Refrescar estado local abriendo el carrito visualmente
      await fetchActiveCart();
      setIsOpen(true);
      
    } catch (error) {
      console.error('Error adding to cart', error);
      alert('Ocurrió un error al agregar el producto al carrito.');
    }
  };

  const updateQuantity = async (id_item: string, nueva_cantidad: number) => {
    if (nueva_cantidad <= 0) {
      await removeFromCart(id_item);
      return;
    }

    // Optimistic UI Update
    setItems(current => current.map(item => item.id_item === id_item ? { ...item, cantidad: nueva_cantidad } : item));

    try {
      await supabase
        .from('pedido_items')
        .update({ cantidad: nueva_cantidad })
        .eq('id', id_item);
    } catch (error) {
      console.error('Error updating quantity', error);
      await fetchActiveCart(); // Revert in case of failure
    }
  };

  const removeFromCart = async (id_item: string) => {
    // Optimistic UI Update
    setItems(current => current.filter(item => item.id_item !== id_item));

    try {
      await supabase
        .from('pedido_items')
        .delete()
        .eq('id', id_item);
        
      // Si era el último ítem, opcionalmente podríamos borrar el `pedidos` 
      // o dejarlo vacío (borrador vacío) -- aquí lo dejamos vacío por seguridad y limpieza
    } catch (error) {
      console.error('Error removing from cart', error);
      await fetchActiveCart(); // Revert in case of failure
    }
  };

  const clearCart = async () => {
    if (!pedidoId) return;
    setItems([]); // Optimistic

    try {
      await supabase
        .from('pedido_items')
        .delete()
        .eq('pedido_id', pedidoId);
    } catch (error) {
      await fetchActiveCart(); // Revert in case of failure
    }
  };

  const cartCount = items.reduce((acc, item) => acc + item.cantidad, 0);
  const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

  return (
    <CartContext.Provider value={{
      pedidoId,
      items,
      cartCount,
      total,
      loading,
      isOpen,
      setIsOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart: fetchActiveCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
