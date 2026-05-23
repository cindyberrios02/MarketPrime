// product/ProductStatus.java
package cl.marketprime.product;

public enum ProductStatus {
    DRAFT,      // el seller lo está preparando, no visible públicamente
    ACTIVE,     // visible y disponible para compra
    PAUSED,     // el seller lo pausó temporalmente
    DELETED     // soft delete
}