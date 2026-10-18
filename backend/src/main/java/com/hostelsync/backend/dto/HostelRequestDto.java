package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.HostelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating or updating a Hostel.
 */
public record HostelRequestDto(
        @NotBlank(message = "Hostel name is required")
        @Size(max = 100, message = "Hostel name cannot exceed 100 characters")
        String name,

        @NotNull(message = "Hostel type is required (BOYS or GIRLS)")
        HostelType hostelType,

        @NotBlank(message = "Hostel address is required")
        @Size(max = 255, message = "Hostel address cannot exceed 255 characters")
        String address,

        Boolean active
) {}
