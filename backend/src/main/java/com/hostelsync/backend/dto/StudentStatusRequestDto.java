package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request payload for activating or deactivating a student account.
 */
public record StudentStatusRequestDto(
        @NotNull(message = "Active status is required")
        Boolean active
) {}
