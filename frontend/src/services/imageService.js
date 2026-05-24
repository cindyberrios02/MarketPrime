import imageCompression from 'browser-image-compression';
import api from './api';

/**
 * Comprime una imagen usando browser-image-compression y la convierte a WebP si el navegador lo soporta.
 * @param {File} imageFile - El archivo original (File o Blob).
 * @param {Object} options - Opciones de compresión personalizadas.
 * @returns {Promise<File>} El archivo comprimido.
 */
export const compressImage = async (imageFile, customOptions = {}) => {
  const defaultOptions = {
    maxSizeMB: 1, // Tamaño máximo de 1MB
    maxWidthOrHeight: 1080, // Máximo 1080px (suficiente para e-commerce)
    useWebWorker: true,
    fileType: 'image/webp', // Forzar compresión a WebP
    ...customOptions,
  };

  try {
    const compressedFile = await imageCompression(imageFile, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error comprimiendo la imagen:', error);
    throw error;
  }
};

/**
 * Comprime la imagen y luego la sube al servidor (Spring Boot -> Azure Blob).
 * @param {File} imageFile - El archivo original.
 * @param {Function} onProgress - Callback para el progreso de subida.
 * @returns {Promise<string>} La URL pública de la imagen en Azure Blob Storage.
 */
export const uploadImage = async (imageFile, onProgress) => {
  try {
    // 1. Comprimir imagen a WebP
    const compressedFile = await compressImage(imageFile);

    // 2. Preparar FormData para subir
    const formData = new FormData();
    formData.append('file', compressedFile, compressedFile.name.replace(/\.[^/.]+$/, "") + '.webp');

    // 3. Llamar al backend
    const response = await api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });

    // 4. Retornar la URL entregada por el backend
    return response.data.url;
  } catch (error) {
    console.error('Error subiendo la imagen al servidor:', error);
    throw error;
  }
};
