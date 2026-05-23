import React from 'react';

const TermsPage = () => {
  return (
    <div className="fade-in" style={{ padding: '80px 16px', minHeight: '80vh', backgroundColor: 'var(--color-black)', color: '#ffffff', textAlign: 'left' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.8px', marginBottom: '12px', textAlign: 'center' }}>
          Términos y Condiciones de Uso
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '40px', textAlign: 'center' }}>
          Última actualización: 22 de mayo de 2026
        </p>

        <div className="card" style={{ padding: '40px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20, 20, 20, 0.4)', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-secondary)' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma MarketPrime.cl, aceptas cumplir con las condiciones aquí establecidas. Este sitio web provee una plataforma interactiva que permite a compradores adquirir artículos de múltiples vendedores autorizados en Chile bajo un modelo consolidado.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>2. Funcionamiento del Marketplace</h2>
            <p>
              MarketPrime facilita el contacto comercial y la pasarela de pago para múltiples vendedores independientes. Cada tienda es responsable de la calidad, stock, descripción de sus productos, y del despacho correspondiente mediante el proveedor Starken de acuerdo a las tarifas calculadas en el checkout.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>3. Pasarela de Pago Webpay Plus</h2>
            <p>
              Las transacciones se procesan mediante un Pago Unificado a través de Transbank Webpay Plus de forma consolidada. Las comisiones por venta del 10.0% se deducen automáticamente en favor del sitio web al liberar el saldo a los vendedores según el cronograma de liquidación semanal.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>4. Reputación y Reseñas de Producto</h2>
            <p>
              Para resguardo del ecosistema y de los compradores, las opiniones y calificaciones del termómetro solo pueden ser ingresadas por usuarios que hayan completado y pagado exitosamente una orden del producto evaluado. Las conductas difamatorias o reseñas artificiales serán sancionadas con la suspensión inmediata de la cuenta.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>5. Limitación de Responsabilidad</h2>
            <p>
              MarketPrime no asume responsabilidad directa por el cumplimiento de los contratos de venta o despachos fuera del plazo simulado por parte de las tiendas, pero otorga un canal seguro de mediación a través de su Centro de Mensajería y notificaciones integradas.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
