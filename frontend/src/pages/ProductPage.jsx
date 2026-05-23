import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart, Store, Truck, ShieldCheck, ArrowLeft, Plus, Minus, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useToastStore from '../store/useToastStore';
import { formatCLP } from '../services/utils';

const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const { isAuthenticated, user } = useAuthStore();
  const { addItem, loading: cartLoading } = useCartStore();
  const { showToast } = useToastStore();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  
  // Estados para creación de reseña
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Cargar producto
        const productRes = await api.get(`/api/products/${slug}`);
        const productData = productRes.data;
        setProduct(productData);

        // 2. Cargar reseñas
        try {
          const reviewsRes = await api.get(`/api/products/${slug}/reviews`);
          setReviews(reviewsRes.data?.content || reviewsRes.data || []);
        } catch (rErr) {
          console.warn('Reviews not loaded:', rErr);
        }

        // 3. Verificar si está en wishlist si está autenticado
        if (isAuthenticated) {
          try {
            const wishlistRes = await api.get('/api/wishlist');
            const wishlistItems = wishlistRes.data || [];
            const found = wishlistItems.some(item => item.productId === productData.id);
            setIsFavorite(found);
          } catch (wErr) {
            console.warn('Wishlist not checked:', wErr);
          }
        }

      } catch (err) {
        console.error('Error loading product:', err);
        setError('El producto que estás buscando no existe o no está disponible.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [slug, isAuthenticated]);

  const handleQuantityChange = (val) => {
    if (!product) return;
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= (product.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${slug}`);
      return;
    }
    
    const res = await addItem(product.id, quantity);
    if (res.success) {
      showToast('¡Producto agregado al carro con éxito!', 'success');
    } else {
      showToast(res.error || 'No se pudo agregar al carro', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${slug}`);
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/api/wishlist/${product.id}`);
        setIsFavorite(false);
        showToast('Eliminado de favoritos', 'info');
      } else {
        await api.post(`/api/wishlist/${product.id}`);
        setIsFavorite(true);
        showToast('¡Agregado a favoritos con éxito!', 'success');
      }
      // Notificar reactivamente al Navbar
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      showToast('Error al modificar favoritos', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    if (!reviewComment.trim()) {
      setReviewError('Por favor escribe un comentario para tu reseña.');
      setSubmittingReview(false);
      return;
    }

    try {
      const response = await api.post(`/api/products/${slug}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });

      setReviews([response.data, ...reviews]);
      showToast('¡Reseña publicada con éxito! Gracias por tu opinión.', 'success');
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al enviar la reseña. Solo puedes opinar si has comprado este producto y tu pedido está confirmado o entregado.';
      setReviewError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-error)', margin: '0 auto 16px auto', display: 'block' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-black)' }}>{error || 'Error'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Por favor verifica la dirección web o explora el catálogo.</p>
        <Link to="/search" className="btn btn-black">Volver al Catálogo</Link>
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="fade-in container" style={{ padding: '32px 0 64px 0' }}>
      
      {/* Volver */}
      <Link to="/search" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px',
        fontWeight: '500'
      }}>
        <ArrowLeft size={16} /> Volver a la búsqueda
      </Link>

      {/* Grid del Producto */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr',
        gap: '48px',
        marginBottom: '64px',
        alignItems: 'start'
      }}>
        
        {/* GALERÍA DE IMÁGENES (Izquierda) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{
            backgroundColor: 'var(--bg-secondary)',
            height: '460px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflow: 'hidden'
          }}>
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
              alt={product.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* DETALLE DE COMPRA (Derecha) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            {/* Store & Rating */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              {product.storeSlug ? (
                <Link to={`/stores/${product.storeSlug}`} style={{ textDecoration: 'none' }}>
                  <span className="badge" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    color: '#c5a059',
                    border: '1px solid rgba(197, 160, 89, 0.4)',
                    backgroundColor: 'rgba(197, 160, 89, 0.08)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    transition: 'all 0.2s'
                  }} className="hover-gold-pill">
                    <Store size={14} /> {product.storeName || 'Tienda Oficial'}
                  </span>
                </Link>
              ) : (
                <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Store size={14} /> {product.storeName || 'Tienda Oficial'}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={16} fill="var(--color-gold)" color="var(--color-gold)" />
                <span style={{ fontSize: '14px', fontWeight: '700' }}>
                  {product.averageRating ? product.averageRating.toFixed(1) : '5.0'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  ({reviews.length} opiniones)
                </span>
              </div>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--color-black)',
              lineHeight: '1.25',
              marginBottom: '16px'
            }}>
              {product.name}
            </h1>

            {/* Precio */}
            <div style={{
              fontSize: '36px',
              fontWeight: '800',
              color: 'var(--color-black)',
              marginBottom: '8px'
            }}>
              {formatCLP(product.price)}
            </div>
            
            {/* Impuestos/Cuotas simuladas */}
            <div style={{ fontSize: '14px', color: 'var(--color-success)', fontWeight: '600', marginBottom: '24px' }}>
              En 6 cuotas sin interés de {formatCLP(product.price ? Math.round(product.price / 6) : 0)}
            </div>

            {/* Stock status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span className={`badge ${inStock ? 'badge-success' : 'badge-error'}`}>
                {inStock ? 'Stock Disponible' : 'Agotado temporalmente'}
              </span>
              {inStock && (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  ({product.stock} unidades en bodega)
                </span>
              )}
            </div>

            {/* Descripción */}
            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '20px',
              marginBottom: '28px'
            }}>
              {product.description || 'Sin descripción detallada disponible.'}
            </p>
          </div>

          {/* MENÚ DE ACCIÓN (Carro, wishlist) */}
          {inStock && (
            <div className="card" style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Selección de cantidad */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Cantidad:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-primary)' }}>
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    style={{ background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    disabled={quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ padding: '0 16px', fontWeight: '700', fontSize: '15px' }}>{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    style={{ background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    disabled={quantity >= product.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Botón Carrito & Favoritos */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleAddToCart}
                  className="btn btn-black"
                  style={{
                    flex: 1,
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  disabled={cartLoading}
                >
                  <ShoppingCart size={18} /> Agregar al Carro
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className="btn btn-outline"
                  style={{
                    padding: '14px',
                    borderColor: isFavorite ? 'var(--color-error)' : 'var(--border-medium)',
                    color: isFavorite ? 'var(--color-error)' : 'var(--text-primary)',
                    backgroundColor: isFavorite ? 'var(--color-error-bg)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  <Heart size={18} fill={isFavorite ? 'var(--color-error)' : 'none'} />
                </button>
              </div>

              {/* Info descriptiva de envío */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Truck size={16} style={{ color: 'var(--color-gold)' }} />
                  <span>Envío express disponible en todo Chile.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-gold)' }} />
                  <span>Compra Protegida. Recibe tu producto o te devolvemos el dinero.</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* RESEÑAS Y OPINIONES */}
      <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '48px' }}>
        <h2 className="title-section" style={{ fontSize: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={24} /> Opiniones de Compradores
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '48px', alignItems: 'start' }}>
          
          {/* DEJAR UNA RESEÑA (Izquierda) */}
          <div>
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-black)' }}>
                Escribe tu Opinión
              </h3>

              {!isAuthenticated ? (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Debes <Link to={`/login?redirect=/product/${slug}`} style={{ color: 'var(--color-gold)', fontWeight: '600' }}>iniciar sesión</Link> para dejar una opinión.
                  <br /><br />
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    * Solo compradores con orden confirmada o entregada de este producto pueden calificarlo.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {reviewError && (
                    <div className="badge badge-error" style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  {reviewSuccess && (
                    <div className="badge badge-success" style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <ShieldCheck size={14} />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Calificación (Estrellas)</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <Star
                            size={24}
                            fill={star <= reviewRating ? 'var(--color-gold)' : 'none'}
                            color="var(--color-gold)"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="comment">Comentario</label>
                    <textarea
                      id="comment"
                      rows="4"
                      className="form-input"
                      placeholder="Cuéntanos tu experiencia con el producto. ¿Cumplió tus expectativas?"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      style={{ resize: 'none', fontFamily: 'inherit' }}
                      disabled={submittingReview}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-black"
                    style={{ padding: '10px', fontSize: '14px', fontWeight: '600' }}
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Enviando...' : 'Publicar Reseña'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* LISTADO DE RESEÑAS (Derecha) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Este producto aún no tiene reseñas. ¿Fuiste uno de los primeros compradores? ¡Déjanos saber tu opinión!
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      {/* Estrellas */}
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? 'var(--color-gold)' : 'none'}
                            color="var(--color-gold)"
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-black)' }}>
                        {rev.buyerName || 'Comprador Anónimo'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('es-CL') : 'Fecha no registrada'}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      <style>{`
        .hover-gold-pill:hover {
          color: #ffffff !important;
          border-color: #c5a059 !important;
          background-color: #c5a059 !important;
          box-shadow: 0 0 10px rgba(197, 160, 89, 0.4) !important;
        }
      `}</style>
    </div>
  );
};

export default ProductPage;
