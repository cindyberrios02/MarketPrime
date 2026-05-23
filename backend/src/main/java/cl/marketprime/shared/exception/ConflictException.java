// shared/exception/ConflictException.java
package cl.marketprime.shared.exception;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}