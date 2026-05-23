import React from 'react';
import { Link } from 'react-router-dom';
import { Percent, Check, HelpCircle, ShieldAlert, Award } from 'lucide-react';

const ComisionesPage = () => {
  return (
    <div className="fade-in" style={{ padding: '80px 16px', minHeight: '80vh', backgroundColor: 'var(--color-black)', color: '#ffffff', textAlign: 'left' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(197, 160, 89, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c5a059',
            margin: '0 auto 20px auto'
          }}>
            <Percent size={28} />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.8px', marginBottom: '12px' }}>
            Políticas de Comisión de Venta
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Conoce cómo cobramos por nuestros servicios y cómo aseguramos transacciones ágiles y seguras para vendedores y compradores en MarketPrime.cl.
          </p>
        </div>

        {/* Estructura Tarifaria */}
        <div className="card" style={{ padding: '40px', border: '1px solid rgba(197, 160, 89, 0.2)', background: 'rgba(255, 255, 255, 0.01)', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: '#c5a059' }} />
            Tarifa Única Simplificada
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
            Nuestra política comercial es simple: <strong>sólo pagas si vendes</strong>. No cobramos tarifas por listado de productos, suscripciones mensuales, ni cargos ocultos de mantención.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px',
            marginBottom: '32px'
          }} className="store-profile-grid">
            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>Comisión por Venta Concretada</span>
              <strong style={{ fontSize: '40px', fontWeight: '900', color: '#c5a059', display: 'block', margin: '8px 0' }}>10.0%</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sobre el valor del producto</span>
            </div>

            <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>Costo de Inscripción y Catálogo</span>
              <strong style={{ fontSize: '40px', fontWeight: '900', color: '#2e7d32', display: 'block', margin: '8px 0' }}>$0 CLP</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Suscripción e inserciones gratis</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Check size={16} style={{ color: '#2e7d32' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong>El envío no tiene comisión</strong>: La tarifa Starken pagada por el cliente se transfiere íntegra al vendedor.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Check size={16} style={{ color: '#2e7d32' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong>Cobro Automatizado</strong>: La comisión se descuenta directamente antes de liquidar el saldo a tu cuenta bancaria registrada.</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Check size={16} style={{ color: '#2e7d32' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}><strong>Soporte en Disputas</strong>: Si una orden es cancelada de mutuo acuerdo o rechazada antes de despachar, la comisión se devuelve de inmediato.</span>
            </div>
          </div>
        </div>

        {/* Políticas de Liquidación */}
        <div className="card" style={{ padding: '40px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20, 20, 20, 0.4)', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '16px' }}>
            Ciclo de Facturación y Liquidación
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
            Las ventas acumuladas en MarketPrime.cl se procesan de la siguiente manera:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <li>Las transacciones aprobadas mediante Webpay Plus entran en estado de custodia para resguardo del cliente durante 7 días hábiles tras confirmarse la recepción del producto.</li>
            <li>Las transferencias a la cuenta corriente del vendedor se efectúan en lotes semanales todos los días viernes hábiles de forma automática.</li>
            <li>El administrador del sitio puede realizar ajustes sobre el porcentaje de comisión de tiendas destacadas directamente en su panel de control en línea, lo cual se verá reflejado en tu panel en tiempo real.</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/vender" className="btn btn-gold" style={{ padding: '12px 24px', display: 'inline-block' }}>
            Volver a Vender
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ComisionesPage;
