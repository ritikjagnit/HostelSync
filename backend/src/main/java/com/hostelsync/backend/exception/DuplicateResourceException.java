package com.hostelsync.backend.exception;

/**
 * Exception thrown when creating or updating a resource violates a uniqueness constraint.
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
