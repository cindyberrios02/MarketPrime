import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('ROLE_BUYER'); // BUYER by default
  const [validationError, setValidationError] = useState('');

  const { register, loading, error, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setValidationError('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setValidationError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden.');
      return;
    }

    const res = await register(email, password, firstName, lastName, role);
    if (res.success) {
      navigate('/', { replace: true });
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
        maxWidth: '500px',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-black)',
            marginBottom: '8px'
          }}>
            Crear <span style={{ color: 'var(--color-gold)' }}>Cuenta</span>
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            Únete a la red de comercio más sofisticada de Chile
          </p>
        </div>

        {/* Mensaje de error */}
        {(error || validationError) && (
          <div className="badge badge-error" style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
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
          
          {/* Nombre y Apellido */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">Nombre</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="firstName"
                  type="text"
                  className="form-input"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  disabled={loading}
                />
                <User size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)'
                }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Apellido</label>
              <input
                id="lastName"
                type="text"
                className="form-input"
                placeholder="Pérez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="juan.perez@ejemplo.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '36px' }}
                disabled={loading}
              />
              <Mail size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }} />
            </div>
          </div>

          {/* Tipo de Cuenta (Rol) */}
          <div className="form-group">
            <label className="form-label">Tipo de Cuenta</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setRole('ROLE_BUYER')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: role === 'ROLE_BUYER' ? '2px solid var(--color-black)' : '1px solid var(--border-medium)',
                  backgroundColor: role === 'ROLE_BUYER' ? 'var(--color-gold-light)' : 'var(--bg-primary)',
                  fontWeight: role === 'ROLE_BUYER' ? '600' : '500',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                disabled={loading}
              >
                <Users size={16} /> Comprador
              </button>
              <button
                type="button"
                onClick={() => setRole('ROLE_SELLER')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: role === 'ROLE_SELLER' ? '2px solid var(--color-black)' : '1px solid var(--border-medium)',
                  backgroundColor: role === 'ROLE_SELLER' ? 'var(--color-gold-light)' : 'var(--bg-primary)',
                  fontWeight: role === 'ROLE_SELLER' ? '600' : '500',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                disabled={loading}
              >
                <ShieldCheck size={16} /> Vendedor
              </button>
            </div>
          </div>

          {/* Contraseñas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  style={{ paddingLeft: '36px' }}
                  disabled={loading}
                />
                <Lock size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)'
                }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirmar</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            className="btn btn-black"
            style={{
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              marginTop: '12px',
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
                Creando cuenta...
              </>
            ) : (
              <>
                Registrarse <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{
            color: 'var(--color-gold)',
            fontWeight: '600',
            textDecoration: 'none'
          }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
