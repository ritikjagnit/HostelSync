package com.hostelsync.backend.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Standardized error response DTO for API exceptions.
 */
public record ErrorResponseDto(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp,
        Map<String, String> validationErrors
) {
    public static ErrorResponseDto of(int status, String error, String message, String path) {
        return new ErrorResponseDto(status, error, message, path, Instant.now(), null);
    }

    public static ErrorResponseDto ofValidation(int status, String error, String message, String path, Map<String, String> validationErrors) {
        return new ErrorResponseDto(status, error, message, path, Instant.now(), validationErrors);
    }
}
