import React, { useState, useEffect } from 'react';
import { 
  Shield, Store, ShoppingBag, TrendingUp, CheckCircle, AlertCircle, XCircle, 
  ExternalLink, RefreshCw, Clock, User, DollarSign, Percent, Award, AlertTriangle,
  Edit2, Check, X
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { formatCLP } from '../services/utils';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'stores', 'orders'
  const [storeFilterStatus, setStoreFilterStatus] = useState('PENDING'); // 'PENDING', 'ACTIVE', 'SUSPENDED'

  // Data States
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // KPI Metrics States
  const [stats, setStats] = useState({
    pendingStoresCount: 0,
    activeStoresCount: 0,
    suspendedStoresCount: 0,
    totalStoresCount: 0,
    totalOrdersCount: 0,
    globalVolume: 0
  });

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionStoreId, setActionStoreId] = useState(null); // tracking individual store loading actions
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Inline Commission Edit States
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editCommissionRate, setEditCommissionRate] = useState('');

  // Initial Fetch & Refresh
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'stores') {
      fetchStores();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, storeFilterStatus]);

  // Fetch KPI statistics in parallel for accuracy
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Request all store states in parallel to compile accurate counts
      const [pendingRes, activeRes, suspendedRes, ordersRes] = await Promise.all([
        api.get('/api/admin/stores', { params: { status: 'PENDING', size: 1 } }),
        api.get('/api/admin/stores', { params: { status: 'ACTIVE', size: 1 } }),
        api.get('/api/admin/stores', { params: { status: 'SUSPENDED', size: 1 } }),
        api.get('/api/admin/orders', { params: { size: 100 } }) // fetch up to 100 global orders for stat calculation
      ]);

      const pending = pendingRes.data?.totalElements || 0;
      const active = activeRes.data?.totalElements || 0;
      const suspended = suspendedRes.data?.totalElements || 0;

      const orderList = ordersRes.data?.content || ordersRes.data || [];
      const totalOrders = ordersRes.data?.totalElements || orderList.length || 0;

      // Sum all transaction volumes
      const volume = orderList.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

      setStats({
        pendingStoresCount: pending,
        activeStoresCount: active,
        suspendedStoresCount: suspended,
        totalStoresCount: pending + active + suspended,
        totalOrdersCount: totalOrders,
        globalVolume: volume
      });
    } catch (err) {
      console.error('Error fetching admin statistics:', err);
      setError('No pudimos actualizar las métricas de la plataforma.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/stores', { 
        params: { status: storeFilterStatus, size: 50 } 
      });
      setStores(response.data?.content || response.data || []);
    } catch (err) {
      console.error('Error loading stores list:', err);
      setError('Error al obtener la lista de tiendas registradas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/orders', { 
        params: { size: 50, sort: 'createdAt,desc' } 
      });
      // Admin orders returns PageResponse record
      setOrders(response.data?.content || response.data || []);
    } catch (err) {
      console.error('Error loading global orders:', err);
      setError('Error al obtener la auditoría de transacciones.');
    } finally {
      setLoading(false);
    }
  };

  // One-click approval / suspension actions
  const handleApproveStore = async (storeId, storeName) => {
    setError(null);
    setLoadingAction(true);
    setActionStoreId(storeId);
    try {
      await api.post(`/api/admin/stores/${storeId}/approve`);
      setSuccessMsg(`¡La tienda "${storeName}" ha sido aprobada con éxito!`);
      
      // Update statistics and reload store list
      fetchStats();
      fetchStores();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error approving store:', err);
      setError(err.response?.data?.detail || 'Error al intentar aprobar la tienda.');
    } finally {
      setLoadingAction(false);
      setActionStoreId(null);
    }
  };

  const handleSuspendStore = async (storeId, storeName) => {
    if (!window.confirm(`¿Estás seguro de que deseas suspender la tienda "${storeName}"? El vendedor perderá acceso a su catálogo.`)) {
      return;
    }
    setError(null);
    setLoadingAction(true);
    setActionStoreId(storeId);
    try {
      await api.post(`/api/admin/stores/${storeId}/suspend`);
      setSuccessMsg(`La tienda "${storeName}" ha sido suspendida.`);
      
      // Update statistics and reload store list
      fetchStats();
      fetchStores();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error suspending store:', err);
      setError(err.response?.data?.detail || 'Error al intentar suspender la tienda.');
    } finally {
      setLoadingAction(false);
      setActionStoreId(null);
    }
  };

  const handleSaveCommission = async (storeId) => {
    const rate = parseFloat(editCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('La comisión debe ser un número entre 0 y 100.');
      return;
    }
    setError(null);
    setLoadingAction(true);
    setActionStoreId(storeId);
    try {
      await api.patch(`/api/admin/stores/${storeId}/commission`, null, {
        params: { rate: rate.toFixed(2) }
      });
      setSuccessMsg('Comisión comercial actualizada con éxito.');
      setEditingStoreId(null);
      
      // Refresh stats and stores
      fetchStats();
      fetchStores();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating commission:', err);
      setError(err.response?.data?.detail || 'Error al actualizar la comisión.');
    } finally {
      setLoadingAction(false);
      setActionStoreId(null);
    }
  };

  // Order Status Badges Helpers
  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': 
        return <span className="badge badge-warning" style={{ border: 'none' }}><Clock size={12} /> Pendiente</span>;
      case 'CONFIRMED': 
        return <span className="badge badge-success" style={{ border: 'none' }}><CheckCircle size={12} /> Confirmado</span>;
      case 'SHIPPED': 
        return <span className="badge badge-neutral" style={{ backgroundColor: '#e3f2fd', color: '#1565c0', border: 'none' }}><TrendingUp size={12} /> Enviado</span>;
      case 'DELIVERED': 
        return <span className="badge badge-success" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: 'none' }}><CheckCircle size={12} /> Entregado</span>;
      case 'CANCELLED': 
        return <span className="badge badge-error" style={{ border: 'none' }}><XCircle size={12} /> Cancelado</span>;
      default: 
        return <span className="badge badge-neutral" style={{ border: 'none' }}>{status}</span>;
    }
  };

  return (
    <div className="fade-in container" style={{ padding: '40px 0 64px 0' }}>
      
      {/* Upper Premium Admin Banner */}
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
        {/* Subtle geometric gold gradient decoration background */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(197,160,89,0.18) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ textAlign: 'left', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Shield size={28} style={{ color: 'var(--color-gold)' }} />
            <h1 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px', color: '#ffffff' }}>
              Consola de Administración
            </h1>
            <span className="badge" style={{
              fontSize: '11px',
              padding: '4px 8px',
              fontWeight: '700',
              backgroundColor: 'rgba(197,160,89,0.2)',
              color: 'var(--color-gold)',
              border: '1px solid rgba(197,160,89,0.3)',
              textTransform: 'uppercase'
            }}>
              Master Admin
            </span>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', maxWidth: '600px' }}>
            Supervisión global de MarketPrime.cl: control de admisión de tiendas premium, auditoría de transacciones y estados operativos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
          <button 
            onClick={() => { fetchStats(); if (activeTab === 'stores') fetchStores(); if (activeTab === 'orders') fetchOrders(); }} 
            className="btn btn-outline" 
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinner' : ''} style={{ border: 'none', animationDuration: '1.5s' }} /> 
            Sincronizar Datos
          </button>
        </div>
      </div>

      {/* Navigation and Tabs Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
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
            Métricas de Plataforma
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'stores' ? '700' : '500',
              color: activeTab === 'stores' ? 'var(--color-gold)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'stores' ? '2px solid var(--color-gold)' : '2px solid transparent',
              transition: 'all var(--transition-fast)'
            }}
          >
            Validación de Tiendas {stats.pendingStoresCount > 0 && (
              <span style={{
                marginLeft: '6px',
                padding: '2px 6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--text-white)',
                fontSize: '10px',
                fontWeight: '700'
              }}>{stats.pendingStoresCount}</span>
            )}
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
            Auditoría de Órdenes
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="badge badge-success fade-in" style={{ padding: '16px 24px', width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '10px', fontSize: '14px', fontWeight: '600', border: 'none' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div className="badge badge-error fade-in" style={{ padding: '16px 24px', width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '10px', fontSize: '14px', border: 'none' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* ==========================================
          TAB 1: PLATFORM METRICS SUMMARY
          ========================================== */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Actionable Banner for Pending Stores */}
          {stats.pendingStoresCount > 0 && (
            <div className="card fade-in" style={{
              backgroundColor: 'var(--color-gold-light)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197, 160, 89, 0.1)',
                  color: 'var(--color-gold)'
                }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-black)' }}>
                    Hay solicitudes de tienda pendientes de aprobación
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Existen <strong style={{ color: 'var(--color-gold)' }}>{stats.pendingStoresCount} tienda(s)</strong> postuladas que esperan revisión para obtener credenciales comerciales.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setActiveTab('stores'); setStoreFilterStatus('PENDING'); }} 
                className="btn btn-gold"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Evaluar Solicitudes
              </button>
            </div>
          )}

          {/* Grid of 4 Key Indicators */}
          <div className="grid-4">
            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#efebe9', color: '#5d4037' }}>
                <Store size={28} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tiendas Afiliadas
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-black)', marginTop: '4px' }}>
                  {stats.totalStoresCount}
                </h3>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-gold-light)', color: 'var(--color-gold)' }}>
                <TrendingUp size={28} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Volumen Global ($)
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-black)', marginTop: '4px' }}>
                  {formatCLP(stats.globalVolume)}
                </h3>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(76,175,80,0.1)', color: '#388e3c' }}>
                <ShoppingBag size={28} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Órdenes Totales
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-black)', marginTop: '4px' }}>
                  {stats.totalOrdersCount}
                </h3>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,152,0,0.1)', color: 'var(--color-warning)' }}>
                <Clock size={28} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tiendas Pendientes
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: stats.pendingStoresCount > 0 ? 'var(--color-warning)' : 'var(--color-black)', marginTop: '4px' }}>
                  {stats.pendingStoresCount} solicitudes
                </h3>
              </div>
            </div>
          </div>

          {/* Platform Performance & Auditing Panel */}
          <div className="grid-2">
            <div className="card" style={{ padding: '32px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--color-gold)' }} />
                Políticas de Admisión y Comisión
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                Como administrador en <strong>MarketPrime.cl</strong>, eres responsable de la validación técnica y comercial de los postulantes. 
                Cada tienda aprobada adquiere de inmediato el rol <code style={{ backgroundColor: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>ROLE_SELLER</code>, permitiendo a sus dueños catalogar productos premium.
              </p>
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tasa de Comisión Promedio:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-black)' }}>10.0% por transacción</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tiempo Estimado de Revisión:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-black)' }}>&lt; 24 horas hábiles</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '32px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={18} style={{ color: 'var(--color-gold)' }} />
                Métricas Operacionales
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Tiendas Activas</span>
                  <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-success)', marginTop: '4px' }}>{stats.activeStoresCount}</h4>
                </div>
                <div style={{ border: '1px solid var(--border-light)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>Tiendas Suspendidas</span>
                  <h4 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-error)', marginTop: '4px' }}>{stats.suspendedStoresCount}</h4>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px' }}>
                Las tiendas suspendidas ocultan automáticamente todos sus productos del catálogo de búsqueda pública.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: STORE APPROVAL & MANAGEMENT
          ========================================== */}
      {activeTab === 'stores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tab Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button
                onClick={() => setStoreFilterStatus('PENDING')}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: storeFilterStatus === 'PENDING' ? 'var(--color-black)' : 'transparent',
                  color: storeFilterStatus === 'PENDING' ? 'var(--text-white)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600'
                }}
              >
                Pendientes ({stats.pendingStoresCount})
              </button>
              <button
                onClick={() => setStoreFilterStatus('ACTIVE')}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: storeFilterStatus === 'ACTIVE' ? 'var(--color-black)' : 'transparent',
                  color: storeFilterStatus === 'ACTIVE' ? 'var(--text-white)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600'
                }}
              >
                Activas ({stats.activeStoresCount})
              </button>
              <button
                onClick={() => setStoreFilterStatus('SUSPENDED')}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: 'none',
                  backgroundColor: storeFilterStatus === 'SUSPENDED' ? 'var(--color-black)' : 'transparent',
                  color: storeFilterStatus === 'SUSPENDED' ? 'var(--text-white)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600'
                }}
              >
                Suspendidas ({stats.suspendedStoresCount})
              </button>
            </div>
          </div>

          {/* Stores Table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
              </div>
            ) : stores.length === 0 ? (
              <div style={{ padding: '64px 32px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <Store size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>
                  No hay tiendas en esta sección
                </h3>
                <p style={{ fontSize: '14px' }}>
                  No se encontraron tiendas registradas con el estado actual ({storeFilterStatus}).
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Tienda</th>
                      <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Dueño</th>
                      <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Comisión</th>
                      <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Fecha de Solicitud</th>
                      <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Estado</th>
                      <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color var(--transition-fast)' }} className="table-row-hover">
                        <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-light)', color: 'var(--color-gold)' }}>
                            <Store size={20} />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '2px' }}>{st.storeName}</h4>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>/{st.slug}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-black)' }}>{st.ownerFirstName || 'Vendedor'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{st.ownerEmail}</span>
                          </div>
                        </td>
                        {editingStoreId === st.id ? (
                          <td style={{ padding: '12px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1" 
                                value={editCommissionRate}
                                onChange={(e) => setEditCommissionRate(e.target.value)}
                                style={{
                                  width: '75px',
                                  padding: '6px 10px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--color-gold)',
                                  backgroundColor: 'var(--bg-primary)',
                                  color: 'var(--color-black)',
                                  outline: 'none',
                                  boxShadow: '0 0 0 2px rgba(197, 160, 89, 0.2)'
                                }}
                              />
                              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-black)' }}>%</span>
                              <button 
                                onClick={() => handleSaveCommission(st.id)}
                                style={{
                                  background: 'var(--color-success)',
                                  border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#ffffff',
                                  transition: 'transform 0.15s ease'
                                }}
                                title="Guardar"
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => { setEditingStoreId(null); setEditCommissionRate(''); }}
                                style={{
                                  background: '#eceff1',
                                  border: 'none',
                                  borderRadius: 'var(--radius-sm)',
                                  width: '28px',
                                  height: '28px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: 'var(--text-secondary)',
                                  transition: 'transform 0.15s ease'
                                }}
                                title="Cancelar"
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        ) : (
                          <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'var(--color-black)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>
                                {st.commissionRate !== undefined && st.commissionRate !== null ? `${Number(st.commissionRate).toFixed(1)}%` : '10.0%'}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingStoreId(st.id);
                                  setEditCommissionRate(st.commissionRate !== undefined && st.commissionRate !== null ? st.commissionRate.toString() : '10.0');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  color: 'var(--text-tertiary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                  transition: 'color var(--transition-fast), background-color var(--transition-fast)'
                                }}
                                title="Editar comisión"
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-gold)'; e.currentTarget.style.backgroundColor = 'var(--color-gold-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {new Date(st.createdAt || Date.now()).toLocaleDateString('es-CL')}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                          <span className="badge" style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            border: 'none',
                            backgroundColor: st.status === 'ACTIVE' ? 'var(--color-success-bg)' : st.status === 'PENDING' ? 'var(--color-warning-bg)' : 'var(--color-error-bg)',
                            color: st.status === 'ACTIVE' ? 'var(--color-success)' : st.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-error)',
                            textTransform: 'uppercase'
                          }}>
                            {st.status === 'ACTIVE' ? 'Activo' : st.status === 'PENDING' ? 'Pendiente' : 'Suspendido'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {st.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveStore(st.id, st.storeName)}
                                  className="btn btn-gold"
                                  style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                                  disabled={loadingAction}
                                >
                                  {loadingAction && actionStoreId === st.id ? 'Aprobando...' : 'Aprobar'}
                                </button>
                                <button
                                  onClick={() => handleSuspendStore(st.id, st.storeName)}
                                  className="btn btn-outline"
                                  style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-error)', borderColor: 'rgba(183,28,28,0.2)' }}
                                  disabled={loadingAction}
                                >
                                  Suspender
                                </button>
                              </>
                            )}

                            {st.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleSuspendStore(st.id, st.storeName)}
                                className="btn btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-error)', borderColor: 'rgba(183,28,28,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                disabled={loadingAction}
                              >
                                <XCircle size={12} /> Suspender
                              </button>
                            )}

                            {st.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleApproveStore(st.id, st.storeName)}
                                className="btn btn-gold"
                                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                                disabled={loadingAction}
                              >
                                Reactivar / Aprobar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: GLOBAL ORDER HISTORY
          ========================================== */}
      {activeTab === 'orders' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '64px 32px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '6px' }}>No hay ventas registradas</h3>
              <p style={{ fontSize: '14px' }}>Aún no se han registrado transacciones comerciales globales en MarketPrime.cl.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>ID Pedido / Fecha</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Artículos</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Transacción</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Dirección de Despacho</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color var(--transition-fast)' }} className="table-row-hover">
                      <td style={{ padding: '16px 24px', textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-black)', fontFamily: 'monospace' }}>
                          #{ord.id.substring(0, 8).toUpperCase()}
                        </h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {new Date(ord.createdAt || Date.now()).toLocaleDateString('es-CL')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--color-black)', fontWeight: '600' }}>
                        {ord.totalItems || 1} artículo(s)
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'var(--color-black)' }}>
                        {formatCLP(ord.totalAmount)}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }} title={ord.shippingAddressSnapshot}>
                        {ord.shippingAddressSnapshot || 'No disponible'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                        {getOrderStatusBadge(ord.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
