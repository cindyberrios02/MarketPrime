// store/useAuthStore.js
import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Inicializa la sesión si ya existe información en localStorage
  init: () => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      set({
        accessToken: token,
        user: JSON.parse(savedUser),
        isAuthenticated: true,
      });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, email: userEmail, firstName, roles } = response.data;

      const user = { email: userEmail, firstName, roles };

      // Guardar en localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        loading: false,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Credenciales inválidas';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      const { accessToken, refreshToken, email: userEmail, firstName: fName, roles } = response.data;

      const user = { email: userEmail, firstName: fName, roles };

      // Guardar en localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        isAuthenticated: true,
        loading: false,
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Error en el registro';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));

export default useAuthStore;
