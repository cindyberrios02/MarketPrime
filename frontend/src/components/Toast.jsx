// components/Toast.jsx
import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore from '../store/useToastStore';
import './Toast.css';

export const Toast = ({ toast }) => {
  const { removeToast } = useToastStore();

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="toast-icon success" size={18} />;
      case 'error':
        return <XCircle className="toast-icon error" size={18} />;
      case 'warning':
        return <AlertCircle className="toast-icon warning" size={18} />;
      case 'info':
      default:
        return <Info className="toast-icon info" size={18} />;
    }
  };

  return (
    <div className={`toast-card toast-${toast.type}`}>
      {getIcon()}
      <div className="toast-message" style={{ color: '#ffffff' }}>{toast.message}</div>
      <button className="toast-close-btn" onClick={() => removeToast(toast.id)} aria-label="Cerrar">
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
