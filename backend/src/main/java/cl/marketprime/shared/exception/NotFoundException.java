// shared/exception/NotFoundException.java
package cl.marketprime.shared.exception;

public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}