import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowLeft, Plus, Minus, CreditCard, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { formatCLP } from '../services/utils';

const CartPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { cart, loading, fetchCart, updateItem, removeItem, clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleQuantityChange = async (productId, currentQty, stock, change) => {
    const newQty = currentQty + change;
    if (newQty >= 1 && newQty <= stock) {
      await updateItem(productId, newQty);
    }
  };

  const handleCheckoutRedirect = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  // Calcular envío simulado (Gratis sobre $50.000)
  const shippingCost = cart.totalAmount >= 50000 || cart.totalAmount === 0 ? 0 : 3990;
  const finalTotal = cart.totalAmount + shippingCost;

  if (!isAuthenticated) {
    return (
      <div className="container fade-in" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <ShoppingCart size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px auto', display: 'block' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-black)' }}>Tu carro está vacío</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Inicia sesión para poder agregar productos y realizar compras.</p>
        <Link to="/login?redirect=/cart" className="btn btn-black">Iniciar Sesión</Link>
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }}></div>
      </div>
    );
  }

  return (
    <div className="fade-in container" style={{ padding: '32px 0 64px 0' }}>
      <h1 className="title-section" style={{ fontSize: '32px', marginBottom: '8px' }}>Carro de Compras</h1>
      <p className="subtitle-section" style={{ marginBottom: '32px' }}>
        Gestiona tus productos seleccionados antes de finalizar el pedido
      </p>

      {cart.items.length === 0 ? (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '64px 24px', maxWidth: '600px', margin: '0 auto' }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px auto', display: 'block' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--color-black)' }}>No tienes productos en tu carro</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Explora las tiendas oficiales y encuentra las mejores ofertas de Chile.
          </p>
          <Link to="/search" className="btn btn-black" style={{ display: 'inline-flex', gap: '8px' }}>
            <ArrowLeft size={16} /> Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          
          {/* LISTA DE ITEMS (Izquierda) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {cart.totalItems} {cart.totalItems === 1 ? 'Producto seleccionado' : 'Productos seleccionados'}
              </span>
              <button
                onClick={clearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  color: 'var(--color-error)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Trash2 size={14} /> Vaciar Carro
              </button>
            </div>

            {cart.items.map((item) => (
              <div
                key={item.productId}
                className="card"
                style={{
                  display: 'flex',
                  gap: '20px',
                  padding: '20px',
                  alignItems: 'center'
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                    alt={item.productName}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <Link to={`/product/${item.productSlug || item.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: 'var(--color-black)',
                      marginBottom: '2px',
                      lineHeight: '1.4'
                    }}>
                      {item.productName}
                    </h3>
                  </Link>
                  
                  {/* Tienda Link */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Vendido por:</span>
                    {item.storeSlug ? (
                      <Link 
                        to={`/stores/${item.storeSlug}`} 
                        style={{ fontSize: '11px', color: '#c5a059', textDecoration: 'none', fontWeight: '700' }}
                        className="hover-underline"
                      >
                        {item.storeName}
                      </Link>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.storeName || 'Tienda Oficial'}</span>
                    )}
                  </div>

                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Precio unitario: {formatCLP(item.unitPrice)}
                  </span>
                </div>

                {/* Controles de cantidad */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)' }}>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity, 99, -1)}
                    style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    disabled={item.quantity <= 1 || loading}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ padding: '0 8px', fontWeight: '700', fontSize: '14px', minWidth: '24px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    // Se asume un límite por defecto si no viene stock en el response, o 99 max
                    onClick={() => handleQuantityChange(item.productId, item.quantity, 99, 1)}
                    style={{ background: 'none', border: 'none', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    disabled={loading}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Subtotal */}
                <div style={{ width: '110px', textAlign: 'right' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-black)' }}>
                    {formatCLP(item.subtotal)}
                  </span>
                </div>

                {/* Eliminar unitario */}
                <button
                  onClick={() => removeItem(item.productId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
                    e.currentTarget.style.color = 'var(--color-error)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                  }}
                  title="Eliminar del carro"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <Link to="/search" style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'var(--color-gold)',
              fontWeight: '600',
              marginTop: '8px'
            }}>
              <ArrowLeft size={16} /> Seguir Comprando
            </Link>
          </div>

          {/* RESUMEN DE COMPRA (Derecha) */}
          <div className="card" style={{ padding: '28px', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--color-black)' }}>
              Resumen de Compra
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Productos ({cart.totalItems})</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatCLP(cart.totalAmount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Envío</span>
                <span style={{
                  fontWeight: '600',
                  color: shippingCost === 0 ? 'var(--color-success)' : 'var(--text-primary)'
                }}>
                  {shippingCost === 0 ? '¡Gratis!' : formatCLP(shippingCost)}
                </span>
              </div>

              {shippingCost > 0 && (
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4'
                }}>
                  Agrega <strong>{formatCLP(50000 - cart.totalAmount)}</strong> más en productos para obtener <strong>envío gratis</strong>.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: 'var(--color-black)', marginBottom: '24px' }}>
              <span>Total final</span>
              <span>{formatCLP(finalTotal)}</span>
            </div>

            <button
              onClick={handleCheckoutRedirect}
              className="btn btn-black"
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
              disabled={loading}
            >
              <CreditCard size={18} /> Continuar al Checkout
            </button>
          </div>

        </div>
      )}

      <style>{`
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        @media (max-width: 868px) {
          .cart-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
