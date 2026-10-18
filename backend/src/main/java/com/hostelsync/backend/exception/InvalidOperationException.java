package com.hostelsync.backend.exception;

/**
 * Exception thrown when an operation violates business rules or conflicts with active allocations.
 */
public class InvalidOperationException extends RuntimeException {
    public InvalidOperationException(String message) {
        super(message);
    }
}
