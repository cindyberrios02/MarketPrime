// components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--color-black)',
      color: 'var(--text-white)',
      padding: '48px 0 24px 0',
      marginTop: 'auto',
      borderTop: '1px solid var(--border-light)'
    }}>
      <div className="container">
        <div className="grid-4" style={{
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          {/* Col 1 */}
          <div>
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-gold)' }}>
              MarketPrime.cl
            </h4>
            <p style={{ fontSize: '14px', color: '#aaaaaa', lineHeight: '1.6' }}>
              El marketplace multivendedor más sofisticado de Chile. Calidad, seguridad y despacho garantizado para cada una de tus compras.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>
              Comprar
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <li><Link to="/search" style={{ color: '#aaaaaa' }} hover={{ color: '#fff' }}>Ver Todos los Productos</Link></li>
              <li><Link to="/search?category=electronics" style={{ color: '#aaaaaa' }}>Tecnología</Link></li>
              <li><Link to="/search?category=clothing" style={{ color: '#aaaaaa' }}>Vestuario y Moda</Link></li>
              <li><Link to="/search?category=home" style={{ color: '#aaaaaa' }}>Hogar y Decoración</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>
              Vender
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <li><Link to="/vender" style={{ color: '#aaaaaa' }}>¿Cómo Vender?</Link></li>
              <li><Link to="/crear-tienda" style={{ color: '#aaaaaa' }}>Crear Tienda</Link></li>
              <li><Link to="/comisiones" style={{ color: '#aaaaaa' }}>Políticas de Comisión</Link></li>
              <li><Link to="/preguntas-frecuentes" style={{ color: '#aaaaaa' }}>Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1px' }}>
              Contacto
            </h4>
            <p style={{ fontSize: '14px', color: '#aaaaaa', lineHeight: '1.6' }}>
              ¿Tienes dudas?<br />
              soporte@marketprime.cl<br />
              Santiago, Chile
            </p>
          </div>
        </div>

        {/* Divisor */}
        <div style={{
          borderTop: '1px solid #222222',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#888888',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            &copy; {new Date().getFullYear()} MarketPrime.cl. Todos los derechos reservados.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/terminos" style={{ color: '#888888' }}>Términos y Condiciones</Link>
            <Link to="/privacidad" style={{ color: '#888888' }}>Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
