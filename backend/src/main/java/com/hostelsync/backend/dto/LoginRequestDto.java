package com.hostelsync.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Inbound payload for user authentication requests.
 */
public record LoginRequestDto(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid format")
        @Size(max = 150, message = "Email cannot exceed 150 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(max = 100, message = "Password cannot exceed 100 characters")
        String password
) {}
