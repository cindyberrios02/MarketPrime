// shared/config/DataSeeder.java
package cl.marketprime.shared.config;

import cl.marketprime.category.Category;
import cl.marketprime.category.CategoryRepository;
import cl.marketprime.role.Role;
import cl.marketprime.role.RoleName;
import cl.marketprime.role.RoleRepository;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import cl.marketprime.store.StoreProfile;
import cl.marketprime.store.StoreProfileRepository;
import cl.marketprime.store.StoreStatus;
import cl.marketprime.product.Product;
import cl.marketprime.product.ProductRepository;
import cl.marketprime.product.ProductStatus;
import cl.marketprime.product.ProductImage;
import cl.marketprime.shared.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final StoreProfileRepository storeRepository;
    private final ProductRepository productRepository;
    private final cl.marketprime.review.ReviewRepository reviewRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoles();
        seedAdminUser();
        seedCategories();
        List<StoreProfile> stores = seedStores();
        seedProducts(stores);
        List<User> buyers = seedBuyers();
        List<Product> products = productRepository.findAll();
        seedReviews(products, buyers);

        // Ensure any existing products created as DRAFT are migrated to ACTIVE so they are visible
        productRepository.findAll().forEach(p -> {
            if (p.getStatus() == ProductStatus.DRAFT) {
                p.setStatus(ProductStatus.ACTIVE);
                productRepository.save(p);
                log.info("Migrated existing product '{}' from DRAFT to ACTIVE", p.getName());
            }
        });
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;

        Category deportes = categoryRepository.save(Category.builder()
                .name("Deportes").slug("deportes").displayOrder(1).build());

        Category ropa = categoryRepository.save(Category.builder()
                .name("Ropa").slug("ropa").displayOrder(2).build());

        Category herramientas = categoryRepository.save(Category.builder()
                .name("Herramientas").slug("herramientas").displayOrder(3).build());

        // Subcategorías
        categoryRepository.save(Category.builder()
                .name("Fútbol").slug("futbol").parent(deportes).displayOrder(1).build());
        categoryRepository.save(Category.builder()
                .name("Running").slug("running").parent(deportes).displayOrder(2).build());
        categoryRepository.save(Category.builder()
                .name("Ropa Hombre").slug("ropa-hombre").parent(ropa).displayOrder(1).build());
        categoryRepository.save(Category.builder()
                .name("Ropa Mujer").slug("ropa-mujer").parent(ropa).displayOrder(2).build());
        categoryRepository.save(Category.builder()
                .name("Herramientas Eléctricas").slug("herramientas-electricas")
                .parent(herramientas).displayOrder(1).build());

        log.info("Seeded categories");
    }

    private void seedRoles() {
        Arrays.stream(RoleName.values()).forEach(roleName -> {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(new Role(roleName));
                log.info("Seeded role: {}", roleName);
            }
        });
    }

    private void seedAdminUser() {
        String adminEmail = "admin@marketprime.cl";
        if (userRepository.existsByEmail(adminEmail)) return;

        var adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN).orElseThrow();

        var admin = User.builder()
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode("Admin1234!"))
                .firstName("Admin")
                .lastName("MarketPrime")
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(admin);
        log.info("Seeded admin user: {}", adminEmail);
    }

    private List<StoreProfile> seedStores() {
        var sellerRole = roleRepository.findByName(RoleName.ROLE_SELLER).orElseThrow();
        List<StoreProfile> stores = new ArrayList<>();

        String[][] storeData = {
                {"seller1@marketprime.cl", "Tienda Deportes Pro", "deportes-pro", "Tu tienda líder para deportes de alta intensidad y rendimiento.", "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=150&q=80", "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80"},
                {"seller2@marketprime.cl", "Fútbol y Running Chile", "futbol-running-chile", "Especialistas en equipamiento de fútbol y calzado para running.", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&q=80", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80"},
                {"seller3@marketprime.cl", "Moda Urbana", "moda-urbana", "Estilo, elegancia y comodidad en ropa urbana para el día a día.", "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&q=80", "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200&q=80"},
                {"seller4@marketprime.cl", "Ropa Premium", "ropa-premium", "Colección exclusiva de vestuario premium para hombres y mujeres.", "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=150&q=80", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80"},
                {"seller5@marketprime.cl", "Ferretería Eléctrica", "ferreteria-electrica", "Las mejores herramientas eléctricas y accesorios industriales del país.", "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=150&q=80", "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80"}
        };

        for (int i = 0; i < storeData.length; i++) {
            String email = storeData[i][0];
            String name = storeData[i][1];
            String slug = storeData[i][2];
            String desc = storeData[i][3];
            String logo = storeData[i][4];
            String banner = storeData[i][5];

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = User.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode("Seller1234!"))
                        .firstName("Vendedor " + (i + 1))
                        .lastName("MarketPrime")
                        .roles(Set.of(sellerRole))
                        .build();
                user = userRepository.save(user);
                log.info("Seeded seller user: {}", email);
            }

            StoreProfile store = storeRepository.findBySlug(slug).orElse(null);
            if (store == null) {
                boolean isPending = slug.equals("ferreteria-electrica");
                store = StoreProfile.builder()
                        .user(user)
                        .storeName(name)
                        .slug(slug)
                        .description(desc)
                        .logoUrl(logo)
                        .bannerUrl(banner)
                        .status(isPending ? StoreStatus.PENDING : StoreStatus.ACTIVE)
                        .commissionRate(new BigDecimal("10.00"))
                        .approvedAt(isPending ? null : Instant.now())
                        .build();
                store = storeRepository.save(store);
                log.info("Seeded store: {}", name);
            }
            stores.add(store);
        }
        return stores;
    }

    private void seedProducts(List<StoreProfile> stores) {
        if (productRepository.count() >= 250) {
            log.info("Products already seeded (count = {}). Skipping.", productRepository.count());
            return;
        }

        // Recuperar categorías hoja
        Category catFutbol = categoryRepository.findBySlug("futbol").orElse(null);
        Category catRunning = categoryRepository.findBySlug("running").orElse(null);
        Category catRopaHombre = categoryRepository.findBySlug("ropa-hombre").orElse(null);
        Category catRopaMujer = categoryRepository.findBySlug("ropa-mujer").orElse(null);
        Category catHerramientas = categoryRepository.findBySlug("herramientas-electricas").orElse(null);

        if (catFutbol == null || catRunning == null || catRopaHombre == null || catRopaMujer == null || catHerramientas == null) {
            log.warn("Leaf categories not found. Skipping product seeding.");
            return;
        }

        log.info("Starting product seeding...");

        // Definiciones de datos para cada categoría
        String[] futbolBrands = {"Nike", "Adidas", "Puma", "Reebok", "Under Armour"};
        String[] futbolItems = {"Pelota de Fútbol", "Zapatos de Fútbol", "Guantes de Arquero", "Camiseta de Entrenamiento", "Canilleras Pro", "Short de Fútbol"};
        String[] futbolImages = {
                "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&q=80",
                "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&q=80"
        };

        String[] runningBrands = {"Asics", "Brooks", "Saucony", "New Balance", "Hoka"};
        String[] runningItems = {"Zapatillas Running Trail", "Polera Deportiva Transpirable", "Cortaviento Ultraliviano", "Calcetines de Compresión", "Reloj Deportivo GPS", "Mochila de Hidratación"};
        String[] runningImages = {
                "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&q=80",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80"
        };

        String[] ropaHombreBrands = {"Levis", "Zara", "H&M", "Tommy Hilfiger", "Calvin Klein"};
        String[] ropaHombreItems = {"Polera Básica Algodón", "Jeans Denim Slim Fit", "Polerón Con Capucha Confort", "Camisa Oxford Elegante", "Chaqueta de Mezclilla", "Pantalón Chino Casual"};
        String[] ropaHombreImages = {
                "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&q=80",
                "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=500&q=80"
        };

        String[] ropaMujerBrands = {"Mango", "Zara", "Forever 21", "Nike Women", "Adidas Originals"};
        String[] ropaMujerItems = {"Calzas Deportivas Seamless", "Top Deportivo Con Soporte", "Vestido de Verano Floral", "Chaqueta Cortaviento Chic", "Polerón Oversized Confort", "Falta Plisada Casual"};
        String[] ropaMujerImages = {
                "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80",
                "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80"
        };

        String[] herramientasBrands = {"DeWalt", "Bosch", "Makita", "Stanley", "Black & Decker"};
        String[] herramientasItems = {"Taladro Percutor Inalámbrico", "Sierra Circular Eléctrica", "Esmeril Angular Power", "Lijadora Orbital Eléctrica", "Rotomartillo Industrial", "Atornillador de Impacto"};
        String[] herramientasImages = {
                "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&q=80",
                "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80"
        };

        // Sembrar 50 productos por cada categoría
        seedCategoryProducts(catFutbol, futbolBrands, futbolItems, futbolImages, stores, 0, 1);
        seedCategoryProducts(catRunning, runningBrands, runningItems, runningImages, stores, 0, 1);
        seedCategoryProducts(catRopaHombre, ropaHombreBrands, ropaHombreItems, ropaHombreImages, stores, 2, 3);
        seedCategoryProducts(catRopaMujer, ropaMujerBrands, ropaMujerItems, ropaMujerImages, stores, 2, 3);
        seedCategoryProducts(catHerramientas, herramientasBrands, herramientasItems, herramientasImages, stores, 4, 4);

        log.info("Finished product seeding successfully!");
    }

    private void seedCategoryProducts(Category category, String[] brands, String[] items, String[] images,
                                      List<StoreProfile> stores, int storeMinIndex, int storeMaxIndex) {
        log.info("Seeding 50 products for category: {}", category.getName());
        for (int j = 1; j <= 50; j++) {
            String brand = brands[j % brands.length];
            String item = items[j % items.length];
            String name = item + " " + brand + " Pro " + j;
            
            // Slug único
            String slug = SlugUtils.toSlug(name) + "-" + (int)(Math.random() * 10000);

            // Seleccionar tienda del rango asignado
            int storeIndex = storeMinIndex + (j % (storeMaxIndex - storeMinIndex + 1));
            StoreProfile store = stores.get(storeIndex);

            // Precios
            BigDecimal basePrice = new BigDecimal((15 + (j * 2)) * 1000);
            BigDecimal salePrice = null;
            if (j % 4 == 0) { // Descuento en 25% de los productos
                salePrice = basePrice.multiply(new BigDecimal("0.85")).setScale(0, java.math.RoundingMode.HALF_UP);
            }

            Integer stock = 5 + (j % 45);

            Product product = Product.builder()
                    .store(store)
                    .category(category)
                    .name(name)
                    .slug(slug)
                    .description("Este es un producto premium de alta calidad " + name + ", especialmente seleccionado por " + store.getStoreName() + " para garantizar el mejor desempeño y durabilidad.")
                    .basePrice(basePrice)
                    .salePrice(salePrice)
                    .stockQuantity(stock)
                    .status(ProductStatus.ACTIVE)
                    .isFeatured(j % 10 == 0)
                    .build();

            // Agregar imagen primaria
            String imgUrl = images[j % images.length];
            ProductImage primaryImage = ProductImage.builder()
                    .product(product)
                    .url(imgUrl)
                    .altText(name + " principal")
                    .isPrimary(true)
                    .displayOrder(0)
                    .build();
            product.setImages(new ArrayList<>(List.of(primaryImage)));

            productRepository.save(product);
        }
    }

    private List<User> seedBuyers() {
        var buyerRole = roleRepository.findByName(RoleName.ROLE_BUYER).orElseThrow();
        List<User> buyers = new ArrayList<>();

        String[][] buyerData = {
            {"comprador1@marketprime.cl", "Juan", "Pérez"},
            {"comprador2@marketprime.cl", "María", "González"},
            {"comprador3@marketprime.cl", "Diego", "Silva"}
        };

        for (int i = 0; i < buyerData.length; i++) {
            String email = buyerData[i][0];
            String firstName = buyerData[i][1];
            String lastName = buyerData[i][2];

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = User.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode("Buyer1234!"))
                        .firstName(firstName)
                        .lastName(lastName)
                        .roles(Set.of(buyerRole))
                        .build();
                user = userRepository.save(user);
                log.info("Seeded buyer user: {}", email);
            }
            buyers.add(user);
        }
        return buyers;
    }

    private void seedReviews(List<Product> products, List<User> buyers) {
        if (reviewRepository.count() > 0) return;

        String[] comments = {
            "Superó mis expectativas, muy resistente.",
            "Excelente relación precio calidad, despacho súper rápido.",
            "Buen producto, corresponde exactamente a la descripción.",
            "Muy conforme con la compra. La calidad del material es fantástica.",
            "Llegó en el tiempo indicado y funciona a la perfección. Totalmente recomendado.",
            "Increíble diseño y terminación. Se nota que es un producto de gama alta.",
            "Excelente atención de la tienda, respondieron todas mis dudas.",
            "Muy práctico y cómodo. Lo uso a diario."
        };

        int reviewCount = 0;
        // Seed 2-3 reviews per product for the first 15 products
        for (int i = 0; i < Math.min(products.size(), 15); i++) {
            Product p = products.get(i);
            int numReviews = 2 + (i % 2); // 2 or 3
            for (int r = 0; r < numReviews; r++) {
                User buyer = buyers.get((i + r) % buyers.size());
                int rating = 4 + ((i + r) % 2); // 4 or 5 stars
                String comment = comments[(i * 3 + r) % comments.length];

                cl.marketprime.review.Review review = cl.marketprime.review.Review.builder()
                        .product(p)
                        .user(buyer)
                        .rating(rating)
                        .comment(comment)
                        .build();
                reviewRepository.save(review);
                reviewCount++;
            }
        }
        log.info("Seeded {} product reviews.", reviewCount);
    }
}