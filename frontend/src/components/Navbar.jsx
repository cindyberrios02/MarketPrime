// components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Heart, Store, ChevronDown, Bell, Menu, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchWishlistCount = async () => {
    try {
      const res = await api.get('/api/wishlist');
      setWishlistCount(res.data?.length || 0);
    } catch (err) {
      console.warn('Error fetching wishlist count:', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/notifications/unread-count');
      setUnreadCount(res.data || 0);
    } catch (err) {
      console.warn('Error fetching unread count:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlistCount();
      fetchUnreadCount();
    } else {
      setWishlistCount(0);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchCart]);

  // Escuchar evento personalizado de actualización de favoritos
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (isAuthenticated) {
        fetchWishlistCount();
      }
    };
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [isAuthenticated]);

  // Escuchar evento personalizado de actualización de notificaciones
  useEffect(() => {
    const handleNotifUpdate = () => {
      if (isAuthenticated) {
        fetchUnreadCount();
      }
    };
    window.addEventListener('notifications-updated', handleNotifUpdate);
    return () => window.removeEventListener('notifications-updated', handleNotifUpdate);
  }, [isAuthenticated]);

  // Si cambia la URL de búsqueda, actualizar input
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    } else if (!location.pathname.includes('/search')) {
      setSearchQuery('');
    }
  }, [location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isSeller = user?.roles?.includes('ROLE_SELLER');
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const bellLink = isSeller ? '/seller/dashboard?tab=notifications' : '/profile?tab=notifications';

  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Logo */}
        <Link to="/" className="logo">
          Market<span>Prime</span>
        </Link>

        {/* Buscador */}
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder="Buscar productos, marcas y más..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <Search size={18} className="search-icon" />
        </form>

        {/* Acciones */}
        <div className="nav-actions">
          <Link to="/search" className="nav-link">
            Explorar
          </Link>
          <Link to="/vender" className="nav-link">
            Vender
          </Link>

          {/* Favoritos */}
          {isAuthenticated && (
            <Link to="/profile?tab=wishlist" className="icon-btn" title="Mis Favoritos" style={{ position: 'relative' }}>
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="badge-count" style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}>{wishlistCount}</span>
              )}
            </Link>
          )}

          {/* Notificaciones */}
          {isAuthenticated && (
            <Link to={bellLink} className="icon-btn" title="Notificaciones" style={{ position: 'relative' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="badge-count" style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}>{unreadCount}</span>
              )}
            </Link>
          )}

          {/* Carrito */}
          <Link to="/cart" className="icon-btn" title="Carrito de Compras">
            <ShoppingCart size={20} />
            {cart.totalItems > 0 && (
              <span className="badge-count">{cart.totalItems}</span>
            )}
          </Link>

          {/* Perfil / Login */}
          {isAuthenticated ? (
            <div className="profile-menu">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="btn btn-outline"
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <User size={16} />
                <span style={{ fontSize: '14px' }}>Hola, {user.firstName}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    Sesión activa como
                    <strong>{user.email}</strong>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="dropdown-item"
                  >
                    <User size={16} /> Mi Perfil
                  </Link>

                  {isSeller && (
                    <Link
                      to="/seller/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="dropdown-item"
                    >
                      <Store size={16} /> Panel de Vendedor
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="dropdown-item"
                    >
                      <Store size={16} /> Panel de Administrador
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="dropdown-item dropdown-item-danger"
                    style={{ borderTop: '1px solid var(--border-light)', marginTop: '4px' }}
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-black" style={{ padding: '8px 16px', fontSize: '14px' }}>
              Iniciar Sesión
            </Link>
          )}
          {/* Menú Hamburguesa Móvil */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div className="mobile-nav-menu">
          <form onSubmit={(e) => { setMobileMenuOpen(false); handleSearchSubmit(e); }} className="mobile-search">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit"><Search size={18} /></button>
          </form>
          <Link to="/search" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Explorar Catálogo</Link>
          <Link to="/vender" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>¿Cómo Vender?</Link>
          
          {isAuthenticated && (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sesión activa como {user.email}</div>
              <Link to="/profile" className="mobile-nav-link" style={{ border: 'none', padding: 0 }} onClick={() => setMobileMenuOpen(false)}>
                <User size={16} style={{ display: 'inline', marginRight: '8px' }} /> Mi Perfil
              </Link>
              {isSeller && (
                <Link to="/seller/dashboard" className="mobile-nav-link" style={{ border: 'none', padding: 0 }} onClick={() => setMobileMenuOpen(false)}>
                  <Store size={16} style={{ display: 'inline', marginRight: '8px' }} /> Panel de Vendedor
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="mobile-nav-link" style={{ border: 'none', padding: 0 }} onClick={() => setMobileMenuOpen(false)}>
                  <Store size={16} style={{ display: 'inline', marginRight: '8px' }} /> Panel de Administrador
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="mobile-nav-link" 
                style={{ border: 'none', padding: 0, textAlign: 'left', color: 'var(--color-error)', cursor: 'pointer', background: 'none' }}
              >
                <LogOut size={16} style={{ display: 'inline', marginRight: '8px' }} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
