package com.hostelsync.backend.dto;

import java.time.LocalDate;

/**
 * Resident student summary DTO for warden resident listings and room occupant views.
 */
public record WardenResidentSummaryDto(
        Long studentId,
        String enrollmentNumber,
        String studentName,
        String email,
        String course,
        Integer semester,
        String phone,
        Long allocationId,
        LocalDate allocationDate,
        Long roomId,
        String roomNumber,
        Long hostelId,
        String hostelName
) {
}
