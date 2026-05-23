import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Truck, BadgePercent, ChevronRight, HelpCircle, Store } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const VenderPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const handleStartSelling = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/crear-tienda');
    } else {
      // Si ya tiene rol de vendedor, ir a su dashboard. Si no, ir a crear tienda
      if (user?.roles?.includes('ROLE_SELLER')) {
        navigate('/seller/dashboard');
      } else {
        navigate('/crear-tienda');
      }
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '100px', backgroundColor: 'var(--color-black)', color: '#ffffff' }}>
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        padding: '120px 0 80px 0',
        background: 'linear-gradient(135deg, #0b0b0b 0%, #1a1a1a 100%)',
        borderBottom: '1px solid rgba(197, 160, 89, 0.15)',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Decorative ambient light */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
          <Store size={56} style={{ color: '#c5a059', margin: '0 auto 20px auto' }} />
          <h1 style={{ fontSize: '48px', fontWeight: '950', letterSpacing: '-1.5px', marginBottom: '20px', lineHeight: '1.1' }}>
            Empieza a vender en <span style={{ color: '#c5a059' }}>MarketPrime.cl</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
            Únete a la red de comercio más sofisticada de Chile. Crea tu escaparate digital en minutos y vende con despachos Starken integrados y transacciones Webpay Plus 100% seguras.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleStartSelling} className="btn btn-gold" style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '800' }}>
              Comenzar a Vender Ahora
            </button>
            <Link to="/comisiones" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '700' }}>
              Ver Políticas de Comisión
            </Link>
          </div>
        </div>
      </div>

      {/* Ventajas Clave */}
      <div className="container" style={{ marginTop: '80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '900', color: '#ffffff', marginBottom: '48px' }}>
          ¿Por qué elegir MarketPrime?
        </h2>

        <div className="grid-3" style={{ gap: '32px', textAlign: 'left' }}>
          {/* Card 1 */}
          <div className="card" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,20,20,0.5)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(197, 160, 89, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: '#c5a059', marginBottom: '24px' }}>
              <TrendingUp size={24} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#ffffff' }}>Escapárate Público Premium</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Obtén un minisitio personalizado (`/stores/tu-tienda`) con un termómetro dinámico de reputación, catálogo interactivo con buscador avanzado, opiniones de tus compradores y estadísticas de entrega a tiempo.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,20,20,0.5)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(197, 160, 89, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: '#c5a059', marginBottom: '24px' }}>
              <Truck size={24} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#ffffff' }}>Logística y Envío Cobrado</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Calculamos el costo de envío de Starken de forma autónoma por tienda. El cliente paga a cada tienda su respectivo despacho y tú procesas el paquete de forma 100% independiente en tu panel.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ padding: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20,20,20,0.5)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(197, 160, 89, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: '#c5a059', marginBottom: '24px' }}>
              <BadgePercent size={24} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#ffffff' }}>Comisiones Justas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Sin cobros fijos mensuales ni costos de mantención. Solo cobramos un <strong style={{ color: '#c5a059' }}>10.0%</strong> de comisión comercial sobre el valor del producto vendido. Si no vendes, no pagas nada.
            </p>
          </div>
        </div>
      </div>

      {/* Cómo Funciona */}
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 0', marginTop: '80px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '900', color: '#ffffff', marginBottom: '48px' }}>
            Cómo funciona el proceso de venta
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c5a059', color: '#121212', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                1
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>Regístrate y Solicita tu Tienda</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Completa tu registro como usuario y envía la solicitud de creación de tienda ingresando el nombre, descripción y un slug único (ej. `tienda-deportes`). Tu tienda entrará en validación de forma inmediata.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c5a059', color: '#121212', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                2
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>Aprobación y Activación</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Un administrador del sitio revisará tu postulación y la activará en la consola global. Una vez aprobada, recibirás automáticamente el rol de Vendedor oficial y tendrás acceso a tu Panel de Control.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#c5a059', color: '#121212', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>Carga tus Productos y Vende</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  Carga tus productos con títulos claros, descripciones, stock e imágenes de alta definición. Tus artículos aparecerán de inmediato en el catálogo general del sitio y los clientes podrán adquirirlos unificadamente en su carrito.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Final */}
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <div className="card" style={{ padding: '48px', border: '1px solid rgba(197, 160, 89, 0.2)', background: 'linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(30,30,30,0.8) 100%)', maxWidth: '750px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', marginBottom: '12px' }}>¿Listo para potenciar tus ventas en Chile?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '28px', maxWidth: '500px', margin: '0 auto 28px auto' }}>
            Únete a cientos de emprendedores que ya confían en la red de transacciones premium de MarketPrime.cl.
          </p>
          <button onClick={handleStartSelling} className="btn btn-gold" style={{ padding: '14px 32px', fontSize: '15px', fontWeight: '800' }}>
            Registrar mi Tienda
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenderPage;
