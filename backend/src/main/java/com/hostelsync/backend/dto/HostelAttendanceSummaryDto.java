package com.hostelsync.backend.dto;

/**
 * Breakdown of roll-call attendance for a specific hostel on a given date.
 */
public record HostelAttendanceSummaryDto(
        Long hostelId,
        String hostelName,
        long totalResidents,
        long markedCount,
        long unmarkedCount,
        long presentCount,
        long absentCount,
        long onLeaveCount,
        double attendancePercentage
) {
}
