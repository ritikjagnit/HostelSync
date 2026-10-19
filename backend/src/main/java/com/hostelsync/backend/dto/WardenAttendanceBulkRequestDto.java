package com.hostelsync.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * Bulk roll-call attendance submission request for a specific hostel and date.
 */
public record WardenAttendanceBulkRequestDto(
        @NotNull(message = "Hostel ID is required")
        Long hostelId,

        @NotNull(message = "Attendance date is required")
        LocalDate date,

        @NotEmpty(message = "Attendance records list cannot be empty")
        @Valid
        List<WardenAttendanceItemDto> records
) {
}
