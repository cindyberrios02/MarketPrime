// store/StoreStatus.java
package cl.marketprime.store;

public enum StoreStatus {
    PENDING,    // recién creada, esperando aprobación
    ACTIVE,     // aprobada por admin
    SUSPENDED   // desactivada por admin
}