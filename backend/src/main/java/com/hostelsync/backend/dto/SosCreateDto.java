package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.SosType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SosCreateDto(
        @NotNull(message = "Alert type is required")
        SosType alertType,

        @Size(max = 1000, message = "Description must be within 1000 characters")
        String description
) {
}

