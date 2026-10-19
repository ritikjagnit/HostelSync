package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request payload for self-service student profile contact updates.
 * Permits modification only of allowable fields (phone number).
 */
public record StudentProfileUpdateRequestDto(
        @NotBlank(message = "Phone number is required")
        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        @Pattern(regexp = "^[0-9+\\-\\s()]{7,20}$", message = "Phone number must be a valid format between 7 and 20 characters")
        String phone
) {}
