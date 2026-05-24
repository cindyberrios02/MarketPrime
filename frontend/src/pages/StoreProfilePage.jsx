import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Store, MapPin, Package, Clock, Check, ShoppingCart, Eye, Search, SlidersHorizontal, ShieldCheck, Flame, ThumbsUp, Calendar, Truck } from 'lucide-react';
import api from '../services/api';
import { formatCLP } from '../services/utils';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useToastStore from '../store/useToastStore';
import ProductPreviewModal from '../components/ProductPreviewModal';
import ImageSlider from '../components/ImageSlider';

const StoreProfilePage = () => {
  const { slug } = useParams();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [allStoreProducts, setAllStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Catalog search/filters
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [previewSlug, setPreviewSlug] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const { addItem, loading: cartLoading } = useCartStore();

  useEffect(() => {
    fetchStoreProfile();
  }, [slug]);

  useEffect(() => {
    if (store) {
      fetchStoreProducts();
    }
  }, [store, searchQ, sortBy]);

  const fetchStoreProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/stores/public/${slug}`);
      setStore(response.data);
    } catch (err) {
      console.error('Error fetching store profile:', err);
      setError('No pudimos encontrar la tienda solicitada. Por favor verifica el enlace.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async () => {
    setProductsLoading(true);
    try {
      const params = {
        storeSlug: slug
      };
      if (searchQ.trim()) {
        params.q = searchQ;
      }
      if (sortBy === 'price_asc') {
        params.sort = 'price,asc';
      } else if (sortBy === 'price_desc') {
        params.sort = 'price,desc';
      } else {
        params.sort = 'createdAt,desc';
      }

      const response = await api.get('/api/products', { params });
      const productList = response.data?.content || response.data || [];
      setProducts(productList);
      
      // Save unfiltered products on first load for metrics extraction
      if (!searchQ.trim() && sortBy === 'newest' && allStoreProducts.length === 0) {
        setAllStoreProducts(productList);
      }
    } catch (err) {
      console.error('Error fetching store products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleQuickAddToCart = async (e, prod) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/stores/${slug}`);
      return;
    }
    const res = await addItem(prod.id, 1);
    if (res.success) {
      showToast(`¡${prod.name} agregado al carrito!`, 'success');
      setAddedProductId(prod.id);
      setTimeout(() => {
        setAddedProductId(null);
      }, 1500);
    } else {
      showToast('No se pudo agregar al carrito.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Cargando catálogo del vendedor...</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="container" style={{ padding: '80px 16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px', border: '1px solid rgba(255, 82, 82, 0.2)' }}>
          <Store size={48} style={{ color: '#ff5252', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '22px', color: '#ffffff', fontWeight: '800', marginBottom: '12px' }}>Tienda no encontrada</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'La tienda solicitada no existe o no se encuentra activa en nuestra red de MarketPrime.'}</p>
          <Link to="/search" className="btn btn-gold">Explorar el catálogo global</Link>
        </div>
      </div>
    );
  }

  // Helper to format dynamic joined date in Spanish
  const formatJoinedDate = (dateString) => {
    if (!dateString) return 'Miembro desde Mayo 2026';
    try {
      const date = new Date(dateString);
      const formatter = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' });
      const formatted = formatter.format(date);
      return `Miembro desde ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
    } catch (err) {
      return 'Miembro desde Mayo 2026';
    }
  };

  // Dynamic specialties (what it sells) based on store products categories
  const uniqueCategories = allStoreProducts.length > 0
    ? [...new Set(allStoreProducts.map(p => p.category?.name).filter(Boolean))].slice(0, 4)
    : products.length > 0
      ? [...new Set(products.map(p => p.category?.name).filter(Boolean))].slice(0, 4)
      : ['General'];

  // Best sellers based on reviews counts (higher indicates more sales in MarketPrime)
  const bestSellers = allStoreProducts.length > 0
    ? [...allStoreProducts]
        .sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        .slice(0, 3)
    : [...products]
        .sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        .slice(0, 3);

  // Reputation metrics
  const rating = store.averageRating || 5.0;
  const isNewStore = !store.totalSales || store.totalSales === 0;

  let activeIndex = -1; // No active index for new stores
  if (!isNewStore) {
    if (rating < 2.5) activeIndex = 0;
    else if (rating < 3.5) activeIndex = 1;
    else if (rating < 4.0) activeIndex = 2;
    else if (rating < 4.5) activeIndex = 3;
    else activeIndex = 4;
  }

  const reputationTexts = [
    { label: 'Atención crítica', desc: 'Presenta algunos reclamos y demoras de despacho.', color: '#ff4d4d' },
    { label: 'Regular', desc: 'Atención aceptable con algunas oportunidades de mejora.', color: '#ff9f43' },
    { label: 'Confiable', desc: 'Buen nivel de conformidad entre sus compradores.', color: '#feca57' },
    { label: 'Excelente', desc: 'Vendedor altamente recomendado por sus compradores.', color: '#9df373' },
    { label: 'Líder Platinum', desc: '¡De los mejores vendedores del sitio! 100% de confianza y rapidez.', color: '#10ac84' }
  ];

  const colors = ['#ff4d4d', '#ff9f43', '#feca57', '#9df373', '#10ac84'];

  const getReputationDetails = () => {
    if (isNewStore) {
      return {
        label: 'Vendedor Nuevo',
        desc: 'Este vendedor aún no cuenta con suficientes despachos para calcular su reputación comercial.',
        color: 'var(--text-secondary)'
      };
    }
    return reputationTexts[activeIndex];
  };

  const reputationDetails = getReputationDetails();

  return (
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Banner de la tienda - MercadoLibre Style Gold/Dark */}
      <div style={{
        position: 'relative',
        height: '260px',
        backgroundColor: '#1f1f1f',
        backgroundImage: store.bannerUrl ? `url(${store.bannerUrl})` : 'linear-gradient(135deg, #121212 0%, #2a2a2a 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid rgba(197, 160, 89, 0.25)'
      }}>
        {/* Overlay translúcido */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.9) 100%)'
        }} />

        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
            {/* Logo */}
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '16px',
              backgroundColor: '#1a1a1a',
              border: '2.5px solid #c5a059',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'transform 0.3s ease'
            }} className="store-logo-hover">
              {store.logoUrl ? (
                <img 
                  src={store.logoUrl || 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Logo'} 
                  alt={store.storeName} 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Logo'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <Store size={52} style={{ color: '#c5a059' }} />
              )}
            </div>

            {/* Info */}
            <div style={{ textAlign: 'left', flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>
                  {store.storeName}
                </h1>
                <span style={{
                  backgroundColor: 'rgba(197, 160, 89, 0.15)',
                  color: '#c5a059',
                  border: '1px solid rgba(197, 160, 89, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Tienda Oficial
                </span>
              </div>

              {/* Miembro desde + Ubicación */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} style={{ color: '#c5a059' }} />
                  {formatJoinedDate(store.createdAt)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} style={{ color: '#c5a059' }} />
                  Despacha a todo Chile vía Starken
                </span>
              </div>

              {/* Especialidad / Categorías que vende */}
              {uniqueCategories.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                    Especialista en:
                  </span>
                  {uniqueCategories.map((cat, index) => (
                    <span key={index} style={{
                      backgroundColor: 'rgba(197, 160, 89, 0.08)',
                      color: '#c5a059',
                      border: '1px solid rgba(197, 160, 89, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '720px', lineHeight: '1.5', margin: 0 }}>
                {store.description || 'Este vendedor oficial ofrece una excelente selección de productos garantizados con el respaldo exclusivo y logística Starken de MarketPrime.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '32px',
          textAlign: 'left'
        }} className="store-profile-grid">
          
          {/* COLUMNA IZQUIERDA: REPUTACIÓN Y DATOS COMERCIALES */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Tarjeta de Reputación Comercial */}
            <div className="card" style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                Reputación Comercial
              </h3>

              {/* Gran Calificación */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {rating.toFixed(1)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '2px', color: '#c5a059' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < Math.round(rating) ? '#c5a059' : 'none'} color="#c5a059" />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Puntuación de la Tienda
                  </span>
                </div>
              </div>

              {/* Termómetro de Satisfacción - Estilo MercadoLibre */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Nivel de confianza:</span>
                  <strong style={{ color: reputationDetails.color }}>
                    {reputationDetails.label}
                  </strong>
                </div>
                
                {/* 5 BARRAS REPUTACIÓN */}
                <div style={{ display: 'flex', gap: '4px', height: '10px', marginBottom: '12px' }}>
                  {colors.map((color, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          flex: 1, 
                          backgroundColor: isNewStore ? 'var(--bg-tertiary)' : color, 
                          opacity: isNewStore ? 0.3 : (isActive ? 1.0 : 0.15),
                          borderRadius: '2px', 
                          border: (!isNewStore && isActive) ? `1px solid ${color}` : 'none',
                          boxShadow: (!isNewStore && isActive) ? `0 0 12px ${color}99` : 'none',
                          transform: (!isNewStore && isActive) ? 'scaleY(1.2)' : 'none',
                          transition: 'all 0.3s ease'
                        }} 
                      />
                    );
                  })}
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  {reputationDetails.desc}
                </p>
              </div>

              {/* Estadísticas de Vendedor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                
                {/* Ventas */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 160, 89, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c5a059',
                    flexShrink: 0
                  }}>
                    <Package size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>DESPACHOS CONCRETADOS</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {store.totalSales && store.totalSales > 0 ? `+${store.totalSales} ventas con éxito` : 'Sin ventas concretadas aún'}
                    </strong>
                  </div>
                </div>

                {/* Envío a tiempo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isNewStore ? 'var(--bg-tertiary)' : ((store.onTimeDeliveryRate || 98.0) >= 90.0 ? 'rgba(27, 94, 32, 0.08)' : 'rgba(197, 160, 89, 0.08)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isNewStore ? 'var(--text-tertiary)' : ((store.onTimeDeliveryRate || 98.0) >= 90.0 ? 'var(--color-success)' : '#c5a059'),
                    flexShrink: 0
                  }}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>EFICIENCIA DE ENVÍO</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {isNewStore ? 'Sin envíos registrados' : `${store.onTimeDeliveryRate ? store.onTimeDeliveryRate.toFixed(0) : '98'}% Starken a tiempo`}
                    </strong>
                    {!isNewStore && (
                      <span style={{ fontSize: '11px', color: 'var(--color-success)', display: 'block', fontWeight: '600' }}>
                        ✓ Despacha sus productos a tiempo
                      </span>
                    )}
                  </div>
                </div>

                {/* Atención al cliente */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 160, 89, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c5a059',
                    flexShrink: 0
                  }}>
                    <ThumbsUp size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>CALIDAD DE ATENCIÓN</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {isNewStore ? 'Pendiente de evaluación' : 'Excelente servicio y postventa'}
                    </strong>
                  </div>
                </div>

                {/* Miembro Desde */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    <Store size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }}>TIENDA REGISTRADA</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {store.createdAt ? `Miembro desde ${new Date(store.createdAt).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}` : 'Desconocido'}
                    </strong>
                  </div>
                </div>

                {/* Compra Protegida */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  backgroundColor: 'var(--color-gold-light)', 
                  border: '1px solid rgba(197, 160, 89, 0.18)', 
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '4px' 
                }}>
                  <ShieldCheck size={20} style={{ color: '#c5a059', flexShrink: 0 }} />
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>Compra Protegida</strong> Recibe el producto que esperabas o te devolvemos el 100% de tu dinero.
                  </p>
                </div>
              </div>
            </div>

            {/* Opiniones de Clientes */}
            <div className="card" style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                Opiniones Recientes
              </h3>

              {store.reviews && store.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {store.reviews.map((rev) => (
                    <div key={rev.id} style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{rev.buyerName || 'Comprador Anónimo'}</strong>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={10} 
                              fill={i < rev.rating ? '#c5a059' : 'none'} 
                              color={i < rev.rating ? '#c5a059' : 'rgba(0,0,0,0.15)'} 
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px 0', fontStyle: 'italic', lineHeight: '1.4' }}>
                        "{rev.comment}"
                      </p>
                      <Link 
                        to={`/product/${rev.productSlug}`} 
                        style={{ fontSize: '10px', color: '#c5a059', textDecoration: 'none', fontWeight: '600' }}
                        className="hover-underline"
                      >
                        Ver producto: {rev.productName}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px 16px', 
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ThumbsUp size={28} style={{ color: 'var(--text-tertiary)' }} />
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Sin opiniones todavía</strong>
                  <span style={{ fontSize: '11px', lineHeight: '1.4' }}>
                    Este vendedor aún no ha recibido opiniones sobre sus productos de parte de los compradores.
                  </span>
                </div>
              )}
            </div>
          </aside>

          {/* COLUMNA DERECHA: CATÁLOGO Y BUSCADOR */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* PRODUCTOS MÁS VENDIDOS - SHOWCASE PREMIUM */}
            {bestSellers.length > 0 && (
              <div className="card" style={{
                background: 'linear-gradient(135deg, var(--color-gold-light) 0%, var(--bg-primary) 100%)',
                border: '1px solid var(--border-light)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Flame size={20} style={{ color: '#c5a059' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                    Productos Más Vendidos
                  </h3>
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#c5a059',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginLeft: '8px'
                  }}>
                    Popular
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px'
                }}>
                  {bestSellers.map((prod) => (
                    <Link
                      key={`best-${prod.id}`}
                      to={`/product/${prod.slug}`}
                      className="card border-hover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-light)',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        borderRadius: '12px'
                      }}
                    >
                      {/* Imagen */}
                      <div style={{
                        width: '100%',
                        height: '140px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px'
                      }}>
                        <img
                          src={prod.imageUrl || (prod.images && prod.images[0]?.url) || 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'}
                          alt={prod.name}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'; }}
                          style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>

                      {/* Estrellas */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                        <Star size={10} fill="#c5a059" color="#c5a059" />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {prod.averageRating ? prod.averageRating.toFixed(1) : '5.0'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          ({prod.reviewsCount || 0})
                        </span>
                      </div>

                      {/* Título */}
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4',
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '36px'
                      }}>
                        {prod.name}
                      </h4>

                      {/* Precio */}
                      <div style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-light)'
                      }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {formatCLP(prod.price)}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#c5a059' }}>
                          Ver detalles
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Buscador de catálogo y Ordenamiento */}
            <div className="card" style={{
              padding: '16px 24px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Buscador interno */}
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Buscar en el catálogo de esta tienda..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: '40px',
                    marginBottom: 0,
                    height: '42px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Ordenamiento */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SlidersHorizontal size={14} style={{ color: '#c5a059' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                  style={{
                    marginBottom: 0,
                    width: '180px',
                    height: '42px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-light)',
                    color: 'var(--text-primary)',
                    padding: '0 12px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                </select>
              </div>
            </div>

            {/* Malla de Productos */}
            {productsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '2.5px' }}></div>
              </div>
            ) : products.length === 0 ? (
              <div className="card" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '16px' }}>
                <SlidersHorizontal size={40} style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--text-tertiary)' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  Sin productos
                </h3>
                <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                  No se encontraron productos en esta tienda que coincidan con la búsqueda. Intenta borrando los filtros de búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid-3" style={{ gap: '24px' }}>
                {products.map((prod) => (
                  <Link
                    key={prod.id || prod.slug}
                    to={`/product/${prod.slug}`}
                    className="card border-hover"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '16px',
                      height: '100%',
                      textDecoration: 'none',
                      boxShadow: 'var(--shadow-sm)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-light)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Image container */}
                    <div className="product-image-container" style={{
                      width: '100%',
                      height: '180px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      position: 'relative'
                    }}>
                      <ImageSlider images={prod.imageUrls || [prod.imageUrl]} fallbackText="Sin Imagen" />
                      {/* Floating Hover Actions */}
                      <div className="prod-overlay-actions" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.90)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <button
                          onClick={(e) => handleQuickAddToCart(e, prod)}
                          className="overlay-btn"
                          style={{
                            backgroundColor: addedProductId === prod.id ? 'var(--color-success)' : 'var(--color-black, #1a1a1a)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: addedProductId === prod.id ? '#ffffff' : 'var(--color-gold, #c5a059)',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                          title="Agregar al Carro"
                          disabled={cartLoading}
                        >
                          {addedProductId === prod.id ? <Check size={18} /> : <ShoppingCart size={18} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setPreviewSlug(prod.slug);
                          }}
                          className="overlay-btn"
                          style={{
                            backgroundColor: 'var(--color-black, #1a1a1a)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '42px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#ffffff',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}
                          title="Vista Rápida"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <Star size={12} fill="var(--color-gold)" color="var(--color-gold)" />
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {prod.averageRating ? prod.averageRating.toFixed(1) : '5.0'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        ({prod.reviewsCount || 0})
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      lineHeight: '1.4',
                      marginBottom: '4px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '38px',
                      transition: 'color 0.2s'
                    }} className="prod-title-hover">
                      {prod.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>
                      Por: {store.storeName}
                    </span>

                    {/* Pricing and Action */}
                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-light)'
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: 'var(--text-primary)'
                      }}>
                        {formatCLP(prod.price)}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--color-gold)'
                      }}>
                        Ver Detalles
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* QUICK PREVIEW MODAL */}
      {previewSlug && (
        <ProductPreviewModal
          slug={previewSlug}
          onClose={() => setPreviewSlug(null)}
        />
      )}

      <style>{`
        .border-hover:hover {
          border-color: var(--color-gold) !important;
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px);
        }

        .border-hover:hover .prod-zoom-img {
          transform: scale(1.05);
        }

        .border-hover:hover .prod-overlay-actions {
          opacity: 1 !important;
        }

        .border-hover:hover .prod-title-hover {
          color: var(--color-gold) !important;
        }

        .overlay-btn:hover {
          transform: scale(1.1);
        }

        .hover-underline:hover {
          text-decoration: underline !important;
        }

        @media (max-width: 768px) {
          .store-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StoreProfilePage;

