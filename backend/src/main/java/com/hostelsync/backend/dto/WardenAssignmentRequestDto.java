package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Admin request DTO to assign a hostel to a warden.
 */
public record WardenAssignmentRequestDto(
        @NotNull(message = "Warden ID is required")
        Long wardenId,

        @NotNull(message = "Hostel ID is required")
        Long hostelId
) {
}
