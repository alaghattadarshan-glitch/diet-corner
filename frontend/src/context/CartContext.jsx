import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRole } from './RoleContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { customerId } = useRole();
  const storageKey = `customer_cart_${customerId || 'default'}`;

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch (e) {
      console.error("Cart storage error:", e);
    }
  }, [cartItems, storageKey]);

  const addToCart = (item) => {
    setCartItems(prev => {
      const itemId = item.type === 'meal' ? (item.meal_id || item.id || item.name) : item.id;
      const existingIdx = prev.findIndex(i => {
        const pId = i.type === 'meal' ? (i.meal_id || i.id || i.name) : i.id;
        return pId === itemId;
      });

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + (item.quantity || 1)
        };
        return updated;
      } else {
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => {
      const itemId = item.type === 'meal' ? (item.meal_id || item.id || item.name) : item.id;
      return itemId !== id;
    }));
  };

  const updateQuantity = (id, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        const itemId = item.type === 'meal' ? (item.meal_id || item.id || item.name) : item.id;
        if (itemId === id) {
          const newQty = (item.quantity || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartCount = () => {
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getSubtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
