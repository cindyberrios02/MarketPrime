import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: '¿Cómo funciona el despacho multitienda independiente?',
      a: 'MarketPrime opera como un ecosistema de marketplace. Si añades productos de dos tiendas distintas a tu carrito, el despacho se calcula de forma independiente para cada vendedor. La tarifa Starken es de $3.990 CLP para subtotales inferiores a $50.000 CLP en cada tienda respectiva. Si la compra a una tienda en específico alcanza o supera los $50.000 CLP, el envío de esa tienda será gratis para ti.'
    },
    {
      q: '¿Cómo puedo pagar si compro a múltiples tiendas a la vez?',
      a: '¡Implementamos un flujo de Pago Unificado! Aunque tu carrito contenga productos de múltiples vendedores (lo que generará múltiples órdenes independientes a nivel de base de datos), realizarás una única transacción consolidada de Transbank Webpay Plus. El total de los productos y sus respectivos despachos se sumarán en un solo cobro de tarjeta, y al aprobarse se confirmarán todas las órdenes al mismo tiempo.'
    },
    {
      q: '¿Cómo se calcula el termómetro de reputación de una tienda?',
      a: 'La reputación del vendedor se basa en tres pilares objetivos: (1) La calificación promedio por estrellas que otorgan los compradores reales en sus reseñas de producto, (2) El total de ventas exitosas concretadas e históricas, y (3) La tasa de entrega a tiempo simulada con Starken. Con estas métricas el termómetro se posiciona automáticamente en escala de Rojo a Verde Brillante.'
    },
    {
      q: '¿Puedo escribir una reseña sobre cualquier producto?',
      a: 'Para garantizar opiniones 100% verídicas y generar confianza, MarketPrime solo permite escribir opiniones y dar estrellas a productos que hayas adquirido y pagado con éxito en la plataforma. Una vez completado tu pedido, se habilitará la sección de reseñas en la ficha técnica del producto.'
    },
    {
      q: '¿Cómo puedo postular para crear mi propia tienda?',
      a: '¡Es sumamente fácil! Regístrate o ingresa a tu cuenta, navega a "Mi Perfil" y en la pestaña "Mi Tienda" completa los campos requeridos (Nombre comercial de tu marca, una descripción atractiva y el slug que servirá de enlace público). Un administrador validará tu postulación y te habilitará de inmediato.'
    },
    {
      q: '¿Cuáles son las políticas de comisión para vendedores?',
      a: 'MarketPrime.cl cobra un 10.0% fijo por venta concretada sobre el valor del producto. No existen cobros por inscripción de tienda, publicaciones mensuales de catálogo, ni costos de mantención. Si no realizas ventas, tu cuenta es 100% gratis.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="fade-in" style={{ padding: '80px 16px', minHeight: '80vh', backgroundColor: 'var(--color-black)', color: '#ffffff', textAlign: 'left' }}>
      <div className="container" style={{ maxWidth: '750px' }}>
        
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
            <HelpCircle size={28} />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#ffffff', letterSpacing: '-0.8px', marginBottom: '12px' }}>
            Preguntas Frecuentes (FAQ)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Todo lo que necesitas saber sobre despachos, transacciones consolidadas, reputación y ventas en la plataforma oficial de MarketPrime.cl.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="card" 
                style={{ 
                  padding: '20px 24px', 
                  border: isOpen ? '1px solid rgba(197, 160, 89, 0.3)' : '1px solid rgba(255,255,255,0.05)', 
                  background: isOpen ? 'rgba(197,160,89,0.02)' : 'rgba(255,255,255,0.01)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderRadius: 'var(--radius-lg)'
                }}
                onClick={() => toggleFaq(index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: isOpen ? '#c5a059' : '#ffffff', margin: 0 }}>
                    {faq.q}
                  </h3>
                  {isOpen ? <ChevronUp size={18} style={{ color: '#c5a059' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />}
                </div>

                {isOpen && (
                  <p style={{ 
                    marginTop: '16px', 
                    color: 'var(--text-secondary)', 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    margin: '16px 0 0 0',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '16px',
                    animation: 'fadeInUp 0.3s ease'
                  }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default FaqPage;
