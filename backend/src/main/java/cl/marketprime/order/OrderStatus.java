// order/OrderStatus.java
package cl.marketprime.order;

public enum OrderStatus {
    PENDING,     // Creada, esperando pago o confirmación
    CONFIRMED,   // Confirmada (pagada)
    SHIPPED,     // Enviada
    DELIVERED,   // Entregada
    CANCELLED    // Cancelada
}
