import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Store, ShoppingBag, Plus, Edit, Trash2, ShieldAlert, CheckCircle, 
  AlertCircle, DollarSign, Box, Image as ImageIcon, ExternalLink, RefreshCw, ChevronRight, X, Upload, Mail, Inbox, Settings
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import useToastStore from '../store/useToastStore';
import { formatCLP } from '../services/utils';

const SellerDashboard = () => {
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'products', 'orders'
  
  // Data States
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  // Notificaciones / Alertas por Correo
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modals / Form States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    salePrice: '',
    stockQuantity: '10',
    categoryId: '',
    imageUrl: '',
    status: 'ACTIVE'
  });

  const [settingsForm, setSettingsForm] = useState({
    storeName: '',
    description: '',
    logoUrl: '',
    bannerUrl: ''
  });

  useEffect(() => {
    fetchStoreData();
    fetchCategories();
    fetchUnreadCount();

    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['summary', 'products', 'orders', 'notifications', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Escuchar actualización de notificaciones
  useEffect(() => {
    const handleNotifUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notifications-updated', handleNotifUpdate);
    return () => window.removeEventListener('notifications-updated', handleNotifUpdate);
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchStoreData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/stores/me');
      setStore(response.data);
      if (response.data) {
        setSettingsForm({
          storeName: response.data.storeName || '',
          description: response.data.description || '',
          logoUrl: response.data.logoUrl || '',
          bannerUrl: response.data.bannerUrl || ''
        });
      }
    } catch (err) {
      console.error('Error fetching store details:', err);
      setError('No pudimos cargar los detalles de tu tienda.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/products/mine');
      setProducts(response.data?.content || response.data || []);
    } catch (err) {
      console.error('Error loading seller products:', err);
      setError('Error al obtener la lista de productos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/seller/orders');
      setOrders(response.data?.content || response.data || []);
    } catch (err) {
      console.error('Error loading seller orders:', err);
      setError('Error al obtener la lista de pedidos recibidos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      setUnreadCount(response.data || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const fetchNotifications = async () => {
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
      fetchUnreadCount();
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Autogenerar slug
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setProductForm({
      ...productForm,
      name,
      slug: editingProduct ? productForm.slug : slug
    });
  };

  // CRUD Product Actions
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setIsUploading(false);
    setProductForm({
      name: '',
      slug: '',
      description: '',
      basePrice: '',
      salePrice: '',
      stockQuantity: '10',
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      status: 'ACTIVE'
    });
    setError(null);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    const primaryImg = prod.imageUrl || (prod.images && prod.images.find(img => img.primary)?.imageUrl) || '';
    setImagePreview(primaryImg);
    setProductForm({
      name: prod.name || '',
      slug: prod.slug || '',
      description: prod.description || '',
      basePrice: prod.basePrice?.toString() || '',
      salePrice: prod.salePrice?.toString() || '',
      stockQuantity: prod.stockQuantity?.toString() || '0',
      categoryId: prod.category?.id || prod.categoryId || '',
      imageUrl: primaryImg,
      status: prod.status || 'ACTIVE'
    });
    setError(null);
    setShowProductModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError(null);
    setLoadingAction(true);

    const payload = {
      name: productForm.name,
      slug: productForm.slug,
      description: productForm.description,
      basePrice: parseFloat(productForm.basePrice),
      salePrice: productForm.salePrice ? parseFloat(productForm.salePrice) : null,
      stockQuantity: parseInt(productForm.stockQuantity, 10),
      categoryId: productForm.categoryId
    };

    try {
      let savedProduct;
      if (editingProduct) {
        // Incluir status al actualizar
        const updatePayload = { ...payload, status: productForm.status };
        const response = await api.patch(`/api/products/${editingProduct.id}`, updatePayload);
        savedProduct = response.data;
        showToast('¡Producto actualizado con éxito!', 'success');
      } else {
        const response = await api.post('/api/products', payload);
        savedProduct = response.data;
        showToast('¡Producto creado con éxito!', 'success');
      }

      // Subir archivo físico si está seleccionado
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('primary', 'true');
        if (productForm.name) {
          formData.append('altText', productForm.name);
        }

        await api.post(`/api/products/${savedProduct.id}/images/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
        showToast('¡Imagen física subida y enlazada con éxito!', 'success');
      } else if (productForm.imageUrl && productForm.imageUrl !== (editingProduct?.imageUrl || (editingProduct?.images && editingProduct.images.find(img => img.primary)?.imageUrl))) {
        // Enlazar imagen vía URL si ha cambiado o es nueva
        await api.post(`/api/products/${savedProduct.id}/images?url=${encodeURIComponent(productForm.imageUrl)}&primary=true`);
      }

      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.detail || 'Error al guardar el producto. Verifica que los campos sean válidos y el slug sea único.');
      showToast(err.response?.data?.detail || 'Error al guardar el producto.', 'error');
    } finally {
      setLoadingAction(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto permanentemente?')) return;
    setLoadingAction(true);
    try {
      await api.delete(`/api/products/${productId}`);
      showToast('Producto eliminado de tu catálogo.', 'info');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast(err.response?.data?.detail || 'Error al eliminar el producto.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Order Status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setLoadingAction(true);
    try {
      await api.patch(`/api/seller/orders/${orderId}/status`, { status: newStatus });
      showToast('¡Estado del pedido actualizado con éxito!', 'success');
      fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      showToast(err.response?.data?.detail || 'Error al cambiar el estado del pedido.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError(null);
    setLoadingAction(true);
    try {
      const response = await api.patch('/api/stores/me', settingsForm);
      setStore(response.data);
      showToast('¡Configuración de tienda guardada con éxito!', 'success');
    } catch (err) {
      console.error('Error saving store settings:', err);
      setError(err.response?.data?.detail || 'Error al guardar la configuración de la tienda.');
      showToast('Error al guardar la configuración.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // KPIs helpers
  const getTotalProducts = () => products.length;
  const getLowStockProducts = () => products.filter(p => p.stockQuantity < 5).length;
  const getRevenue = () => {
    // Calcular en base a órdenes pagadas (CONFIRMED, SHIPPED, DELIVERED)
    return orders
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
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
      
      {/* Upper Store Banner */}
      {store && (
        <div className="card" style={{
          padding: '32px',
          backgroundColor: 'var(--color-black)',
          color: 'var(--text-white)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          {/* Subtle gold decoration background */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(197,160,89,0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}></div>

          <div style={{ textAlign: 'left', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Store size={28} style={{ color: 'var(--color-gold)' }} />
              <h1 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px', color: '#ffffff' }}>
                {store.storeName}
              </h1>
              <span className={`badge`} style={{
                fontSize: '11px',
                padding: '4px 8px',
                fontWeight: '600',
                backgroundColor: store.status === 'ACTIVE' ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)',
                color: store.status === 'ACTIVE' ? '#81c784' : '#ffb74d',
                border: 'none',
                textTransform: 'uppercase'
              }}>
                {store.status === 'ACTIVE' ? 'Activa' : 'Pendiente'}
              </span>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', maxWidth: '600px' }}>
              {store.description || 'Sin descripción de tienda disponible.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
            <a href={`/search?store=${store.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Ver Tienda Pública <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Navigation and Actions Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'summary' ? '700' : '500',
              color: activeTab === 'summary' ? 'var(--color-gold)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'summary' ? '2px solid var(--color-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'products' ? '700' : '500',
              color: activeTab === 'products' ? 'var(--color-gold)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'products' ? '2px solid var(--color-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            Mis Productos
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'orders' ? '700' : '500',
              color: activeTab === 'orders' ? 'var(--color-gold)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'orders' ? '2px solid var(--color-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            Pedidos Recibidos
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'notifications' ? '700' : '500',
              color: activeTab === 'notifications' ? 'var(--color-gold)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'notifications' ? '2px solid var(--color-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Mail size={16} /> Buzón de Mensajes
            {unreadCount > 0 && (
              <span className="badge-count-gold" style={{
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
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'settings' ? '700' : '500',
              color: activeTab === 'settings' ? 'var(--color-gold)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'settings' ? '2px solid var(--color-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={16} /> Configuración
          </button>
        </div>

        {/* Global actions */}
        {activeTab === 'products' && (
          <button onClick={handleOpenCreateModal} className="btn btn-black" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Agregar Producto
          </button>
        )}
      </div>

      {/* Global Alerts */}
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

      {/* ==========================================
          TAB 1: RESUMEN / DASHBOARD HOME
          ========================================== */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* KPI Cards Grid */}
          <div className="grid-3">
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-gold-light)', color: 'var(--color-gold)' }}>
                <DollarSign size={28} />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ventas Estimadas
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-black)', marginTop: '4px' }}>
                  {formatCLP(getRevenue())}
                </h3>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#efebe9', color: '#5d4037' }}>
                <Box size={28} />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Catálogo
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-black)', marginTop: '4px' }}>
                  {getTotalProducts()} productos
                </h3>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: getLowStockProducts() > 0 ? 'var(--color-error-bg)' : 'rgba(76,175,80,0.1)', color: getLowStockProducts() > 0 ? 'var(--color-error)' : '#388e3c' }}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Stock Crítico
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: getLowStockProducts() > 0 ? 'var(--color-error)' : 'var(--color-black)', marginTop: '4px' }}>
                  {getLowStockProducts()} items
                </h3>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="card" style={{ padding: '32px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '16px' }}>
              ¡Bienvenido al Panel del Vendedor de MarketPrime.cl!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              Desde este portal sofisticado, tienes el control absoluto sobre tus ventas y catálogo de comercio electrónico. Agrega productos con configuraciones de precio base y precios de oferta, controla tu inventario, y actualiza el estado de tus envíos de forma fluida.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ border: '1px solid var(--border-light)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Plus size={16} style={{ color: 'var(--color-gold)' }} /> Cargar un catálogo premium
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Sube productos únicos especificando su stock. Los compradores verán tus ofertas en tiempo real y el stock se descontará de manera automática.
                </p>
              </div>
              <div style={{ border: '1px solid var(--border-light)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ShoppingBag size={16} style={{ color: 'var(--color-gold)' }} /> Despachos coordinados
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Actualiza el estado de tus despachos a <strong style={{ color: 'var(--color-gold)' }}>SHIPPED</strong> (Enviado) o <strong style={{ color: '#4caf50' }}>DELIVERED</strong> (Entregado) para notificar al cliente del estado de su orden.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: PRODUCT CRUD MANAGEMENT
          ========================================== */}
      {activeTab === 'products' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading && products.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '64px 32px', textDecoration: 'none', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <Box size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>No has agregado productos</h3>
              <p style={{ fontSize: '14px', marginBottom: '24px' }}>Comienza a construir tu catálogo subiendo tu primer producto en MarketPrime.cl.</p>
              <button onClick={handleOpenCreateModal} className="btn btn-black">
                <Plus size={16} /> Crear mi Primer Producto
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Producto</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Categoría</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Precio Base</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Precio Oferta</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Stock</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Estado</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color var(--transition-fast)' }} className="table-row-hover">
                      <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-light)' }}>
                          <img
                            src={prod.imageUrl || (prod.images && prod.images.find(img => img.primary)?.imageUrl) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'}
                            alt={prod.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '2px' }}>{prod.name}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>SKU: {prod.slug}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {prod.category?.name || 'General'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-black)' }}>
                        {formatCLP(prod.basePrice)}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-gold)' }}>
                        {prod.salePrice ? formatCLP(prod.salePrice) : '-'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '700', color: prod.stockQuantity < 5 ? 'var(--color-error)' : 'var(--color-black)' }}>
                            {prod.stockQuantity}
                          </span>
                          {prod.stockQuantity < 5 && (
                            <span className="badge badge-error" style={{ fontSize: '9px', padding: '2px 4px', border: 'none' }}>Bajo</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                        <span className={`badge`} style={{
                          fontSize: '11px',
                          padding: '3px 6px',
                          border: 'none',
                          backgroundColor: prod.status === 'ACTIVE' ? 'rgba(76,175,80,0.1)' : prod.status === 'PAUSED' ? 'rgba(255,152,0,0.1)' : 'rgba(158,158,158,0.15)',
                          color: prod.status === 'ACTIVE' ? '#2e7d32' : prod.status === 'PAUSED' ? '#ef6c00' : '#424242'
                        }}>
                          {prod.status === 'ACTIVE' ? 'Activo' : prod.status === 'PAUSED' ? 'Pausado' : 'Borrador'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => handleOpenEditModal(prod)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Edit size={12} /> Editar
                          </button>
                          <button onClick={() => handleDeleteProduct(prod.id)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-error)', borderColor: 'rgba(183,28,28,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: SELLER ORDERS MANAGEMENT
          ========================================== */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading && orders.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '64px 32px', textDecoration: 'none', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>No hay ventas registradas</h3>
              <p style={{ fontSize: '14px' }}>Cuando los compradores adquieran tus productos cargados, aparecerán de forma estructurada en esta sección.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>ID Pedido / Fecha</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Cliente</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Artículos Vendidos</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Recibido</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Estado</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'right' }}>Cambiar Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-black)', fontFamily: 'monospace' }}>
                          #{ord.id.substring(0, 8).toUpperCase()}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {new Date(ord.createdAt || Date.now()).toLocaleDateString('es-CL')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        {ord.buyerEmail || 'Cliente Registrado'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {ord.items && ord.items.map((item, idx) => (
                            <span key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                              • {item.productName || 'Producto'} (x{item.quantity})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--color-black)' }}>
                        {formatCLP(ord.totalAmount)}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                        {getStatusBadge(ord.status)}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="form-input"
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            width: '160px',
                            display: 'inline-block',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                          }}
                          disabled={ord.status === 'CANCELLED' || ord.status === 'DELIVERED'}
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="CONFIRMED">Confirmado</option>
                          <option value="SHIPPED">Enviado</option>
                          <option value="DELIVERED">Entregado</option>
                          <option value="CANCELLED">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: BUZÓN DE NOTIFICACIONES / ALERTAS POR CORREO
          ========================================== */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '4px' }}>
              Alertas por Correo
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Historial de avisos de venta, confirmaciones de pago y alertas operativas simuladas para tu tienda.
            </p>
          </div>

          {notifLoading && notifications.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Inbox size={40} style={{ color: 'var(--text-tertiary)' }} />
              <span>No tienes alertas ni notificaciones registradas.</span>
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

      {/* ==========================================
          TAB 5: CONFIGURACIÓN DE LA TIENDA (BANNER Y LOGO)
          ========================================== */}
      {activeTab === 'settings' && (
        <div style={{ textAlign: 'left' }} className="fade-in">
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '4px' }}>
              Configuración de la Tienda
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Personaliza la identidad visual de tu escaparate público en MarketPrime.cl.
            </p>

            {/* Banners & Logo Previews */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Vista Previa de Portada / Banner</span>
                <div style={{
                  height: '140px',
                  borderRadius: '8px',
                  backgroundColor: '#1f1f1f',
                  backgroundImage: settingsForm.bannerUrl ? `url(${settingsForm.bannerUrl})` : 'linear-gradient(135deg, #121212 0%, #2a2a2a 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '13px'
                }}>
                  {!settingsForm.bannerUrl && 'Sin imagen de portada configurada'}
                </div>
              </div>
              <div style={{ width: '140px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Logo / Foto</span>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {settingsForm.logoUrl ? (
                    <img src={settingsForm.logoUrl} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Store size={36} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="settings-name">Nombre de la Tienda</label>
                <input
                  id="settings-name"
                  type="text"
                  className="form-input"
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="settings-desc">Descripción de la Tienda</label>
                <textarea
                  id="settings-desc"
                  className="form-input"
                  rows="4"
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  style={{ fontFamily: 'inherit', padding: '12px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-logo">URL de la Foto / Logo de Tienda</label>
                  <input
                    id="settings-logo"
                    type="url"
                    className="form-input"
                    value={settingsForm.logoUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                    placeholder="https://ejemplo.cl/logo.jpg"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-banner">URL de Foto de Fondo / Banner</label>
                  <input
                    id="settings-banner"
                    type="url"
                    className="form-input"
                    value={settingsForm.bannerUrl}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerUrl: e.target.value })}
                    placeholder="https://ejemplo.cl/banner.jpg"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="submit" className="btn btn-black" style={{ minWidth: '150px' }} disabled={loadingAction}>
                  {loadingAction ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT PRODUCT FORM
          ========================================== */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} className="fade-in">
          <div className="card" style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowProductModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-black)', marginBottom: '4px', textAlign: 'left' }}>
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'left' }}>
              Rellena los detalles técnicos y de inventario de tu artículo para publicarlo.
            </p>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              
              {/* Product Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="prod-name">Nombre del Producto</label>
                <input
                  id="prod-name"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Consola PlayPrime 5"
                  value={productForm.name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              {/* Slug & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-slug">Identificador (Slug)</label>
                  <input
                    id="prod-slug"
                    type="text"
                    className="form-input"
                    placeholder="consola-playprime-5"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    required
                    disabled={!!editingProduct}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-cat">Categoría</label>
                  <select
                    id="prod-cat"
                    className="form-input"
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Selecciona categoría...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="prod-desc">Descripción Detallada</label>
                <textarea
                  id="prod-desc"
                  className="form-input"
                  placeholder="Describe las especificaciones, características y valor añadido de tu producto..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows="4"
                  style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', padding: '12px' }}
                />
              </div>

              {/* Pricing & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="prod-base">Precio Base ($)</label>
                  <input
                    id="prod-base"
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="599990"
                    value={productForm.basePrice}
                    onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-sale">Precio Oferta ($)</label>
                  <input
                    id="prod-sale"
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Opcional"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="prod-stock">Stock Inicial</label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    className="form-input"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Image URL & Status (only in edit) */}
              {/* Image Uploader & Status Container */}
              <div style={{ display: 'grid', gridTemplateColumns: editingProduct ? '1.2fr 1fr' : '1fr', gap: '24px', marginBottom: '20px' }}>
                
                {/* Left Column: Image physical upload & fallback URL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Custom Premium File Selector */}
                  <div className="form-group">
                    <label className="form-label">Imagen Principal del Producto</label>
                    <div style={{
                      border: '2px dashed rgba(197, 160, 89, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      padding: '24px 20px',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-secondary)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(197, 160, 89, 0.4)'}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      />
                      {imagePreview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <img src={imagePreview} alt="Preview" style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: 'var(--radius-md)', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Haz clic o arrastra para cambiar la foto</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--color-gold-light)', color: 'var(--color-gold)', display: 'inline-flex' }}>
                            <Upload size={24} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-black)' }}>Sube una foto real del producto</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Formatos PNG, JPG, WEBP de hasta 10MB</span>
                        </div>
                      )}
                    </div>
                    
                    {isUploading && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
                          <span style={{ color: 'var(--color-gold)' }}>Subiendo imagen...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--color-gold)', transition: 'width 0.2s ease-out' }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible / Fallback URL Input */}
                  <div className="form-group" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    <label className="form-label" htmlFor="prod-img" style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      O introduce una URL de imagen externa (opcional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="prod-img"
                        type="url"
                        className="form-input"
                        placeholder="https://ejemplo.cl/imagen.jpg"
                        value={productForm.imageUrl}
                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        style={{ paddingLeft: '36px' }}
                      />
                      <ImageIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>
                </div>

                {/* Right Column: Status (only in edit) */}
                {editingProduct && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="prod-status">Estado del Producto</label>
                      <select
                        id="prod-status"
                        className="form-input"
                        value={productForm.status}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                        required
                      >
                        <option value="ACTIVE">Activo (Visible)</option>
                        <option value="PAUSED">Pausado (Oculto)</option>
                        <option value="DRAFT">Borrador</option>
                      </select>
                    </div>
                  </div>
                )}

              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn btn-outline"
                  disabled={loadingAction}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-black"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '1.5px' }}></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
