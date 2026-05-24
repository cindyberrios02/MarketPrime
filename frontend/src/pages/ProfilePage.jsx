import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User, MapPin, ShoppingBag, Heart, ShieldAlert, Lock, Trash2, Plus, CheckCircle, AlertCircle, Eye, Power, Store, Mail, Inbox, Bell } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { REGIONES_CHILE } from '../data/chileData';
import useToastStore from '../store/useToastStore';
import { formatCLP } from '../services/utils';

const ProfilePage = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToastStore();

  // Estados Generales
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'addresses', 'orders', 'wishlist', 'store'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Datos de Perfil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 2. Direcciones
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    alias: '',
    recipientName: '',
    phone: '',
    street: '',
    number: '',
    city: '',
    region: '',
    zipCode: '',
    country: 'Chile',
    isDefault: false
  });

  // 3. Pedidos
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // 4. Favoritos
  const [wishlist, setWishlist] = useState([]);

  // 5. Tienda
  const [storeProfile, setStoreProfile] = useState(null);
  const [hasStore, setHasStore] = useState(false);
  const [loadingStore, setLoadingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({
    storeName: '',
    slug: '',
    description: ''
  });

  // 6. Notificaciones / Buzón de Correos
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
      return;
    }
    loadProfileDetails();
    loadUnreadCount();

    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'addresses', 'orders', 'wishlist', 'notifications', 'store'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [isAuthenticated, location.search]);

  // Escuchar evento de actualización de notificaciones (por si se marcan como leídas en otro componente o navbar)
  useEffect(() => {
    const handleNotifUpdate = () => {
      if (isAuthenticated) {
        loadUnreadCount();
      }
    };
    window.addEventListener('notifications-updated', handleNotifUpdate);
    return () => window.removeEventListener('notifications-updated', handleNotifUpdate);
  }, [isAuthenticated]);

  // Cargar datos según pestaña activa
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'addresses') {
      loadAddresses();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'wishlist') {
      loadWishlist();
    } else if (activeTab === 'notifications') {
      loadNotifications();
    } else if (activeTab === 'store') {
      loadStoreProfile();
    }
  }, [activeTab, isAuthenticated]);

  const loadProfileDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/me');
      setProfileData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
        avatarUrl: response.data.avatarUrl || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      // fallback con datos de Zustand
      if (user) {
        setProfileData({
          firstName: user.firstName || '',
          lastName: '',
          phone: '',
          avatarUrl: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/addresses');
      setAddresses(response.data || []);
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/orders');
      // Spring Boot retorna un Page o List de órdenes. Capturamos .content si existe
      setOrders(response.data?.content || response.data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/wishlist');
      setWishlist(response.data || []);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreProfile = async () => {
    setLoadingStore(true);
    try {
      const response = await api.get('/api/stores/me');
      setStoreProfile(response.data);
      setHasStore(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasStore(false);
        setStoreProfile(null);
      } else {
        console.error('Error loading store profile:', err);
      }
    } finally {
      setLoadingStore(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      setUnreadCount(response.data || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const response = await api.get('/api/notifications');
      const list = response.data?.content || response.data || [];
      setNotifications(list);
      
      // Auto-select the first notification if one is present and not currently selected
      if (list.length > 0 && !selectedNotif) {
        setSelectedNotif(list[0]);
        const isRead = list[0].read !== undefined ? list[0].read : list[0].isRead;
        if (!isRead) {
          handleMarkAsRead(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
      setSelectedNotif(prev => prev && prev.id === id ? { ...prev, read: true, isRead: true } : prev);
      
      // Reload unread count and trigger reactive UI events
      loadUnreadCount();
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // HANDLERS PERFIL
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.patch('/api/users/me', profileData);
      showToast('¡Perfil actualizado con éxito!', 'success');
      
      // Actualizar Zustand local storage del user
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.firstName = profileData.firstName;
      localStorage.setItem('user', JSON.stringify(savedUser));
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar perfil.');
      showToast(err.response?.data?.detail || 'Error al actualizar perfil.', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      showToast('Las nuevas contraseñas no coinciden.', 'warning');
      return;
    }

    try {
      await api.patch('/api/users/me/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      showToast('Contraseña actualizada con éxito.', 'success');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al rotar contraseña. Verifica tu clave actual.');
      showToast(err.response?.data?.detail || 'Error al rotar contraseña.', 'error');
    }
  };

  // HANDLER TIENDA
  const handleCreateStore = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(storeForm.slug)) {
      setError('El slug solo puede contener letras minúsculas, números y guiones (ej. mi-tienda-premium).');
      showToast('Slug no válido', 'warning');
      return;
    }

    try {
      const response = await api.post('/api/stores', storeForm);
      showToast('¡Solicitud de tienda enviada con éxito!', 'success');
      setStoreProfile(response.data);
      setHasStore(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al solicitar la tienda. Asegúrate de que el nombre y el slug sean únicos.');
      showToast(err.response?.data?.detail || 'Error al solicitar la tienda.', 'error');
    }
  };

  // HANDLERS DIRECCIONES
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (editingAddressId) {
        await api.put(`/api/addresses/${editingAddressId}`, addressForm);
        showToast('Dirección actualizada correctamente.', 'success');
      } else {
        await api.post('/api/addresses', addressForm);
        showToast('Dirección guardada correctamente.', 'success');
      }
      
      loadAddresses();
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({
        alias: '', recipientName: '', phone: '', street: '', number: '',
        city: '', region: '', zipCode: '', country: 'Chile', isDefault: false
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar dirección.');
      showToast(err.response?.data?.detail || 'Error al guardar dirección.', 'error');
    }
  };

  const handleEditAddressInit = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      alias: addr.alias || '',
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      street: addr.street || '',
      number: addr.number || '',
      city: addr.city || '',
      region: addr.region || '',
      zipCode: addr.zipCode || '',
      country: addr.country || 'Chile',
      isDefault: addr.isDefault || false
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta dirección?')) return;
    try {
      await api.delete(`/api/addresses/${id}`);
      loadAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await api.patch(`/api/addresses/${id}/default`);
      loadAddresses();
    } catch (err) {
      console.error('Error setting default address:', err);
    }
  };

  // HANDLERS PEDIDOS
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido? Se repondrá el stock de manera automática.')) return;
    try {
      await api.delete(`/api/orders/${orderId}`);
      showToast('Pedido cancelado con éxito.', 'success');
      loadOrders();
    } catch (err) {
      showToast(err.response?.data?.detail || 'No puedes cancelar este pedido en su estado actual.', 'error');
    }
  };

  // HANDLERS FAVORITOS
  const handleRemoveFavorite = async (productId) => {
    try {
      await api.delete(`/api/wishlist/${productId}`);
      showToast('Eliminado de favoritos', 'info');
      loadWishlist();
      // Notificar reactivamente al Navbar
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Error removing favorite:', err);
      showToast('Error al eliminar de favoritos', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Pendiente</span>;
      case 'CONFIRMED': return <span className="badge badge-success">Confirmado</span>;
      case 'SHIPPED': return <span className="badge badge-neutral" style={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}>Enviado</span>;
      case 'DELIVERED': return <span className="badge badge-success">Entregado</span>;
      case 'CANCELLED': return <span className="badge badge-error">Cancelado</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="fade-in container" style={{ padding: '40px 0 64px 0' }}>
      
      {/* Título de Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="title-section" style={{ fontSize: '32px' }}>Mi Cuenta</h1>
          <p className="subtitle-section">Bienvenido de vuelta, {user?.firstName}</p>
        </div>
        <button onClick={logout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)', borderColor: 'rgba(183,28,28,0.2)' }}>
          <Power size={16} /> Cerrar Sesión
        </button>
      </div>

      {successMsg && (
        <div className="badge badge-success" style={{ padding: '12px', width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="badge badge-error" style={{ padding: '12px', width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '8px', fontSize: '14px' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Grid del Dashboard */}
      <div className="profile-layout">
        
        {/* SIDE BAR NAVIGATION TABS */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === 'profile' ? '700' : '500',
              backgroundColor: activeTab === 'profile' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--text-white)' : 'var(--text-secondary)'
            }}
          >
            <User size={18} /> Mi Perfil
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === 'addresses' ? '700' : '500',
              backgroundColor: activeTab === 'addresses' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'addresses' ? 'var(--text-white)' : 'var(--text-secondary)'
            }}
          >
            <MapPin size={18} /> Mis Direcciones
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === 'orders' ? '700' : '500',
              backgroundColor: activeTab === 'orders' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'orders' ? 'var(--text-white)' : 'var(--text-secondary)'
            }}
          >
            <ShoppingBag size={18} /> Mis Pedidos
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === 'wishlist' ? '700' : '500',
              backgroundColor: activeTab === 'wishlist' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'wishlist' ? 'var(--text-white)' : 'var(--text-secondary)'
            }}
          >
            <Heart size={18} /> Mis Favoritos
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === 'notifications' ? '700' : '500',
              backgroundColor: activeTab === 'notifications' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'notifications' ? 'var(--text-white)' : 'var(--text-secondary)',
              position: 'relative'
            }}
          >
            <Mail size={18} /> Buzón de Mensajes
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                backgroundColor: 'var(--color-gold)',
                color: 'white',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                fontWeight: '700',
                boxShadow: '0 0 6px rgba(197, 160, 89, 0.4)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('store')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: activeTab === 'store' ? '700' : '500',
              backgroundColor: activeTab === 'store' ? 'var(--color-black)' : 'transparent',
              color: activeTab === 'store' ? 'var(--text-white)' : 'var(--text-secondary)'
            }}
          >
            <Store size={18} /> Mi Tienda
          </button>
        </aside>

        {/* CONTENIDO DERECHA (Pestañas Dinámicas) */}
        <main>
          
          {/* TAB 1: MI PERFIL */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Actualizar Datos */}
              <div className="card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-black)' }}>
                  Información Personal
                </h3>
                <form onSubmit={handleUpdateProfile} className="profile-form-row" style={{ gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="first-name">Nombre</label>
                    <input
                      id="first-name"
                      type="text"
                      className="form-input"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="last-name">Apellido</label>
                    <input
                      id="last-name"
                      type="text"
                      className="form-input"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="phone">Teléfono Móvil</label>
                    <input
                      id="phone"
                      type="text"
                      className="form-input"
                      placeholder="+56912345678"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-black" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>

              {/* Rotación Contraseña */}
              <div className="card" style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--color-black)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} /> Cambiar Contraseña
                </h3>
                <form onSubmit={handleChangePassword} className="profile-form-row" style={{ gap: '20px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                    <label className="form-label" htmlFor="old-pass">Contraseña Actual</label>
                    <input
                      id="old-pass"
                      type="password"
                      className="form-input"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="new-pass">Nueva Contraseña</label>
                    <input
                      id="new-pass"
                      type="password"
                      className="form-input"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="confirm-pass">Confirmar Nueva Contraseña</label>
                    <input
                      id="confirm-pass"
                      type="password"
                      className="form-input"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-gold" style={{ padding: '10px 24px', fontSize: '14px' }}>
                      Rotar Contraseña
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: MIS DIRECCIONES (CRUD) */}
          {activeTab === 'addresses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)' }}>
                  Mis Direcciones de Envío
                </h3>
                {!showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="btn btn-black" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> Nueva Dirección
                  </button>
                )}
              </div>

              {/* Formulario Agregar/Editar */}
              {showAddressForm && (
                <div className="card fade-in" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>
                    {editingAddressId ? 'Editar Dirección' : 'Nueva Dirección de Envío'}
                  </h4>
                  <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="profile-form-row" style={{ gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="alias">Alias (ej. Casa, Oficina) *</label>
                        <input
                          id="alias"
                          type="text"
                          className="form-input"
                          value={addressForm.alias}
                          onChange={(e) => setAddressForm({ ...addressForm, alias: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="recipient">Nombre del Destinatario *</label>
                        <input
                          id="recipient"
                          type="text"
                          className="form-input"
                          value={addressForm.recipientName}
                          onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="profile-form-row profile-form-row-2" style={{ gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="phone">Teléfono de Contacto *</label>
                        <input
                          id="phone"
                          type="text"
                          className="form-input"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="street">Calle *</label>
                        <input
                          id="street"
                          type="text"
                          className="form-input"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="profile-form-row profile-form-row-3" style={{ gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="number">Número *</label>
                        <input
                          id="number"
                          type="text"
                          className="form-input"
                          value={addressForm.number}
                          onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="region">Región *</label>
                        <select
                          id="region"
                          className="form-input"
                          value={addressForm.region}
                          onChange={(e) => {
                            const selectedReg = e.target.value;
                            setAddressForm({ ...addressForm, region: selectedReg, city: '' });
                          }}
                          style={{ padding: '8px 12px', height: '40px', cursor: 'pointer', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                        >
                          <option value="">Selecciona Región</option>
                          {REGIONES_CHILE.map((item) => (
                            <option key={item.region} value={item.region}>{item.region}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="city">Ciudad / Comuna *</label>
                        <select
                          id="city"
                          className="form-input"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          disabled={!addressForm.region}
                          style={{ padding: '8px 12px', height: '40px', cursor: 'pointer', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                        >
                          <option value="">Selecciona Comuna</option>
                          {((REGIONES_CHILE.find(r => r.region === addressForm.region)?.comunas) || []).map((comuna) => (
                            <option key={comuna} value={comuna}>{comuna}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddressId(null);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-black"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        Guardar Dirección
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Grid Direcciones */}
              {loading && addresses.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                </div>
              ) : addresses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Aún no has guardado ninguna dirección de envío.
                </div>
              ) : (
                <div className="profile-grid-2" style={{ gap: '20px' }}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', border: addr.isDefault ? '1px solid var(--color-gold)' : '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
                            {addr.alias} {addr.isDefault && '(Predeterminada)'}
                          </span>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Fijar predeterminada
                            </button>
                          )}
                        </div>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                          {addr.recipientName}
                        </strong>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {addr.street} {addr.number}, {addr.city}, {addr.region}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
                          Contacto: {addr.phone}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '16px', fontSize: '13px' }}>
                        <button
                          onClick={() => handleEditAddressInit(addr)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontWeight: '600', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MIS PEDIDOS */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', textAlign: 'left', marginBottom: '10px' }}>
                Mis Historial de Pedidos
              </h3>

              {loading && orders.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Aún no has realizado ninguna compra en el sitio.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    return (
                      <div key={ord.id} className="card" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Header del pedido */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block' }}>PEDIDO ID</span>
                            <strong style={{ fontSize: '14px', color: 'var(--color-black)' }}>{ord.id}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block' }}>FECHA</span>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('es-CL') : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block' }}>TOTAL</span>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-black)' }}>
                              {formatCLP(ord.totalAmount)}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '2px' }}>ESTADO</span>
                            {getStatusBadge(ord.status)}
                          </div>
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} /> Detalle
                          </button>
                        </div>

                        {/* Desglose Expandido */}
                        {isExpanded && (
                          <div style={{
                            borderTop: '1px solid var(--border-light)',
                            paddingTop: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                          }}>
                            {/* Dirección de despacho */}
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                              <strong>Despachado a:</strong> {ord.shippingAddress || ord.shippingAddressSnapshot || 'Dirección no registrada'}
                            </div>

                            {/* Ítems */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {ord.items?.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed var(--border-light)', paddingBottom: '6px' }}>
                                  <span>
                                    {item.productName || 'Producto del pedido'} <strong style={{ color: 'var(--color-black)' }}>x{item.quantity}</strong>
                                  </span>
                                  <span style={{ fontWeight: '600' }}>
                                    {formatCLP(item.subtotal)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Acciones de Orden (e.g. Cancelación si está pendiente) */}
                            {ord.status === 'PENDING' && (
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                className="btn btn-outline"
                                style={{
                                  alignSelf: 'flex-end',
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  color: 'var(--color-error)',
                                  borderColor: 'rgba(183,28,28,0.2)'
                                }}
                              >
                                Cancelar Pedido
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MIS FAVORITOS */}
          {activeTab === 'wishlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', textAlign: 'left', marginBottom: '10px' }}>
                Mis Productos Favoritos
              </h3>

              {loading && wishlist.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                </div>
              ) : wishlist.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Aún no agregas ningún producto a tus favoritos.
                </div>
              ) : (
                <div className="grid-3" style={{ gap: '20px' }}>
                  {wishlist.map((item) => {
                    const prod = item.product || item; // soporte estructura de respuesta
                    const productId = item.productId || prod.id;
                    const slug = item.productSlug || prod.slug;
                    return (
                      <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', position: 'relative' }}>
                        {/* Remove favorite */}
                        <button
                          onClick={() => handleRemoveFavorite(productId)}
                          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '12px' }}>
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                            alt={prod.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </div>

                        <h4 style={{ fontSize: '14px', fontWeight: '700', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '38px', marginBottom: '6px', textAlign: 'left' }}>
                          {prod.name}
                        </h4>

                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-black)', display: 'block', textAlign: 'left', marginBottom: '12px' }}>
                          {formatCLP(prod.price)}
                        </span>

                        <Link to={`/product/${slug}`} className="btn btn-black" style={{ padding: '8px', fontSize: '13px', marginTop: 'auto' }}>
                          Comprar Ahora
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4.5: BUZÓN DE NOTIFICACIONES */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '4px' }}>
                  Buzón de Mensajes
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Historial de notificaciones y correos simulados de tus compras.
                </p>
              </div>

              {notifLoading && notifications.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Inbox size={40} style={{ color: 'var(--text-tertiary)' }} />
                  <span>Tu buzón de mensajes está vacío.</span>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '320px 1fr',
                  gap: '24px',
                  height: '580px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-sm)'
                }} className="mailbox-container">
                  
                  {/* Left panel: Email List */}
                  <div style={{
                    borderRight: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-secondary)'
                  }}>
                    {notifications.map((notif) => {
                      const isSelected = selectedNotif?.id === notif.id;
                      const isRead = notif.read !== undefined ? notif.read : notif.isRead;
                      const formattedDate = notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('es-CL', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      }) : '';

                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setSelectedNotif(notif);
                            if (!isRead) {
                              handleMarkAsRead(notif.id);
                            }
                          }}
                          style={{
                            padding: '16px',
                            borderBottom: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            position: 'relative',
                            backgroundColor: isSelected ? 'var(--color-gold-light)' : 'transparent',
                            borderLeft: isSelected ? '3px solid var(--color-gold)' : '3px solid transparent'
                          }}
                          className="email-item-click"
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {notif.type === 'SELLER_ALERT' ? 'Vendedor' : 'Comprador'}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{formattedDate}</span>
                          </div>

                          <h4 style={{
                            fontSize: '13px',
                            fontWeight: isRead ? '600' : '800',
                            color: isRead ? 'var(--text-primary)' : 'var(--color-black)',
                            margin: '0 0 6px 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            paddingRight: '12px'
                          }}>
                            {notif.subject}
                          </h4>

                          <p style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4'
                          }}>
                            {notif.body?.replace(/<[^>]*>/g, '') || ''}
                          </p>

                          {!isRead && (
                            <div style={{
                              position: 'absolute',
                              right: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-gold)',
                              boxShadow: '0 0 6px var(--color-gold)'
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Right panel: Viewer */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    backgroundColor: 'var(--bg-primary)',
                    padding: '24px'
                  }}>
                    {selectedNotif ? (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{
                          borderBottom: '1px solid var(--border-light)',
                          paddingBottom: '16px',
                          marginBottom: '20px',
                          textAlign: 'left'
                        }}>
                          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-black)', marginBottom: '8px' }}>
                            {selectedNotif.subject}
                          </h2>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <div><strong>De:</strong> MarketPrime.cl &lt;no-reply@marketprime.cl&gt;</div>
                            <div><strong>Para:</strong> {selectedNotif.recipientEmail}</div>
                            <div><strong>Fecha:</strong> {selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleString('es-CL') : ''}</div>
                          </div>
                        </div>

                        <div style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: '24px',
                          overflowY: 'auto',
                          flex: 1,
                          textAlign: 'left',
                          boxShadow: 'var(--shadow-sm)',
                          color: 'var(--text-primary)'
                        }}>
                          <div dangerouslySetInnerHTML={{ __html: selectedNotif.body }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-tertiary)' }}>
                        <Mail size={48} style={{ color: 'var(--text-tertiary)' }} />
                        <span>Selecciona un mensaje de la lista para leerlo</span>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 5: MI TIENDA */}
          {activeTab === 'store' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-black)', marginBottom: '8px' }}>
                  Gestión de Mi Tienda
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Solicita y revisa el estado de tu cuenta de vendedor en MarketPrime.cl
                </p>
              </div>

              {loadingStore ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                </div>
              ) : hasStore ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Status Banner */}
                  {storeProfile?.status === 'PENDING' && (
                    <div className="card" style={{
                      backgroundColor: 'var(--color-gold-light)',
                      borderLeft: '4px solid var(--color-gold)',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <ShieldAlert size={24} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>
                          Solicitud en Evaluación
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          Tu solicitud para la tienda <strong>"{storeProfile.storeName}"</strong> está siendo revisada por el equipo de administración de MarketPrime.cl. Te enviaremos una notificación cuando sea aprobada y tu panel de ventas se desbloquee automáticamente.
                        </p>
                      </div>
                    </div>
                  )}

                  {storeProfile?.status === 'ACTIVE' && (
                    <div className="card" style={{
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      borderLeft: '4px solid #4CAF50',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <CheckCircle size={24} style={{ color: '#4CAF50', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>
                          Tienda Activa
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                          ¡Felicitaciones! Tu tienda <strong>"{storeProfile.storeName}"</strong> está aprobada y completamente operativa. Ya puedes comenzar a subir tus productos y gestionar pedidos.
                        </p>
                        <Link to="/seller/dashboard" className="btn btn-black" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px' }}>
                          <Store size={16} /> Ir al Panel de Vendedor
                        </Link>
                      </div>
                    </div>
                  )}

                  {storeProfile?.status === 'SUSPENDED' && (
                    <div className="card" style={{
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      borderLeft: '4px solid #F44336',
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <ShieldAlert size={24} style={{ color: '#F44336', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>
                          Tienda Suspendida
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          Tu tienda <strong>"{storeProfile.storeName}"</strong> ha sido suspendida temporalmente por la administración del marketplace. Para reactivar tu cuenta, ponte en contacto con nuestro equipo de soporte técnico.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Store Details Card */}
                  <div className="card" style={{ padding: '32px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '20px' }}>
                      Detalles de la Tienda
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>Nombre</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-black)', fontSize: '14px' }}>{storeProfile?.storeName}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>Enlace (Slug)</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-gold)', fontSize: '14px' }}>marketprime.cl/store/{storeProfile?.slug}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>Descripción</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{storeProfile?.description || 'Sin descripción.'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>Tasa de Comisión</span>
                        <span style={{ fontWeight: '700', color: 'var(--color-black)', fontSize: '14px' }}>{storeProfile?.commissionRate}%</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', paddingBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}>Fecha Registro</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{storeProfile?.createdAt ? new Date(storeProfile.createdAt).toLocaleDateString('es-CL') : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <div className="card" style={{ padding: '32px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '8px' }}>
                    Solicitud de Tienda Nueva
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Completa la información a continuación para postular como tienda en MarketPrime.cl. Nuestro equipo revisará la solicitud a la brevedad.
                  </p>

                  <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="store-name">Nombre de la Tienda</label>
                      <input
                        id="store-name"
                        type="text"
                        className="form-input"
                        placeholder="Mi Tienda Premium"
                        value={storeForm.storeName}
                        onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="store-slug">Slug único de la tienda</label>
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '12px',
                          color: 'var(--text-tertiary)',
                          fontSize: '14px',
                          pointerEvents: 'none'
                        }}>
                          marketprime.cl/store/
                        </span>
                        <input
                          id="store-slug"
                          type="text"
                          className="form-input"
                          placeholder="mi-tienda-premium"
                          value={storeForm.slug}
                          onChange={(e) => setStoreForm({ ...storeForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          style={{ paddingLeft: '155px' }}
                          required
                        />
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                        Solo minúsculas, números y guiones. Es la URL directa de tu local.
                      </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="store-desc">Descripción de la Tienda</label>
                      <textarea
                        id="store-desc"
                        className="form-input"
                        placeholder="Describe qué productos ofreces en tu tienda..."
                        value={storeForm.description}
                        onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                        rows="4"
                        style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', padding: '12px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="submit" className="btn btn-black" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600' }}>
                        Enviar Solicitud de Tienda
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      <style>{`
        .profile-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 40px;
          align-items: start;
        }
        .profile-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .profile-form-row-2 {
          grid-template-columns: 1.2fr 1fr;
        }
        .profile-form-row-3 {
          grid-template-columns: 1fr 1.2fr 1.2fr;
        }
        .profile-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 868px) {
          .profile-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .profile-form-row, .profile-form-row-2, .profile-form-row-3, .profile-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
