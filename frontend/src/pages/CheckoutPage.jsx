import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ShieldCheck, MapPin, Truck, Plus, Check, CreditCard, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import { REGIONES_CHILE } from '../data/chileData';
import { formatCLP } from '../services/utils';

const CheckoutPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { cart, clearCart, fetchCart } = useCartStore();
  const navigate = useNavigate();

  // Estados
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Éxito de la transacción
  const [createdOrder, setCreatedOrder] = useState(null);

  // Formulario de nueva dirección
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
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
  const [addressError, setAddressError] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      fetchCart();
      loadAddresses();
    }
  }, [isAuthenticated, navigate]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/addresses');
      const data = response.data || [];
      setAddresses(data);
      
      // Auto-seleccionar la dirección predeterminada
      const defaultAddr = data.find(addr => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Error al cargar tus direcciones. Reintenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    setAddressError('');
    setAddressLoading(true);

    const { alias, recipientName, phone, street, number, city, region } = newAddress;
    if (!alias.trim() || !recipientName.trim() || !phone.trim() || !street.trim() || !number.trim() || !city.trim() || !region.trim()) {
      setAddressError('Completa todos los campos obligatorios (*).');
      setAddressLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/addresses', newAddress);
      const created = response.data;
      
      // Añadir y auto-seleccionar
      setAddresses([...addresses, created]);
      setSelectedAddressId(created.id);
      
      // Reset form
      setNewAddress({
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
      setShowAddressForm(false);
    } catch (err) {
      setAddressError(err.response?.data?.detail || 'Error al guardar la dirección.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Por favor selecciona una dirección de envío.');
      return;
    }
    
    setOrderLoading(true);
    setError(null);
    try {
      // 1. Create PENDING Orders (split by store in backend)
      const response = await api.post('/api/orders', {
        shippingAddressId: selectedAddressId
      });
      const orders = response.data;
      
      // 2. Initialize Webpay Plus Transaction for the batch
      const paymentResponse = await api.post('/api/payments/init', {
        orderIds: orders.map(o => o.id)
      });
      const { token, url } = paymentResponse.data;

      // 3. Construct dynamic HTML form and submit to redirect to Transbank
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;

      const tokenInput = document.createElement('input');
      tokenInput.type = 'hidden';
      tokenInput.name = 'token_ws';
      tokenInput.value = token;

      form.appendChild(tokenInput);
      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      console.error('Error initiating checkout payment:', err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Hubo un problema al procesar tu pago con Webpay Plus. Verifica tu stock e intenta nuevamente.'
      );
    } finally {
      setOrderLoading(false);
    }
  };

  // Group cart items by store
  const itemsByStore = React.useMemo(() => {
    const groups = {};
    (cart.items || []).forEach(item => {
      const storeId = item.storeId || 'other';
      const storeName = item.storeName || 'MarketPrime Store';
      const storeSlug = item.storeSlug || '';
      if (!groups[storeId]) {
        groups[storeId] = {
          storeId,
          storeName,
          storeSlug,
          items: [],
          subtotal: 0
        };
      }
      groups[storeId].items.push(item);
      groups[storeId].subtotal += item.subtotal;
    });
    return Object.values(groups);
  }, [cart.items]);

  // Calculate shipping cost per store: $3,990 if store subtotal < $50,000, else $0
  const shippingByStore = React.useMemo(() => {
    const shipping = {};
    itemsByStore.forEach(group => {
      shipping[group.storeId] = group.subtotal >= 50000 ? 0 : 3990;
    });
    return shipping;
  }, [itemsByStore]);

  const totalShippingCost = React.useMemo(() => {
    return Object.values(shippingByStore).reduce((acc, curr) => acc + curr, 0);
  }, [shippingByStore]);

  const finalTotal = cart.totalAmount + totalShippingCost;

  return (
    <div className="fade-in container" style={{ padding: '32px 0 64px 0' }}>
      
      {/* Volver */}
      <Link to="/cart" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px',
        fontWeight: '500'
      }}>
        <ArrowLeft size={16} /> Volver al carro
      </Link>

      <h1 className="title-section" style={{ fontSize: '32px', marginBottom: '32px' }}>Finalizar Compra</h1>

      {error && (
        <div className="badge badge-error" style={{
          width: '100%',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          textAlign: 'left'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
          
          {/* SECCIÓN DIRECCIÓN Y PAGO (Izquierda) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* 1. Direcciones */}
            <div className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={22} style={{ color: 'var(--color-gold)' }} /> 1. Dirección de Envío
              </h2>

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Aún no registras ninguna dirección de despacho.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      style={{
                        padding: '16px',
                        border: selectedAddressId === addr.id ? '2px solid var(--color-black)' : '1px solid var(--border-medium)',
                        backgroundColor: selectedAddressId === addr.id ? 'var(--color-gold-light)' : 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-gold)', display: 'block', marginBottom: '4px' }}>
                          {addr.alias} {addr.isDefault && '(Predeterminada)'}
                        </span>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>
                          {addr.recipientName}
                        </strong>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {addr.street} {addr.number}, {addr.city}, {addr.region}
                        </span>
                      </div>
                      {selectedAddressId === addr.id && (
                        <div style={{
                          backgroundColor: 'var(--color-black)',
                          color: 'var(--text-white)',
                          padding: '4px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Botón Agregar Nueva Dirección */}
              {!showAddressForm ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> Agregar Nueva Dirección
                </button>
              ) : (
                <div style={{
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '20px',
                  marginTop: '20px'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Nueva Dirección de Envío</h3>
                  
                  {addressError && (
                    <div className="badge badge-error" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)', width: '100%', marginBottom: '16px', display: 'flex', gap: '6px' }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{addressError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="alias">Alias (ej. Casa, Oficina) *</label>
                        <input
                          id="alias"
                          type="text"
                          className="form-input"
                          placeholder="Casa"
                          value={newAddress.alias}
                          onChange={(e) => setNewAddress({ ...newAddress, alias: e.target.value })}
                          disabled={addressLoading}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="recipientName">Nombre del Destinatario *</label>
                        <input
                          id="recipientName"
                          type="text"
                          className="form-input"
                          placeholder="Pedro Pérez"
                          value={newAddress.recipientName}
                          onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                          disabled={addressLoading}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="phone">Teléfono de Contacto *</label>
                        <input
                          id="phone"
                          type="text"
                          className="form-input"
                          placeholder="+56912345678"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          disabled={addressLoading}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="street">Calle *</label>
                        <input
                          id="street"
                          type="text"
                          className="form-input"
                          placeholder="Av. Providencia"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          disabled={addressLoading}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="number">Número *</label>
                        <input
                          id="number"
                          type="text"
                          className="form-input"
                          placeholder="1234"
                          value={newAddress.number}
                          onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                          disabled={addressLoading}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="region">Región *</label>
                        <select
                          id="region"
                          className="form-input"
                          value={newAddress.region}
                          onChange={(e) => {
                            const selectedReg = e.target.value;
                            setNewAddress({ ...newAddress, region: selectedReg, city: '' });
                          }}
                          disabled={addressLoading}
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
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          disabled={addressLoading || !newAddress.region}
                          style={{ padding: '8px 12px', height: '40px', cursor: 'pointer', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                        >
                          <option value="">Selecciona Comuna</option>
                          {((REGIONES_CHILE.find(r => r.region === newAddress.region)?.comunas) || []).map((comuna) => (
                            <option key={comuna} value={comuna}>{comuna}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                        disabled={addressLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-black"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                        disabled={addressLoading}
                      >
                        {addressLoading ? 'Guardando...' : 'Guardar Dirección'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

            {/* 2. Simulación de Método de Pago */}
            <div className="card" style={{ padding: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-black)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={22} style={{ color: 'var(--color-gold)' }} /> 2. Método de Pago Integrado
              </h2>
              <div style={{
                border: '2px solid var(--color-black)',
                backgroundColor: 'var(--color-gold-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left'
              }}>
                <div>
                  <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Pasarela de Pago Stripe / Webpay
                  </strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Pago automático en pesos chilenos con encriptación SSL de nivel militar.
                  </span>
                </div>
                <div style={{
                  backgroundColor: 'var(--color-black)',
                  color: 'var(--text-white)',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Check size={14} />
                </div>
              </div>
            </div>

          </div>

          {/* RESUMEN DE LA COMPRA (Derecha) */}
          <div className="card" style={{ padding: '28px', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-black)' }}>
              Detalles del Pedido
            </h3>

            {/* Resumen productos agrupado por tienda */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '20px',
              marginBottom: '20px',
              maxHeight: '280px',
              overflowY: 'auto'
            }}>
              {itemsByStore.map((group) => (
                <div key={group.storeId} style={{ borderBottom: '1px dashed var(--border-light)', paddingBottom: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', gap: '4px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Tienda:</span>
                    {group.storeSlug ? (
                      <Link to={`/stores/${group.storeSlug}`} style={{ color: 'var(--color-gold)', textDecoration: 'none' }} className="hover-underline">
                        {group.storeName}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--color-gold)' }}>{group.storeName}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {group.items.map((item) => (
                      <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '8px', textAlign: 'left' }}>
                        <span style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                          {item.productName} <strong style={{ color: 'var(--text-primary)' }}>x{item.quantity}</strong>
                        </span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {formatCLP(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    <span>Despacho:</span>
                    <span style={{ fontWeight: '600', color: shippingByStore[group.storeId] === 0 ? 'var(--color-success)' : 'var(--text-primary)' }}>
                      {shippingByStore[group.storeId] === 0 ? '¡Gratis!' : formatCLP(shippingByStore[group.storeId])}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Subtotal Productos</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCLP(cart.totalAmount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Envío Consolidado</span>
                <span style={{
                  fontWeight: '600',
                  color: totalShippingCost === 0 ? 'var(--color-success)' : 'var(--text-primary)'
                }}>
                  {totalShippingCost === 0 ? '¡Gratis!' : formatCLP(totalShippingCost)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: 'var(--color-black)', marginBottom: '24px' }}>
              <span>Total final</span>
              <span>{formatCLP(finalTotal)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="btn btn-gold"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              disabled={orderLoading || cart.items.length === 0}
            >
              {orderLoading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '1.5px' }}></span>
                  Procesando Pago...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> Pagar {formatCLP(finalTotal)}
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
