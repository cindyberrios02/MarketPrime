import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, ShoppingCart, Star, Plus, Minus, Store, ShieldCheck, Truck } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import { formatCLP } from '../services/utils';
import useToastStore from '../store/useToastStore';

const ProductPreviewModal = ({ slug, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, loading: cartLoading } = useCartStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/products/${slug}`);
        setProduct(res.data);
        setActiveImage(res.data.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80');
      } catch (err) {
        console.error('Error fetching preview product:', err);
        setError('No se pudo cargar la vista previa del producto.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleQuantityChange = (val) => {
    if (!product) return;
    const newQty = quantity + val;
    const stock = product.stock || product.stockQuantity || 1;
    if (newQty >= 1 && newQty <= stock) {
      setQuantity(newQty);
    }
  };

  const { showToast } = useToastStore();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      onClose();
      navigate(`/login?redirect=/product/${slug}`);
      return;
    }

    setSuccessMsg('');
    const res = await addItem(product.id, quantity);
    if (res.success) {
      showToast(`¡${product.name} agregado al carrito!`, 'success');
      setSuccessMsg('¡Agregado al carro!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } else {
      showToast('No se pudo agregar al carrito.', 'error');
    }
  };

  if (!slug) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid rgba(197, 160, 89, 0.3)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
        >
          <X size={18} />
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }}></div>
          </div>
        ) : error || !product ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-error)', marginBottom: '16px', fontWeight: '600' }}>{error || 'Error'}</p>
            <button onClick={onClose} className="btn btn-black">Cerrar</button>
          </div>
        ) : (
          <div className="modal-grid">
            
            {/* Left Column: Media Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                border: '1px solid var(--border-light)',
                overflow: 'hidden'
              }}>
                <img
                  src={activeImage || 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'}
                  alt={product.name}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'; }}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {product.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(img.url)}
                      style={{
                        width: '60px',
                        height: '60px',
                        padding: '4px',
                        border: activeImage === img.url ? '2px solid var(--color-gold)' : '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <img 
                        src={img.url || 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'} 
                        alt="thumbnail" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Content and Purchase Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Store size={12} /> {product.storeName || 'Tienda Oficial'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Star size={14} fill="var(--color-gold)" color="var(--color-gold)" />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {product.averageRating ? product.averageRating.toFixed(1) : '5.0'}
                  </span>
                </div>
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--color-black)',
                lineHeight: '1.3',
                marginBottom: '12px',
                fontFamily: 'var(--font-sans)'
              }}>
                {product.name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-black)' }}>
                  {formatCLP(product.price)}
                </span>
                {product.salePrice && (
                  <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>
                    {formatCLP(product.basePrice)}
                  </span>
                )}
              </div>

              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                marginBottom: '20px',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {product.description || 'Sin descripción detallada disponible.'}
              </p>

              {/* Purchase Actions */}
              <div style={{
                marginTop: 'auto',
                backgroundColor: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Cantidad:</span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer' }}
                      disabled={quantity <= 1}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ padding: '0 12px', fontWeight: '700', fontSize: '14px' }}>{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer' }}
                      disabled={quantity >= (product.stock || product.stockQuantity || 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="badge badge-success" style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    width: '100%',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    display: 'block'
                  }}>
                    {successMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAddToCart}
                    className="btn btn-black"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    disabled={cartLoading}
                  >
                    <ShoppingCart size={14} /> Agregar
                  </button>
                  
                  <Link
                    to={`/product/${slug}`}
                    onClick={onClose}
                    className="btn btn-outline"
                    style={{
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      textAlign: 'center'
                    }}
                  >
                    Detalles
                  </Link>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
      <style>{`
        .modal-grid {
          display: grid;
          grid-template-columns: minmax(300px, 1.1fr) 1fr;
          gap: 32px;
          padding: 32px;
        }
        @media (max-width: 768px) {
          .modal-grid {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 16px;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ProductPreviewModal;
