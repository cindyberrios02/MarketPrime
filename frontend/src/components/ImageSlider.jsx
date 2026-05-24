import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ImageSlider = ({ images, fallbackText = "Sin Imagen", height = "100%" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const safeImages = Array.isArray(images) && images.length > 0 
    ? images 
    : ['https://placehold.co/600x600/eeeeee/999999?text=' + fallbackText.replace(' ', '+')];

  useEffect(() => {
    if (safeImages.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [safeImages.length, isHovered]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      style={{ width: '100%', height: height, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={safeImages[currentIndex]}
        alt="Product"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          transition: "opacity 0.3s ease"
        }}
        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/eeeeee/999999?text=Sin+Imagen'; }}
      />
      
      {safeImages.length > 1 && isHovered && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-black)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              zIndex: 2
            }}
          >
            <ChevronLeft size={16} />
          </button>
          
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-black)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              zIndex: 2
            }}
          >
            <ChevronRight size={16} />
          </button>
          
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '0',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            zIndex: 2
          }}>
            {safeImages.map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: idx === currentIndex ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSlider;
