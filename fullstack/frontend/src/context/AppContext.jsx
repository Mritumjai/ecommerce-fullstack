import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [cartId, setCartId] = useState(() => localStorage.getItem('cartId'));
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const refreshCart = useCallback(async (id = cartId) => {
    if (!id) return;
    try {
      setCartLoading(true);
      const data = await api.getCart(id);
      setCart(data.data);
    } catch {
      // Cart may be gone (server restart with memory storage)
      localStorage.removeItem('cartId');
      setCartId(null);
      setCart(null);
    } finally {
      setCartLoading(false);
    }
  }, [cartId]);

  useEffect(() => { refreshCart(); }, []);

  async function ensureCart() {
    if (cartId) return cartId;
    const data = await api.createCart();
    const id = data.data.id;
    localStorage.setItem('cartId', id);
    setCartId(id);
    setCart(data.data);
    return id;
  }

  async function addToCart(productId, quantity = 1) {
    const id = await ensureCart();
    const data = await api.addItem(id, { productId, quantity });
    setCart(data.data);
    return data.data;
  }

  async function updateCartItem(productId, quantity) {
    const data = await api.updateItem(cartId, productId, { quantity });
    setCart(data.data);
  }

  async function removeCartItem(productId) {
    const data = await api.removeItem(cartId, productId);
    setCart(data.data);
  }

  function doLogin(userData, token) {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  }

  function doLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  }

  function clearCart() {
    localStorage.removeItem('cartId');
    setCartId(null);
    setCart(null);
  }

  return (
    <AppContext.Provider value={{
      user, doLogin, doLogout,
      cart, cartLoading, refreshCart,
      addToCart, updateCartItem, removeCartItem, clearCart, ensureCart,
      cartItemCount: cart?.summary?.itemCount || 0
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
