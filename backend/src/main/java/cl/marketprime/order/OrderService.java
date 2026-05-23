// order/OrderService.java
package cl.marketprime.order;

import cl.marketprime.address.Address;
import cl.marketprime.address.AddressRepository;
import cl.marketprime.cart.CartItem;
import cl.marketprime.cart.CartItemRepository;
import cl.marketprime.order.dto.*;
import cl.marketprime.product.Product;
import cl.marketprime.product.ProductRepository;
import cl.marketprime.product.ProductStatus;
import cl.marketprime.shared.exception.ForbiddenException;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.shared.service.EmailService;
import cl.marketprime.store.StoreProfile;
import cl.marketprime.store.StoreProfileRepository;
import cl.marketprime.store.StoreStatus;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository          orderRepository;
    private final OrderItemRepository      orderItemRepository;
    private final CartItemRepository       cartItemRepository;
    private final AddressRepository         addressRepository;
    private final UserRepository            userRepository;
    private final StoreProfileRepository   storeProfileRepository;
    private final ProductRepository         productRepository;
    private final EmailService              emailService;

    // ─── Crear orden desde el carrito ─────────────────────────────────────────

    @Transactional
    public List<OrderResponse> placeOrder(String email, PlaceOrderRequest request) {
        User user = findUser(email);

        // 1. Obtener y validar dirección de envío
        Address address = addressRepository.findByIdAndUserId(request.shippingAddressId(), user.getId())
                .orElseThrow(() -> new NotFoundException("Shipping address not found"));

        // Crear snapshot de dirección de envío
        String addressSnapshot = String.format("%s - %s. %s, %s %s, %s, %s. Fono: %s",
                address.getAlias(),
                address.getRecipientName(),
                address.getStreet(),
                address.getNumber() != null ? address.getNumber() : "",
                address.getApartment() != null ? "Depto " + address.getApartment() : "",
                address.getCity(),
                address.getRegion(),
                address.getPhone() != null ? address.getPhone() : "N/A"
        ).replaceAll("\\s+", " ").trim();

        // 2. Obtener y validar ítems del carrito
        List<CartItem> cartItems = cartItemRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cannot place order. Your shopping cart is empty");
        }

        // 3. Agrupar ítems por tienda
        Map<StoreProfile, List<CartItem>> itemsByStore = cartItems.stream()
                .collect(Collectors.groupingBy(item -> item.getProduct().getStore()));

        List<Order> savedOrders = new ArrayList<>();

        for (Map.Entry<StoreProfile, List<CartItem>> entry : itemsByStore.entrySet()) {
            StoreProfile store = entry.getKey();
            List<CartItem> storeCartItems = entry.getValue();

            Order order = Order.builder()
                    .user(user)
                    .status(OrderStatus.PENDING)
                    .store(store)
                    .shippingAddress(address)
                    .shippingAddressSnapshot(addressSnapshot)
                    .totalAmount(BigDecimal.ZERO)
                    .shippingCost(BigDecimal.ZERO)
                    .build();

            BigDecimal storeSubtotal = BigDecimal.ZERO;

            // 4. Procesar ítems, validar stock y reservar
            for (CartItem cartItem : storeCartItems) {
                Product product = cartItem.getProduct();

                if (product.getStatus() != ProductStatus.ACTIVE) {
                    throw new IllegalArgumentException("Product '" + product.getName() + "' is no longer active");
                }

                if (product.getStockQuantity() < cartItem.getQuantity()) {
                    throw new IllegalArgumentException("Not enough stock for product '" + product.getName() + "'. Available: " + product.getStockQuantity());
                }

                // Descontar stock
                product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
                productRepository.save(product);

                BigDecimal unitPrice = product.getSalePrice() != null ? product.getSalePrice() : product.getBasePrice();
                BigDecimal subtotal  = unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
                storeSubtotal = storeSubtotal.add(subtotal);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .product(product)
                        .store(store)
                        .quantity(cartItem.getQuantity())
                        .unitPrice(unitPrice)
                        .subtotal(subtotal)
                        .build();

                order.getItems().add(orderItem);
            }

            // Regla de envío individual por tienda: si subtotal < 50,000 CLP, cobra 3,990 CLP, sino gratis
            BigDecimal shippingCost = BigDecimal.ZERO;
            if (storeSubtotal.compareTo(BigDecimal.valueOf(50000)) < 0) {
                shippingCost = BigDecimal.valueOf(3990);
            }
            order.setShippingCost(shippingCost);
            order.setTotalAmount(storeSubtotal.add(shippingCost));

            Order savedOrder = orderRepository.save(order);
            savedOrders.add(savedOrder);

            // Enviar notificaciones por correo de orden recibida (Fase 3)
            // Comprador
            String buyerSubject = "Confirmación de Pedido Recibido #" + savedOrder.getId().toString().substring(0, 8);
            String buyerBody = String.format("""
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <h2 style='color: #d4af37;'>MarketPrime.cl</h2>
                    <h3>¡Gracias por tu compra!</h3>
                    <p>Hemos registrado tu pedido en la tienda <strong>%s</strong>.</p>
                    <p><strong>Detalles del Envío:</strong> %s</p>
                    <p><strong>Costo de Despacho:</strong> $%,.0f CLP</p>
                    <p><strong>Total de esta Tienda:</strong> $%,.0f CLP</p>
                    <p>Estado del Pedido: <span style='background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px;'>Pendiente de Pago</span></p>
                    <p>Puedes realizar el pago consolidated desde el flujo de Webpay.</p>
                </div>
                """, store.getStoreName(), addressSnapshot, shippingCost.doubleValue(), storeSubtotal.add(shippingCost).doubleValue());
            emailService.sendHtmlEmail(user.getEmail(), buyerSubject, buyerBody, "BUYER_ALERT");

            // Vendedor
            String sellerSubject = "Nuevo Pedido Recibido #" + savedOrder.getId().toString().substring(0, 8);
            String sellerBody = String.format("""
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <h2 style='color: #d4af37;'>MarketPrime Seller Center</h2>
                    <h3>¡Tienes una nueva venta!</h3>
                    <p>El cliente <strong>%s</strong> ha realizado un pedido en tu tienda.</p>
                    <p><strong>Detalles de Despacho:</strong> %s</p>
                    <p><strong>Tu Subtotal:</strong> $%,.0f CLP</p>
                    <p><strong>Costo de Envío a Cobrar:</strong> $%,.0f CLP</p>
                    <p>El pedido está actualmente <span style='background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px;'>Pendiente de Pago</span>. Te avisaremos apenas el pago sea procesado.</p>
                </div>
                """, user.getEmail(), addressSnapshot, storeSubtotal.doubleValue(), shippingCost.doubleValue());
            emailService.sendHtmlEmail(store.getUser().getEmail(), sellerSubject, sellerBody, "SELLER_ALERT");
        }

        // 5. Limpiar carrito
        cartItemRepository.deleteAllByUserId(user.getId());

        return savedOrders.stream()
                .map(this::toOrderResponse)
                .toList();
    }

    // ─── Ver mis órdenes (Buyer) ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getMyOrders(String email, Pageable pageable) {
        User user = findUser(email);
        return orderRepository.findAllByUserId(user.getId(), pageable)
                .map(this::toOrderSummaryResponse);
    }

    // ─── Detalle de orden (Buyer) ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(String email, UUID orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new NotFoundException("Order not found"));
        return toOrderResponse(order);
    }

    // ─── Cancelar orden (Buyer) ───────────────────────────────────────────────

    @Transactional
    public OrderResponse cancelOrder(String email, UUID orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only PENDING orders can be cancelled. Current status: " + order.getStatus());
        }

        // Devolver stock
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        // Notify cancellation
        String cancelSubject = "Pedido Cancelado #" + savedOrder.getId().toString().substring(0, 8);
        String cancelBody = String.format("""
            <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                <h2 style='color: #dc3545;'>Pedido Cancelado</h2>
                <p>Tu pedido en la tienda <strong>%s</strong> ha sido cancelado con éxito.</p>
                <p>El stock de tus productos ha sido liberado.</p>
            </div>
            """, order.getStore().getStoreName());
        emailService.sendHtmlEmail(user.getEmail(), cancelSubject, cancelBody, "BUYER_ALERT");

        return toOrderResponse(savedOrder);
    }

    // ─── Ver órdenes de la tienda (Seller) ─────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getStoreOrders(String sellerEmail, Pageable pageable) {
        StoreProfile store = findSellerStore(sellerEmail);
        return orderRepository.findAllByStoreId(store.getId(), pageable)
                .map(this::toOrderSummaryResponse);
    }

    // ─── Actualizar estado de orden (Seller) ──────────────────────────────────

    @Transactional
    public OrderResponse updateOrderStatus(String sellerEmail, UUID orderId, OrderStatus status) {
        StoreProfile store = findSellerStore(sellerEmail);

        // Buscar orden asociada al seller
        Order order = orderRepository.findByIdAndStoreId(orderId, store.getId())
                .orElseThrow(() -> new NotFoundException("Order not found or does not belong to your store"));

        // Opcional: Validaciones de flujo de estado
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot change status of a " + order.getStatus() + " order");
        }

        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);

        // Notificar cambio de estado por correo (Fase 3)
        String statusSubject = "Actualización de tu pedido #" + savedOrder.getId().toString().substring(0, 8);
        String statusBody = String.format("""
            <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                <h2 style='color: #d4af37;'>MarketPrime.cl</h2>
                <h3>¡Tu pedido ha cambiado de estado!</h3>
                <p>La tienda <strong>%s</strong> ha actualizado el estado de tu pedido a: <span style='background-color: #d1ecf1; color: #0c5460; padding: 4px 8px; border-radius: 4px;'>%s</span></p>
                <p>Pronto recibirás más novedades sobre el despacho a tu dirección: <em>%s</em>.</p>
            </div>
            """, store.getStoreName(), status.name(), order.getShippingAddressSnapshot());
        emailService.sendHtmlEmail(order.getUser().getEmail(), statusSubject, statusBody, "BUYER_ALERT");

        return toOrderResponse(savedOrder);
    }

    // ─── Ver todas las órdenes (Admin) ────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getAdminOrders(Pageable pageable) {
        return orderRepository.findAll(pageable)
                .map(this::toOrderSummaryResponse);
    }

    @Transactional
    public void markOrderAsCancelled(Order order) {
        if (order.getStatus() == OrderStatus.PENDING) {
            // Devolver stock
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
            order.setStatus(OrderStatus.CANCELLED);
            orderRepository.save(order);

            // Notify cancellation
            String cancelSubject = "Pedido Cancelado #" + order.getId().toString().substring(0, 8);
            String cancelBody = String.format("""
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <h2 style='color: #dc3545;'>Pedido Cancelado</h2>
                    <p>Tu pedido en la tienda <strong>%s</strong> ha sido cancelado debido a que no se procesó el pago.</p>
                </div>
                """, order.getStore().getStoreName());
            emailService.sendHtmlEmail(order.getUser().getEmail(), cancelSubject, cancelBody, "BUYER_ALERT");
        }
    }

    @Transactional
    public void markOrderAsConfirmed(Order order) {
        if (order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);

            // Notificar pago confirmado (Fase 3)
            // Comprador
            String paySubject = "Pago Confirmado - Pedido #" + order.getId().toString().substring(0, 8);
            String payBody = String.format("""
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <h2 style='color: #28a745;'>✔ Pago Confirmado</h2>
                    <h3>¡Tu pago ha sido procesado con éxito!</h3>
                    <p>El pago de tu pedido en la tienda <strong>%s</strong> ha sido confirmado.</p>
                    <p>Monto Pagado: $%,.0f CLP (incluye despacho de $%,.0f CLP)</p>
                    <p>El vendedor comenzará a preparar tu envío a la brevedad.</p>
                </div>
                """, order.getStore().getStoreName(), order.getTotalAmount().doubleValue(), order.getShippingCost().doubleValue());
            emailService.sendHtmlEmail(order.getUser().getEmail(), paySubject, payBody, "BUYER_ALERT");

            // Vendedor
            String sellPaySubject = "Pago Aprobado - ¡Despacha tu venta! #" + order.getId().toString().substring(0, 8);
            String sellPayBody = String.format("""
                <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <h2 style='color: #28a745;'>💵 Venta Aprobada</h2>
                    <h3>¡El pago ha sido confirmado!</h3>
                    <p>El cliente <strong>%s</strong> ha pagado con éxito.</p>
                    <p>Por favor, procede a preparar el despacho de los productos a la siguiente dirección:</p>
                    <blockquote style='background-color: #f8f9fa; border-left: 4px solid #d4af37; padding: 10px;'>%s</blockquote>
                    <p>Una vez enviado, recuerda marcar el pedido como <strong>ENVIADO (SHIPPED)</strong> en tu panel de vendedor.</p>
                </div>
                """, order.getUser().getEmail(), order.getShippingAddressSnapshot());
            emailService.sendHtmlEmail(order.getStore().getUser().getEmail(), sellPaySubject, sellPayBody, "SELLER_ALERT");
        }
    }

    // ─── Helpers y Mapeos ─────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private StoreProfile findSellerStore(String email) {
        User user = findUser(email);
        StoreProfile store = storeProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("Store not found for user: " + email));

        if (store.getStatus() != StoreStatus.ACTIVE) {
            throw new ForbiddenException("Your store is not approved yet");
        }
        return store;
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::toOrderItemResponse)
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getShippingCost(),
                order.getStore() != null ? order.getStore().getId() : null,
                order.getStore() != null ? order.getStore().getStoreName() : null,
                order.getStore() != null ? order.getStore().getSlug() : null,
                order.getUser() != null ? order.getUser().getEmail() : null,
                order.getShippingAddress() != null ? order.getShippingAddress().getId() : null,
                order.getShippingAddressSnapshot(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        Product product = item.getProduct();
        String imageUrl = product.getImages().stream()
                .filter(cl.marketprime.product.ProductImage::isPrimary)
                .map(cl.marketprime.product.ProductImage::getUrl)
                .findFirst()
                .orElseGet(() -> product.getImages().stream()
                        .map(cl.marketprime.product.ProductImage::getUrl)
                        .findFirst()
                        .orElse(null));

        return new OrderItemResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getSlug(),
                imageUrl,
                item.getStore().getId(),
                item.getStore().getStoreName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getSubtotal()
        );
    }

    private OrderSummaryResponse toOrderSummaryResponse(Order order) {
        int totalItems = order.getItems().stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();

        return new OrderSummaryResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getShippingCost(),
                order.getStore() != null ? order.getStore().getStoreName() : null,
                order.getUser() != null ? order.getUser().getEmail() : null,
                order.getShippingAddressSnapshot(),
                totalItems,
                order.getCreatedAt()
        );
    }
}
