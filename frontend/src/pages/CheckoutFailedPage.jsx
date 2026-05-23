import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';

const CheckoutFailedPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="fade-in container" style={{ padding: '80px 16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div className="card" style={{
        padding: '56px 40px',
        background: 'rgba(26, 26, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <XCircle size={72} style={{ color: '#ff5252', margin: '0 auto 24px auto', filter: 'drop-shadow(0 0 12px rgba(255,82,82,0.4))' }} />
        
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff5252', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '8px' }}>
          Transacción Fallida o Rechazada
        </span>
        
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '16px' }}>
          El Pago no Pudo Completarse
        </h1>
        
        <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', lineHeight: '1.6', marginBottom: '32px' }}>
          La pasarela de pago de <strong>Webpay Plus</strong> reportó que la transacción fue cancelada por el usuario o rechazada por la entidad bancaria emisora. No se ha realizado ningún débito en tu cuenta.
        </p>

        {/* Causa del Error y Consejos */}
        <div style={{
          backgroundColor: 'rgba(255, 82, 82, 0.05)',
          border: '1px solid rgba(255, 82, 82, 0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ff5252', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} /> Posibles causas del inconveniente:
          </h4>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>Cancelación voluntaria en el portal de Webpay pulsando "Anular" o "Volver al comercio".</li>
            <li>Fondos insuficientes en la cuenta de débito/crédito seleccionada.</li>
            <li>Rechazo de seguridad del banco emisor o problemas de conectividad con Transbank.</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/checkout" className="btn btn-gold" style={{ padding: '12px 24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Reintentar el Pago
          </Link>
          <Link to="/cart" className="btn btn-outline" style={{ padding: '12px 24px', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
            <ArrowLeft size={16} /> Ir al Carrito
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailedPage;
