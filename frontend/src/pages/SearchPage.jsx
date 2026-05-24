import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Filter, Star, Search, SlidersHorizontal, Grid3X3, ArrowUpDown, Eye, ShoppingCart, Check } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import ProductPreviewModal from '../components/ProductPreviewModal';
import { formatCLP } from '../services/utils';
import useToastStore from '../store/useToastStore';

const SearchPage = () => {
  const { showToast } = useToastStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados de filtros
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leer params de la URL de forma síncrona en la inicialización para evitar la doble petición
  const searchParams = new URLSearchParams(window.location.search);
  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || '';

  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price_asc', 'price_desc'
  const [previewSlug, setPreviewSlug] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);

  const { isAuthenticated } = useAuthStore();
  const { addItem, loading: cartLoading } = useCartStore();

  // Sincronizar params ante cambios de navegación posterior
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const cat = params.get('category') || '';
    
    setQuery(q);
    setSelectedCategory(cat);
  }, [location.search]);

  // Cargar productos cada vez que cambien los filtros (blindado contra race conditions)
  useEffect(() => {
    let active = true;

    const fetchFilteredProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Mapear los parámetros que entiende el backend de Spring Boot
        const params = {};
        if (query.trim()) params.q = query;
        if (selectedCategory) params.category = selectedCategory;
        if (minPrice) params.minPrice = parseFloat(minPrice);
        if (maxPrice) params.maxPrice = parseFloat(maxPrice);
        
        // Mapear ordenamiento
        if (sortBy === 'price_asc') {
          params.sort = 'price,asc';
        } else if (sortBy === 'price_desc') {
          params.sort = 'price,desc';
        } else {
          params.sort = 'createdAt,desc'; // por defecto el más nuevo
        }

        const response = await api.get('/api/products', { params });
        const productList = response.data?.content || response.data || [];
        if (active) {
          setProducts(productList);
        }
      } catch (err) {
        console.error('Error fetching filtered products:', err);
        if (active) {
          setError('No se pudo conectar con el catálogo de productos.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchFilteredProducts();

    return () => {
      active = false;
    };
  }, [query, selectedCategory, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/categories');
        const list = res.data?.content || res.data || [];
        const roots = list.filter(cat => !cat.parent && !cat.parentId);
        if (roots.length > 0) {
          setCategories([{ id: 'all', name: 'Todas las Categorías', slug: '' }, ...roots]);
        } else {
          setCategories([
            { id: 'all', name: 'Todas las Categorías', slug: '' },
            { id: 'deportes', name: 'Deportes', slug: 'deportes' },
            { id: 'ropa', name: 'Ropa', slug: 'ropa' },
            { id: 'herramientas', name: 'Herramientas', slug: 'herramientas' }
          ]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([
          { id: 'all', name: 'Todas las Categorías', slug: '' },
          { id: 'deportes', name: 'Deportes', slug: 'deportes' },
          { id: 'ropa', name: 'Ropa', slug: 'ropa' },
          { id: 'herramientas', name: 'Herramientas', slug: 'herramientas' }
        ]);
      }
    };
    fetchCategories();
  }, []);

  const handleQuickAddToCart = async (e, prod) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/search`);
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

  const handleClearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="fade-in container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
      
      {/* Header Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '20px',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 className="title-section" style={{ fontSize: '28px' }}>
            {query ? `Resultados para "${query}"` : 'Explorar Catálogo'}
          </h1>
          <p className="subtitle-section" style={{ fontSize: '14px' }}>
            {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>
        </div>

        {/* Barra de Ordenamiento rápido */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={16} /> Ordenar por:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              backgroundColor: 'var(--bg-primary)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Más Recientes</option>
            <option value="price_asc">Menor Precio</option>
            <option value="price_desc">Mayor Precio</option>
          </select>
        </div>
      </div>

      {/* Main Layout */}
      <div className="search-layout">
        
        {/* SIDEBAR FILTERS */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} /> Filtros
            </h3>
            <button
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: 'var(--color-gold)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          </div>

          {/* Categorías */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
              Categoría
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    color: selectedCategory === cat.slug ? 'var(--color-gold)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === cat.slug ? '700' : '400',
                    cursor: 'pointer',
                    padding: '4px 0',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Rango de Precio */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
              Rango de Precio ($)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="form-input"
                  style={{ padding: '8px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="form-input"
                  style={{ padding: '8px' }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* PRODUCTS GRID / LIST */}
        <main>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
              <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }}></div>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-error)' }}>
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <SlidersHorizontal size={40} style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--text-tertiary)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-black)' }}>
                Sin resultados
              </h3>
              <p style={{ fontSize: '14px' }}>
                No encontramos productos que coincidan con los criterios de búsqueda. Intenta limpiando los filtros.
              </p>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: '24px' }}>
              {products.map((prod) => (
                <Link
                  key={prod.id || prod.slug}
                  to={`/product/${prod.slug}`}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    height: '100%',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-normal)'
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
                    <img
                      src={prod.imageUrl || 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'}
                      alt={prod.name}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'; }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                    {/* Floating Premium Hover Overlay */}
                    <div className="product-image-overlay" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      backdropFilter: 'blur(4px)',
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
                          backgroundColor: addedProductId === prod.id ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(197, 160, 89, 0.4)',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: addedProductId === prod.id ? 'white' : 'var(--color-black)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        title="Agregar al Carro"
                        disabled={cartLoading}
                      >
                        {addedProductId === prod.id ? <Check size={16} /> : <ShoppingCart size={16} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setPreviewSlug(prod.slug);
                        }}
                        className="overlay-btn"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(197, 160, 89, 0.4)',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--color-black)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        title="Vista Rápida"
                      >
                        <Eye size={16} />
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
                    color: 'var(--color-black)',
                    lineHeight: '1.4',
                    marginBottom: '4px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '38px'
                  }}>
                    {prod.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>
                    Por: {prod.storeName || 'Tienda Oficial'}
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
                      color: 'var(--color-black)'
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

      {/* Quick Preview Modal */}
      {previewSlug && (
        <ProductPreviewModal
          slug={previewSlug}
          onClose={() => setPreviewSlug(null)}
        />
      )}

      <style>{`
        .search-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 32px;
        }
        @media (max-width: 868px) {
          .search-layout {
            grid-template-columns: 1fr;
          }
          .product-image-overlay {
            display: none !important;
          }
        }
        .product-image-container:hover .product-image-overlay {
          opacity: 1 !important;
        }
        .overlay-btn:hover {
          background-color: var(--color-gold) !important;
          color: white !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
