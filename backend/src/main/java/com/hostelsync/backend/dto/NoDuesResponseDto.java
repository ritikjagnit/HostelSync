package com.hostelsync.backend.dto;

import java.time.LocalDate;

public record NoDuesResponseDto(
        Long studentId,
        String studentName,
        String enrollmentNumber,
        String course,
        Integer semester,
        String hostelName,
        String roomNumber,
        Double totalAssessed,
        Double totalPaid,
        Double totalOutstanding,
        boolean isEligibleForNoDues,
        LocalDate clearanceDate,
        String certificateNumber,
        String authorizedBy
) {
}
