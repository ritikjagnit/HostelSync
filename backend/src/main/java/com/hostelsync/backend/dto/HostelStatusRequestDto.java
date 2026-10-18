package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request payload for toggling active/inactive status of a Hostel.
 */
public record HostelStatusRequestDto(
        @NotNull(message = "Active status is required")
        Boolean active
) {}
