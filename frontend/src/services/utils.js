// services/utils.js

/**
 * Formatea un número al estándar oficial de pesos chilenos (CLP).
 * Ejemplo: 19990 -> $19.990
 * @param {number|string} value - El precio a formatear.
 * @returns {string} El precio formateado como string.
 */
export const formatCLP = (value) => {
  if (value === null || value === undefined) return '$0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};
