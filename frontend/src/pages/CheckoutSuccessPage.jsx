import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Mail, MapPin, Receipt, RefreshCw, ShoppingBag, Store } from 'lucide-react';
import api from '../services/api';
import { formatCLP } from '../services/utils';
import useCartStore from '../store/useCartStore';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderIdsParam = searchParams.get('orderIds') || searchParams.get('orderId');
  const token = searchParams.get('token');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear shopping cart on successful checkout
    clearCart();
    
    if (orderIdsParam) {
      fetchOrdersDetails();
    } else {
      setLoading(false);
    }
  }, [orderIdsParam]);

  const fetchOrdersDetails = async () => {
    setLoading(true);
    try {
      const ids = orderIdsParam.split(',').map(id => id.trim()).filter(Boolean);
      const fetchedOrders = await Promise.all(
        ids.map(async (id) => {
          const response = await api.get(`/api/orders/${id}`);
          return response.data;
        })
      );
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('No pudimos cargar los detalles de tus boletas digitales, pero tu pago está confirmado.');
    } finally {
      setLoading(false);
    }
  };

  // Generate simulated falling confetti pieces (CSS animated sparks)
  const renderConfetti = () => {
    return Array.from({ length: 40 }).map((_, i) => {
      const left = Math.random() * 100;
      const size = Math.random() * 8 + 4;
      const delay = Math.random() * 5;
      const duration = Math.random() * 4 + 3;
      const color = ['#c5a059', '#e5c07b', '#d4af37', '#ffffff', '#ffd700'][Math.floor(Math.random() * 5)];
      
      return (
        <div
          key={i}
          className="confetti-spark"
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`
          }}
        />
      );
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <RefreshCw className="spinner" size={48} style={{ color: 'var(--color-gold)' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Cargando tus boletas premium...</p>
      </div>
    );
  }

  // Calculate consolidated values
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalShipping = orders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const itemsTotal = totalAmount - totalShipping;
  const netAmount = Math.round(itemsTotal / 1.19);
  const ivaAmount = itemsTotal - netAmount;

  const firstOrder = orders[0] || null;

  return (
    <div className="fade-in" style={{ position: 'relative', overflow: 'hidden', padding: '60px 0 80px 0' }}>
      
      {/* Confetti container */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {renderConfetti()}
      </div>

      <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
        
        {/* Banner Éxito */}
        <div className="card" style={{
          textAlign: 'center',
          padding: '40px 32px',
          background: 'rgba(26, 26, 26, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(197, 160, 89, 0.25)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '32px'
        }}>
          <CheckCircle size={72} style={{ color: '#c5a059', margin: '0 auto 20px auto', filter: 'drop-shadow(0 0 12px rgba(197,160,89,0.4))' }} />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#c5a059', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>
            Transacción Exitosa
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '12px' }}>
            ¡Gracias por tu Compra!
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', maxWidth: '520px', margin: '0 auto' }}>
            El pago fue procesado correctamente con <strong style={{ color: '#c5a059' }}>Webpay Plus</strong>. Tus boletas fiscales electrónicas han sido emitidas y enviadas a tu correo.
          </p>
        </div>

        {error && (
          <div className="card" style={{ padding: '20px', color: '#ff5252', border: '1px solid rgba(255, 82, 82, 0.3)', marginBottom: '32px', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        )}

        {/* Boleta Premium Consolidada */}
        {orders.length > 0 ? (
          <div className="card" style={{
            background: 'var(--color-black)',
            border: '2px solid #c5a059',
            boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: '40px'
          }}>
            {/* Cabezal Boleta */}
            <div style={{
              background: 'linear-gradient(90deg, #1f1f1f 0%, #121212 100%)',
              borderBottom: '1px solid rgba(197, 160, 89, 0.3)',
              padding: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '1px' }}>
                  MARKET<span style={{ color: '#c5a059' }}>PRIME</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
                  MarketPrime SpA • R.U.T. 76.992.813-K
                </span>
              </div>
              <div style={{
                border: '2.5px solid #ff5252',
                borderRadius: '8px',
                padding: '12px 24px',
                backgroundColor: 'rgba(255, 82, 82, 0.05)',
                color: '#ff5252',
                textAlign: 'center',
                fontFamily: 'monospace'
              }}>
                <strong style={{ fontSize: '13px', display: 'block', letterSpacing: '1px' }}>BOLETA ELECTRÓNICA</strong>
                <span style={{ fontSize: '15px', fontWeight: '800' }}>
                  N° MULTI-{firstOrder ? firstOrder.id.substring(0, 4).toUpperCase() : 'PEND'}
                </span>
                <span style={{ fontSize: '9px', display: 'block', color: 'rgba(255,82,82,0.8)', marginTop: '2px' }}>S.I.I. - SANTIAGO CENTRO</span>
              </div>
            </div>

            {/* Datos Generales */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              padding: '32px',
              borderBottom: '1px solid var(--border-light)',
              textAlign: 'left'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>FECHA Y HORA EMISIÓN</span>
                <strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: '#c5a059' }} /> 
                  {firstOrder ? new Date(firstOrder.createdAt).toLocaleString('es-CL') : new Date().toLocaleString('es-CL')}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>CLIENTE (EMAIL)</span>
                <strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} style={{ color: '#c5a059' }} /> 
                  {firstOrder?.buyerEmail || 'Cliente MarketPrime'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>PASARELA DE PAGO</span>
                <strong style={{ fontSize: '14px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={14} style={{ color: '#4caf50' }} /> 
                  Webpay Plus (Consolidado)
                </strong>
              </div>
            </div>

            {/* Grupos de Tiendas / Órdenes */}
            <div style={{ padding: '0 32px' }}>
              {orders.map((order, orderIdx) => {
                const orderSubtotal = order.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
                
                return (
                  <div key={order.id} style={{ 
                    padding: '24px 0', 
                    borderBottom: orderIdx === orders.length - 1 ? 'none' : '1px dashed rgba(255, 255, 255, 0.15)'
                  }}>
                    {/* Encabezado de la tienda */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: '16px',
                      backgroundColor: 'rgba(197, 160, 89, 0.08)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #c5a059'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                        <Store size={18} style={{ color: '#c5a059' }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tienda:</span>
                        <Link 
                          to={`/stores/${order.storeSlug}`} 
                          style={{ 
                            color: '#ffffff', 
                            fontWeight: '700', 
                            fontSize: '15px', 
                            textDecoration: 'none', 
                            transition: 'color 0.2s' 
                          }}
                          className="hover-gold"
                        >
                          {order.storeName}
                        </Link>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          Pedido N°: {order.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Tabla de ítems para esta tienda */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '20px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          <th style={{ color: 'var(--text-tertiary)', paddingBottom: '8px', fontSize: '12px', fontWeight: '600' }}>Producto</th>
                          <th style={{ color: 'var(--text-tertiary)', paddingBottom: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>Cant.</th>
                          <th style={{ color: 'var(--text-tertiary)', paddingBottom: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>Unitario</th>
                          <th style={{ color: 'var(--text-tertiary)', paddingBottom: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items && order.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px 0', fontSize: '13px', color: '#ffffff', textAlign: 'left' }}>
                              {item.productName}
                            </td>
                            <td style={{ padding: '12px 0', fontSize: '13px', color: '#ffffff', textAlign: 'center' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '12px 0', fontSize: '13px', color: '#ffffff', textAlign: 'right' }}>
                              {formatCLP(item.unitPrice)}
                            </td>
                            <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: '600', color: '#ffffff', textAlign: 'right' }}>
                              {formatCLP(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Fila de despacho e información Starken para esta tienda */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '20px',
                      padding: '16px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Mock SVG QR Code */}
                        <svg width="56" height="56" viewBox="0 0 68 68" style={{ backgroundColor: '#ffffff', padding: '3px', borderRadius: '4px', flexShrink: 0 }}>
                          <rect x="2" y="2" width="18" height="18" fill="#121212" />
                          <rect x="5" y="5" width="12" height="12" fill="#ffffff" />
                          <rect x="8" y="8" width="6" height="6" fill="#121212" />

                          <rect x="48" y="2" width="18" height="18" fill="#121212" />
                          <rect x="51" y="5" width="12" height="12" fill="#ffffff" />
                          <rect x="54" y="8" width="6" height="6" fill="#121212" />

                          <rect x="2" y="48" width="18" height="18" fill="#121212" />
                          <rect x="5" y="51" width="12" height="12" fill="#ffffff" />
                          <rect x="8" y="54" width="6" height="6" fill="#121212" />
                          
                          <rect x="24" y="4" width="6" height="6" fill="#121212" />
                          <rect x="36" y="8" width="6" height="12" fill="#121212" />
                          <rect x="30" y="22" width="12" height="6" fill="#121212" />
                          <rect x="8" y="30" width="12" height="6" fill="#121212" />
                          <rect x="48" y="36" width="6" height="12" fill="#121212" />
                          <rect x="24" y="40" width="18" height="6" fill="#121212" />
                          <rect x="54" y="48" width="8" height="8" fill="#121212" />
                          <rect x="36" y="52" width="12" height="12" fill="#121212" />
                        </svg>
                        <div>
                          <strong style={{ fontSize: '12px', color: '#ffffff', display: 'block' }}>Despacho Starken Courier</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginTop: '1px' }}>
                            Seguimiento: <strong style={{ color: '#c5a059', fontFamily: 'monospace' }}>SKN-{order.id.substring(0,8).toUpperCase()}</strong>
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(197, 160, 89, 0.7)', display: 'block', marginTop: '2px' }}>
                            Dirección: {order.shippingAddressSnapshot || 'Dirección de envío'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>Subtotal Tienda:</span>
                          <span style={{ color: '#ffffff' }}>{formatCLP(orderSubtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>Envío Tienda:</span>
                          {order.shippingCost === 0 ? (
                            <span style={{ color: '#4caf50', fontWeight: '600' }}>¡GRATIS!</span>
                          ) : (
                            <span style={{ color: '#ffffff', fontWeight: '600' }}>{formatCLP(order.shippingCost)}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '4px' }}>
                          <span style={{ color: '#c5a059' }}>Total Tienda:</span>
                          <span style={{ color: '#c5a059' }}>{formatCLP(order.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totalizadores consolidados */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
              padding: '32px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderTop: '1px solid var(--border-light)'
            }}>
              {/* Información de ayuda */}
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>Información Importante del Despacho</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.5', margin: 0 }}>
                  Dado que has comprado en distintas tiendas, cada vendedor gestionará y despachará sus productos de forma autónoma. Recibirás notificaciones por correo por cada cambio en el estado de despacho de cada paquete individual.
                </p>
              </div>

              {/* Liquidación de montos consolidados */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Monto Neto (Items)</span>
                  <span style={{ color: '#ffffff' }}>{formatCLP(netAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>I.V.A. (19%)</span>
                  <span style={{ color: '#ffffff' }}>{formatCLP(ivaAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                  <span>Total Despachos (Acumulado)</span>
                  {totalShipping === 0 ? (
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>¡SIN COSTO!</span>
                  ) : (
                    <span style={{ color: '#ffffff', fontWeight: '600' }}>{formatCLP(totalShipping)}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                  <span style={{ color: '#c5a059' }}>TOTAL COMPRA</span>
                  <span style={{ color: '#c5a059' }}>{formatCLP(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '40px', color: 'var(--text-secondary)', marginBottom: '40px', textAlign: 'center' }}>
            <p>Se confirmó tu pago, pero ocurrió un problema al cargar los detalles de la orden en esta sesión.</p>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/profile" className="btn btn-gold animate-hover" style={{ padding: '14px 28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} /> Ver Mis Pedidos
          </Link>
          <Link to="/" className="btn btn-outline" style={{ padding: '14px 28px', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
            Volver a la Home
          </Link>
        </div>

      </div>

      <style>{`
        .confetti-spark {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          opacity: 0.8;
          animation: fall linear infinite;
        }

        .hover-gold:hover {
          color: #c5a059 !important;
        }

        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutSuccessPage;

