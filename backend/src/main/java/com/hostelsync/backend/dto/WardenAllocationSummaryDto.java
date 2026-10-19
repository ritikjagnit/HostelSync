package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.AllocationStatus;

import java.time.LocalDate;

/**
 * Historical or active room allocation record DTO for warden allocation history views.
 */
public record WardenAllocationSummaryDto(
        Long id,
        Long studentId,
        String studentName,
        String enrollmentNumber,
        String course,
        Integer semester,
        String phone,
        Long roomId,
        String roomNumber,
        Long hostelId,
        String hostelName,
        LocalDate allocationDate,
        LocalDate vacatingDate,
        AllocationStatus status
) {
}
