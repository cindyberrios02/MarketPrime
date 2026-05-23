// store/useToastStore.js
import { create } from 'zustand';

const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Muestra un toast flotante en la pantalla.
   * @param {string} message - El mensaje a mostrar.
   * @param {'success'|'error'|'info'|'warning'} type - El tipo de notificación.
   * @param {number} [duration=3500] - Duración en milisegundos.
   */
  showToast: (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Agregar toast
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));

    // Auto-remover tras la duración
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  /**
   * Remueve manualmente un toast por su ID.
   * @param {string} id - El identificador del toast.
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));

export default useToastStore;
