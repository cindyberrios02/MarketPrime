import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutFailedPage from './pages/CheckoutFailedPage';
import StoreProfilePage from './pages/StoreProfilePage';
import VenderPage from './pages/VenderPage';
import CrearTiendaPage from './pages/CrearTiendaPage';
import ComisionesPage from './pages/ComisionesPage';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import useAuthStore from './store/useAuthStore';
import './App.css';

// Componente para proteger rutas privadas con validación de roles
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user || !user.roles || !allowedRoles.some(role => user.roles.includes(role)))) {
    return <Navigate to="/" replace />;
  }

  return children;
};



// Componente para scrollear al inicio en cada cambio de ruta
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    // Restaurar sesión activa de localStorage al iniciar la app
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Barra de navegación global */}
      <Navbar />

      {/* Contenedor de notificaciones flotantes global */}
      <ToastContainer />

      {/* Contenedor principal de vistas */}
      <main style={{ flex: 1, minHeight: 'calc(100vh - 72px - 280px)' }}>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/stores/:slug" element={<StoreProfilePage />} />
          <Route path="/vender" element={<VenderPage />} />
          <Route path="/crear-tienda" element={<CrearTiendaPage />} />
          <Route path="/comisiones" element={<ComisionesPage />} />
          <Route path="/preguntas-frecuentes" element={<FaqPage />} />
          <Route path="/terminos" style={{ color: '#ffffff' }} element={<TermsPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Privadas Protegidas */}
          <Route 
            path="/checkout" 
            element={
              <PrivateRoute>
                <CheckoutPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/checkout/success" 
            element={
              <PrivateRoute>
                <CheckoutSuccessPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/checkout/failed" 
            element={
              <PrivateRoute>
                <CheckoutFailedPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } 
          />

          {/* Dashboard de Vendedor (ROLE_SELLER) */}
          <Route 
            path="/seller/dashboard" 
            element={
              <PrivateRoute allowedRoles={['ROLE_SELLER']}>
                <SellerDashboard />
              </PrivateRoute>
            } 
          />

          {/* Dashboard de Administrador (ROLE_ADMIN) */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute allowedRoles={['ROLE_ADMIN']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />

          {/* Fallback de redirección */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Pie de página global */}
      <Footer />
    </BrowserRouter>
  );
}

export default App;
