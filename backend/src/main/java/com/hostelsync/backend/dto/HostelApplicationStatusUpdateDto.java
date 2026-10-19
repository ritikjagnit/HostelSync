package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for Hostel In-Charge or Administrator to update application review status (SELECT / REJECT).
 */
public record HostelApplicationStatusUpdateDto(
        @NotNull(message = "Status is required")
        ApplicationStatus status,

        @Size(max = 255, message = "Rejection reason cannot exceed 255 characters")
        String rejectionReason,

        @Size(max = 500, message = "Remarks cannot exceed 500 characters")
        String remarks
) {}
