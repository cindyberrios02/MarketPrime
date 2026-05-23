import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="fade-in" style={{ padding: '80px 16px', minHeight: '80vh', backgroundColor: 'var(--color-black)', color: '#ffffff', textAlign: 'left' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.8px', marginBottom: '12px', textAlign: 'center' }}>
          Políticas de Privacidad
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '40px', textAlign: 'center' }}>
          Última actualización: 22 de mayo de 2026
        </p>

        <div className="card" style={{ padding: '40px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(20, 20, 20, 0.4)', display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.6', fontSize: '14px', color: 'var(--text-secondary)' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>1. Información Recopilada</h2>
            <p>
              Recopilamos información de carácter personal como nombre, dirección de correo electrónico, dirección física de envío en Chile y RUT cuando completas tu registro o configuras tus ubicaciones en el perfil para realizar despachos.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>2. Uso de la Información</h2>
            <p>
              Tus datos son utilizados para procesar órdenes de compra, habilitar la casilla interna de mensajería (notificaciones de despacho), y conectar a los compradores con las respectivas tiendas donde realizaron adquisiciones para coordinar el courier de Starken.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>3. Compartición de Datos con Vendedores</h2>
            <p>
              Únicamente compartimos la dirección física y el nombre del comprador con las tiendas involucradas en la orden para asegurar el correcto etiquetado y entrega del paquete. Los vendedores están contractualmente impedidos de usar tus datos para fines promocionales no solicitados.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', marginBottom: '12px' }}>4. Seguridad de Transacciones</h2>
            <p>
              Toda la pasarela de pagos se procesa en los servidores seguros y certificados de Transbank Webpay Plus. MarketPrime no almacena números de tarjeta de crédito, claves de seguridad, ni contraseñas bancarias en su base de datos.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
