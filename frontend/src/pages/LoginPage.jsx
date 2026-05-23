import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, loading, error, isAuthenticated } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  // Obtener la URL de redirección
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect') || '/';
  const wasExpired = params.get('expired') === 'true';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email.trim() || !password.trim()) {
      setValidationError('Por favor, completa todos los campos.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate(redirect, { replace: true });
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      padding: '40px 16px'
    }} className="fade-in">
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo/Brand Header */}
        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--color-black)',
          marginBottom: '8px'
        }}>
          Iniciar <span style={{ color: 'var(--color-gold)' }}>Sesión</span>
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: '32px'
        }}>
          Bienvenido de vuelta a MarketPrime.cl
        </p>

        {wasExpired && (
          <div className="badge badge-warning" style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} />
            Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
          </div>
        )}

        {/* Mensaje de error general de la API */}
        {(error || validationError) && (
          <div className="badge badge-error" style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="ejemplo@marketprime.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                disabled={loading}
              />
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                disabled={loading}
              />
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-black"
            style={{
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '1.5px' }}></span>
                Autenticando...
              </>
            ) : (
              <>
                Ingresar <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '20px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" style={{
            color: 'var(--color-gold)',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
