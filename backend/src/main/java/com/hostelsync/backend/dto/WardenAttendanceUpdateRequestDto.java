package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an individual attendance record.
 */
public record WardenAttendanceUpdateRequestDto(
        @NotNull(message = "Attendance status is required")
        AttendanceStatus status,

        @Size(max = 255, message = "Remarks cannot exceed 255 characters")
        String remarks
) {
}
