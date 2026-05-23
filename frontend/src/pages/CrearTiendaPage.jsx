import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, UserCheck, ShieldCheck, ArrowRight, ClipboardList } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const CrearTiendaPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile?tab=store');
    } else {
      navigate('/profile?tab=store');
    }
  };

  return (
    <div className="fade-in" style={{ padding: '80px 16px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-black)' }}>
      <div className="card" style={{
        maxWidth: '650px',
        width: '100%',
        padding: '48px',
        border: '1px solid rgba(197, 160, 89, 0.2)',
        background: 'linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(10,10,10,0.95) 100%)',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'rgba(197, 160, 89, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c5a059',
          margin: '0 auto 24px auto'
        }}>
          <Store size={36} />
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '16px' }}>
          Crea tu Tienda Oficial
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
          Estás a un paso de habilitar tu propio escaparate digital en MarketPrime.cl. Para garantizar la seguridad de los compradores, todas las tiendas oficiales deben pasar por un proceso de revisión y aprobación administrativa.
        </p>

        {/* Pasos a seguir */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#c5a059', letterSpacing: '1px', marginBottom: '8px' }}>
            Requisitos de Postulación:
          </h3>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <ClipboardList size={18} style={{ color: '#c5a059', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>Nombre y Slug de la Tienda</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Define un nombre comercial elegante y un enlace único que tus clientes recordarán (ej: `marketprime.cl/stores/mi-marca`).</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <UserCheck size={18} style={{ color: '#c5a059', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>Descripción de Marca</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Escribe una breve reseña de tus productos y tu visión. Esto aparecerá en el encabezado de tu escaparate público.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <ShieldCheck size={18} style={{ color: '#c5a059', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '14px', color: '#ffffff', display: 'block' }}>Revisión Administrativa</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Una vez enviado, un administrador activará tu panel en el sistema y te otorgará los permisos de vendedor oficial.</span>
            </div>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          onClick={handleProceed}
          className="btn btn-gold"
          style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {isAuthenticated ? 'Ir al Formulario de Postulación' : 'Iniciar Sesión para Postular'}
          <ArrowRight size={16} />
        </button>

        <div style={{ marginTop: '24px' }}>
          <Link to="/vender" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }} className="hover-underline">
            Volver a información comercial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CrearTiendaPage;
