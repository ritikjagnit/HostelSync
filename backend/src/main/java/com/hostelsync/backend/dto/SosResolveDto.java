package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.SosStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SosResolveDto(
        @NotNull(message = "Target status is required")
        SosStatus status,

        @Size(max = 1000, message = "Resolution notes must be within 1000 characters")
        String resolutionNotes
) {
}

