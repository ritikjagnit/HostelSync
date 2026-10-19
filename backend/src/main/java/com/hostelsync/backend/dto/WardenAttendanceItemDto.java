package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Individual student attendance record within a bulk roll-call submission.
 */
public record WardenAttendanceItemDto(
        @NotNull(message = "Student ID is required")
        Long studentId,

        @NotNull(message = "Attendance status is required")
        AttendanceStatus status,

        @Size(max = 255, message = "Remarks cannot exceed 255 characters")
        String remarks
) {
}
