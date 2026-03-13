const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data;
}

// Auth
export const register = (body) => req('POST', '/auth/register', body);
export const login = (body) => req('POST', '/auth/login', body);

// Products
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return req('GET', `/products${qs ? `?${qs}` : ''}`);
};
export const getProduct = (id) => req('GET', `/products/${id}`);

// Cart
export const createCart = () => req('POST', '/carts', {});
export const getCart = (cartId) => req('GET', `/carts/${cartId}`);
export const addItem = (cartId, body) => req('POST', `/carts/${cartId}/items`, body);
export const updateItem = (cartId, productId, body) => req('PATCH', `/carts/${cartId}/items/${productId}`, body);
export const removeItem = (cartId, productId) => req('DELETE', `/carts/${cartId}/items/${productId}`);

// Coupons
export const validateCoupon = (code, cartSubtotal) => req('POST', '/coupons/validate', { code, cartSubtotal });

// Checkout
export const checkout = (body) => req('POST', '/checkout', body);

// Orders
export const getOrder = (orderId) => req('GET', `/orders/${orderId}`);

// Admin
export const getAnalytics = () => req('GET', '/admin/analytics');
