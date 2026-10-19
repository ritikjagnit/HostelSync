package com.hostelsync.backend.dto;

/**
 * Summary metrics of attendance records for an individual student resident.
 */
public record StudentAttendanceSummaryDto(
        Long studentId,
        String studentName,
        String enrollmentNumber,
        String period,
        long totalMarkedDays,
        long presentDays,
        long absentDays,
        long onLeaveDays,
        double attendancePercentage,
        String calculationFormula
) {
}
