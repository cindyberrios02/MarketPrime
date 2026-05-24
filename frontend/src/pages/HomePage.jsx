import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Headphones,
  ChevronRight,
  ChevronLeft,
  Star,
  Eye,
  ShoppingCart,
  Check,
} from "lucide-react";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import ProductPreviewModal from "../components/ProductPreviewModal";
import { formatCLP } from "../services/utils";
import useToastStore from "../store/useToastStore";

const FALLBACK_CATEGORIES = [
  {
    id: "deportes",
    name: "Deportes",
    slug: "deportes",
    icon: "⚽",
    count: "90+ Prod.",
  },
  { id: "ropa", name: "Ropa", slug: "ropa", icon: "👕", count: "340+ Prod." },
  {
    id: "herramientas",
    name: "Herramientas",
    slug: "herramientas",
    icon: "🛠️",
    count: "120+ Prod.",
  },
];

const HomePage = () => {
  const { showToast } = useToastStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [previewSlug, setPreviewSlug] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);
  const navigate = useNavigate();

  const [activeSlide, setActiveSlide] = useState(0);

  const SLIDES = [
    {
      subtitle: "LA NUEVA ERA DEL COMERCIO ONLINE EN CHILE",
      title: (
        <>
          Descubre Productos Exclusivos en{" "}
          <span
            style={{
              color: "var(--color-gold)",
              textShadow: "0 0 10px rgba(197, 160, 89, 0.3)",
            }}
          >
            MarketPrime
          </span>
        </>
      ),
      description:
        "Compra de forma segura directamente a las mejores marcas y tiendas del país. Transacciones 100% protegidas y un 15% de descuento semilla de bienvenida ya activado.",
      ctaText: "Explorar Catálogo General",
      ctaLink: "/search",
      badge: "✨ OFERTA EXCLUSIVA DE BIENVENIDA",
      backgroundImage:
        "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80')",
      visualType: "general",
    },
    {
      subtitle: "RENDIMIENTO & ESTILO DEPORTIVO",
      title: (
        <>
          Supera Tus Límites Con{" "}
          <span
            style={{
              color: "var(--color-gold)",
              textShadow: "0 0 10px rgba(197, 160, 89, 0.3)",
            }}
          >
            Equipamiento Pro
          </span>
        </>
      ),
      description:
        "Calzado deportivo técnico, running de alto nivel y accesorios de fútbol. Disfruta de stock real garantizado, envíos gratis y un 15% OFF de fábrica.",
      ctaText: "Comprar Deportes",
      ctaLink: "/search?category=deportes",
      badge: "🏃‍♂️ ALTO RENDIMIENTO",
      backgroundImage:
        "url('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1600&q=80')",
      visualType: "deportes",
    },
    {
      subtitle: "HERRAMIENTAS E INGENIERÍA",
      title: (
        <>
          Equipos de Alto Impacto{" "}
          <span
            style={{
              color: "var(--color-gold)",
              textShadow: "0 0 10px rgba(197, 160, 89, 0.3)",
            }}
          >
            Bosch & DeWalt
          </span>
        </>
      ),
      description:
        "Sierras circulares, taladros percutores y esmeriles listos para tus proyectos profesionales. Calidad premium garantizada con despacho express de 24 horas.",
      ctaText: "Comprar Herramientas",
      ctaLink: "/search?category=herramientas",
      badge: "🛠️ GARANTÍA DE POR VIDA",
      backgroundImage:
        "url('https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=1600&q=80')",
      visualType: "herramientas",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [SLIDES.length]);

  const { isAuthenticated } = useAuthStore();
  const { addItem, loading: cartLoading } = useCartStore();

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const response = await api.get("/api/products?size=4");
        const productList = response.data?.content || response.data || [];
        setProducts(productList);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/categories");
        const list = res.data?.content || res.data || [];
        const roots = list.filter((cat) => !cat.parent && !cat.parentId);
        const mapped = roots.map((cat) => {
          let icon = "📦";
          let count = "50+ Prod.";
          const slug = cat.slug?.toLowerCase();
          if (slug.includes("deportes")) {
            icon = "⚽";
            count = "90+ Prod.";
          } else if (slug.includes("ropa")) {
            icon = "👕";
            count = "340+ Prod.";
          } else if (slug.includes("herramientas")) {
            icon = "🛠️";
            count = "120+ Prod.";
          } else if (slug.includes("tecnologia") || slug.includes("electro")) {
            icon = "💻";
            count = "200+ Prod.";
          }
          return { id: cat.id, name: cat.name, slug: cat.slug, icon, count };
        });

        if (mapped.length > 0) {
          setCategories(mapped);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories(FALLBACK_CATEGORIES);
      }
    };

    fetchRecentProducts();
    fetchCategories();
  }, []);

  const handleQuickAddToCart = async (e, prod) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/`);
      return;
    }
    const res = await addItem(prod.id, 1);
    if (res.success) {
      showToast(`¡${prod.name} agregado al carrito!`, "success");
      setAddedProductId(prod.id);
      setTimeout(() => {
        setAddedProductId(null);
      }, 1500);
    } else {
      showToast("No se pudo agregar al carrito.", "error");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "64px",
        paddingBottom: "64px",
      }}
    >
      {/* 1. HERO SECTION (DYNAMIC PREMIUM SLIDER) */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float3D {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1.5deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
        .hero-slide-enter {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-bg-transition {
          transition: background-image 0.8s ease-in-out, background-color 0.8s ease-in-out;
        }
        .hero-control-btn {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .hero-control-btn:hover {
          background: var(--color-gold);
          border-color: var(--color-gold);
          color: black;
          transform: translateY(-50%) scale(1.15);
          box-shadow: 0 0 20px rgba(197, 160, 89, 0.45);
        }
        .hero-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
        }
        .hero-dot.active {
          background: var(--color-gold);
          width: 32px;
          border-radius: 6px;
          box-shadow: 0 0 10px rgba(197, 160, 89, 0.5);
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
          text-align: center;
          margin: 0 auto;
          max-width: 900px;
          padding: 0 40px; /* Evita que el texto choque con las flechas */
        }
        @media (min-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1.2fr 0.8fr;
            text-align: left;
            padding: 0 50px;
          }
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 30px;
            padding: 0 10px;
          }
          .hero-visual {
            display: none;
          }
          .hero-control-btn {
            top: auto !important;
            bottom: 16px !important;
            transform: none !important;
            width: 40px;
            height: 40px;
          }
          .hero-control-btn:hover {
            transform: scale(1.1) !important;
          }
          .product-image-overlay {
            display: none !important;
          }
        }
        .hero-section-bg {
          padding: 80px 48px 96px 48px;
        }
        .hero-text-block {
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-items: flex-start;
          justify-content: flex-start;
        }
        .hero-cta-wrapper {
          justify-content: flex-start;
        }
        .hero-title {
          font-family: var(--font-sans);
          font-size: 48px;
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -1.8px;
          margin: 0;
          text-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .hero-desc {
          font-size: 17px;
          color: #eaeae8;
          font-weight: 400;
          line-height: 1.65;
          margin: 0 0 16px 0;
          max-width: 580px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        @media (max-width: 1024px) {
          .hero-text-block {
            align-items: center;
          }
          .hero-cta-wrapper {
            justify-content: center;
          }
        }
        @media (max-width: 768px) {
          .hero-section-bg {
            padding: 40px 16px 80px 16px;
          }
          .hero-title {
            font-size: 32px;
            letter-spacing: -1px;
          }
          .hero-desc {
            font-size: 15px;
          }
        }
        @media (max-width: 400px) {
          .hero-title {
            font-size: 28px;
          }
        }
        .glass-visual-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.45);
          position: relative;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-visual-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(197, 160, 89, 0.1), transparent);
          transform: rotate(45deg);
          transition: all 0.5s ease;
        }
        .glass-visual-card:hover {
          transform: translateY(-5px);
          border-color: rgba(197, 160, 89, 0.35);
          box-shadow: 0 30px 60px rgba(197, 160, 89, 0.2);
        }
        .hero-visual-floating {
          animation: float3D 6s ease-in-out infinite;
        }
        .glass-visual-card:hover .zoom-image {
          transform: scale(1.08);
        }
      `}</style>

      <section
        className="hero-bg-transition hero-section-bg"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.95) 30%, rgba(0, 0, 0, 0.75) 60%, rgba(0, 0, 0, 0.45) 100%), ${SLIDES[activeSlide].backgroundImage}`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "var(--text-white)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Subtle decorative gold light */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-10%",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        ></div>

        {/* Left & Right Chevrons */}
        <button
          onClick={() =>
            setActiveSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
          }
          className="hero-control-btn"
          style={{ left: "16px" }}
          aria-label="Previous Slide"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % SLIDES.length)}
          className="hero-control-btn"
          style={{ right: "16px" }}
          aria-label="Next Slide"
        >
          <ChevronRight size={22} />
        </button>

        <div className="hero-grid" style={{ position: "relative", zIndex: 2 }}>
          {/* Left Column: Text & CTA */}
          <div key={activeSlide} className="hero-slide-enter hero-text-block">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  backgroundColor: "rgba(197, 160, 89, 0.15)",
                  color: "var(--color-gold)",
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1.2px",
                  border: "1px solid rgba(197, 160, 89, 0.3)",
                  boxShadow: "0 4px 12px rgba(197, 160, 89, 0.15)",
                }}
              >
                {SLIDES[activeSlide].badge}
              </span>
            </div>

            <span
              style={{
                fontSize: "12px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "4px",
                color: "#d4d3cb",
                display: "inline-block",
              }}
            >
              {SLIDES[activeSlide].subtitle}
            </span>

            <h1 className="hero-title">{SLIDES[activeSlide].title}</h1>

            <p className="hero-desc">{SLIDES[activeSlide].description}</p>

            <div
              className="hero-cta-wrapper"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                alignItems: "center",
                marginBottom: "8px",
                width: "100%",
              }}
            >
              <Link
                to={SLIDES[activeSlide].ctaLink}
                className="btn btn-gold"
                style={{
                  padding: "14px 28px",
                  fontSize: "14px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 15px rgba(197, 160, 89, 0.3)",
                }}
              >
                {SLIDES[activeSlide].ctaText} <ChevronRight size={16} />
              </Link>
            </div>

            {/* Centralized Search Bar embedded inside Hero */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(17, 17, 17, 0.85)",
                borderRadius: "var(--radius-full)",
                padding: "5px 8px",
                boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
                width: "100%",
                maxWidth: "480px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <input
                type="text"
                placeholder="¿Qué buscas hoy? (ej. Zapatilla, Taladro, Chaqueta...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  padding: "10px 16px",
                  fontSize: "14px",
                  backgroundColor: "transparent",
                  color: "white",
                }}
              />
              <button
                type="submit"
                className="btn btn-gold"
                style={{
                  borderRadius: "var(--radius-full)",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "var(--color-gold)",
                  color: "black",
                  border: "none",
                }}
              >
                <Search size={14} /> Buscar
              </button>
            </form>
          </div>

          {/* Right Column: Dynamic interactive glass visual card */}
          <div
            className="hero-visual"
            style={{ justifySelf: "center", width: "100%", maxWidth: "340px" }}
          >
            {SLIDES[activeSlide].visualType === "general" && (
              <div
                className="glass-visual-card hero-slide-enter hero-visual-floating"
                style={{
                  animationDelay: "0.2s",
                  background:
                    "linear-gradient(135deg, rgba(25, 25, 25, 0.85) 0%, rgba(10, 10, 10, 0.95) 100%)",
                  border: "1px solid rgba(197, 160, 89, 0.35)",
                  boxShadow:
                    "0 25px 50px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(197, 160, 89, 0.1)",
                  width: "320px",
                  height: "210px",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Holographic background sheen */}
                <div
                  style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(197, 160, 89, 0.08) 0%, transparent 60%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Card Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>✨</span>
                    <span
                      style={{
                        fontWeight: "800",
                        fontSize: "14px",
                        letterSpacing: "2px",
                        color: "var(--color-gold)",
                      }}
                    >
                      MARKETPRIME
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: "800",
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "1px",
                    }}
                  >
                    ELITE MEMBER
                  </span>
                </div>

                {/* Gold Chip */}
                <div
                  style={{
                    width: "38px",
                    height: "28px",
                    background:
                      "linear-gradient(135deg, #e5c07b 0%, #c5a059 100%)",
                    borderRadius: "4px",
                    position: "relative",
                    border: "1px solid rgba(0,0,0,0.1)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: "1px",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      bottom: 0,
                      width: "1px",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  />
                </div>

                {/* Card Number & Discount */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.9)",
                      letterSpacing: "3px",
                      fontFamily: "monospace",
                    }}
                  >
                    **** **** **** 2026
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      marginTop: "4px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "8px",
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Pase de Descuento
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#ffffff",
                        }}
                      >
                        CLIENTE DISTINGUIDO
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: "var(--color-gold)",
                        color: "#000000",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "900",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 10px rgba(197, 160, 89, 0.3)",
                      }}
                    >
                      15% OFF ACTIVO
                    </div>
                  </div>
                </div>
              </div>
            )}

            {SLIDES[activeSlide].visualType === "deportes" && (
              <div
                className="glass-visual-card hero-slide-enter hero-visual-floating"
                style={{
                  animationDelay: "0.2s",
                  background:
                    "linear-gradient(135deg, rgba(20, 25, 30, 0.85) 0%, rgba(5, 8, 12, 0.95) 100%)",
                  border: "1px solid rgba(197, 160, 89, 0.25)",
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
                  borderRadius: "20px",
                  padding: "20px",
                  width: "320px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    backgroundColor: "var(--color-gold)",
                    color: "var(--color-black)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "800",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    zIndex: 3,
                  }}
                >
                  🔥 15% OFF DIRECTO
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "140px",
                    overflow: "hidden",
                    borderRadius: "12px",
                    marginBottom: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    position: "relative",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                    alt="Zapatillas Nike Air Max"
                    className="zoom-image"
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "var(--text-white)",
                      margin: 0,
                      textAlign: "left",
                    }}
                  >
                    Zapatillas Nike Air Max
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <Star
                      size={12}
                      fill="var(--color-gold)"
                      color="var(--color-gold)"
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--text-white)",
                      }}
                    >
                      4.9
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "11px",
                    color: "#a0a5ab",
                    textAlign: "left",
                    margin: "0 0 12px 0",
                  }}
                >
                  Despacho Express • Envío Gratis Chile
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifySelf: "stretch",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "rgba(255,255,255,0.35)",
                        fontSize: "11px",
                      }}
                    >
                      $79.990
                    </span>
                    <span
                      style={{
                        color: "var(--color-gold)",
                        fontWeight: "850",
                        fontSize: "18px",
                        lineHeight: 1,
                      }}
                    >
                      $67.990
                    </span>
                  </div>
                  <Link
                    to="/search?category=deportes"
                    className="btn btn-gold"
                    style={{
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      borderRadius: "8px",
                    }}
                  >
                    Comprar Ahora
                  </Link>
                </div>
              </div>
            )}

            {SLIDES[activeSlide].visualType === "herramientas" && (
              <div
                className="glass-visual-card hero-slide-enter hero-visual-floating"
                style={{
                  animationDelay: "0.2s",
                  background:
                    "linear-gradient(135deg, rgba(30, 25, 20, 0.85) 0%, rgba(12, 8, 5, 0.95) 100%)",
                  border: "1px solid rgba(197, 160, 89, 0.25)",
                  boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
                  borderRadius: "20px",
                  padding: "20px",
                  width: "320px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    backgroundColor: "#e05353",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "800",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    zIndex: 3,
                  }}
                >
                  ⚡ STOCK LIMITADO
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "140px",
                    overflow: "hidden",
                    borderRadius: "12px",
                    marginBottom: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    position: "relative",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                    alt="Taladro Dewalt"
                    className="zoom-image"
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "var(--text-white)",
                      margin: 0,
                      textAlign: "left",
                    }}
                  >
                    Taladro Percutor DeWalt
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <Star
                      size={12}
                      fill="var(--color-gold)"
                      color="var(--color-gold)"
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--text-white)",
                      }}
                    >
                      4.8
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: "11px",
                    color: "#aba5a0",
                    textAlign: "left",
                    margin: "0 0 12px 0",
                  }}
                >
                  Garantía Extendida • Envío 24 Horas
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifySelf: "stretch",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "rgba(255,255,255,0.35)",
                        fontSize: "11px",
                      }}
                    >
                      $119.990
                    </span>
                    <span
                      style={{
                        color: "var(--color-gold)",
                        fontWeight: "850",
                        fontSize: "18px",
                        lineHeight: 1,
                      }}
                    >
                      $101.990
                    </span>
                  </div>
                  <Link
                    to="/search?category=herramientas"
                    className="btn btn-gold"
                    style={{
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: "700",
                      borderRadius: "8px",
                    }}
                  >
                    Comprar Ahora
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Slide Indicators (Dots) */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 5,
          }}
        >
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`hero-dot ${idx === activeSlide ? "active" : ""}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. CATEGORIES GRID */}
      <section className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "32px",
          }}
        >
          <div>
            <h2 className="title-section" style={{ fontSize: "26px" }}>
              Explorar Categorías
            </h2>
            <p className="subtitle-section">
              Encuentra exactamente lo que necesitas
            </p>
          </div>
          <Link
            to="/search"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--color-gold)",
            }}
          >
            Ver todas <ChevronRight size={16} />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
          }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.slug}`}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "24px 16px",
                cursor: "pointer",
                textDecoration: "none",
                transition: "all var(--transition-normal)",
              }}
            >
              <span style={{ fontSize: "40px", marginBottom: "12px" }}>
                {cat.icon}
              </span>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "var(--color-black)",
                  marginBottom: "4px",
                }}
              >
                {cat.name}
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. RECENT / FEATURED PRODUCTS */}
      <section className="container">
        <div style={{ marginBottom: "32px" }}>
          <h2 className="title-section" style={{ fontSize: "26px" }}>
            Recién Llegados
          </h2>
          <p className="subtitle-section">
            Nuevos lanzamientos de nuestras tiendas aliadas
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "64px 0",
            }}
          >
            <div
              className="spinner"
              style={{ width: "48px", height: "48px", borderWidth: "3px" }}
            ></div>
          </div>
        ) : products.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "48px",
              color: "var(--text-secondary)",
            }}
          >
            No hay productos cargados en este momento.
          </div>
        ) : (
          <div className="grid-4">
            {products.map((prod) => (
              <Link
                key={prod.id || prod.slug}
                to={`/product/${prod.slug}`}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px",
                  height: "100%",
                  textDecoration: "none",
                }}
              >
                {/* Product Image */}
                <div
                  className="product-image-container"
                  style={{
                    width: "100%",
                    height: "200px",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                    position: "relative",
                  }}
                >
                  <img
                    src={
                      prod.imageUrl ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"
                    }
                    alt={prod.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      transition: "transform 0.3s ease",
                    }}
                  />
                  {/* Floating Premium Hover Overlay */}
                  <div
                    className="product-image-overlay"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      backdropFilter: "blur(4px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <button
                      onClick={(e) => handleQuickAddToCart(e, prod)}
                      className="overlay-btn"
                      style={{
                        backgroundColor:
                          addedProductId === prod.id
                            ? "var(--color-success)"
                            : "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(197, 160, 89, 0.4)",
                        borderRadius: "50%",
                        width: "44px",
                        height: "44px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color:
                          addedProductId === prod.id
                            ? "white"
                            : "var(--color-black)",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                      title="Agregar al Carro"
                      disabled={cartLoading}
                    >
                      {addedProductId === prod.id ? (
                        <Check size={18} />
                      ) : (
                        <ShoppingCart size={18} />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setPreviewSlug(prod.slug);
                      }}
                      className="overlay-btn"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(197, 160, 89, 0.4)",
                        borderRadius: "50%",
                        width: "44px",
                        height: "44px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--color-black)",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                      title="Vista Rápida"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>

                {/* Rating */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "8px",
                  }}
                >
                  <Star
                    size={14}
                    fill="var(--color-gold)"
                    color="var(--color-gold)"
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                    }}
                  >
                    {prod.averageRating ? prod.averageRating.toFixed(1) : "5.0"}
                  </span>
                  <span
                    style={{ fontSize: "12px", color: "var(--text-tertiary)" }}
                  >
                    ({prod.reviewsCount || 0})
                  </span>
                </div>

                {/* Title & Store */}
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "var(--color-black)",
                    lineHeight: "1.4",
                    marginBottom: "4px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: "42px",
                  }}
                >
                  {prod.name}
                </h3>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                    display: "block",
                  }}
                >
                  Por: {prod.storeName || "Tienda Oficial"}
                </span>

                {/* Price & Action */}
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      color: "var(--color-black)",
                    }}
                  >
                    {formatCLP(prod.price)}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "var(--color-gold)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Ver Más
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. VALUE PROPOSITION BANNER */}
      <section className="container" style={{ marginTop: "20px" }}>
        <div
          className="grid-3"
          style={{
            backgroundColor: "var(--color-black)",
            color: "var(--text-white)",
            padding: "48px 32px",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Item 1 */}
          <div style={{ display: "flex", gap: "16px", textAlign: "left" }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: "12px",
                borderRadius: "50%",
                display: "inline-flex",
                alignSelf: "flex-start",
                color: "var(--color-gold)",
              }}
            >
              <Truck size={24} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                Despacho Garantizado
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#aaaaaa",
                  lineHeight: "1.5",
                }}
              >
                Entregas rápidas y seguras a todo Chile con seguimiento en línea
                de extremo a extremo.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div style={{ display: "flex", gap: "16px", textAlign: "left" }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: "12px",
                borderRadius: "50%",
                display: "inline-flex",
                alignSelf: "flex-start",
                color: "var(--color-gold)",
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                Transacciones Seguras
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#aaaaaa",
                  lineHeight: "1.5",
                }}
              >
                Pagos encriptados con tecnología Stripe. Tu dinero y datos
                personales siempre a salvo.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div style={{ display: "flex", gap: "16px", textAlign: "left" }}>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: "12px",
                borderRadius: "50%",
                display: "inline-flex",
                alignSelf: "flex-start",
                color: "var(--color-gold)",
              }}
            >
              <Headphones size={24} />
            </div>
            <div>
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                Soporte Dedicado
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#aaaaaa",
                  lineHeight: "1.5",
                }}
              >
                Atención rápida local para cualquier duda con tus compras o
                despachos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Preview Modal */}
      {previewSlug && (
        <ProductPreviewModal
          slug={previewSlug}
          onClose={() => setPreviewSlug(null)}
        />
      )}

      <style>{`
        .product-image-container:hover .product-image-overlay {
          opacity: 1 !important;
        }
        .overlay-btn:hover {
          background-color: var(--color-gold) !important;
          color: white !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default HomePage;
