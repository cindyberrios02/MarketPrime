// shared/exception/ForbiddenException.java
package cl.marketprime.shared.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}