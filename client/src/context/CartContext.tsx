"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface CartItem {
  equipmentId: number;
  title: string;
  category: string;
  hourlyRate: number;
  dailyRate?: number;
  location: string;
  startDate: string;
  endDate: string;
  timeline: string;
  price: number;
  totalAmount: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (equipmentId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      // If same equipment already in cart, replace it
      const exists = prev.find((c) => c.equipmentId === item.equipmentId);
      if (exists) {
        return prev.map((c) => (c.equipmentId === item.equipmentId ? item : c));
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((equipmentId: number) => {
    setCart((prev) => prev.filter((c) => c.equipmentId !== equipmentId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + item.totalAmount, 0);
  const cartCount = cart.length;

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
