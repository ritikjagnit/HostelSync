package com.hostelsync.backend.dto;

import java.time.LocalDate;

/**
 * Response DTO returned after bulk roll call processing.
 */
public record WardenBulkAttendanceResponseDto(
        Long hostelId,
        String hostelName,
        LocalDate date,
        int totalProcessed,
        int createdCount,
        int updatedCount,
        String message
) {
}
