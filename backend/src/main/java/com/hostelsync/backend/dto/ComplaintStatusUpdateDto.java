package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for Warden or Admin updating the resolution status of a complaint ticket.
 */
public record ComplaintStatusUpdateDto(
        @NotNull(message = "Status is required")
        ComplaintStatus status,

        @Size(max = 500, message = "Resolution notes cannot exceed 500 characters")
        String resolutionNotes
) {
}
