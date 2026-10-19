package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.ComplaintCategory;
import com.hostelsync.backend.entity.ComplaintUrgency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for student submitting a new room/hostel maintenance grievance ticket.
 */
public record ComplaintCreateDto(
        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title cannot exceed 120 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        String description,

        @NotNull(message = "Category is required")
        ComplaintCategory category,

        @NotNull(message = "Urgency is required")
        ComplaintUrgency urgency,

        Long roomId
) {
}
