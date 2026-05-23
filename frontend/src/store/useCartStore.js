// store/useCartStore.js
import { create } from 'zustand';
import api from '../services/api';

const useCartStore = create((set, get) => ({
  cart: { items: [], totalItems: 0, totalAmount: 0 },
  loading: false,
  error: null,

  fetchCart: async () => {
    // Si no está autenticado, no hacer el fetch
    if (!localStorage.getItem('accessToken')) return;

    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/cart');
      set({ cart: response.data, loading: false });
    } catch (error) {
      set({ error: 'Error al obtener el carrito', loading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/cart', { productId, quantity });
      set({ cart: response.data, loading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al agregar al carrito';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  updateItem: async (productId, quantity) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/api/cart/${productId}`, { quantity });
      set({ cart: response.data, loading: false });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al actualizar cantidad';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  removeItem: async (productId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete(`/api/cart/${productId}`);
      set({ cart: response.data, loading: false });
      return { success: true };
    } catch (error) {
      set({ error: 'Error al eliminar producto del carro', loading: false });
      return { success: false };
    }
  },

  clearCart: async () => {
    set({ loading: true, error: null });
    try {
      await api.delete('/api/cart');
      set({
        cart: { items: [], totalItems: 0, totalAmount: 0 },
        loading: false,
      });
      return { success: true };
    } catch (error) {
      set({ error: 'Error al vaciar el carro', loading: false });
      return { success: false };
    }
  },
}));

export default useCartStore;
